import { NextRequest, NextResponse } from "next/server";
import { getAllLiveBuyerDemands } from "@/lib/buyer-demands-service";
import { generateWithGemini } from "@/lib/gemini";
import { getPropertySlug } from "@/lib/slug";
import { detectPropertyTypology, parseQueryCriteria } from "@/lib/property-matching";
import { isUserSeller } from "@/lib/seller-intent";
import { getPurposesForProperties } from "@/lib/business-purposes";
import { detectQueryIntent, filterBuyerDemandsByQuery } from "@/lib/search-training-corpus";
import { parseDossierData } from "@/lib/dossier-parser";
import { resolvePropertyPrice } from "@/lib/price-utils";
import { parseEightFieldRequirements } from "@/lib/eight-field-parser";
import {
  buildEightFieldWhereClause,
  executeEightFieldSqlRows,
  fetchEightFieldGroupByFacets
} from "@/lib/sql-8field-search";
import { parseAreaToSqft } from "@/lib/excel-import-engine";
import { executePhase2Search } from "@/lib/phase2-search-engine";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const OFFICIAL_ANV_PHONE = "93730 20701";

function hydrateSqlRow(r: any, purposes: any[]) {
  const { cleanDescription, dossier: parsedDossier } = parseDossierData(r.description || "", r.name);
  const mergedDossier = {
    ...(typeof r.dossierData === "object" && r.dossierData !== null ? r.dossierData : {}),
    ...(parsedDossier || {})
  };
  const { numPrice, formattedPrice, isRent, priceSuffix } = resolvePropertyPrice(r, mergedDossier);
  const isPriceHidden = Boolean(mergedDossier.hidePrice);

  const rawImages: string[] =
    r.all_images && Array.isArray(r.all_images)
      ? r.all_images.filter((url: any) => typeof url === "string" && url.trim().length > 0)
      : [];
  const resolvedImages = rawImages.length > 0 ? rawImages : r.image ? [r.image] : [];

  const detected = detectPropertyTypology({
    name: r.name,
    configuration: r.configuration,
    bhk: r.configuration || (r.bhk_num ? `${r.bhk_num} BHK` : ""),
    type_name: r.type_name,
    description: r.description
  });

  const carpetNum =
    Number(r.carpet_num || r.sqft_num) ||
    parseAreaToSqft(mergedDossier.CarpetAreaName) ||
    0;
  const builtupNum =
    Number(r.builtup_num) ||
    parseAreaToSqft(mergedDossier.BuiltAreaName) ||
    parseAreaToSqft(mergedDossier.SuperAreaName) ||
    0;

  return {
    id: String(r.id),
    slug: r.slug || getPropertySlug({ id: r.id, name: r.name, locality: r.locality }),
    name: r.name,
    developer: r.developer || "Grade-A Developer",
    locality: r.locality || (r.location ? r.location.split(",")[0].trim() : "Pune"),
    city: r.city_name || mergedDossier.CityName || r.loc_city || "Pune",
    location: r.location || "Pune, Maharashtra",
    price: isPriceHidden ? "Price on Request" : formattedPrice,
    priceRaw: numPrice,
    priceSuffix: isPriceHidden ? "On Request" : priceSuffix,
    bhk: r.configuration || (r.bhk_num ? `${r.bhk_num} BHK` : r.type_name || "Commercial Space"),
    bhkNum: Number(r.bhk_num) || 0,
    sqft: mergedDossier.CarpetAreaName || mergedDossier.SuperAreaName || (carpetNum ? `${carpetNum.toLocaleString()} Sq.Ft.` : "On Request"),
    sqftNum: carpetNum || builtupNum || 0,
    carpetAreaNum: carpetNum,
    builtupAreaNum: builtupNum,
    transactionClassification: r.transactionClassification || mergedDossier.TransactionName || null,
    status: r.status || "Ready to Move",
    description: cleanDescription || r.description || "Luxury Pune Residence",
    image: resolvedImages[0] || r.image,
    images: resolvedImages,
    videoUrl: r.videoUrl ? String(r.videoUrl).trim() : null,
    tags: ["Verified Property", "Vastu Compliant"],
    reraNumber: r.rera_number,
    featured: Boolean(r.featured),
    listingType: r.listing_type || (isRent ? "Rent" : "Sale"),
    businessPurposes: purposes || [],
    isCommercial: detected !== "residential" && detected !== "land_plot",
    dossier: mergedDossier
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSearch = (searchParams.get("search") || searchParams.get("query") || "").trim();
    const locality = searchParams.get("locality") || "";
    const city = searchParams.get("city") || "";
    const bhk = searchParams.get("bhk") || searchParams.get("propertyType") || "";
    const transactionClassification = searchParams.get("transactionClassification") || "";
    const priceRange = searchParams.get("priceRange") || "";
    const status = searchParams.get("status") || "";
    const purpose = searchParams.get("purpose") || searchParams.get("businessPurpose") || "";
    const transactionType = searchParams.get("transactionType") || searchParams.get("intent") || "";
    const minBuiltupArea = searchParams.get("minBuiltupArea") ? Number(searchParams.get("minBuiltupArea")) : null;
    const maxBuiltupArea = searchParams.get("maxBuiltupArea") ? Number(searchParams.get("maxBuiltupArea")) : null;
    const minCarpetArea = searchParams.get("minCarpetArea") ? Number(searchParams.get("minCarpetArea")) : null;
    const maxCarpetArea = searchParams.get("maxCarpetArea") ? Number(searchParams.get("maxCarpetArea")) : null;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;

    const cleanSearch = rawSearch
      .replace(/[-_/\(\)\[\]]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();

    let intent: "seller" | "buyer" | "both" = "both";
    let primaryView: "buyer_leads" | "properties" = "properties";
    let aiSummary = "";
    let aiParsed = false;

    const isSellerQuery = (text: string) => {
      const t = text.toLowerCase();
      if (/\b(?:i am a buyer|buyer looking to buy|buyer looking for (?:flat|home|property|house|apartment))\b/i.test(t)) {
        return false;
      }
      return (
        isUserSeller(t) ||
        /\b(?:want|need|find|get|looking for|look for|search for|connect with|require|seeking)\s+(?:a\s+|an\s+|the\s+|some\s+|any\s+|me\s+)?buyers?\b/i.test(t) ||
        /\bbuyers?\s+(?:for|needed|required|wanted)\b/i.test(t) ||
        /\b(?:sell|selling)\s+(?:my\s+|a\s+|an\s+)?(?:flat|apartment|property|home|house|plot|land|commercial|office|unit|penthouse)\b/i.test(t) ||
        /\b(?:i want to sell|want to sell|willing to sell|plan to sell|looking to sell|sell property|sell flat)\b/i.test(t) ||
        /\b(?:seller|sellers|owner|pitch property|have flat to sell|have property to sell|leads?)\b/i.test(t)
      );
    };

    const isBuyerQuery = (text: string) => {
      const t = text.toLowerCase();
      return (
        /\b(?:want to buy|looking to buy|plan to buy|wish to buy|ready to buy)\b/i.test(t) ||
        /\b(?:buy|buying|purchase|purchasing)\s+(?:a\s+|an\s+|the\s+|i\s+|\d+\s*)?(?:flat|apartment|property|home|house|commercial|office|unit|penthouse|\d+\s*bhk)\b/i.test(t) ||
        /\b(?:find|looking for|search for)\s+(?:a\s+|an\s+|the\s+)?(?:flat|apartment|property|home|house|commercial|office|penthouse|\d+\s*bhk)\b/i.test(t) ||
        /\b(?:i am a buyer|buyer seeking|buyer looking for)\b/i.test(t)
      );
    };

    const trainedClassification = detectQueryIntent(cleanSearch);
    const sellerMatch = trainedClassification.intent === "seller" || isSellerQuery(cleanSearch);
    const buyerMatch = trainedClassification.intent === "buyer" || isBuyerQuery(cleanSearch);

    if (trainedClassification.intent === "seller" || (sellerMatch && !buyerMatch)) {
      intent = "seller";
      primaryView = "buyer_leads";
    } else if (trainedClassification.intent === "buyer" || buyerMatch) {
      intent = "buyer";
      primaryView = "properties";
    }

    // 1. Parse all 8 structured SQL fields from search query & explicit params
    const eightField = parseEightFieldRequirements(cleanSearch, {
      transactionType,
      propertyType: bhk,
      bhk,
      transactionClassification,
      locality,
      city,
      minBuiltupArea,
      maxBuiltupArea,
      minCarpetArea,
      maxCarpetArea,
      minPrice,
      maxPrice,
      priceRange
    });

    // Only call external Gemini when no deterministic 8-field constraint or buyer/seller rule was extracted
    if (cleanSearch.length > 2 && !eightField.hasAnyConstraint && !sellerMatch && !buyerMatch) {
      try {
        const geminiResult = await generateWithGemini({
          systemPrompt:
            'Return JSON { "intent": "seller"|"buyer"|"both", "primaryView": "buyer_leads"|"properties", "summary": string } for an Indian real estate query.',
          messages: [{ role: "user", content: cleanSearch }],
          temperature: 0.1,
          maxOutputTokens: 150,
          preferredModel: "gemini-flash-lite-latest"
        });
        if (geminiResult) {
          const parsed = JSON.parse(geminiResult.replace(/```json/gi, "").replace(/```/g, "").trim());
          if (parsed.intent) intent = parsed.intent;
          if (parsed.primaryView === "buyer_leads" || parsed.intent === "seller") {
            primaryView = "buyer_leads";
            intent = "seller";
          }
          if (parsed.summary) {
            aiSummary = parsed.summary;
            aiParsed = true;
          }
        }
      } catch {}
    }

    if (!aiSummary) {
      const activeParts: string[] = [];
      if (eightField.transactionType) activeParts.push(eightField.transactionType);
      if (eightField.propertyTypes.length > 0) activeParts.push(eightField.propertyTypes.join(", "));
      if (eightField.transactionClassification) activeParts.push(eightField.transactionClassification);
      if (eightField.localities.length > 0) activeParts.push(eightField.localities.join(", "));
      if (eightField.cities.length > 0) activeParts.push(eightField.cities.join(", "));
      aiSummary =
        activeParts.length > 0
          ? `SQL 8-field match: ${activeParts.join(" • ")}`
          : `Unified marketplace: Matching verified properties & active buyers`;
    }

    // 2. Buyer Demands filtering
    const allDemands = await getAllLiveBuyerDemands();
    const locFilterLower = (locality && locality !== "All" ? locality : eightField.localities[0] || "").toLowerCase();
    const bhkFilterLower = (bhk && bhk !== "All" ? bhk : eightField.propertyTypes[0] || "").toLowerCase();

    let filteredDemands = allDemands.filter((demand) => {
      if (locFilterLower) {
        const matchesLoc =
          demand.locality.toLowerCase().includes(locFilterLower) ||
          demand.requirements.toLowerCase().includes(locFilterLower);
        if (!matchesLoc) return false;
      }
      if (bhkFilterLower) {
        const dLower = demand.bhk.toLowerCase();
        const digit = bhkFilterLower.match(/\d+/)?.[0];
        if (digit && !dLower.includes(digit) && !demand.requirements.toLowerCase().includes(`${digit} bhk`)) {
          return false;
        }
      }
      return true;
    });

    if (cleanSearch) {
      filteredDemands = filterBuyerDemandsByQuery(filteredDemands, cleanSearch);
    }

    // 3. Execute real SQL WHERE ... AND ... + GROUP BY queries across the 8 database fields
    const builtFilter = buildEightFieldWhereClause(eightField, {
      includeStatus: status,
      includePurpose: purpose
    });

    const [strictRows, strictFacets] = await Promise.all([
      executeEightFieldSqlRows(builtFilter.whereSql, builtFilter.params, 200),
      fetchEightFieldGroupByFacets(builtFilter.whereSql, builtFilter.params)
    ]);

    let isFallbackActivated = false;
    let fallbackBanner: string | undefined;
    let finalRows = strictRows;
    let finalFacets = strictFacets;

    // Graceful relaxed SQL fallback if strict 8-field AND intersection returned 0 rows
    if (finalRows.length === 0 && eightField.hasAnyConstraint) {
      const relaxedCriteria = {
        ...eightField,
        builtupArea: { min: null, max: null },
        carpetArea: { min: null, max: null },
        genericArea: { min: null, max: null },
        expectedPrice: {
          min: eightField.expectedPrice.min ? Math.round(eightField.expectedPrice.min * 0.75) : null,
          max: eightField.expectedPrice.max ? Math.round(eightField.expectedPrice.max * 1.25) : null
        },
        keywords: []
      };
      const relaxedFilter = buildEightFieldWhereClause(relaxedCriteria, {
        includeStatus: status,
        includePurpose: purpose
      });
      const relaxedRows = await executeEightFieldSqlRows(relaxedFilter.whereSql, relaxedFilter.params, 60);
      if (relaxedRows.length > 0) {
        finalRows = relaxedRows;
        finalFacets = await fetchEightFieldGroupByFacets(relaxedFilter.whereSql, relaxedFilter.params);
        isFallbackActivated = true;
        fallbackBanner = `Exact 8-field combination had 0 exact matches — showing ${relaxedRows.length} closest SQL matches with ±25% relaxed budget & area tolerances.`;
      }
    }

    const propIds = finalRows.map((r: any) => r.id);
    const purposesMap = propIds.length > 0 ? await getPurposesForProperties(propIds) : {};
    let properties = finalRows.map((r: any) => hydrateSqlRow(r, purposesMap[String(r.id)] || []));

    // Optional Phase 2 geo/ranking enrichment
    const criteria = parseQueryCriteria(cleanSearch);
    const p2Result = executePhase2Search(properties, {
      query: cleanSearch,
      locality: eightField.localities[0] || undefined,
      transactionType:
        eightField.transactionType === "Rent"
          ? "rent"
          : eightField.transactionType === "Sale"
            ? "sale"
            : criteria.transactionType || undefined,
      propertyType: eightField.propertyTypes[0] || criteria.typologyIntent || undefined,
      minPrice: eightField.expectedPrice.min || undefined,
      maxPrice: eightField.expectedPrice.max || undefined,
      radiusKm: 5
    });

    if (p2Result.allMatches.length > 0 && finalRows.length > 0 && !isFallbackActivated) {
      const rankMap = new Map<string, any>();
      p2Result.allMatches.forEach((m: any) => rankMap.set(String(m.property.id), m));
      properties = properties.map((prop) => {
        const m = rankMap.get(String(prop.id));
        return m
          ? {
              ...prop,
              searchBadges: m.badges,
              distanceKm: m.distanceKm,
              isStrictMatch: true
            }
          : prop;
      });
    }

    // Log search analytics silently
    if (cleanSearch.length > 2) {
      query(
        `INSERT INTO search_history (query, locality, bhk, results_count, intent, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          cleanSearch,
          eightField.localities[0] || eightField.cities[0] || "All",
          eightField.propertyTypes[0] || "All",
          properties.length,
          intent
        ]
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      ai: {
        intent,
        primaryView,
        summary: aiSummary,
        locality: eightField.localities[0] || null,
        city: eightField.cities[0] || null,
        bhk: eightField.propertyTypes[0] || null,
        transactionType: eightField.transactionType || null,
        transactionClassification: eightField.transactionClassification || null,
        priceRange: priceRange || null,
        isAiPowered: aiParsed
      },
      eightFieldCriteria: eightField,
      groupByFacets: finalFacets,
      phase2: {
        isFallbackActivated,
        fallbackBanner,
        strictCount: isFallbackActivated ? 0 : properties.length,
        expandedCount: isFallbackActivated ? properties.length : 0,
        totalCount: properties.length,
        appliedFilters: {
          ...eightField,
          radiusKm: 5
        },
        noResultData:
          properties.length === 0
            ? {
                message: `No database listings matched all criteria for "${cleanSearch}". Try adjusting budget, area, or locality.`,
                suggestedActions: ["modify_budget", "modify_area", "change_location"]
              }
            : undefined
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
      { success: false, error: err.message || "Failed unified search" },
      { status: 500 }
    );
  }
}
