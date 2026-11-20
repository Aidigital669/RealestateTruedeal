import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAllLiveBuyerDemands, isJunkLead, VERIFIED_SEED_BUYER_DEMANDS } from "@/lib/buyer-demands-service";
import { generateWithGemini } from "@/lib/gemini";
import { getPropertySlug } from "@/lib/slug";
import {
  detectPropertyTypology,
  parseQueryCriteria,
  scorePropertyMatch,
  getPropertyRawPrice
} from "@/lib/property-matching";
import { isUserSeller } from "@/lib/seller-intent";
import { getPurposesForProperties } from "@/lib/business-purposes";
import { detectQueryIntent, extractQueryLines, filterBuyerDemandsByQuery } from "@/lib/search-training-corpus";

export const dynamic = 'force-dynamic';

// Official Anv Reealty Public Helpline for all Seller connections
const OFFICIAL_ANV_PHONE = "93730 20701";
const OFFICIAL_ANV_EMAIL = "leads@anvrealty.com";

function maskBuyerName(name: string | null | undefined): string {
  if (!name || !name.trim()) return "Verified Patron (Pune)";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const p = parts[0];
    return p.length > 2 ? `${p.slice(0, 2)}*** (Verified Buyer)` : "Verified Buyer";
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
  return `${first} ${lastInitial}.*** (Verified Buyer)`;
}

// Active registered buyer inquiries directly from database
const SEED_BUYER_DEMANDS: any[] = [];

const SEARCH_STOP_WORDS = new Set([
  "i", "a", "an", "the", "in", "at", "to", "for", "of", "and", "or", "is", "with", "by", "on",
  "pune", "maharashtra", "flat", "flats", "apartment", "apartments", "property",
  "properties", "residence", "residences", "home", "homes", "house", "houses",
  "want", "need", "find", "get", "looking", "look", "search", "show", "me", "give",
  "buy", "buying", "purchase", "purchasing", "seller", "sellers", "buyer", "buyers",
  "sell", "selling", "available", "verified", "luxury", "best", "good", "all", "any"
]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSearch = (searchParams.get("search") || searchParams.get("query") || "").trim();
    let locality = searchParams.get("locality") || "";
    let bhk = searchParams.get("bhk") || "";
    let priceRange = searchParams.get("priceRange") || "";
    let status = searchParams.get("status") || "";
    let purpose = searchParams.get("purpose") || searchParams.get("businessPurpose") || "";
    let transactionType = searchParams.get("transactionType") || searchParams.get("intent") || "";

    const cleanSearch = rawSearch
      .replace(/[-_/\(\)\[\]]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();

    let intent: "seller" | "buyer" | "both" = "both";
    let primaryView: "buyer_leads" | "properties" = "properties";
    let aiSummary = "";
    let aiParsed = false;

    // Fast-path heuristic detection for Seller vs Buyer intent keywords
    const isSellerQuery = (text: string) => {
      const t = text.toLowerCase();
      if (/\b(?:i am a buyer|buyer looking to buy|buyer looking for (?:flat|home|property|house|apartment))\b/i.test(t)) {
        return false;
      }
      return isUserSeller(t) ||
        /\b(?:want|need|find|get|looking for|look for|search for|connect with|require|seeking)\s+(?:a\s+|an\s+|the\s+|some\s+|any\s+|me\s+)?buyers?\b/i.test(t) ||
        /\bbuyers?\s+(?:for|needed|required|wanted)\b/i.test(t) ||
        /\b(?:sell|selling)\s+(?:my\s+|a\s+|an\s+)?(?:flat|apartment|property|home|house|plot|land|commercial|office|unit|penthouse)\b/i.test(t) ||
        /\b(?:i want to sell|want to sell|willing to sell|plan to sell|looking to sell|sell property|sell flat)\b/i.test(t) ||
        /\b(?:seller|sellers|owner|pitch property|have flat to sell|have property to sell|leads?)\b/i.test(t);
    };

    const isBuyerQuery = (text: string) => {
      const t = text.toLowerCase();
      return /\b(?:want to buy|looking to buy|plan to buy|wish to buy|ready to buy)\b/i.test(t) ||
        /\b(?:buy|buying|purchase|purchasing)\s+(?:a\s+|an\s+|the\s+|i\s+|\d+\s*)?(?:flat|apartment|property|home|house|commercial|office|unit|penthouse|\d+\s*bhk)\b/i.test(t) ||
        /\b(?:find|looking for|search for)\s+(?:a\s+|an\s+|the\s+)?(?:flat|apartment|property|home|house|commercial|office|penthouse|\d+\s*bhk)\b/i.test(t) ||
        /\b(?:i am a buyer|buyer seeking|buyer looking for)\b/i.test(t);
    };

    const trainedClassification = detectQueryIntent(cleanSearch);
    const sellerMatch = trainedClassification.intent === "seller" || isSellerQuery(cleanSearch);
    const buyerMatch = trainedClassification.intent === "buyer" || isBuyerQuery(cleanSearch);

    if (trainedClassification.intent === "seller") {
      intent = "seller";
      primaryView = "buyer_leads";
    } else if (trainedClassification.intent === "buyer") {
      intent = "buyer";
      primaryView = "properties";
    } else if (sellerMatch && !buyerMatch) {
      intent = "seller";
      primaryView = "buyer_leads";
    } else if (buyerMatch) {
      intent = "buyer";
      primaryView = "properties";
    } else {
      intent = "both";
      primaryView = "properties";
    }

    const knownLocs = [
      "Koregaon Park", "Baner", "Balewadi", "Kalyani Nagar", "Bavdhan",
      "Mahalunge", "Shivajinagar", "Kharadi", "Worli", "Hinjewadi",
      "Wakad", "Viman Nagar", "Aundh", "Hadapsar", "Magarpatta",
      "Camp", "Kothrud"
    ];

    // 1. Google Gemini AI Semantic Analysis (determines intent: Buyer vs Seller, extracts locality, BHK, budget)
    if (cleanSearch.length > 2) {
      try {
        const geminiPrompt = `You are an AI real estate intent parser for Anv Reealty in Pune, India.
The marketplace serves two groups:
1. BUYERS: looking to buy or view properties (e.g. "buy flat", "3 BHK in Baner", "looking to buy 2 BHK").
2. SELLERS: owners or brokers looking for active buyers to sell to (e.g. "i want a buyer", "find buyer", "need buyers", "sell my flat").

Determine:
- "intent": "seller" (if looking for buyers or selling) | "buyer" (if looking to purchase or view properties) | "both" (if generic search)
- "primaryView": "buyer_leads" (if seller) | "properties" (if buyer or generic)
- "bhk": "1 BHK" | "2 BHK" | "3 BHK" | "4 BHK" | "4.5+ BHK Penthouse" | "Commercial Office" | null
- "locality": "Baner" | "Balewadi" | "Kalyani Nagar" | "Bavdhan" | "Mahalunge" | "Shivajinagar" | "Kharadi" | "Worli" | "Koregaon Park" | "Viman Nagar" | "Hinjewadi" | "Wakad" | null
- "priceRange": "Under ₹1.5 Cr" | "₹1.5 Cr - ₹2.5 Cr" | "₹2.5 Cr - ₹4.0 Cr" | "₹4.0 Cr+" | null
- "summary": 1 concise sentence describing the AI's understanding.

STRICT INSTRUCTIONS:
- If user wants a buyer or wants to sell, intent MUST be "seller" and primaryView MUST be "buyer_leads".
- NEVER hallucinate or guess a BHK if the user query does not explicitly specify one (e.g. if query is "i want a buyer", set bhk: null!).
- NEVER hallucinate or guess a locality if not explicitly present in query (set locality: null!).
- In "summary", NEVER mention a BHK or locality unless explicitly present in the user's query.
- Return ONLY JSON matching schema (no markdown formatting).`;

        const geminiResult = await generateWithGemini({
          systemPrompt: geminiPrompt,
          messages: [{ role: "user", content: cleanSearch }],
          temperature: 0.1,
          maxOutputTokens: 300,
          preferredModel: "gemini-flash-lite-latest"
        });

        if (geminiResult) {
          const cleaned = geminiResult.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.intent) intent = parsed.intent;
          if (sellerMatch || parsed.primaryView === "buyer_leads" || parsed.intent === "seller") {
            primaryView = "buyer_leads";
            intent = "seller";
          } else if (parsed.primaryView === "properties" || parsed.intent === "buyer") {
            primaryView = "properties";
          }

          const earlyCrit = parseQueryCriteria(cleanSearch);
          const earlyIsMulti = earlyCrit.isMultiCategory || (earlyCrit.typologyIntents && earlyCrit.typologyIntents.length > 1) || (earlyCrit.bhkNums && earlyCrit.bhkNums.length > 1);

          // Strict guard: Only accept BHK from AI if query explicitly contains typography indicator (and is not multi-category)
          if (!earlyIsMulti) {
            const hasExplicitBhkInQuery = /\b(\d+\s*bhk|\d+\s*bed|bedroom|penthouse|commercial|office|studio|duplex)\b/i.test(cleanSearch);
            if (parsed.bhk && hasExplicitBhkInQuery && (!bhk || bhk === "All")) {
              bhk = parsed.bhk;
            }
          }

          // Strict guard: Only accept locality from AI if query explicitly mentions known locality
          const hasExplicitLocalityInQuery = knownLocs.some(loc => new RegExp(`\\b${loc}\\b`, "i").test(cleanSearch));
          if (parsed.locality && hasExplicitLocalityInQuery && (!locality || locality === "All")) {
            locality = parsed.locality;
          }

          if (parsed.priceRange && (!priceRange || priceRange === "All")) priceRange = parsed.priceRange;
          if (parsed.summary) {
            aiSummary = parsed.summary;
            aiParsed = true;
          }
        }
      } catch (err: any) {
        console.log("Gemini API fallback in unified search:", err.message || "timeout");
      }
    }

    // High-speed NLP regex extraction fallback (only if NOT multi-category)
    const earlyCritCheck = parseQueryCriteria(cleanSearch);
    const earlyIsMultiCheck = earlyCritCheck.isMultiCategory || (earlyCritCheck.typologyIntents && earlyCritCheck.typologyIntents.length > 1) || (earlyCritCheck.bhkNums && earlyCritCheck.bhkNums.length > 1);

    if (!earlyIsMultiCheck && (!bhk || bhk === "All")) {
      if (/\b(?:commercial|office|workspace|retail)\b/i.test(cleanSearch)) {
        bhk = "Commercial Office";
      } else {
        const bhkMatch = cleanSearch.match(/\b([1-9])\s*(?:bhk|bedroom|bed)s?\b/i) || cleanSearch.match(/\b(?:bhk|bedroom|bed)s?\s*([1-9])\b/i);
        if (bhkMatch) {
          bhk = `${bhkMatch[1]} BHK`;
        } else if (/\bpenthouses?\b/i.test(cleanSearch)) {
          bhk = "4.5+ BHK Penthouse";
        }
      }
    }

    if (!locality || locality === "All") {
      for (const loc of knownLocs) {
        if (new RegExp(`\\b${loc}\\b`, "i").test(cleanSearch)) {
          locality = loc;
          break;
        }
      }
    }

    const wordsInQuery = cleanSearch
      .toLowerCase()
      .replace(/[-_/\(\)\[\]]+/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1);

    const localityTokens = (locality && locality !== "All" ? locality : "").toLowerCase().split(/\s+/);
    const bhkTokens = ["1", "2", "3", "4", "5", "bhk", "bedroom", "bed", "penthouse", "commercial", "office", "rk"];

    const searchKeywords = wordsInQuery.filter((w) => {
      if (SEARCH_STOP_WORDS.has(w)) return false;
      if (localityTokens.some((lt) => lt && (lt === w || lt.includes(w)))) return false;
      if (bhkTokens.includes(w)) return false;
      return true;
    });

    if (!aiSummary) {
      if (primaryView === "buyer_leads" || intent === "seller") {
        aiSummary = `Active buyer search: Connecting qualified buyers ${bhk && bhk !== 'All' ? `for ${bhk}` : ''} in ${locality && locality !== 'All' ? locality : 'Pune'}`;
      } else if (intent === 'buyer') {
        aiSummary = `Property search: Curating verified properties in ${locality && locality !== 'All' ? locality : 'Pune'} ${bhk && bhk !== 'All' ? `(${bhk})` : ''}`;
      } else {
        aiSummary = `Unified marketplace: Matching properties & active buyers in ${locality && locality !== 'All' ? locality : 'Pune'} ${bhk && bhk !== 'All' ? `(${bhk})` : ''}`;
      }
    }

    // 2. Fetch Buyer Inquiries / Demands (Single Source of Truth from CRM Leads)
    const allDemands = await getAllLiveBuyerDemands();
    const locFilterLower = (locality && locality !== "All" ? locality : "").toLowerCase();
    const bhkFilterLower = (bhk && bhk !== "All" ? bhk : "").toLowerCase();

    // Filter buyer demands
    let filteredDemands = allDemands.filter((demand) => {
      if (locFilterLower) {
        const matchesLoc = demand.locality.toLowerCase().includes(locFilterLower) ||
          demand.requirements.toLowerCase().includes(locFilterLower);
        if (!matchesLoc) return false;
      }
      if (bhkFilterLower) {
        const dLower = demand.bhk.toLowerCase();
        if (bhkFilterLower.includes('commercial')) {
          if (!dLower.includes('commercial') && !demand.requirements.toLowerCase().includes('commercial')) {
            return false;
          }
        } else {
          const digit = bhkFilterLower.match(/\d+/)?.[0];
          if (digit && !dLower.includes(digit) && !demand.requirements.toLowerCase().includes(`${digit} bhk`)) {
            return false;
          }
        }
      }
      return true;
    });

    // Use intelligent trained NLP multi-line buyer filter
    if (cleanSearch) {
      filteredDemands = filterBuyerDemandsByQuery(filteredDemands, cleanSearch);
    }

    // 3. Fetch Properties from Database
    let properties: any[] = [];
    try {
      const propRows = await query(`
        SELECT 
          p.id, p.slug, p.title as name, p.description, p.address as location,
          p.price, p."carpetArea" as sqft_num, p.bedrooms as bhk_num, p.configuration, p."videoUrl", p.status, p."isFeatured" as featured,
          p."listingType" as listing_type,
          COALESCE(proj.developer, '') as developer,
          COALESCE(proj."reraNumber", 'PRM/PUN/RERA/2026/0491') as rera_number,
          COALESCE(loc.name, 'Koregaon Park') as locality,
          COALESCE(pt.name, 'Apartment') as type_name,
          COALESCE(img.url, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80') as image,
          imgs.urls as all_images
        FROM "Property" p
        LEFT JOIN "Project" proj ON p."projectId" = proj.id
        LEFT JOIN "Location" loc ON p."locationId" = loc.id
        LEFT JOIN "PropertyType" pt ON p."propertyTypeId" = pt.id
        LEFT JOIN LATERAL (
          SELECT url FROM "PropertyImage" WHERE "propertyId" = p.id ORDER BY "sortOrder" ASC LIMIT 1
        ) img ON true
        LEFT JOIN LATERAL (
          SELECT array_agg(url ORDER BY "sortOrder" ASC) as urls FROM "PropertyImage" WHERE "propertyId" = p.id
        ) imgs ON true
        WHERE p."publishStatus" = 'Published'
        ORDER BY p.id ASC;
      `);

      const propIds = propRows.map((r: any) => r.id);
      const purposesMap = await getPurposesForProperties(propIds);

      properties = propRows.map((r: any) => {
        const numPrice = Number(r.price) || 0;
        let formattedPrice = "Price on Request";
        if (numPrice >= 10000000) {
          const cr = (numPrice / 10000000).toFixed(2).replace(/\.00$/, '');
          formattedPrice = `₹${cr} Cr`;
        } else if (numPrice >= 100000) {
          const lk = (numPrice / 100000).toFixed(2).replace(/\.00$/, '');
          formattedPrice = `₹${lk} Lakh`;
        } else if (numPrice > 0) {
          formattedPrice = `₹${numPrice.toLocaleString('en-IN')}`;
        }

        const rawImages: string[] = (r.all_images && Array.isArray(r.all_images))
          ? r.all_images.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
          : [];
        const resolvedImages = rawImages.length > 0 ? rawImages : (r.image ? [r.image] : []);

        return {
          id: String(r.id),
          slug: r.slug || getPropertySlug({ id: r.id, name: r.name, locality: r.locality }),
          name: r.name,
          developer: r.developer || "Grade-A Developer",
          locality: r.locality || (r.location ? r.location.split(',')[0].trim() : 'Pune'),
          location: r.location || "Pune, Maharashtra",
          price: formattedPrice,
          priceRaw: numPrice || 15000000,
          bhk: r.configuration || (r.bhk_num ? `${r.bhk_num} BHK` : (r.type_name || "Commercial Space")),
          bhkNum: Number(r.bhk_num) || 0,
          sqft: r.sqft_num ? `${Number(r.sqft_num).toLocaleString()} Sq.Ft.` : "On Request",
          sqftNum: Number(r.sqft_num) || 0,
          status: r.status || "Ready to Move",
          description: r.description || "Luxury Pune Residence",
          image: resolvedImages[0] || r.image,
          images: resolvedImages,
          videoUrl: r.videoUrl ? String(r.videoUrl).trim() : null,
          tags: ["Verified Property", "Vastu Compliant"],
          reraNumber: r.rera_number,
          featured: Boolean(r.featured),
          listingType: r.listing_type || 'Sale',
          businessPurposes: purposesMap[String(r.id)] || [],
          isCommercial: (() => {
            const detected = detectPropertyTypology({
              name: r.name,
              configuration: r.configuration,
              bhk: r.configuration || (r.bhk_num ? `${r.bhk_num} BHK` : ''),
              type_name: r.type_name,
              description: r.description
            });
            return detected !== 'residential' && detected !== 'land_plot';
          })()
        };
      });

      // Filter & Score properties using property-matching engine (Strict Typology Boundaries + Name Words)
      const criteria = parseQueryCriteria(cleanSearch);
      const isMultiCat = criteria.isMultiCategory || (criteria.typologyIntents && criteria.typologyIntents.length > 1) || (criteria.bhkNums && criteria.bhkNums.length > 1);

      if (locFilterLower && (!criteria.locality || criteria.locality === 'All')) {
        criteria.locality = locFilterLower;
        criteria.isExplicitLocality = true;
      }
      if (!isMultiCat && bhkFilterLower && bhkFilterLower !== 'all') {
        const d = bhkFilterLower.match(/\d+/)?.[0];
        if (d && !bhkFilterLower.includes('penthouse')) criteria.bhkNum = parseInt(d, 10);
        if (bhkFilterLower.includes('commercial')) criteria.typologyIntent = 'commercial_office';
      }

      if (criteria.hasSpecificIntent || cleanSearch.trim() || locFilterLower || (!isMultiCat && bhkFilterLower && bhkFilterLower !== 'all')) {
        const scoredProperties = properties
          .map((p) => ({ p, score: scorePropertyMatch(p, criteria) }))
          .filter((item) => {
            if (item.score <= 0) return false;
            // If criteria has specific name/project words, property MUST match at least one
            if (criteria.nameWords && criteria.nameWords.length > 0) {
              const pText = `${item.p.name || ''} ${item.p.title || ''} ${item.p.developer || ''} ${item.p.description || ''} ${item.p.configuration || ''} ${item.p.bhk || ''}`.toLowerCase();
              const matchesAnyNameWord = criteria.nameWords.some((w) => pText.includes(w));
              if (!matchesAnyNameWord) return false;
            }
            const price = getPropertyRawPrice(item.p);
            if (price > 0) {
              if (criteria.maxBudget && price > criteria.maxBudget) return false;
              if (criteria.minBudget && price < criteria.minBudget) return false;
            }
            return true;
          })
          .sort((a, b) => b.score - a.score);

        const topScore = scoredProperties.length > 0 ? scoredProperties[0].score : 0;
        const filteredByRelevance = topScore >= 200
          ? scoredProperties.filter((item) => item.score >= topScore * 0.45)
          : scoredProperties;

        properties = filteredByRelevance.map((item) => item.p);
      }

      // Filter by Business Purpose
      if (purpose && purpose !== "All" && purpose !== "all") {
        const pLower = purpose.toLowerCase().trim();
        properties = properties.filter((prop) => {
          if (!prop.businessPurposes || prop.businessPurposes.length === 0) return false;
          return prop.businessPurposes.some(
            (bp: any) => bp.slug.toLowerCase() === pLower || String(bp.id) === pLower || bp.name.toLowerCase() === pLower
          );
        });
      }

      // Filter by Transaction Type (Buy vs Rent)
      if (transactionType && transactionType !== "All" && transactionType !== "all") {
        const ttLower = transactionType.toLowerCase().trim();
        if (ttLower.includes("rent") || ttLower.includes("lease")) {
          properties = properties.filter((prop) => {
            const lt = String(prop.listingType || '').toLowerCase();
            return lt.includes('rent') || lt.includes('lease');
          });
        } else if (ttLower.includes("buy") || ttLower.includes("sale")) {
          properties = properties.filter((prop) => {
            const lt = String(prop.listingType || '').toLowerCase();
            return lt.includes('sale') || lt.includes('buy') || !prop.listingType;
          });
        }
      }

      if (cleanSearch.trim() && properties.length === 0 && filteredDemands.length === 0) {
        aiSummary = `No matching properties or buyers found for "${cleanSearch}" in Pune.`;
      }
    } catch (pErr: any) {
      console.log("DB properties query notice:", pErr.message);
    }

    return NextResponse.json({
      success: true,
      ai: {
        intent,
        primaryView,
        summary: aiSummary,
        locality: locality || null,
        bhk: bhk || null,
        priceRange: priceRange || null,
        isAiPowered: aiParsed
      },
      officialHelpline: OFFICIAL_ANV_PHONE,
      propertiesCount: properties.length,
      buyerDemandsCount: filteredDemands.length,
      properties,
      buyerDemands: filteredDemands
    });
  } catch (err: any) {
    console.error("GET /api/unified-search error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed unified search", stack: err.stack },
      { status: 200 }
    );
  }
}
