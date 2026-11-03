import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getPurposesForProperties, setPropertyBusinessPurposes } from "@/lib/business-purposes";
import { parseDossierData, embedDossierData } from "@/lib/dossier-parser";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let sql = `
      SELECT 
        p.id, p.title AS name, p.slug, p.address AS location, p.description,
        p.price, p."carpetArea" AS sqft, 
        p.bedrooms,
        p.configuration,
        p."listingType" as listing_type,
        p."listingType",
        COALESCE(
          NULLIF(p.configuration, ''), 
          CASE WHEN p.bedrooms IS NOT NULL AND p.bedrooms > 0 THEN p.bedrooms || ' BHK' ELSE pt.name END, 
          'Commercial'
        ) AS bhk,
        p.status, p."publishStatus", p."isFeatured",
        p."videoUrl",
        p."createdAt",
        loc.name as loc_name,
        pt.name as pt_name,
        proj.developer,
        COALESCE(img.url, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800') as image,
        imgs.urls as all_images
      FROM "Property" p
      LEFT JOIN "Location" loc ON p."locationId" = loc.id
      LEFT JOIN "PropertyType" pt ON p."propertyTypeId" = pt.id
      LEFT JOIN "Project" proj ON p."projectId" = proj.id
      LEFT JOIN LATERAL (
        SELECT url FROM "PropertyImage" 
        WHERE "propertyId" = p.id 
        ORDER BY "sortOrder" ASC LIMIT 1
      ) img ON true
      LEFT JOIN LATERAL (
        SELECT array_agg(url ORDER BY "sortOrder" ASC) as urls 
        FROM "PropertyImage" 
        WHERE "propertyId" = p.id
      ) imgs ON true
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.title ILIKE $${params.length} OR p.address ILIKE $${params.length} OR loc.name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY p."createdAt" DESC;`;

    const properties = await query(sql, params);
    const propIds = properties.map((p: any) => p.id);
    const purposesMap = await getPurposesForProperties(propIds);

    return NextResponse.json({
      success: true,
      count: properties.length,
      properties: properties.map((p: any) => {
        const assignedPurposes = purposesMap[String(p.id)] || [];
        const rawImages: string[] = (p.all_images && Array.isArray(p.all_images))
          ? p.all_images.filter((u: any) => typeof u === 'string' && u.trim().length > 0)
          : [];
        const images = rawImages.length > 0 ? rawImages : (p.image ? [p.image] : []);
        const { cleanDescription, dossier } = parseDossierData(p.description || '');

        return {
          ...p,
          hideName: Boolean(dossier.hideName),
          hidePrice: Boolean(dossier.hidePrice),
          isSafe: Boolean(dossier.isSafe),
          description: cleanDescription || p.description || '',
          highlights: dossier.highlights || [],
          connectivity: dossier.connectivity || [],
          amenitiesList: dossier.amenitiesList || [],
          reraNumber: dossier.reraNumber || '',
          possession: dossier.possession || p.status || '',
          rpsStatus: dossier.rpsStatus || '',
          images,
          image: images[0] || p.image,
          videoUrl: p.videoUrl ? String(p.videoUrl).trim() : '',
          listingType: p.listingType || p.listing_type || 'Sale',
          businessPurposes: assignedPurposes,
          businessPurposeIds: assignedPurposes.map((bp: any) => bp.id),
          priceFormatted: p.price
            ? p.price >= 10000000
              ? `₹${(p.price / 10000000).toFixed(2)} Cr`
              : `₹${(p.price / 100000).toFixed(1)} Lakh`
            : "Price on Request"
        };
      })
    });
  } catch (error: any) {
    console.error("GET /api/admin/properties error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, location, developer, price, bhk, configuration, sqft, status, publishStatus, description, imageUrl, images, videoUrl, propertyType, listingType, businessPurposeIds, businessPurposes,
      hideName, hidePrice, highlights, connectivity, amenitiesList, reraNumber, possession, rpsStatus
    } = body;

    const rawListingType = String(listingType || '').toLowerCase();
    const finalListingType = rawListingType.includes('rent') || rawListingType.includes('lease') ? 'Rent' : 'Sale';

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Property title is required." },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();
    const slug =
      trimmedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + `-${Date.now().toString().slice(-4)}`;

    // 1. Resolve Location / Locality
    let locationId = 11; // default fallback (Koregaon Park / Baner)
    const rawLoc = (location || "Baner, Pune").trim();
    const locFirst = rawLoc.split(/[,–-]/)[0].trim();

    let matchedLoc = await queryOne(
      `SELECT id FROM "Location" WHERE LOWER(name) = LOWER($1) OR LOWER(name) = LOWER($2) LIMIT 1;`,
      [locFirst, rawLoc]
    );

    if (matchedLoc) {
      locationId = matchedLoc.id;
    } else if (locFirst.length >= 3) {
      // Create new Location record so it immediately becomes a filter option
      const newLocSlug = locFirst.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-pune";
      const createdLoc = await queryOne(
        `INSERT INTO "Location" (name, slug, city, state, country, description, "createdAt", "updatedAt")
         VALUES ($1, $2, 'Pune', 'Maharashtra', 'India', $3, NOW(), NOW())
         RETURNING id;`,
        [locFirst, newLocSlug, `Exclusive luxury & commercial corridor in ${locFirst}, Pune.`]
      );
      if (createdLoc) locationId = createdLoc.id;
    }

    // 2. Resolve PropertyType & Typology / Configuration
    let propertyTypeId = 1; // default fallback
    const rawType = (body.configuration || propertyType || bhk || "").trim();
    const isCommercial = /\b(?:commercial|office|retail|hospital|clinic|showroom|space|warehouse|industrial)\b/i.test(
      trimmedTitle + " " + rawType
    );

    // Try finding exact or slug match in PropertyType
    const cleanSlug = rawType.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let matchedPT = await queryOne(
      `SELECT id FROM "PropertyType" WHERE LOWER(name) = LOWER($1) OR slug = $2 LIMIT 1;`,
      [rawType, cleanSlug]
    );

    if (!matchedPT && rawType.length >= 3 && !/^\d+\s*bhk$/i.test(rawType)) {
      try {
        matchedPT = await queryOne(
          `INSERT INTO "PropertyType" (name, slug, description, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id;`,
          [
            rawType.charAt(0).toUpperCase() + rawType.slice(1),
            cleanSlug,
            `Exclusive ${rawType} properties in Pune & Mumbai.`
          ]
        );
      } catch (e) {
        console.warn("Could not insert PropertyType:", e);
      }
    }

    if (matchedPT?.id) {
      propertyTypeId = matchedPT.id;
    } else if (isCommercial) {
      const commType = await queryOne(
        `SELECT id FROM "PropertyType" WHERE LOWER(name) LIKE '%commercial%' LIMIT 1;`
      );
      if (commType) {
        propertyTypeId = commType.id;
      }
    } else {
      let matchedPTFallback = await queryOne(
        `SELECT id FROM "PropertyType" WHERE LOWER(name) = LOWER($1) LIMIT 1;`,
        [rawType]
      );
      if (matchedPTFallback) {
        propertyTypeId = matchedPTFallback.id;
      } else if (/\bpenthouse\b/i.test(trimmedTitle + " " + rawType)) {
        const pt = await queryOne(`SELECT id FROM "PropertyType" WHERE LOWER(name) LIKE '%penthouse%' LIMIT 1;`);
        if (pt) propertyTypeId = pt.id;
      } else if (/\bvilla\b/i.test(trimmedTitle + " " + rawType)) {
        const pt = await queryOne(`SELECT id FROM "PropertyType" WHERE LOWER(name) LIKE '%villa%' LIMIT 1;`);
        if (pt) propertyTypeId = pt.id;
      }
    }

    const rawPriceStr = String(price || "").toLowerCase();
    let numPrice = parseFloat(rawPriceStr.replace(/[^0-9.]/g, ""));
    if (rawPriceStr.includes("cr") || rawPriceStr.includes("crore")) {
      numPrice = Math.round(numPrice * 10000000);
    } else if (rawPriceStr.includes("lakh") || rawPriceStr.includes("lac") || rawPriceStr.includes("l")) {
      numPrice = Math.round(numPrice * 100000);
    } else if (rawPriceStr.includes("th") || rawPriceStr.includes("k") || rawPriceStr.includes("thousand")) {
      numPrice = Math.round(numPrice * 1000);
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      numPrice = 15000000;
    }
    const numBedrooms = isCommercial
      ? null
      : (bhk ? parseInt(String(bhk).replace(/[^0-9]/g, ""), 10) || 3 : 3);
    const numArea = sqft ? parseFloat(String(sqft).replace(/[^0-9.]/g, "")) || 1200 : 1200;

    // 3. Resolve Project
    let projectId: number | null = null;
    if (developer && developer.trim()) {
      const proj = await queryOne(
        `SELECT id FROM "Project" WHERE LOWER(developer) = LOWER($1) OR LOWER(name) LIKE $2 LIMIT 1;`,
        [developer.trim(), `%${developer.trim()}%`]
      );
      if (proj) projectId = proj.id;
    }

    const finalDescription = embedDossierData(
      description || `Exclusive luxury property curated by Anv Reealty in ${locFirst}.`,
      {
        highlights: Array.isArray(highlights) ? highlights : undefined,
        connectivity: Array.isArray(connectivity) ? connectivity : undefined,
        amenitiesList: Array.isArray(amenitiesList) ? amenitiesList : undefined,
        reraNumber: reraNumber ? String(reraNumber).trim() : undefined,
        possession: possession ? String(possession).trim() : undefined,
        rpsStatus: rpsStatus ? String(rpsStatus).trim() : undefined,
        hideName: Boolean(hideName),
        hidePrice: Boolean(hidePrice),
      }
    );

    const newProp = await queryOne(`
      INSERT INTO "Property" (
        title, slug, "propertyTypeId", "locationId", "projectId", "listingType", status, "publishStatus",
        description, address, price, "carpetArea", "areaUnit", bedrooms, "configuration", "videoUrl", "isFeatured",
        "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, 'Sq.Ft.', $13, $14, $15, true,
        NOW(), NOW()
      )
      RETURNING *;
    `, [
      trimmedTitle,
      slug,
      propertyTypeId,
      locationId,
      projectId,
      finalListingType,
      status || "Ready to Move",
      publishStatus || "Published",
      finalDescription,
      location || `${locFirst}, Pune, Maharashtra`,
      numPrice,
      numArea,
      numBedrooms,
      rawType || null,
      videoUrl ? String(videoUrl).trim() : null
    ]);

    const imagesToInsert: string[] = (Array.isArray(images) && images.length > 0)
      ? images.map((u: any) => String(u || '').trim()).filter((u: string) => u.length > 0)
      : (imageUrl && String(imageUrl).trim().length > 0 ? [String(imageUrl).trim()] : []);

    if (newProp && imagesToInsert.length > 0) {
      for (let i = 0; i < imagesToInsert.length; i++) {
        await query(`
          INSERT INTO "PropertyImage" ("propertyId", url, "altText", "sortOrder", "isPrimary", "createdAt")
          VALUES ($1, $2, $3, $4, $5, NOW());
        `, [newProp.id, imagesToInsert[i], `${trimmedTitle} - Photo ${i + 1}`, i + 1, i === 0]);
      }
    }

    // Save selected Suitable Business Purposes
    const purposeListToSave = Array.isArray(businessPurposeIds)
      ? businessPurposeIds
      : (Array.isArray(businessPurposes) ? businessPurposes.map((bp: any) => bp.id || bp) : []);
    
    if (newProp && purposeListToSave.length > 0) {
      await setPropertyBusinessPurposes(newProp.id, purposeListToSave);
    }

    return NextResponse.json({
      success: true,
      message: `Property "${trimmedTitle}" published to catalog successfully!`,
      property: {
        ...newProp,
        listingType: finalListingType,
        businessPurposeIds: purposeListToSave
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/properties error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create property" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // 1. Delete all related media and cross-references safely
    await query(`DELETE FROM "PropertyImage";`).catch(() => {});
    await query(`DELETE FROM "PropertyDocument";`).catch(() => {});
    await query(`DELETE FROM "PropertyAmenity";`).catch(() => {});
    await query(`DELETE FROM "FeaturedProperty";`).catch(() => {});
    await query(`DELETE FROM "BlogProperty";`).catch(() => {});
    await query(`UPDATE "WebsiteEnquiry" SET "propertyId" = NULL WHERE "propertyId" IS NOT NULL;`).catch(() => {});

    // 2. Delete all records from Property table
    const deleted = await query(`DELETE FROM "Property" RETURNING id;`);
    const count = deleted.length;

    return NextResponse.json({
      success: true,
      message: `Successfully deleted all ${count} properties and their associated media from the database.`,
      deletedCount: count
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/properties error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete properties" },
      { status: 500 }
    );
  }
}

