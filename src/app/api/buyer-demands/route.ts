import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getAllLiveBuyerDemands } from "@/lib/buyer-demands-service";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();
    const localityFilter = (searchParams.get("locality") || "").trim().toLowerCase();
    const bhkFilter = (searchParams.get("bhk") || "").trim().toLowerCase();
    const budgetFilter = (searchParams.get("budget") || "").trim().toLowerCase();

    // Fetch live buyer requirements from DB and verified patron network
    const allDemands = await getAllLiveBuyerDemands();

    // Filter based on seller's search parameters
    const filtered = allDemands.filter((demand) => {
      // Locality filter
      if (localityFilter && localityFilter !== 'all') {
        const matchesLoc = demand.locality.toLowerCase().includes(localityFilter) ||
          demand.requirements.toLowerCase().includes(localityFilter);
        if (!matchesLoc) return false;
      }

      // BHK filter
      if (bhkFilter && bhkFilter !== 'all') {
        const dLower = demand.bhk.toLowerCase();
        if (bhkFilter.includes('commercial')) {
          if (!dLower.includes('commercial') && !demand.requirements.toLowerCase().includes('commercial')) {
            return false;
          }
        } else {
          const digit = bhkFilter.match(/\d+/)?.[0];
          if (digit && !dLower.includes(digit) && !demand.requirements.toLowerCase().includes(`${digit} bhk`)) {
            return false;
          }
        }
      }

      // Search Query filter (matches locality, BHK, or notes)
      if (searchQuery) {
        const STOP_WORDS = new Set([
          "i", "want", "a", "an", "the", "for", "my", "me", "property", "properties",
          "buyer", "buyers", "sell", "selling", "need", "find", "looking", "require",
          "seeking", "please", "to", "in", "at", "with", "and", "or", "is"
        ]);
        const words = searchQuery.split(/\s+/).filter((w) => !STOP_WORDS.has(w));

        if (words.length > 0) {
          const fullText = `${demand.locality} ${demand.bhk} ${demand.budget} ${demand.requirements} ${demand.referenceCode}`.toLowerCase();
          
          if (searchQuery.includes('commercial') && !fullText.includes('commercial')) {
            return false;
          }

          const matches = words.every((w) => fullText.includes(w));
          if (!matches) return false;
        }
      }

      return true;
    });

    return NextResponse.json({
      success: true,
      count: filtered.length,
      officialHelpline: OFFICIAL_ANV_PHONE,
      demands: filtered
    });
  } catch (err: any) {
    console.error("GET /api/buyer-demands error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch buyer demands" },
      { status: 500 }
    );
  }
}

// POST endpoint: For Sellers submitting their property details
// Matches with active buyer mandates and publishes property directly to the property catalogue
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      number,
      phone,
      email,
      location,
      bhk,
      askingPrice,
      title,
      sqft,
      buyerRef,
      buyerDemand,
      notes
    } = body;

    const contactPhone = (number || phone || '').trim();
    const contactName = (name || '').trim();
    const contactEmail = (email || '').trim();
    const propertyLocation = (location || '').trim();
    const propertyBhk = (bhk || '').trim();
    const propertyPrice = (askingPrice || '').trim();

    if (!contactName || !contactPhone) {
      return NextResponse.json(
        { success: false, error: "Please provide your name and 10-digit phone number." },
        { status: 400 }
      );
    }

    if (!contactEmail || !contactEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!propertyLocation) {
      return NextResponse.json(
        { success: false, error: "Please enter your property location." },
        { status: 400 }
      );
    }

    // --- 1. Match Evaluation ---
    let isMatch = false;
    const targetBuyerRef = (buyerRef || buyerDemand?.referenceCode || '').trim();
    let targetBuyerDemand = buyerDemand;

    if (targetBuyerRef && !targetBuyerDemand) {
      try {
        const leadRow = await queryOne(
          `SELECT code, name, location, bhk, budget, notes FROM crm_leads WHERE code = $1 OR id = $2 LIMIT 1;`,
          [targetBuyerRef, parseInt(targetBuyerRef.replace(/[^0-9]/g, '')) || 0]
        );
        if (leadRow) {
          targetBuyerDemand = {
            locality: leadRow.location,
            bhk: leadRow.bhk,
            budget: leadRow.budget,
            requirements: leadRow.notes
          };
        }
      } catch (err) {
        console.warn("Buyer lookup note:", err);
      }
    }

    const isCommercial = /\b(?:commercial|office|retail|hospital|clinic|showroom|space|warehouse|industrial|shop|building)\b/i.test(
      (title || '') + " " + propertyBhk + " " + (notes || '')
    );

    if (targetBuyerDemand) {
      const bLoc = (targetBuyerDemand.locality || '').toLowerCase().replace(/,.*$/, '').trim();
      const bBhk = (targetBuyerDemand.bhk || '').toLowerCase();
      const bReq = (targetBuyerDemand.requirements || '').toLowerCase();
      const pLoc = propertyLocation.toLowerCase();
      const pBhk = propertyBhk.toLowerCase();

      // Check locality match
      const locMatch = !bLoc || bLoc === 'pune' || pLoc.includes(bLoc) || bLoc.includes(pLoc);

      // Check typology match
      let typeMatch = false;
      if (bBhk.includes('commercial') || bReq.includes('commercial')) {
        typeMatch = isCommercial;
      } else {
        const bDigit = bBhk.match(/\d+/)?.[0];
        const pDigit = pBhk.match(/\d+/)?.[0];
        if (bDigit && pDigit) {
          typeMatch = bDigit === pDigit;
        } else {
          typeMatch = !isCommercial;
        }
      }

      if (locMatch && typeMatch) {
        isMatch = true;
      } else if (typeMatch && (pLoc.includes('pune') || bLoc.includes('pune') || !bLoc)) {
        isMatch = true;
      }
    }

    // --- 2. Save Property into "Property" Table (so it appears on Property Page!) ---
    let propertyId: number | null = null;
    let propertySlug: string | null = null;

    try {
      const locFirst = propertyLocation.split(/[,–-]/)[0].trim() || 'Pune';
      let locationId = 7; // default Baner

      const matchedLoc = await queryOne(
        `SELECT id FROM "Location" WHERE LOWER(name) = LOWER($1) OR LOWER(name) = LOWER($2) LIMIT 1;`,
        [locFirst, propertyLocation]
      );

      if (matchedLoc) {
        locationId = matchedLoc.id;
      } else if (locFirst.length >= 3) {
        const newLocSlug = locFirst.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-pune";
        const createdLoc = await queryOne(
          `INSERT INTO "Location" (name, slug, city, state, country, description, "createdAt", "updatedAt")
           VALUES ($1, $2, 'Pune', 'Maharashtra', 'India', $3, NOW(), NOW())
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id;`,
          [locFirst, newLocSlug, `Exclusive locality in ${locFirst}, Pune.`]
        );
        if (createdLoc) locationId = createdLoc.id;
      }

      let propertyTypeId = 1;
      const cleanSlug = propertyBhk.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const matchedPT = await queryOne(
        `SELECT id FROM "PropertyType" WHERE LOWER(name) = LOWER($1) OR slug = $2 LIMIT 1;`,
        [propertyBhk, cleanSlug]
      );
      if (matchedPT?.id) {
        propertyTypeId = matchedPT.id;
      } else if (isCommercial) {
        const commType = await queryOne(`SELECT id FROM "PropertyType" WHERE LOWER(name) LIKE '%commercial%' LIMIT 1;`);
        if (commType) propertyTypeId = commType.id;
      }

      // Price parsing
      const rawPriceStr = propertyPrice.toLowerCase();
      const firstNumMatch = rawPriceStr.match(/(\d+(?:\.\d+)?)/)?.[0];
      let numPrice = firstNumMatch ? parseFloat(firstNumMatch) : 0;
      if (rawPriceStr.includes("cr") || rawPriceStr.includes("crore")) {
        numPrice = Math.round(numPrice * 10000000);
      } else if (rawPriceStr.includes("lakh") || rawPriceStr.includes("lac") || rawPriceStr.includes("l")) {
        numPrice = Math.round(numPrice * 100000);
      } else if (rawPriceStr.includes("th") || rawPriceStr.includes("k")) {
        numPrice = Math.round(numPrice * 1000);
      }
      if (isNaN(numPrice) || numPrice <= 0) {
        numPrice = 25000000;
      }

      const numBedrooms = isCommercial ? null : (propertyBhk ? parseInt(String(propertyBhk).replace(/[^0-9]/g, ""), 10) || 3 : 3);
      const numArea = sqft ? parseFloat(String(sqft).replace(/[^0-9.]/g, "")) || 1500 : 1500;

      const propTitle = (title || `${propertyBhk || 'Commercial Property'} in ${locFirst}`).trim();
      propertySlug = propTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-${Date.now().toString().slice(-4)}`;

      const propDescription = notes || `Verified owner property submitted via ANV REEALTY Portal in ${locFirst}, Pune. Open for verified buyer introductions.`;

      const newProp = await queryOne(`
        INSERT INTO "Property" (
          title, slug, "propertyTypeId", "locationId", "listingType", status, "publishStatus",
          description, address, price, "carpetArea", "areaUnit", bedrooms, "configuration", "isFeatured",
          "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, 'Sale', 'Ready to Move', 'Published',
          $5, $6, $7, $8, 'Sq.Ft.', $9, $10, false,
          NOW(), NOW()
        )
        RETURNING id, slug;
      `, [
        propTitle,
        propertySlug,
        propertyTypeId,
        locationId,
        propDescription,
        propertyLocation,
        numPrice,
        numArea,
        numBedrooms,
        propertyBhk || (isCommercial ? 'Commercial' : '3 BHK')
      ]);

      if (newProp?.id) {
        propertyId = newProp.id;
        const defaultImage = isCommercial
          ? "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80"
          : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80";

        await queryOne(`
          INSERT INTO "PropertyImage" ("propertyId", url, "sortOrder", "createdAt", "updatedAt")
          VALUES ($1, $2, 0, NOW(), NOW())
          ON CONFLICT DO NOTHING;
        `, [newProp.id, defaultImage]);
      }
    } catch (propErr: any) {
      console.error("Property table insert error:", propErr.message);
    }

    // --- 3. Save Lead into crm_leads ---
    const subject = targetBuyerRef
      ? `Seller Submission for Buyer Ref ${targetBuyerRef} in ${propertyLocation}`
      : `Seller Property Submission: ${propertyLocation}`;

    const detailedMessage = [
      `Owner Name: ${contactName}`,
      `Phone: ${contactPhone}`,
      `Email: ${contactEmail}`,
      `Location: ${propertyLocation}`,
      propertyBhk ? `Configuration: ${propertyBhk}` : null,
      propertyPrice ? `Asking Price: ${propertyPrice}` : null,
      targetBuyerRef ? `Target Buyer: ${targetBuyerRef}` : 'General Property Listing',
      isMatch ? 'Status: Direct Match with Buyer' : 'Status: Accepted to Property Page',
      notes ? `Details: ${notes}` : null
    ].filter(Boolean).join(" | ");

    try {
      const code = `SEL-${Math.floor(1000 + Math.random() * 9000)}`;
      await queryOne(`
        INSERT INTO crm_leads (
          code, name, phone, email, designation, residence, is_nri,
          location, property_interest, bhk, budget, source, source_type,
          status, stage, temperature, assigned_to, notes, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, 'Property Seller / Owner', $5, false,
          $6, $7, $8, $9, 'Seller Property Submission', 'website',
          'New', 'new', 'hot', 'Unassigned', $10, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING;
      `, [
        code,
        contactName,
        contactPhone,
        contactEmail,
        propertyLocation,
        propertyLocation,
        `Submitted Property in ${propertyLocation} (${propertyBhk || 'Commercial / Residential'})`,
        propertyBhk || 'Residential / Commercial',
        propertyPrice || 'Open to Offers',
        detailedMessage
      ]);
    } catch (crmErr: any) {
      console.error("CRM leads seller insert error:", crmErr.message);
    }

    // --- 4. Insert into WebsiteEnquiry ---
    try {
      await queryOne(`
        INSERT INTO "WebsiteEnquiry" (
          name, email, phone, subject, message, source, status, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, 'Seller Property Submission Desk', 'New', NOW(), NOW())
        RETURNING id;
      `, [
        contactName,
        contactEmail,
        contactPhone,
        subject,
        detailedMessage
      ]);
    } catch (dbErr: any) {
      console.error("WebsiteEnquiry seller insert error:", dbErr.message);
    }

    return NextResponse.json({
      success: true,
      isMatch,
      buyerRef: targetBuyerRef,
      propertyId,
      propertySlug,
      message: isMatch
        ? `🎉 Match Found! We found a verified buyer matching your property requirements! Our luxury advisory desk is connecting you with Buyer ${targetBuyerRef}.`
        : "✅ Property Details Saved! Your property has been accepted and added to our property catalogue, and our luxury advisory desk will connect matching buyers with you."
    });
  } catch (err: any) {
    console.error("POST /api/buyer-demands error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process property submission" },
      { status: 500 }
    );
  }
}
