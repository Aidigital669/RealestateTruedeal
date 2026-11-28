import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPropertySlug } from "@/lib/slug";
import { parseDossierData } from "@/lib/dossier-parser";
import { detectPropertyTypology } from "@/lib/property-matching";
import { getPurposesForProperties } from "@/lib/business-purposes";
import { fetchHomepageProperties, toHomepageSummary } from "@/lib/property-data";
import { resolvePropertyPrice } from "@/lib/price-utils";
import { parseEightFieldRequirements } from "@/lib/eight-field-parser";
import {
  buildEightFieldWhereClause,
  executeEightFieldSqlRows,
  fetchEightFieldGroupByFacets
} from "@/lib/sql-8field-search";
import { parseAreaToSqft } from "@/lib/excel-import-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSearch = (searchParams.get("search") || searchParams.get("query") || "").trim();
    const locality = searchParams.get("locality") || searchParams.get("location") || "";
    const city = searchParams.get("city") || "";
    const bhk = searchParams.get("bhk") || "";
    const priceRange = searchParams.get("priceRange") || "";
    const status = searchParams.get("status") || "";
    const propertyType = searchParams.get("type") || searchParams.get("propertyType") || "";
    const transactionClassification = searchParams.get("transactionClassification") || "";
    const purpose = searchParams.get("purpose") || searchParams.get("businessPurpose") || "";
    const transactionType = searchParams.get("transactionType") || searchParams.get("intent") || "";

    const carpetAreaMin = searchParams.get("carpetAreaMin") || searchParams.get("minCarpetArea");
    const carpetAreaMax = searchParams.get("carpetAreaMax") || searchParams.get("maxCarpetArea");
    const builtupAreaMin = searchParams.get("minBuiltupArea") || searchParams.get("builtupAreaMin");
    const builtupAreaMax = searchParams.get("maxBuiltupArea") || searchParams.get("builtupAreaMax");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const isUnfiltered =
      !rawSearch &&
      (!locality || locality === "All" || locality === "All Localities") &&
      (!city || city === "All" || city === "All Cities") &&
      (!bhk || bhk === "All" || bhk === "All Typologies") &&
      (!priceRange || priceRange === "All" || priceRange === "Any Budget" || priceRange === "all") &&
      (!status || status === "All" || status === "All Statuses") &&
      (!propertyType || propertyType === "All" || propertyType === "All Types") &&
      (!transactionClassification || transactionClassification === "All") &&
      (!purpose || purpose === "All" || purpose === "all") &&
      (!transactionType || transactionType === "All" || transactionType === "all") &&
      !carpetAreaMin &&
      !carpetAreaMax &&
      !builtupAreaMin &&
      !builtupAreaMax &&
      !minPrice &&
      !maxPrice;

    if (isUnfiltered) {
      const cachedProps = await fetchHomepageProperties();
      return NextResponse.json({
        success: true,
        count: cachedProps.length,
        aiParsed: false,
        aiSummary: "Curated luxury & commercial properties",
        nlpCriteria: {},
        similarAlternatives: [],
        properties: cachedProps
      });
    }

    const cleanSearch = rawSearch
      .replace(/[-_/\(\)\[\]]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();

    const eightField = parseEightFieldRequirements(cleanSearch, {
      transactionType,
      propertyType: propertyType && propertyType !== "All" && propertyType !== "All Types" ? propertyType : bhk,
      bhk,
      transactionClassification,
      locality,
      city,
      minBuiltupArea: builtupAreaMin ? Number(builtupAreaMin) : null,
      maxBuiltupArea: builtupAreaMax ? Number(builtupAreaMax) : null,
      minCarpetArea: carpetAreaMin ? Number(carpetAreaMin) : null,
      maxCarpetArea: carpetAreaMax ? Number(carpetAreaMax) : null,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      priceRange
    });

    const built = buildEightFieldWhereClause(eightField, {
      includeStatus: status,
      includePurpose: purpose
    });

    const [rows, facets] = await Promise.all([
      executeEightFieldSqlRows(built.whereSql, built.params, 250),
      fetchEightFieldGroupByFacets(built.whereSql, built.params)
    ]);

    const propIds = rows.map((r: any) => r.id);
    const purposesMap = propIds.length > 0 ? await getPurposesForProperties(propIds) : {};

    const hydrated = rows.map((p: any) => {
      const { cleanDescription, dossier: parsedDossier } = parseDossierData(p.description || "", p.name);
      const d = {
        ...(typeof p.dossierData === "object" && p.dossierData !== null ? p.dossierData : {}),
        ...(parsedDossier || {})
      } as Record<string, any>;

      const { numPrice, formattedPrice, priceSuffix } = resolvePropertyPrice(p, d);
      const isPriceHidden = Boolean(d.hidePrice);

      const detectedTypology = detectPropertyTypology({
        name: p.name,
        configuration: p.configuration,
        bhk: p.configuration || (p.bhk_num ? `${p.bhk_num} BHK` : ""),
        type_name: p.type_name,
        description: p.description
      });
      const isCommercial = detectedTypology !== "residential" && detectedTypology !== "land_plot";

      const bhkStr =
        d.PropertyTypeName ||
        p.configuration ||
        (isCommercial ? p.type_name || "Commercial Space" : p.bhk_num ? `${p.bhk_num} BHK` : "3 BHK");
      const carpetNum =
        Number(p.carpet_num || p.sqft_num) ||
        parseAreaToSqft(d.CarpetAreaName) ||
        0;
      const builtupNum =
        Number(p.builtup_num) ||
        parseAreaToSqft(d.BuiltAreaName) ||
        parseAreaToSqft(d.SuperAreaName) ||
        0;
      const sqftStr =
        d.CarpetAreaName ||
        d.SuperAreaName ||
        (carpetNum ? `${carpetNum.toLocaleString()} Sq.Ft.` : "1,200 Sq.Ft.");

      const rawImages: string[] =
        p.all_images && Array.isArray(p.all_images)
          ? p.all_images.filter((url: any) => typeof url === "string" && url.trim().length > 0)
          : [];
      const resolvedImages = rawImages.length > 0 ? rawImages : p.image ? [p.image] : [];
      const videoUrl = p.videoUrl && String(p.videoUrl).trim().length > 0 ? String(p.videoUrl).trim() : null;

      return toHomepageSummary({
        id: String(p.id),
        slug: p.slug || getPropertySlug({ id: p.id, name: p.name, locality: p.locality }),
        name: p.name,
        developer: p.developer && !/anv\b/i.test(p.developer) ? p.developer : "",
        buildingName: d.BuildingName || "",
        locality: p.locality,
        city: p.city_name || d.CityName || p.loc_city || "Pune",
        location: p.location || `${p.locality}, Pune, Maharashtra`,
        price: isPriceHidden ? "Price on Request" : formattedPrice,
        priceRaw: numPrice,
        priceSuffix: isPriceHidden ? "On Request" : priceSuffix,
        hidePrice: isPriceHidden,
        bhk: bhkStr,
        bhkNum: p.bhk_num || 0,
        sqft: sqftStr,
        sqftNum: carpetNum || builtupNum || 0,
        carpetAreaNum: carpetNum,
        builtupAreaNum: builtupNum,
        transactionClassification: p.transactionClassification || d.TransactionName || null,
        status: d.PossessionName || d.possession || p.status || "Ready to Move",
        possession: d.PossessionName || d.possession || p.status || "Possession on Request",
        reraNumber: d.reraNumber || p.rera_number || "",
        description: cleanDescription || p.description || "",
        dossier: d,
        image: p.image,
        images: resolvedImages,
        videoUrl,
        videoThumbnail: videoUrl ? resolvedImages[0] || null : null,
        featured: !!p.featured,
        label: isCommercial ? "Commercial Landmark" : p.featured ? "Top Choice" : "New Launch",
        isCommercial,
        isPreleased: Boolean(p.is_preleased),
        listingType: d.TransactionName ? (p.listing_type || "Sale") : p.listing_type || "Sale",
        businessPurposes: purposesMap[String(p.id)] || []
      });
    });

    const totalMatchedCount =
      facets.transactionTypes.reduce((sum, r) => sum + Number(r.count || 0), 0) || hydrated.length;

    if (cleanSearch.length > 2) {
      query(
        `INSERT INTO search_history (query, locality, bhk, results_count, intent, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          cleanSearch,
          eightField.localities[0] || eightField.cities[0] || "All",
          eightField.propertyTypes[0] || "All",
          totalMatchedCount,
          eightField.transactionType || "buyer"
        ]
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      count: totalMatchedCount,
      returnedCount: hydrated.length,
      aiParsed: false,
      aiSummary: `SQL 8-field search matched ${totalMatchedCount} verified listings`,
      eightFieldCriteria: eightField,
      groupByFacets: facets,
      similarAlternatives: [],
      properties: hydrated
    });
  } catch (error: any) {
    console.error("GET /api/properties error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
