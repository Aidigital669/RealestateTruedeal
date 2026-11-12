import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { getPurposesForProperties, setPropertyBusinessPurposes } from "@/lib/business-purposes";
import { parseDossierData, embedDossierData } from "@/lib/dossier-parser";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const colUpdates = new Map<string, any>();

    // 1. Title / Name
    const titleVal = body.title !== undefined ? body.title : body.name;
    if (titleVal !== undefined && typeof titleVal === "string" && titleVal.trim()) {
      colUpdates.set("title", titleVal.trim());
    }

    // 2. Price
    if (body.price !== undefined && body.price !== null && body.price !== "") {
      const rawStr = String(body.price).toLowerCase();
      let parsed = parseFloat(rawStr.replace(/[^0-9.]/g, ""));
      if (rawStr.includes("cr") || rawStr.includes("crore")) {
        parsed = Math.round(parsed * 10000000);
      } else if (rawStr.includes("lakh") || rawStr.includes("lac") || rawStr.includes("l")) {
        parsed = Math.round(parsed * 100000);
      }
      colUpdates.set("price", isNaN(parsed) ? 15000000 : parsed);
    }

    // 3. Location / Address & locationId
    const addressVal = body.address !== undefined ? body.address : body.location;
    if (addressVal !== undefined && typeof addressVal === "string" && addressVal.trim()) {
      const trimmedAddress = addressVal.trim();
      colUpdates.set("address", trimmedAddress);

      const locFirst = trimmedAddress.split(/[,–-]/)[0].trim();
      let matchedLoc = await queryOne(
        `SELECT id FROM "Location" WHERE LOWER(name) = LOWER($1) OR LOWER(name) = LOWER($2) LIMIT 1;`,
        [locFirst, trimmedAddress]
      );
      if (!matchedLoc && locFirst) {
        const newLocSlug = locFirst.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        matchedLoc = await queryOne(
          `INSERT INTO "Location" (name, slug, city, state, country, description, "createdAt", "updatedAt")
           VALUES ($1, $2, 'Pune', 'Maharashtra', 'India', $3, NOW(), NOW())
           ON CONFLICT DO NOTHING
           RETURNING id;`,
          [locFirst, newLocSlug || `loc-${Date.now()}`, `Exclusive corridor in ${locFirst}, Pune.`]
        );
        if (!matchedLoc) {
          matchedLoc = await queryOne(
            `SELECT id FROM "Location" WHERE LOWER(name) = LOWER($1) LIMIT 1;`,
            [locFirst]
          );
        }
      }
      if (matchedLoc?.id) {
        colUpdates.set('"locationId"', matchedLoc.id);
      }
    }

    // 4. Typology / BHK / Bedrooms & propertyTypeId
    const rawType = String(body.configuration || body.bhk || body.propertyType || body.bedrooms || "").trim();
    const rawTitle = String(titleVal || "").trim();
    const isCommercial = /\b(?:commercial|office|retail|hospital|clinic|showroom|space|warehouse|industrial)\b/i.test(
      rawTitle + " " + rawType
    );

    if (body.bhk !== undefined || body.configuration !== undefined || body.bedrooms !== undefined || body.propertyType !== undefined) {
      if (rawType) {
        colUpdates.set('"configuration"', rawType);
      }

      if (isCommercial) {
        const digits = rawType.replace(/[^0-9]/g, "");
        colUpdates.set("bedrooms", digits ? parseInt(digits, 10) : null);
      } else {
        const digits = rawType.replace(/[^0-9]/g, "");
        colUpdates.set("bedrooms", digits ? parseInt(digits, 10) : 3);
      }

      // Check if PropertyType with this name or slug already exists
      const cleanSlug = rawType.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      let matchedPT = await queryOne(
        `SELECT id FROM "PropertyType" WHERE LOWER(name) = LOWER($1) OR slug = $2 LIMIT 1;`,
        [rawType, cleanSlug]
      );

      // If not found and it's a specific typology (like "Hospital", "Showroom", "Warehouse", "Clinic", etc.)
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
        colUpdates.set('"propertyTypeId"', matchedPT.id);
      } else if (isCommercial) {
        const commType = await queryOne(
          `SELECT id FROM "PropertyType" WHERE LOWER(name) LIKE '%commercial%' OR LOWER(name) LIKE '%office%' LIMIT 1;`
        );
        if (commType?.id) {
          colUpdates.set('"propertyTypeId"', commType.id);
        }
      } else {
        const lowerType = rawType.toLowerCase();
        let ptId: number | null = null;
        if (lowerType.includes("penthouse")) ptId = 8;
        else if (lowerType.includes("villa")) ptId = 9;
        else if (lowerType.includes("estate") || lowerType.includes("plot")) ptId = 10;
        else if (lowerType.includes("bhk") || lowerType.includes("apartment")) ptId = 1;

        if (ptId) {
          colUpdates.set('"propertyTypeId"', ptId);
        }
      }
    }

    // 5. Carpet Area / Sqft
    const rawSqft = body.carpetArea !== undefined ? body.carpetArea : body.sqft;
    if (rawSqft !== undefined && rawSqft !== null && rawSqft !== "") {
      const parsedSqft = parseFloat(String(rawSqft).replace(/[^0-9.]/g, ""));
      colUpdates.set('"carpetArea"', isNaN(parsedSqft) ? 1200 : parsedSqft);
    }

    // 6. Description & Dossier Data
    const hasDossierUpdates = 
      body.highlights !== undefined ||
      body.connectivity !== undefined ||
      body.amenitiesList !== undefined ||
      body.reraNumber !== undefined ||
      body.possession !== undefined ||
      body.rpsStatus !== undefined ||
      body.legalVettingText !== undefined ||
      body.hideName !== undefined ||
      body.hidePrice !== undefined ||
      body.hideRera !== undefined ||
      body.hideComplianceTab !== undefined ||
      body.hideCostSheet !== undefined ||
      body.hideAmenities !== undefined ||
      body.hideHighlights !== undefined ||
      body.hideConnectivity !== undefined ||
      body.customCostSheet !== undefined ||
      body.suitableFor !== undefined ||
      body.isSafe !== undefined;

    if (hasDossierUpdates || body.description !== undefined) {
      const currentProp = await queryOne(`SELECT description FROM "Property" WHERE id = $1;`, [id]);
      const { cleanDescription: existingClean, dossier: existingDossier } = parseDossierData(currentProp?.description || '');

      const baseNarrative = body.description !== undefined ? body.description : existingClean;

      const mergedDossier = {
        highlights: body.highlights !== undefined ? body.highlights : existingDossier.highlights,
        connectivity: body.connectivity !== undefined ? body.connectivity : existingDossier.connectivity,
        amenitiesList: body.amenitiesList !== undefined ? body.amenitiesList : existingDossier.amenitiesList,
        reraNumber: body.reraNumber !== undefined ? body.reraNumber : existingDossier.reraNumber,
        possession: body.possession !== undefined ? body.possession : (body.status !== undefined ? body.status : existingDossier.possession),
        rpsStatus: body.rpsStatus !== undefined ? body.rpsStatus : existingDossier.rpsStatus,
        legalVettingText: body.legalVettingText !== undefined ? body.legalVettingText : existingDossier.legalVettingText,
        suitableFor: body.suitableFor !== undefined ? body.suitableFor : existingDossier.suitableFor,
        hideName: body.hideName !== undefined ? Boolean(body.hideName) : existingDossier.hideName,
        hidePrice: body.hidePrice !== undefined ? Boolean(body.hidePrice) : existingDossier.hidePrice,
        hideRera: body.hideRera !== undefined ? Boolean(body.hideRera) : existingDossier.hideRera,
        hideComplianceTab: body.hideComplianceTab !== undefined ? Boolean(body.hideComplianceTab) : existingDossier.hideComplianceTab,
        hideCostSheet: body.hideCostSheet !== undefined ? Boolean(body.hideCostSheet) : existingDossier.hideCostSheet,
        hideAmenities: body.hideAmenities !== undefined ? Boolean(body.hideAmenities) : existingDossier.hideAmenities,
        hideHighlights: body.hideHighlights !== undefined ? Boolean(body.hideHighlights) : existingDossier.hideHighlights,
        hideConnectivity: body.hideConnectivity !== undefined ? Boolean(body.hideConnectivity) : existingDossier.hideConnectivity,
        customCostSheet: body.customCostSheet !== undefined ? body.customCostSheet : existingDossier.customCostSheet,
        isSafe: body.isSafe !== undefined ? Boolean(body.isSafe) : existingDossier.isSafe,
      };

      colUpdates.set("description", embedDossierData(baseNarrative || '', mergedDossier));
    }

    // 7. Status & PublishStatus
    if (body.status !== undefined) {
      const s = String(body.status).trim();
      if (s === "Draft") {
        colUpdates.set('"publishStatus"', "Draft");
        colUpdates.set("status", "Ready to Move");
      } else if (s === "Published") {
        colUpdates.set('"publishStatus"', "Published");
        colUpdates.set("status", "Ready to Move");
      } else {
        colUpdates.set("status", s || "Ready to Move");
        colUpdates.set('"publishStatus"', "Published");
      }
    } else if (body.publishStatus !== undefined) {
      colUpdates.set('"publishStatus"', body.publishStatus === "Draft" ? "Draft" : "Published");
    }

    // 7. Video URL
    if (body.videoUrl !== undefined) {
      colUpdates.set('"videoUrl"', body.videoUrl && String(body.videoUrl).trim().length > 0 ? String(body.videoUrl).trim() : null);
    }

    // 8. Listing Type (Buy vs Rent)
    if (body.listingType !== undefined) {
      const rawLt = String(body.listingType).toLowerCase().trim();
      colUpdates.set('"listingType"', rawLt.includes('rent') || rawLt.includes('lease') ? 'Rent' : 'Sale');
    }

    // Build unique SET statements
    const updates: string[] = [];
    const values: any[] = [];

    for (const [col, val] of colUpdates.entries()) {
      values.push(val);
      updates.push(`${col} = $${values.length}`);
    }

    if (updates.length > 0) {
      values.push(id);
      await queryOne(`
        UPDATE "Property"
        SET ${updates.join(", ")}, "updatedAt" = NOW()
        WHERE id = $${values.length};
      `, values);
    }

    // 8. Update Property Images (Single or Multiple)
    if (body.images !== undefined && Array.isArray(body.images)) {
      const cleanImages = body.images
        .map((u: any) => String(u || '').trim())
        .filter((u: string) => u.length > 0);

      await query(`DELETE FROM "PropertyImage" WHERE "propertyId" = $1;`, [id]);
      for (let i = 0; i < cleanImages.length; i++) {
        await query(
          `INSERT INTO "PropertyImage" ("propertyId", url, "altText", "sortOrder", "isPrimary", "createdAt")
           VALUES ($1, $2, $3, $4, $5, NOW());`,
          [id, cleanImages[i], `${body.name || body.title || "Property"} - Photo ${i + 1}`, i + 1, i === 0]
        );
      }
    } else {
      const newImageUrl = body.imageUrl || body.image;
      if (newImageUrl && typeof newImageUrl === "string" && newImageUrl.trim()) {
        const existingImg = await queryOne(
          `SELECT id FROM "PropertyImage" WHERE "propertyId" = $1 ORDER BY "isPrimary" DESC, "sortOrder" ASC LIMIT 1;`,
          [id]
        );
        if (existingImg) {
          await query(
            `UPDATE "PropertyImage" SET url = $1, "altText" = $2 WHERE id = $3;`,
            [newImageUrl.trim(), body.name || body.title || "Property Cover", existingImg.id]
          );
        } else {
          await query(
            `INSERT INTO "PropertyImage" ("propertyId", url, "altText", "sortOrder", "isPrimary", "createdAt")
             VALUES ($1, $2, $3, 1, true, NOW());`,
            [id, newImageUrl.trim(), body.name || body.title || "Property Cover"]
          );
        }
      }
    }

    // 9. Update Developer in linked Project
    if (body.developer && typeof body.developer === "string") {
      const propRecord = await queryOne(
        `SELECT "projectId" FROM "Property" WHERE id = $1;`,
        [id]
      );
      if (propRecord?.projectId) {
        await query(
          `UPDATE "Project" SET developer = $1, "updatedAt" = NOW() WHERE id = $2;`,
          [body.developer.trim(), propRecord.projectId]
        );
      } else {
        const projSlug = `proj-${Date.now().toString().slice(-5)}`;
        const newProj = await queryOne(
          `INSERT INTO "Project" (name, slug, developer, status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, 'Active', NOW(), NOW()) RETURNING id;`,
          [`${body.developer} Project`, projSlug, body.developer.trim()]
        );
        if (newProj) {
          await query(
            `UPDATE "Property" SET "projectId" = $1 WHERE id = $2;`,
            [newProj.id, id]
          );
        }
      }
    }

    // 9.5 Update RERA & Possession in linked Project if provided
    if (body.reraNumber || body.possession) {
      const propRecord = await queryOne(
        `SELECT "projectId" FROM "Property" WHERE id = $1;`,
        [id]
      );
      if (propRecord?.projectId) {
        if (body.reraNumber) {
          await query(`UPDATE "Project" SET "reraNumber" = $1, "updatedAt" = NOW() WHERE id = $2;`, [String(body.reraNumber).trim(), propRecord.projectId]);
        }
        if (body.possession) {
          await query(`UPDATE "Project" SET possession = $1, "updatedAt" = NOW() WHERE id = $2;`, [String(body.possession).trim(), propRecord.projectId]);
        }
      }
    }

    // 10. Update Suitable Business Purposes if provided
    if (body.businessPurposeIds !== undefined || body.businessPurposes !== undefined) {
      const pList = Array.isArray(body.businessPurposeIds)
        ? body.businessPurposeIds
        : (Array.isArray(body.businessPurposes) ? body.businessPurposes.map((bp: any) => bp.id || bp) : []);
      await setPropertyBusinessPurposes(id, pList);
    }

    // 11. Fetch Full Updated Property with joined images, videoUrl, location, and developer
    const updatedFull = await queryOne(`
      SELECT 
        p.id, p.title AS name, p.title, p.slug, p.address AS location,
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
        p."createdAt", p."updatedAt",
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
      WHERE p.id = $1;
    `, [id]);

    const formattedPrice = updatedFull?.price
      ? updatedFull.price >= 10000000
        ? `₹${(updatedFull.price / 10000000).toFixed(2)} Cr`
        : `₹${(updatedFull.price / 100000).toFixed(1)} Lakh`
      : "Price on Request";

    const rawImages: string[] = (updatedFull?.all_images && Array.isArray(updatedFull.all_images))
      ? updatedFull.all_images.filter((u: any) => typeof u === 'string' && u.trim().length > 0)
      : [];
    const images = rawImages.length > 0 ? rawImages : (updatedFull?.image ? [updatedFull.image] : []);

    const purposesMap = await getPurposesForProperties([id]);
    const assignedPurposes = purposesMap[String(id)] || [];

    return NextResponse.json({
      success: true,
      message: `Property "${updatedFull?.name || id}" updated successfully!`,
      property: {
        ...updatedFull,
        images,
        image: images[0] || updatedFull?.image,
        videoUrl: updatedFull?.videoUrl ? String(updatedFull.videoUrl).trim() : '',
        priceFormatted: formattedPrice,
        listingType: updatedFull?.listingType || updatedFull?.listing_type || 'Sale',
        businessPurposes: assignedPurposes,
        businessPurposeIds: assignedPurposes.map((bp: any) => bp.id),
        ...(() => {
          const { cleanDescription, dossier } = parseDossierData(updatedFull?.description || '');
          return {
            description: cleanDescription || updatedFull?.description,
            highlights: dossier.highlights || [],
            connectivity: dossier.connectivity || [],
            amenitiesList: dossier.amenitiesList || [],
            reraNumber: dossier.reraNumber || '',
            possession: dossier.possession || updatedFull?.status || '',
            rpsStatus: dossier.rpsStatus || '',
            legalVettingText: dossier.legalVettingText || '',
            hideName: Boolean(dossier.hideName),
            hidePrice: Boolean(dossier.hidePrice),
            hideRera: Boolean(dossier.hideRera),
            hideComplianceTab: Boolean(dossier.hideComplianceTab),
            hideCostSheet: Boolean(dossier.hideCostSheet),
            hideAmenities: Boolean(dossier.hideAmenities),
            hideHighlights: Boolean(dossier.hideHighlights),
            hideConnectivity: Boolean(dossier.hideConnectivity),
            customCostSheet: dossier.customCostSheet,
            isSafe: Boolean(dossier.isSafe)
          };
        })()
      }
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/properties/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update property" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if property is marked safe
    const prop = await queryOne(`SELECT id, title, description FROM "Property" WHERE id = $1;`, [id]);
    if (!prop) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    const { dossier } = parseDossierData(prop.description || '');
    const force = req.nextUrl.searchParams.get("force") === "true";
    if (dossier.isSafe && !force) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete "${prop.title}": This property is marked as SAFE and protected from deletion. Please remove its Safe status first if you wish to delete it.`
      }, { status: 400 });
    }

    // Clean up relations
    await query(`DELETE FROM "PropertyImage" WHERE "propertyId" = $1;`, [id]).catch(() => {});
    await query(`DELETE FROM "PropertyDocument" WHERE "propertyId" = $1;`, [id]).catch(() => {});
    await query(`DELETE FROM "PropertyAmenity" WHERE "propertyId" = $1;`, [id]).catch(() => {});
    await query(`DELETE FROM "FeaturedProperty" WHERE "propertyId" = $1;`, [id]).catch(() => {});
    await query(`DELETE FROM "BlogProperty" WHERE "propertyId" = $1;`, [id]).catch(() => {});
    await query(`UPDATE "WebsiteEnquiry" SET "propertyId" = NULL WHERE "propertyId" = $1;`, [id]).catch(() => {});

    const deleted = await queryOne(`
      DELETE FROM "Property" WHERE id = $1 RETURNING id, title;
    `, [id]);

    return NextResponse.json({
      success: true,
      message: `Property "${deleted?.title || id}" deleted successfully.`
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/properties/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete property" },
      { status: 500 }
    );
  }
}
