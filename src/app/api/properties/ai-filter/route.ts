import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateWithGemini } from "@/lib/gemini";
import { getPropertySlug, getPropertyCategorySlug } from "@/lib/slug";
import {
  getChatbotLiveInventory,
  ChatbotInventoryProperty,
  VERIFIED_PORTFOLIO_FALLBACK
} from "@/lib/chatbot-knowledge";
import {
  parseQueryCriteria,
  scorePropertyMatch,
  getBestMatchingProperties
} from "@/lib/property-matching";
import { formatIndianPrice, parseIndianPriceToNumber } from "@/lib/price-utils";

export const dynamic = "force-dynamic";

interface ExtractedFilters {
  locality: string | null;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  status: string | null;
  keywords: string[];
  aiSummary: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const queryText = (body.query || body.search || "").trim();
    const currentProperties: any[] = Array.isArray(body.currentProperties) ? body.currentProperties : [];
    const forcePortfolio: boolean = Boolean(body.forcePortfolio);

    if (!queryText) {
      return NextResponse.json({
        success: true,
        properties: currentProperties,
        aiSummary: null,
        extractedFilters: null,
        source: "direct"
      });
    }

    // 1. Fetch live inventory from database
    const liveInventory = await getChatbotLiveInventory();

    // 2. Use Gemini AI to extract deep search criteria from natural language
    let extracted: ExtractedFilters = {
      locality: null,
      category: null,
      minPrice: null,
      maxPrice: null,
      status: null,
      keywords: [],
      aiSummary: `Filtered by: "${queryText}"`
    };

    const systemPrompt = `You are an expert real estate AI filter engine for ANV REEALTY in Pune, India.
Analyze the user's property filter query and extract structured JSON parameters.

Available Localities in Pune:
Undri, Koregaon Park, Baner, Balewadi, Kalyani Nagar, Viman Nagar, Camp, Kharadi, Hinjawadi, Wakad, Bavdhan, Aundh, Senapati Bapat Road, Shivajinagar, Magarpatta, Hadapsar, Kothrud.

Available Categories:
Commercial Office, Hospital / Medical, Shop/Showroom, Pre-Leased, Residential Apartment, Penthouse, Residential Bunglow, Land/Plot, Warehouse.

Return ONLY a valid JSON object matching this schema (no markdown, no backticks):
{
  "locality": string or null,
  "category": string or null,
  "minPrice": number in INR or null (e.g. 2 Cr is 20000000),
  "maxPrice": number in INR or null (e.g. "under 2 cr" is 20000000, "under 6 cr" is 60000000),
  "status": "Ready to Move" | "Under Construction" | "Pre-Leased" | null,
  "keywords": string[],
  "aiSummary": string (1 brief sentence describing understanding, e.g. "Hospital & Medical premises under ₹2 Cr in Koregaon Park")
}`;

    try {
      const geminiResponse = await generateWithGemini({
        systemPrompt,
        messages: [{ role: "user", content: `Filter query: "${queryText}"` }],
        temperature: 0.1,
        maxOutputTokens: 300,
        preferredModel: "gemini-flash-lite-latest"
      });

      if (geminiResponse) {
        const cleaned = geminiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        extracted = {
          locality: parsed.locality || null,
          category: parsed.category || null,
          minPrice: typeof parsed.minPrice === "number" ? parsed.minPrice : null,
          maxPrice: typeof parsed.maxPrice === "number" ? parsed.maxPrice : null,
          status: parsed.status || null,
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          aiSummary: parsed.aiSummary || `Matching "${queryText}" via Gemini AI`
        };
      }
    } catch (geminiErr: any) {
      console.warn("Gemini query parser notice:", geminiErr.message);
    }

    // Heuristic fallbacks if Gemini missed explicit price cues (e.g. "under 2 cr")
    const lowerQuery = queryText.toLowerCase();
    if (!extracted.maxPrice) {
      const crMatch = lowerQuery.match(/(?:under|below|max|upto|within|budget(?:\s*of)?)\s*(?:₹|rs\.?)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:cr|crore)/i);
      if (crMatch) {
        extracted.maxPrice = parseFloat(crMatch[1]) * 10000000;
      } else {
        const lkMatch = lowerQuery.match(/(?:under|below|max|upto|within|budget(?:\s*of)?)\s*(?:₹|rs\.?)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:l|lac|lakh)/i);
        if (lkMatch) {
          extracted.maxPrice = parseFloat(lkMatch[1]) * 100000;
        }
      }
    }

    // 3. Filter current properties first (if not force portfolio)
    const filterPropertyAgainstCriteria = (p: any) => {
      // Numerical price check
      const rawPrice = typeof p.priceRaw === "number"
        ? p.priceRaw
        : parseFloat(String(p.price || "0").replace(/[^0-9.]/g, "")) * (String(p.price).toLowerCase().includes("cr") ? 10000000 : 100000);

      if (extracted.maxPrice && rawPrice > 0 && rawPrice > extracted.maxPrice) {
        return false;
      }
      if (extracted.minPrice && rawPrice > 0 && rawPrice < extracted.minPrice) {
        return false;
      }

      // Locality check
      if (extracted.locality) {
        const loc = extracted.locality.toLowerCase();
        const pLoc = `${p.locality || ""} ${p.location || ""}`.toLowerCase();
        if (!pLoc.includes(loc)) {
          return false;
        }
      }

      // Category check
      if (extracted.category) {
        const cat = extracted.category.toLowerCase();
        const pCat = `${p.name || ""} ${p.bhk || ""} ${p.type_name || ""} ${p.configuration || ""}`.toLowerCase();
        if (cat.includes("hospital") || cat.includes("medical")) {
          if (!pCat.includes("hospital") && !pCat.includes("medical") && !pCat.includes("clinic")) return false;
        } else if (cat.includes("office")) {
          if (!pCat.includes("office") && !pCat.includes("commercial")) return false;
        } else if (cat.includes("showroom") || cat.includes("shop")) {
          if (!pCat.includes("showroom") && !pCat.includes("shop") && !pCat.includes("retail")) return false;
        }
      }

      // Status check
      if (extracted.status && p.status) {
        if (!p.status.toLowerCase().includes(extracted.status.toLowerCase())) {
          return false;
        }
      }

      // Keywords match
      if (extracted.keywords.length > 0) {
        const haystack = `${p.name || ""} ${p.locality || ""} ${p.description || ""}`.toLowerCase();
        const matchesAnyKeyword = extracted.keywords.some((kw) => haystack.includes(kw.toLowerCase()));
        if (!matchesAnyKeyword && !extracted.locality && !extracted.category) {
          return false;
        }
      }

      return true;
    };

    let matchedFromCurrent: any[] = [];
    if (!forcePortfolio && currentProperties.length > 0) {
      matchedFromCurrent = currentProperties.filter(filterPropertyAgainstCriteria);
    }

    // 4. If current properties matched some results and user did not ask for portfolio expansion, return current matches
    if (!forcePortfolio && matchedFromCurrent.length > 0) {
      return NextResponse.json({
        success: true,
        scope: "current",
        properties: matchedFromCurrent,
        aiSummary: extracted.aiSummary || `Filtered ${matchedFromCurrent.length} properties matching "${queryText}"`,
        extractedFilters: extracted,
        totalFound: matchedFromCurrent.length,
        source: "gemini_current"
      });
    }

    // 5. Query Full Live Portfolio Catalog using Gemini AI criteria & ranking
    let portfolioMatches: ChatbotInventoryProperty[] = [];

    // Filter live inventory with structured criteria
    portfolioMatches = liveInventory.filter(filterPropertyAgainstCriteria);

    // If structured match found nothing or too few, use our smart NLP matcher
    if (portfolioMatches.length === 0) {
      portfolioMatches = getBestMatchingProperties(liveInventory, queryText, 8);
    }

    // Format properties for frontend card consumption
    const formattedProperties = portfolioMatches.slice(0, 12).map((p) => {
      const numPrice = typeof p.priceRaw === "number" ? p.priceRaw : (parseIndianPriceToNumber(p.price) ?? 0);
      const formattedPrice = p.price || formatIndianPrice(numPrice);

      return {
        id: String(p.id),
        name: p.name,
        locality: p.locality || (p.location ? p.location.split(",")[0].trim() : "Pune"),
        price: formattedPrice,
        bhk: p.bhk,
        status: p.status || "Ready to Move",
        sqft: p.sqft,
        image: p.image || "/LogoAnv-original.png",
        url: p.url || `/properties/${p.slug || p.id}`
      };
    });

    return NextResponse.json({
      success: true,
      scope: "portfolio",
      properties: formattedProperties,
      aiSummary: extracted.aiSummary || `Found ${formattedProperties.length} portfolio listings matching "${queryText}"`,
      extractedFilters: extracted,
      totalFound: formattedProperties.length,
      source: "gemini_portfolio"
    });
  } catch (err: any) {
    console.error("AI Property Filter Error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to filter properties with AI",
      properties: []
    }, { status: 500 });
  }
}
