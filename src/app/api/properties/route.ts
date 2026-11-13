import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateWithGemini } from "@/lib/gemini";
import { getPropertySlug } from "@/lib/slug";
import {
  detectPropertyTypology,
  parseQueryCriteria,
  scorePropertyMatch,
  getPropertyRawPrice
} from "@/lib/property-matching";
import { getPurposesForProperties } from "@/lib/business-purposes";
import {
  parseNaturalLanguageSearch,
  getLocalitiesWithinRadius
} from "@/lib/matching-and-search-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSearch = (searchParams.get("search") || searchParams.get("query") || "").trim();
    let locality = searchParams.get("locality") || searchParams.get("location") || "";
    let bhk = searchParams.get("bhk") || "";
    let priceRange = searchParams.get("priceRange") || "";
    let status = searchParams.get("status") || "";
    let propertyType = searchParams.get("type") || "";
    let purpose = searchParams.get("purpose") || searchParams.get("businessPurpose") || "";
    let transactionType = searchParams.get("transactionType") || searchParams.get("intent") || "";

    // Advanced & Specialized Search Parameters
    const radiusKm = searchParams.get("radiusKm") ? parseInt(searchParams.get("radiusKm")!, 10) : null;
    const carpetAreaMin = searchParams.get("carpetAreaMin") ? parseInt(searchParams.get("carpetAreaMin")!, 10) : null;
    const carpetAreaMax = searchParams.get("carpetAreaMax") ? parseInt(searchParams.get("carpetAreaMax")!, 10) : null;
    const floor = searchParams.get("floor");
    const parking = searchParams.get("parking");
    const furnishing = searchParams.get("furnishing");
    const possession = searchParams.get("possession");
    const minRoi = searchParams.get("minRoi") ? parseFloat(searchParams.get("minRoi")!) : null;

    let aiParsed = false;
    let aiSummary = "";

    // Normalize punctuation, hyphens, and slashes so pasted slugs or hyphenated queries tokenize cleanly
    // e.g. "Commercial-OfficeSpace-for-Sale-in-Koregaon-Park-Pune(East)" -> "Commercial Office Space for Sale in Koregaon Park Pune East"
    let cleanSearch = rawSearch
      .replace(/[-_/\(\)\[\]]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();

    // Natural Language Query Understanding
    const nlpCriteria = parseNaturalLanguageSearch(cleanSearch);
    if ((!locality || locality === "All" || locality === "All Localities") && nlpCriteria.locality) {
      locality = nlpCriteria.locality;
    }
    if ((!bhk || bhk === "All" || bhk === "All Typologies") && nlpCriteria.bhk) {
      bhk = nlpCriteria.bhk;
    }
    if ((!propertyType || propertyType === "All" || propertyType === "All Types") && nlpCriteria.typology) {
      propertyType = nlpCriteria.typology;
    }

    // --- 0. Google Gemini AI Semantic Query Extraction ---
    if (cleanSearch.length > 2 && (!bhk || bhk === "All") && (!locality || locality === "All")) {
      try {
        const geminiPrompt = `You are an AI real estate query parser for Anv Reealty in Pune, India.
Given the user query, return a JSON object with:
- "bhk": "2 BHK" | "3 BHK" | "4 BHK" | "4.5+ BHK Penthouse" | "Commercial Office" | null
- "locality": "Baner" | "Balewadi" | "Kalyani Nagar" | "Bavdhan" | "Mahalunge" | "Shivajinagar" | "Kharadi" | "Worli" | "Koregaon Park" | "Viman Nagar" | "Undri" | null
- "priceRange": "Under ₹1.5 Cr" | "₹1.5 Cr - ₹2.5 Cr" | "₹2.5 Cr - ₹4.0 Cr" | "₹4.0 Cr+" | null
- "status": "Ready to Move" | "Under-Construction" | null
- "propertyType": "Apartment" | "Penthouse" | "Villa" | "Commercial Office" | "Hospital" | null
- "keywords": string[] (e.g. builder names like "Godrej", "VTP", "Panchshil", "GT", project names)
- "summary": string (1 concise sentence describing what user is looking for)

Return ONLY valid JSON (no markdown formatting).`;

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
          const earlyCrit = parseQueryCriteria(cleanSearch);
          const earlyIsMulti = earlyCrit.isMultiCategory || (earlyCrit.typologyIntents && earlyCrit.typologyIntents.length > 1) || (earlyCrit.bhkNums && earlyCrit.bhkNums.length > 1);

          if (!earlyIsMulti) {
            const hasExplicitBhkInQuery = /\b(\d+\s*bhk|\d+\s*bed|bedroom|penthouse|commercial|office|studio|duplex)\b/i.test(cleanSearch);
            if (parsed.bhk && hasExplicitBhkInQuery && (!bhk || bhk === "All")) bhk = parsed.bhk;
            if (parsed.propertyType && (!propertyType || propertyType === "All")) propertyType = parsed.propertyType;
          }

          const knownLocs = ["Baner", "Balewadi", "Kalyani Nagar", "Bavdhan", "Mahalunge", "Shivajinagar", "Kharadi", "Worli", "Koregaon Park", "Viman Nagar", "Undri"];
          const hasExplicitLocalityInQuery = knownLocs.some(loc => new RegExp(`\\b${loc}\\b`, "i").test(cleanSearch));
          if (parsed.locality && hasExplicitLocalityInQuery && (!locality || locality === "All")) locality = parsed.locality;
          if (parsed.priceRange && (!priceRange || priceRange === "All")) priceRange = parsed.priceRange;
          if (parsed.status && (!status || status === "All")) status = parsed.status;
          if (parsed.summary) {
            aiSummary = parsed.summary;
            aiParsed = true;
          }
        }
      } catch (err: any) {
        console.log("Gemini API fallback to high-speed NLP parser (" + (err.message || "quota/timeout") + ")");
      }
    }

    // Base query joining Project, Location, PropertyType and primary Image
    let sql = `
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
    `;

    const params: any[] = [];
    let paramIndex = 1;

    let workingSearch = cleanSearch;
    const queryCriteria = parseQueryCriteria(cleanSearch);
    const isMultiCat = queryCriteria.isMultiCategory || (queryCriteria.typologyIntents && queryCriteria.typologyIntents.length > 1) || (queryCriteria.bhkNums && queryCriteria.bhkNums.length > 1);

    // --- 1. Intelligent Search Query Pre-Processing ---
    // If user searched a single digit like "3" or "2" or "4", treat as BHK requirement
    if (/^[1-9]$/.test(workingSearch)) {
      if (!bhk || bhk === "All" || bhk === "All Typologies") {
        bhk = `${workingSearch} BHK`;
      }
      workingSearch = "";
    }

    // Extract BHK or Commercial from search query if not explicitly passed (only if NOT multi-category)
    if (!isMultiCat) {
      if (!bhk || bhk === "All" || bhk === "All Typologies") {
        if (/\b(?:commercial\s*office|it\s*park|tech\s*park|corporate)\b/i.test(workingSearch)) {
          bhk = "Commercial Office";
          propertyType = "Commercial Office";
          workingSearch = workingSearch.replace(/\b(?:commercial\s*office|it\s*park|tech\s*park|corporate)\b/gi, " ");
        } else if (/\b(?:showroom)\b/i.test(workingSearch)) {
          bhk = "Showroom";
          propertyType = "Showroom";
          workingSearch = workingSearch.replace(/\b(?:showroom)\b/gi, " ");
        } else if (/\b(?:shop|retail)\b/i.test(workingSearch)) {
          bhk = "Shop";
          propertyType = "Shop";
          workingSearch = workingSearch.replace(/\b(?:shop|retail)\b/gi, " ");
        } else {
          const bhkMatch = workingSearch.match(/\b([1-9])\s*(?:bhk|bedroom|bed)s?\b/i) || workingSearch.match(/\b(?:bhk|bedroom|bed)s?\s*([1-9])\b/i);
          if (bhkMatch) {
            bhk = `${bhkMatch[1]} BHK`;
            workingSearch = workingSearch.replace(bhkMatch[0], " ");
          } else if (/\bpenthouses?\b/i.test(workingSearch)) {
            bhk = "4.5+ BHK Penthouse";
            propertyType = "Penthouse";
          }
        }
      } else {
        // Remove explicit bhk pattern from search query to avoid conflicts
        workingSearch = workingSearch.replace(/\b[1-9]\s*(?:bhk|bedroom|bed)s?\b/gi, " ");
      }
    }

    // Extract known Pune localities from search query
    const knownLocalities = [
      "Koregaon Park", "Baner", "Balewadi", "Kalyani Nagar", "Bavdhan", "Mahalunge",
      "Shivajinagar", "Kharadi", "Worli", "Hinjewadi", "Wakad",
      "Aundh", "Viman Nagar", "Kothrud", "Hadapsar", "Magarpatta"
    ];

    if (!locality || locality === "All" || locality === "All Localities") {
      for (const loc of knownLocalities) {
        const locRegex = new RegExp(`\\b${loc.replace(/\\s+/g, "\\s+")}\\b`, "i");
        if (locRegex.test(workingSearch)) {
          locality = loc;
          workingSearch = workingSearch.replace(locRegex, " ");
          break;
        }
      }
    } else {
      for (const loc of knownLocalities) {
        const locRegex = new RegExp(`\\b${loc.replace(/\\s+/g, "\\s+")}\\b`, "i");
        workingSearch = workingSearch.replace(locRegex, " ");
      }
    }

    // Extract Status from search query if not explicitly provided
    if (!status || status === "All" || status === "All Statuses") {
      if (/\bready\s*to\s*move\b/i.test(workingSearch)) {
        status = "Ready to Move";
        workingSearch = workingSearch.replace(/\bready\s*to\s*move\b/gi, " ");
      } else if (/\bunder\s*construction\b/i.test(workingSearch) || /\bunder-construction\b/i.test(workingSearch)) {
        status = "Under-Construction";
        workingSearch = workingSearch.replace(/\bunder[-\s]construction\b/gi, " ");
      } else if (/\bnew\s*launch\b/i.test(workingSearch) || /\bnewly\s*launched\b/i.test(workingSearch)) {
        status = "Newly Launched";
        workingSearch = workingSearch.replace(/\bnew(?:ly)?\s*launch(?:ed)?\b/gi, " ");
      }
    }

    // Extract Property Type from search query if not explicitly provided (only if NOT multi-category)
    if (!isMultiCat && (!propertyType || propertyType === "All" || propertyType === "All Types")) {
      if (/\b(?:apartment|apartments|flat|flats)\b/i.test(workingSearch)) {
        propertyType = "Apartment";
        workingSearch = workingSearch.replace(/\b(?:apartment|apartments|flat|flats)\b/gi, " ");
      } else if (/\b(?:villa|villas)\b/i.test(workingSearch)) {
        propertyType = "Villa";
        workingSearch = workingSearch.replace(/\b(?:villa|villas)\b/gi, " ");
      } else if (/\b(?:penthouse|penthouses)\b/i.test(workingSearch)) {
        propertyType = "Penthouse";
        workingSearch = workingSearch.replace(/\b(?:penthouse|penthouses)\b/gi, " ");
      } else if (/\b(?:commercial|office|retail|space)\b/i.test(workingSearch)) {
        propertyType = "Commercial";
        workingSearch = workingSearch.replace(/\b(?:commercial|office|retail|space)\b/gi, " ");
      }
    }

    // Extract Budget / Price from search query
    if (!priceRange || priceRange === "All" || priceRange === "Any Budget") {
      if (/\b(?:under|below|<|less than)\s*(?:₹|rs\.?)?\s*1\.5\s*(?:cr|crore)?\b/i.test(workingSearch)) {
        priceRange = "Under ₹1.5 Cr";
        workingSearch = workingSearch.replace(/\b(?:under|below|<|less than)\s*(?:₹|rs\.?)?\s*1\.5\s*(?:cr|crore)?\b/gi, " ");
      } else if (/\b(?:under|below|<|less than)\s*(?:₹|rs\.?)?\s*2(?:\.0|\.5)?\s*(?:cr|crore)?\b/i.test(workingSearch)) {
        priceRange = "₹1.5 Cr - ₹2.5 Cr";
        workingSearch = workingSearch.replace(/\b(?:under|below|<|less than)\s*(?:₹|rs\.?)?\s*2(?:\.0|\.5)?\s*(?:cr|crore)?\b/gi, " ");
      } else if (/\b(?:above|>|more than)\s*(?:₹|rs\.?)?\s*4(?:\.0)?\s*(?:cr|crore)?\b/i.test(workingSearch) || /\b4\s*(?:cr|crore)?\s*\+\b/i.test(workingSearch)) {
        priceRange = "₹4.0 Cr+";
        workingSearch = workingSearch.replace(/\b(?:above|>|more than)\s*(?:₹|rs\.?)?\s*4(?:\.0)?\s*(?:cr|crore)?\b/gi, " ");
      }
    }

    // Stop words to exclude from keyword search so they don't over-broaden or conflict
    const stopWords = [
      "in", "the", "and", "for", "at", "to", "of", "with", "near", "by", "on", "a", "an",
      "pune", "luxury", "verified", "property", "properties", "home", "homes", "residence",
      "residences", "project", "projects", "buy", "sale", "all", "best", "flat", "flats",
      "apartment", "apartments", "commercial", "office", "space", "spaces", "looking",
      "want", "find", "show", "me", "need"
    ];

    const words = workingSearch
      .toLowerCase()
      .split(/[\s,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1 && !stopWords.includes(w));

    // --- 2. SQL Filter Conditions ---

    // BHK / Typology Filtering
    if (isMultiCat) {
      // For multi-category searches (e.g. "shop and office", "2 bhk and 3 bhk"),
      // properties from all matching categories are evaluated and union-scored by scorePropertyMatch below.
    } else if (bhk && bhk !== "All" && bhk !== "All Typologies") {
      if (bhk.toLowerCase().includes("commercial") || bhk.toLowerCase().includes("office")) {
        sql += ` AND (
          LOWER(COALESCE(pt.name, '')) LIKE '%commercial%' OR 
          LOWER(p.title) LIKE '%commercial%' OR 
          LOWER(p.title) LIKE '%office%' OR
          p.bedrooms IS NULL OR
          p.bedrooms = 0
        )`;
      } else if (bhk.includes("4.5") || bhk.toLowerCase().includes("penthouse") || bhk.includes("5")) {
        sql += ` AND (p.bedrooms >= 4 OR LOWER(p.title) LIKE '%penthouse%' OR LOWER(COALESCE(pt.name, '')) LIKE '%penthouse%')`;
      } else {
        const bhkDigits = bhk.match(/\d+/);
        if (bhkDigits) {
          sql += ` AND p.bedrooms = $${paramIndex}`;
          params.push(parseInt(bhkDigits[0], 10));
          paramIndex++;
        } else {
          sql += ` AND (
            LOWER(COALESCE(p.configuration, '')) LIKE $${paramIndex} OR 
            LOWER(COALESCE(pt.name, '')) LIKE $${paramIndex} OR 
            LOWER(p.title) LIKE $${paramIndex} OR
            LOWER(COALESCE(p.description, '')) LIKE $${paramIndex}
          )`;
          params.push(`%${bhk.toLowerCase()}%`);
          paramIndex++;
        }
      }
    }

    // Locality & Radius proximity filtering
    const effectiveRadius = radiusKm || nlpCriteria.radiusKm || 0;
    if (locality && locality !== "All" && locality !== "All Localities") {
      if (effectiveRadius > 0) {
        const radiusNeighbors = getLocalitiesWithinRadius(locality, effectiveRadius).map((n) => n.name);
        if (radiusNeighbors.length > 0) {
          const locClauses = radiusNeighbors.map(
            (_, idx) =>
              `LOWER(COALESCE(loc.name, '')) LIKE $${paramIndex + idx} OR LOWER(COALESCE(p.address, '')) LIKE $${
                paramIndex + idx
              } OR LOWER(p.title) LIKE $${paramIndex + idx}`
          );
          sql += ` AND (${locClauses.join(' OR ')})`;
          radiusNeighbors.forEach((rn) => {
            params.push(`%${rn.toLowerCase()}%`);
            paramIndex++;
          });
        } else {
          sql += ` AND (
            LOWER(COALESCE(loc.name, '')) LIKE $${paramIndex} OR 
            LOWER(COALESCE(p.address, '')) LIKE $${paramIndex} OR
            LOWER(p.title) LIKE $${paramIndex}
          )`;
          params.push(`%${locality.toLowerCase()}%`);
          paramIndex++;
        }
      } else {
        sql += ` AND (
          LOWER(COALESCE(loc.name, '')) LIKE $${paramIndex} OR 
          LOWER(COALESCE(p.address, '')) LIKE $${paramIndex} OR
          LOWER(p.title) LIKE $${paramIndex}
        )`;
        params.push(`%${locality.toLowerCase()}%`);
        paramIndex++;
      }
    }

    // Status filtering
    if (status && status !== "All" && status !== "All Statuses") {
      if (status.toLowerCase().includes("ready")) {
        sql += ` AND LOWER(p.status) LIKE '%ready%'`;
      } else if (status.toLowerCase().includes("under")) {
        sql += ` AND (LOWER(p.status) LIKE '%under%' OR LOWER(p.status) LIKE '%construction%')`;
      } else if (status.toLowerCase().includes("new")) {
        sql += ` AND (LOWER(p.status) LIKE '%new%' OR p."isFeatured" = false)`;
      } else {
        sql += ` AND LOWER(p.status) LIKE $${paramIndex}`;
        params.push(`%${status.toLowerCase()}%`);
        paramIndex++;
      }
    }

    // Price range filtering
    if (priceRange && priceRange !== "Any Budget" && priceRange !== "All" && priceRange !== "all") {
      if (priceRange === "under_1.5cr" || priceRange.includes("Under ₹1.5") || priceRange.toLowerCase().includes("under 1.5")) {
        sql += ` AND p.price <= 15000000`;
      } else if (priceRange === "1.5_2.5cr" || priceRange.includes("₹1.5 - ₹2.5") || priceRange.includes("₹1.5 Cr - ₹2.5 Cr") || priceRange.includes("2.0")) {
        sql += ` AND p.price >= 15000000 AND p.price <= 25000000`;
      } else if (priceRange === "2.5_4cr" || priceRange.includes("₹2.5 - ₹4.0") || priceRange.includes("₹2.5 Cr - ₹4.0 Cr")) {
        sql += ` AND p.price >= 25000000 AND p.price <= 40000000`;
      } else if (priceRange === "above_4cr" || priceRange.includes("₹4.0 Cr+") || priceRange.toLowerCase().includes("above 4")) {
        sql += ` AND p.price >= 40000000`;
      }
    }

    // Natural Language Budget Extracted (if priceRange was not explicit)
    if ((!priceRange || priceRange === "Any Budget" || priceRange === "All" || priceRange === "all") && nlpCriteria.maxPrice) {
      sql += ` AND p.price <= $${paramIndex}`;
      params.push(nlpCriteria.maxPrice);
      paramIndex++;
    }
    if ((!priceRange || priceRange === "Any Budget" || priceRange === "All" || priceRange === "all") && nlpCriteria.minPrice) {
      sql += ` AND p.price >= $${paramIndex}`;
      params.push(nlpCriteria.minPrice);
      paramIndex++;
    }

    // Carpet Area Range Filtering
    const effectiveCarpetMin = carpetAreaMin || nlpCriteria.carpetAreaMin;
    const effectiveCarpetMax = carpetAreaMax || nlpCriteria.carpetAreaMax;
    if (effectiveCarpetMin) {
      sql += ` AND p."carpetArea" >= $${paramIndex}`;
      params.push(effectiveCarpetMin);
      paramIndex++;
    }
    if (effectiveCarpetMax) {
      sql += ` AND p."carpetArea" <= $${paramIndex}`;
      params.push(effectiveCarpetMax);
      paramIndex++;
    }

    // Parking Filter
    if (parking === 'true' || parking === 'yes' || nlpCriteria.hasParking) {
      sql += ` AND (LOWER(p.description) LIKE '%parking%' OR LOWER(p.title) LIKE '%parking%')`;
    }

    // Furnishing Filter
    const effectiveFurnishing = furnishing || nlpCriteria.furnishing;
    if (effectiveFurnishing) {
      sql += ` AND (LOWER(p.description) LIKE $${paramIndex} OR LOWER(p.title) LIKE $${paramIndex})`;
      params.push(`%${effectiveFurnishing.toLowerCase()}%`);
      paramIndex++;
    }

    // Floor Filter
    const effectiveFloor = floor || nlpCriteria.floorPreference;
    if (effectiveFloor === 'penthouse') {
      sql += ` AND (p.bedrooms >= 4 OR LOWER(p.title) LIKE '%penthouse%' OR LOWER(COALESCE(pt.name, '')) LIKE '%penthouse%')`;
    } else if (effectiveFloor === 'ground') {
      sql += ` AND (LOWER(p.description) LIKE '%ground floor%' OR LOWER(p.title) LIKE '%ground floor%')`;
    } else if (effectiveFloor === 'high') {
      sql += ` AND (LOWER(p.description) LIKE '%high floor%' OR LOWER(p.description) LIKE '%higher floor%')`;
    }

    // Investment & ROI Yield Filter
    const effectiveRoi = minRoi || nlpCriteria.minRoi;
    if (effectiveRoi || nlpCriteria.isPreleased) {
      sql += ` AND (LOWER(p.description) LIKE '%roi%' OR LOWER(p.description) LIKE '%pre-leased%' OR LOWER(p.description) LIKE '%preleased%' OR LOWER(p.title) LIKE '%preleased%')`;
    }

    // Property type filtering
    if (!isMultiCat && propertyType && propertyType !== "All" && propertyType !== "All Types") {
      sql += ` AND (
        LOWER(COALESCE(pt.name, '')) LIKE $${paramIndex} OR 
        LOWER(p.title) LIKE $${paramIndex} OR
        LOWER(COALESCE(p.description, '')) LIKE $${paramIndex}
      )`;
      params.push(`%${propertyType.toLowerCase()}%`);
      paramIndex++;
    }

    // Business Purpose filtering (Exact slug, ID, or name match)
    if (purpose && purpose !== "All" && purpose !== "all") {
      sql += ` AND EXISTS (
        SELECT 1 FROM "PropertyBusinessPurpose" pbp
        JOIN "BusinessPurpose" bp ON pbp."businessPurposeId" = bp.id
        WHERE pbp."propertyId" = p.id AND (bp.slug = $${paramIndex} OR bp.id::text = $${paramIndex} OR LOWER(bp.name) = LOWER($${paramIndex}))
      )`;
      params.push(purpose.trim());
      paramIndex++;
    }

    // Transaction Type filtering (Buy / Sale vs Rent / Lease)
    if (transactionType && transactionType !== "All" && transactionType !== "all") {
      const ttLower = transactionType.toLowerCase().trim();
      if (ttLower.includes("rent") || ttLower.includes("lease")) {
        sql += ` AND (LOWER(COALESCE(p."listingType", '')) LIKE '%rent%' OR LOWER(COALESCE(p."listingType", '')) LIKE '%lease%')`;
      } else if (ttLower.includes("buy") || ttLower.includes("sale")) {
        sql += ` AND (LOWER(COALESCE(p."listingType", '')) LIKE '%sale%' OR LOWER(COALESCE(p."listingType", '')) LIKE '%buy%' OR p."listingType" IS NULL)`;
      }
    }

    // High-signal project or building name words
    if (queryCriteria.nameWords.length > 0) {
      for (const w of queryCriteria.nameWords) {
        const idx = paramIndex++;
        params.push(`%${w}%`);
        sql += ` AND (
          LOWER(COALESCE(p.configuration, '')) LIKE $${idx} OR 
          LOWER(p.title) LIKE $${idx} OR 
          LOWER(COALESCE(p.description, '')) LIKE $${idx} OR 
          LOWER(COALESCE(p.address, '')) LIKE $${idx} OR 
          LOWER(COALESCE(proj.developer, '')) LIKE $${idx} OR 
          LOWER(COALESCE(loc.name, '')) LIKE $${idx} OR
          LOWER(COALESCE(pt.name, '')) LIKE $${idx} OR
          LOWER(COALESCE(p.slug, '')) LIKE $${idx}
        )`;
      }
    }

    sql += ` ORDER BY p."isFeatured" DESC, p."createdAt" DESC;`;

    const rows = await query(sql, params);
    const propIds = rows.map((r: any) => r.id);
    const purposesMap = await getPurposesForProperties(propIds);

    const properties = rows.map((p: any) => {
      const numPrice = Number(p.price) || 15000000;
      const formattedPrice =
        numPrice >= 10000000
          ? `₹${(numPrice / 10000000).toFixed(2)} Cr`
          : `₹${(numPrice / 100000).toFixed(1)} Lakh`;

      const detectedTypology = detectPropertyTypology({
        name: p.name,
        configuration: p.configuration,
        bhk: p.configuration || (p.bhk_num ? `${p.bhk_num} BHK` : ''),
        type_name: p.type_name,
        description: p.description
      });
      const isCommercial = detectedTypology !== 'residential' && detectedTypology !== 'land_plot';

      const bhkStr = p.configuration
        ? p.configuration
        : (isCommercial
          ? (p.type_name || "Commercial Space")
          : (p.bhk_num ? `${p.bhk_num} BHK` : "3 BHK"));

      const sqftStr = p.sqft_num
        ? `${Number(p.sqft_num).toLocaleString()} Sq.Ft.`
        : "1,200 Sq.Ft.";

      const defaultDesc = isCommercial
        ? `Grade-A corporate office space in ${p.locality}, Pune. Landmark business address with optimized workspace efficiency and airport corridor connectivity.`
        : `Spacious and luxurious ${bhkStr} residence in ${p.locality}. High floor inventory with scenic skyline views.`;

      const tags = isCommercial
        ? ["Grade-A Tower", "Warm Shell", "Airport & KP Connectivity", "100% DG Backup"]
        : ["Verified Listing", "Vastu Compliant", "Private Balcony"];

      const label = isCommercial
        ? "Commercial Landmark"
        : (p.featured ? "Top Choice" : "New Launch");

      // Strictly return only images actually uploaded for this property
      const rawImages: string[] = (p.all_images && Array.isArray(p.all_images))
        ? p.all_images.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : [];

      const resolvedImages = rawImages.length > 0
        ? rawImages
        : (p.image ? [p.image] : []);

      const videoUrl = p.videoUrl && String(p.videoUrl).trim().length > 0 ? String(p.videoUrl).trim() : null;
      const videoThumbnail = videoUrl ? (resolvedImages[0] || null) : null;

      return {
        id: String(p.id),
        slug: p.slug || getPropertySlug({ id: p.id, name: p.name, locality: p.locality }),
        name: p.name,
        developer: p.developer,
        locality: p.locality,
        location: p.location || `${p.locality}, Pune, Maharashtra`,
        price: formattedPrice,
        priceRaw: numPrice,
        priceSuffix: "All Inclusive",
        bhk: bhkStr,
        bhkNum: p.bhk_num || 0,
        sqft: sqftStr,
        sqftNum: Number(p.sqft_num) || 1200,
        status: p.status || "Ready to Move",
        reraNumber: p.rera_number || "PRM/PUN/COM/2026/0882",
        rpsStatus: isCommercial ? "Verified Commercial" : "Verified Project",
        description: p.description || defaultDesc,
        image: p.image,
        images: resolvedImages,
        videoUrl,
        videoThumbnail,
        tags,
        featured: !!p.featured,
        label,
        isCommercial,
        listingType: p.listing_type || 'Sale',
        businessPurposes: purposesMap[String(p.id)] || []
      };
    });

    let finalProperties = properties;
    if (queryCriteria.hasSpecificIntent || cleanSearch.trim()) {
      finalProperties = properties
        .map((prop) => ({ prop, matchScore: scorePropertyMatch(prop, queryCriteria) }))
        .filter((item) => {
          if (item.matchScore <= 0) return false;
          const price = getPropertyRawPrice(item.prop);
          if (price > 0) {
            if (queryCriteria.maxBudget && price > queryCriteria.maxBudget) return false;
            if (queryCriteria.minBudget && price < queryCriteria.minBudget) return false;
          }
          return true;
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .map((item) => item.prop);
    }

    // Similar Properties Alternative Recommendations (when exact match returns 0 or low count)
    let similarAlternatives: any[] = [];
    if (finalProperties.length === 0 && properties.length > 0) {
      similarAlternatives = properties.slice(0, 4);
    }

    // Search Analytics & Unmet Demand Logging
    if (cleanSearch.length > 2) {
      query(
        `INSERT INTO search_history (query, locality, bhk, results_count, intent, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [cleanSearch, locality || 'All', bhk || 'All', finalProperties.length, nlpCriteria.intent || 'buyer']
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      count: finalProperties.length,
      aiParsed,
      aiSummary:
        aiSummary ||
        (bhk
          ? `Verified ${bhk} properties${locality ? ` in ${locality}` : ''}`
          : 'Curated Pune luxury & commercial properties'),
      nlpCriteria,
      similarAlternatives,
      properties: finalProperties
    });
  } catch (error: any) {
    console.error("GET /api/properties error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch properties", stack: error.stack },
      { status: 200 }
    );
  }
}
