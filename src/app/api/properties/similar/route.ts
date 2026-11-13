import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import {
  calculateGeoDistanceKm,
  PUNE_LOCALITIES_GEO
} from '@/lib/matching-and-search-engine';

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
    const localityParam = searchParams.get('locality');
    const bhkParam = searchParams.get('bhk');
    const priceParam = searchParams.get('price');
    const limit = parseInt(searchParams.get('limit') || '4', 10);

    let baseProp: any = null;

    if (propertyId) {
      baseProp = await queryOne<any>(
        `
        SELECT 
          p.id, p.slug, p.title, p.price, p."carpetArea" as carpet_sqft, p.bedrooms as bhk_num,
          p.status, COALESCE(loc.name, 'Baner') as locality, COALESCE(pt.name, 'Apartment') as type_name
        FROM "Property" p
        LEFT JOIN "Location" loc ON p."locationId" = loc.id
        LEFT JOIN "PropertyType" pt ON p."typeId" = pt.id
        WHERE p.id = $1::integer OR p.slug = $1::text
        LIMIT 1;
        `,
        [propertyId]
      );
    }

    const targetLocality = baseProp?.locality || localityParam || 'Baner';
    const targetBhk = baseProp?.bhk_num ? `${baseProp.bhk_num} BHK` : bhkParam || '3 BHK';
    const targetPriceRaw = baseProp ? parsePriceToNumber(baseProp.price) : parsePriceToNumber(priceParam);

    // Fetch pool of candidate properties
    const candidateRows = await query<any>(`
      SELECT 
        p.id, p.slug, p.title, p.description, p.address as location,
        p.price, p."carpetArea" as carpet_sqft, p.bedrooms as bhk_num, p.configuration,
        p.status, COALESCE(loc.name, 'Baner') as locality,
        COALESCE(pt.name, 'Apartment') as type_name,
        COALESCE(img.url, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80') as image
      FROM "Property" p
      LEFT JOIN "Location" loc ON p."locationId" = loc.id
      LEFT JOIN "PropertyType" pt ON p."typeId" = pt.id
      LEFT JOIN "PropertyImage" img ON p.id = img."propertyId" AND img."isPrimary" = true
      WHERE p.status != 'Draft'
      ORDER BY p."createdAt" DESC
      LIMIT 60;
    `);

    const scoredAlternatives = candidateRows
      .filter((cand) => !baseProp || String(cand.id) !== String(baseProp.id))
      .map((cand) => {
        let similarityScore = 0;
        const reasons: string[] = [];
        const candLoc = cand.locality || '';
        const candPriceRaw = parsePriceToNumber(cand.price);

        // 1. Locality similarity
        if (candLoc.toLowerCase() === targetLocality.toLowerCase()) {
          similarityScore += 40;
          reasons.push(`Same prime locality in ${candLoc}`);
        } else {
          const pCoord = PUNE_LOCALITIES_GEO[targetLocality.toLowerCase().replace(/[^a-z]/g, '')];
          const cCoord = PUNE_LOCALITIES_GEO[candLoc.toLowerCase().replace(/[^a-z]/g, '')];
          if (pCoord && cCoord) {
            const dist = calculateGeoDistanceKm(pCoord.lat, pCoord.lng, cCoord.lat, cCoord.lng);
            if (dist <= 4) {
              similarityScore += 28;
              reasons.push(`Adjacent corridor (${dist} km from ${targetLocality})`);
            } else if (dist <= 8) {
              similarityScore += 16;
              reasons.push(`Within 8 km radius of ${targetLocality}`);
            }
          }
        }

        // 2. Typology & BHK similarity
        const candBhk = cand.bhk_num ? `${cand.bhk_num} BHK` : cand.configuration || '';
        if (candBhk.toLowerCase() === targetBhk.toLowerCase()) {
          similarityScore += 35;
          reasons.push(`Matching ${targetBhk} configuration`);
        } else {
          similarityScore += 15;
          reasons.push(`Alternative ${candBhk || cand.type_name} layout`);
        }

        // 3. Price Bracket similarity
        if (targetPriceRaw > 0 && candPriceRaw > 0) {
          const ratio = candPriceRaw / targetPriceRaw;
          if (ratio >= 0.85 && ratio <= 1.15) {
            similarityScore += 25;
            reasons.push('Identical price bracket (within ±15%)');
          } else if (ratio >= 0.7 && ratio <= 1.3) {
            similarityScore += 15;
            reasons.push('Comparable investment valuation');
          }
        } else {
          similarityScore += 15;
        }

        return {
          property: cand,
          similarityScore: Math.min(100, similarityScore),
          matchReason: reasons.slice(0, 2).join(' • ')
        };
      });

    scoredAlternatives.sort((a, b) => b.similarityScore - a.similarityScore);

    return NextResponse.json({
      success: true,
      targetCriteria: {
        locality: targetLocality,
        bhk: targetBhk,
        price: targetPriceRaw > 0 ? `₹${(targetPriceRaw / 10000000).toFixed(2)} Cr` : undefined
      },
      similarProperties: scoredAlternatives.slice(0, limit)
    });
  } catch (error: any) {
    console.error('GET /api/properties/similar error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch similar properties' },
      { status: 500 }
    );
  }
}
