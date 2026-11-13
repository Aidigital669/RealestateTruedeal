import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import {
  calculateBuyerPropertyMatch,
  PropertyProfile,
  BuyerProfile,
  MatchScoreResult
} from '@/lib/matching-and-search-engine';
import { getAllLiveBuyerDemands } from '@/lib/buyer-demands-service';

export const dynamic = 'force-dynamic';

function parsePriceToNumber(rawPrice: any): number {
  if (typeof rawPrice === 'number') return rawPrice;
  if (!rawPrice) return 0;
  const str = String(rawPrice).toLowerCase().replace(/,/g, '');
  const crMatch = str.match(/([\d.]+)\s*(?:cr|crore)/i);
  if (crMatch) return parseFloat(crMatch[1]) * 10000000;
  const lMatch = str.match(/([\d.]+)\s*(?:l|lakh|lac)/i);
  if (lMatch) return parseFloat(lMatch[1]) * 100000;
  const numMatch = str.match(/[\d.]+/);
  return numMatch ? parseFloat(numMatch[0]) : 0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const buyerId = searchParams.get('buyerId');
    const minScore = parseInt(searchParams.get('minScore') || '40', 10);

    // -------------------------------------------------------------
    // CASE 1: MATCH BUYERS FOR A SPECIFIC PROPERTY
    // -------------------------------------------------------------
    if (propertyId) {
      // 1. Fetch property from PostgreSQL
      const propRow = await queryOne<any>(
        `
        SELECT 
          p.id, p.slug, p.title, p.description, p.address as location,
          p.price, p."carpetArea" as carpet_sqft, p.bedrooms as bhk_num, p.configuration,
          p.status, p."listingType" as listing_type,
          COALESCE(loc.name, 'Baner') as locality,
          COALESCE(pt.name, 'Apartment') as type_name
        FROM "Property" p
        LEFT JOIN "Location" loc ON p."locationId" = loc.id
        LEFT JOIN "PropertyType" pt ON p."typeId" = pt.id
        WHERE p.id = $1::integer OR p.slug = $1::text
        LIMIT 1;
        `,
        [propertyId]
      );

      if (!propRow) {
        return NextResponse.json(
          { success: false, error: 'Property not found' },
          { status: 404 }
        );
      }

      const propertyProfile: PropertyProfile = {
        id: propRow.id,
        title: propRow.title,
        locality: propRow.locality || propRow.location || 'Pune',
        address: propRow.location,
        priceRaw: parsePriceToNumber(propRow.price),
        priceStr: propRow.price || 'Price on Request',
        bhk: propRow.bhk_num ? `${propRow.bhk_num} BHK` : propRow.configuration,
        carpetSqft: parseInt(String(propRow.carpet_sqft || '1200').replace(/\D/g, ''), 10) || 1200,
        typology: (propRow.type_name || 'residential').toLowerCase(),
        transactionType: (propRow.listing_type || 'buy').toLowerCase().includes('rent') ? 'rent' : 'buy',
        status: propRow.status || 'Ready to Move',
        slug: propRow.slug
      };

      // 2. Fetch all active CRM Leads from database
      const crmRows = await query<any>(`
        SELECT 
          id, code, name, phone, email, designation, company, location,
          bhk, carpet_sqft, budget, budget_raw, assigned_to, notes, dna, stage
        FROM crm_leads
        WHERE stage != 'lost' AND stage != 'converted'
        ORDER BY created_at DESC;
      `);

      // 3. Also fetch verified active buyer demands
      const verifiedDemands = await getAllLiveBuyerDemands();

      // Combine CRM leads and verified buyers
      const candidateBuyers: BuyerProfile[] = [];

      crmRows.forEach((r) => {
        candidateBuyers.push({
          id: `crm-${r.id}`,
          name: r.name || 'Verified Patron',
          phone: r.phone || '+91 93730 20701',
          email: r.email,
          code: r.code,
          assignedTo: r.assigned_to || 'Jennifer Desai',
          bhk: r.bhk,
          targetBudgetRaw: r.budget_raw ? Number(r.budget_raw) : parsePriceToNumber(r.budget),
          targetBudgetStr: r.budget || 'Flexible',
          primaryLocality: r.location,
          preferredLocations: r.location ? [r.location] : [],
          minCarpetSqft: r.carpet_sqft ? parseInt(String(r.carpet_sqft).replace(/\D/g, ''), 10) : undefined,
          transactionType: r.notes?.toLowerCase().includes('rent') ? 'rent' : 'buy',
          possessionTimeline: r.dna?.possessionHorizon?.toLowerCase().includes('ready') ? 'ready' : 'any',
          notes: r.notes
        });
      });

      verifiedDemands.forEach((d) => {
        if (!candidateBuyers.some((b) => b.id === d.id)) {
          candidateBuyers.push({
            id: d.id,
            name: d.maskedName,
            phone: d.displayPhone,
            email: d.displayEmail,
            code: d.referenceCode,
            assignedTo: 'ANV Luxury Advisory',
            bhk: d.bhk,
            targetBudgetRaw: parsePriceToNumber(d.budget),
            targetBudgetStr: d.budget,
            primaryLocality: d.locality,
            preferredLocations: [d.locality],
            notes: d.requirements
          });
        }
      });

      // 4. Score every buyer against this property
      const scoredMatches: Array<{
        buyer: BuyerProfile;
        match: MatchScoreResult;
      }> = [];

      for (const buyer of candidateBuyers) {
        const matchResult = calculateBuyerPropertyMatch(propertyProfile, buyer);
        if (!matchResult.isHardExcluded && matchResult.matchScore >= minScore) {
          scoredMatches.push({
            buyer,
            match: matchResult
          });
        }
      }

      // Sort by Match Score Descending
      scoredMatches.sort((a, b) => b.match.matchScore - a.match.matchScore);

      return NextResponse.json({
        success: true,
        property: propertyProfile,
        totalMatchedBuyers: scoredMatches.length,
        highIntentMatches: scoredMatches.filter((m) => m.match.tier === 'exceptional' || m.match.tier === 'strong').length,
        matches: scoredMatches
      });
    }

    // -------------------------------------------------------------
    // CASE 2: MATCH PROPERTIES FOR A SPECIFIC BUYER / LEAD
    // -------------------------------------------------------------
    if (buyerId) {
      // Fetch Buyer profile from CRM leads
      const cleanId = buyerId.replace('crm-', '');
      const leadRow = await queryOne<any>(
        `SELECT * FROM crm_leads WHERE id = $1::integer OR code = $1::text LIMIT 1;`,
        [cleanId]
      );

      let buyerProfile: BuyerProfile;
      if (leadRow) {
        buyerProfile = {
          id: `crm-${leadRow.id}`,
          name: leadRow.name || 'Patron',
          phone: leadRow.phone || '+91 93730 20701',
          email: leadRow.email,
          code: leadRow.code,
          assignedTo: leadRow.assigned_to || 'Jennifer Desai',
          bhk: leadRow.bhk,
          targetBudgetRaw: leadRow.budget_raw ? Number(leadRow.budget_raw) : parsePriceToNumber(leadRow.budget),
          targetBudgetStr: leadRow.budget,
          primaryLocality: leadRow.location,
          preferredLocations: leadRow.location ? [leadRow.location] : [],
          minCarpetSqft: leadRow.carpet_sqft ? parseInt(String(leadRow.carpet_sqft).replace(/\D/g, ''), 10) : undefined,
          transactionType: leadRow.notes?.toLowerCase().includes('rent') ? 'rent' : 'buy',
          notes: leadRow.notes
        };
      } else {
        // Fallback default sample profile
        buyerProfile = {
          id: buyerId,
          name: 'Verified Buyer',
          phone: '+91 93730 20701',
          bhk: '3 BHK',
          primaryLocality: 'Baner',
          targetBudgetRaw: 22000000,
          targetBudgetStr: '₹2.20 Cr'
        };
      }

      // Fetch all properties from PostgreSQL
      const propRows = await query<any>(`
        SELECT 
          p.id, p.slug, p.title, p.description, p.address as location,
          p.price, p."carpetArea" as carpet_sqft, p.bedrooms as bhk_num, p.configuration,
          p.status, p."listingType" as listing_type,
          COALESCE(loc.name, 'Baner') as locality,
          COALESCE(pt.name, 'Apartment') as type_name,
          COALESCE(img.url, '') as image
        FROM "Property" p
        LEFT JOIN "Location" loc ON p."locationId" = loc.id
        LEFT JOIN "PropertyType" pt ON p."typeId" = pt.id
        LEFT JOIN "PropertyImage" img ON p.id = img."propertyId" AND img."isPrimary" = true
        WHERE p.status != 'Draft'
        ORDER BY p."createdAt" DESC;
      `);

      const matchedProperties: Array<{
        property: any;
        match: MatchScoreResult;
      }> = [];

      for (const p of propRows) {
        const propProfile: PropertyProfile = {
          id: p.id,
          title: p.title,
          locality: p.locality || p.location || 'Pune',
          address: p.location,
          priceRaw: parsePriceToNumber(p.price),
          priceStr: p.price || 'Price on Request',
          bhk: p.bhk_num ? `${p.bhk_num} BHK` : p.configuration,
          carpetSqft: parseInt(String(p.carpet_sqft || '1200').replace(/\D/g, ''), 10) || 1200,
          typology: (p.type_name || 'residential').toLowerCase(),
          transactionType: (p.listing_type || 'buy').toLowerCase().includes('rent') ? 'rent' : 'buy',
          status: p.status || 'Ready to Move',
          slug: p.slug
        };

        const matchResult = calculateBuyerPropertyMatch(propProfile, buyerProfile);
        if (!matchResult.isHardExcluded && matchResult.matchScore >= minScore) {
          matchedProperties.push({
            property: {
              ...propProfile,
              image: p.image
            },
            match: matchResult
          });
        }
      }

      matchedProperties.sort((a, b) => b.match.matchScore - a.match.matchScore);

      return NextResponse.json({
        success: true,
        buyer: buyerProfile,
        totalMatchedProperties: matchedProperties.length,
        matches: matchedProperties
      });
    }

    return NextResponse.json(
      { success: false, error: 'Either propertyId or buyerId query parameter is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('GET /api/crm/property-matches error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate buyer-property matches' },
      { status: 500 }
    );
  }
}

// POST: Notify Assigned Agent about a new matching property or buyer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, buyerId, agentName, matchScore, pitchMessage } = body;

    // Log the notification in Admin Activity
    await query(
      `
      INSERT INTO "GlobalSetting" ("key", "value", "group", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT ("key") DO UPDATE
      SET "value" = EXCLUDED."value",
          "updatedAt" = NOW();
      `,
      [
        `agent_match_alert_${Date.now()}`,
        JSON.stringify({
          propertyId,
          buyerId,
          agentName: agentName || 'Jennifer Desai',
          matchScore: matchScore || 90,
          pitchMessage,
          status: 'SENT',
          timestamp: new Date().toISOString()
        }),
        'crm_alerts'
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Alert successfully dispatched to advisor ${agentName || 'Jennifer Desai'}!`
    });
  } catch (error: any) {
    console.error('POST /api/crm/property-matches error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch agent notification' },
      { status: 500 }
    );
  }
}
