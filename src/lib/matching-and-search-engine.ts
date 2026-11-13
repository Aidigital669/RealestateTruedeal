/**
 * Intelligent Matching & Search Engine for ANV REEALTY
 *
 * Implements:
 * 1. AI Natural Language Search & Query Parsing
 * 2. Advanced Multi-Parameter Filters (floor, parking, furnishing, possession, area ranges)
 * 3. Radius & Proximity Search (1, 3, 5, 10 km via Pune Geographical Coordinates)
 * 4. Investment & Commercial Filters (ROI, rental yield, tenant, lease)
 * 5. Buyer–Property Matching Algorithm (Budget 30%, Location 25%, Property Type 20%, Area 15%, Other 10%)
 * 6. Similar Properties Recommendation
 * 7. Search Analytics & Unmet Demand Tracker
 */

// ==========================================
// 1. PUNE LOCALITY GEO-COORDINATES & RADIUS
// ==========================================

export interface LocalityCoord {
  name: string;
  lat: number;
  lng: number;
  zone: 'West' | 'East' | 'Central' | 'North' | 'South';
  adjacent: string[];
}

export const PUNE_LOCALITIES_GEO: Record<string, LocalityCoord> = {
  baner: {
    name: 'Baner',
    lat: 18.559,
    lng: 73.7868,
    zone: 'West',
    adjacent: ['Balewadi', 'Aundh', 'Pashan', 'Mahalunge', 'Bavdhan', 'Wakad']
  },
  balewadi: {
    name: 'Balewadi',
    lat: 18.5789,
    lng: 73.7707,
    zone: 'West',
    adjacent: ['Baner', 'Mahalunge', 'Wakad', 'Hinjewadi', 'Pashan']
  },
  mahalunge: {
    name: 'Mahalunge',
    lat: 18.5638,
    lng: 73.7505,
    zone: 'West',
    adjacent: ['Balewadi', 'Baner', 'Hinjewadi', 'Wakad', 'Sus']
  },
  hinjewadi: {
    name: 'Hinjewadi',
    lat: 18.5913,
    lng: 73.7389,
    zone: 'West',
    adjacent: ['Wakad', 'Balewadi', 'Mahalunge', 'Punawale', 'Tathawade']
  },
  wakad: {
    name: 'Wakad',
    lat: 18.5987,
    lng: 73.7656,
    zone: 'West',
    adjacent: ['Hinjewadi', 'Balewadi', 'Baner', 'Pimple Saudagar', 'Thergaon']
  },
  aundh: {
    name: 'Aundh',
    lat: 18.558,
    lng: 73.8077,
    zone: 'West',
    adjacent: ['Baner', 'Pashan', 'Shivajinagar', 'Khadki', 'Balewadi']
  },
  pashan: {
    name: 'Pashan',
    lat: 18.5393,
    lng: 73.7915,
    zone: 'West',
    adjacent: ['Baner', 'Aundh', 'Bavdhan', 'Kothrud']
  },
  bavdhan: {
    name: 'Bavdhan',
    lat: 18.5147,
    lng: 73.7699,
    zone: 'West',
    adjacent: ['Pashan', 'Kothrud', 'Baner', 'Pirangut']
  },
  kothrud: {
    name: 'Kothrud',
    lat: 18.5074,
    lng: 73.8077,
    zone: 'West',
    adjacent: ['Bavdhan', 'Erandwane', 'Shivajinagar', 'Karve Nagar']
  },
  koregaonpark: {
    name: 'Koregaon Park',
    lat: 18.5362,
    lng: 73.894,
    zone: 'East',
    adjacent: ['Kalyani Nagar', 'Viman Nagar', 'Bund Garden', 'Camp', 'Yerwada']
  },
  kalyaninagar: {
    name: 'Kalyani Nagar',
    lat: 18.5463,
    lng: 73.9034,
    zone: 'East',
    adjacent: ['Koregaon Park', 'Viman Nagar', 'Wadgaon Sheri', 'Yerwada']
  },
  vimannagar: {
    name: 'Viman Nagar',
    lat: 18.5679,
    lng: 73.9143,
    zone: 'East',
    adjacent: ['Kalyani Nagar', 'Kharadi', 'Wadgaon Sheri', 'Koregaon Park']
  },
  kharadi: {
    name: 'Kharadi',
    lat: 18.5514,
    lng: 73.9348,
    zone: 'East',
    adjacent: ['Viman Nagar', 'Wadgaon Sheri', 'Magarpatta', 'Wagholi', 'Hadapsar']
  },
  magarpatta: {
    name: 'Magarpatta',
    lat: 18.5167,
    lng: 73.9272,
    zone: 'East',
    adjacent: ['Hadapsar', 'Kharadi', 'Kalyani Nagar', 'Fatima Nagar']
  },
  hadapsar: {
    name: 'Hadapsar',
    lat: 18.5089,
    lng: 73.9259,
    zone: 'East',
    adjacent: ['Magarpatta', 'Kharadi', 'Undri', 'Fatima Nagar', 'Wanowrie']
  },
  undri: {
    name: 'Undri',
    lat: 18.4604,
    lng: 73.9056,
    zone: 'South',
    adjacent: ['Hadapsar', 'Pisoli', 'NIBM', 'Kondhwa', 'Mohammed Wadi']
  },
  nibm: {
    name: 'NIBM',
    lat: 18.4777,
    lng: 73.8967,
    zone: 'South',
    adjacent: ['Undri', 'Kondhwa', 'Wanowrie', 'Salunke Vihar']
  },
  shivajinagar: {
    name: 'Shivajinagar',
    lat: 18.5314,
    lng: 73.8446,
    zone: 'Central',
    adjacent: ['Aundh', 'Deccan', 'Model Colony', 'Camp', 'Kothrud']
  },
  camp: {
    name: 'Camp',
    lat: 18.5196,
    lng: 73.8778,
    zone: 'Central',
    adjacent: ['Koregaon Park', 'Bund Garden', 'Shivajinagar', 'Wanowrie', 'Swargate']
  }
};

/**
 * Calculates geographical distance in kilometers between two lat/lng coordinates (Haversine Formula)
 */
export function calculateGeoDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Finds all neighboring localities within a specified radius (km) of a target locality
 */
export function getLocalitiesWithinRadius(
  centerLocalityName: string,
  radiusKm: number = 5
): Array<{ name: string; distanceKm: number }> {
  const normKey = centerLocalityName.toLowerCase().replace(/[^a-z]/g, '');
  const center = PUNE_LOCALITIES_GEO[normKey];

  if (!center) {
    // If exact coords not found, return the locality itself
    return [{ name: centerLocalityName, distanceKm: 0 }];
  }

  const results: Array<{ name: string; distanceKm: number }> = [];

  for (const [key, loc] of Object.entries(PUNE_LOCALITIES_GEO)) {
    const dist = calculateGeoDistanceKm(center.lat, center.lng, loc.lat, loc.lng);
    if (dist <= radiusKm) {
      results.push({ name: loc.name, distanceKm: dist });
    }
  }

  // Sort closest first
  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}

// ==========================================
// 2. ADVANCED AI NATURAL LANGUAGE PARSER
// ==========================================

export interface AdvancedSearchCriteria {
  rawQuery: string;
  intent: 'buy' | 'rent' | 'sell' | 'invest';
  typology: string | null;
  bhk: string | null;
  locality: string | null;
  radiusKm: number | null;
  radiusLocalities: string[];
  minPrice: number | null;
  maxPrice: number | null;
  isPriceOnRequest?: boolean;

  // Area ranges
  carpetAreaMin: number | null;
  carpetAreaMax: number | null;
  saleableAreaMin: number | null;
  saleableAreaMax: number | null;
  plotAreaMin: number | null;
  plotAreaMax: number | null;

  // Structural & Physical Filters
  floorPreference: 'ground' | 'low' | 'mid' | 'high' | 'penthouse' | null;
  hasParking: boolean | null;
  parkingCount: number | null;
  furnishing: 'furnished' | 'semi-furnished' | 'unfurnished' | 'bare-shell' | null;
  possession: 'ready' | 'under-construction' | 'immediate' | null;

  // Commercial / Investment Filters
  minRoi: number | null; // e.g. 8 for 8%
  monthlyRentMin: number | null;
  isPreleased: boolean | null;
  tenantType: string | null;

  // Specific project or developer names
  developerOrProject: string | null;
  keywords: string[];
}

/**
 * Natural language understanding parser for search queries like:
 * "Show offices in Baner under ₹2 Cr with parking"
 * "3 BHK in Koregaon Park within 3 km ready to move"
 * "Preleased commercial in Hinjewadi with 8% ROI"
 */
export function parseNaturalLanguageSearch(queryText: string): AdvancedSearchCriteria {
  const text = (queryText || '').trim();
  const lower = text.toLowerCase();

  const criteria: AdvancedSearchCriteria = {
    rawQuery: text,
    intent: 'buy',
    typology: null,
    bhk: null,
    locality: null,
    radiusKm: null,
    radiusLocalities: [],
    minPrice: null,
    maxPrice: null,
    carpetAreaMin: null,
    carpetAreaMax: null,
    saleableAreaMin: null,
    saleableAreaMax: null,
    plotAreaMin: null,
    plotAreaMax: null,
    floorPreference: null,
    hasParking: null,
    parkingCount: null,
    furnishing: null,
    possession: null,
    minRoi: null,
    monthlyRentMin: null,
    isPreleased: null,
    tenantType: null,
    developerOrProject: null,
    keywords: []
  };

  // 1. Transaction Intent (Buy vs Rent vs Sell vs Invest)
  if (/\b(?:for rent|on rent|to rent|lease|renting|monthly rent)\b/i.test(lower)) {
    criteria.intent = 'rent';
  } else if (/\b(?:sell|selling|seller|i want a buyer|find buyer)\b/i.test(lower)) {
    criteria.intent = 'sell';
  } else if (/\b(?:roi|rental yield|pre[-_\s]*leased|investment|investor)\b/i.test(lower)) {
    criteria.intent = 'invest';
  } else {
    criteria.intent = 'buy';
  }

  // 2. Typology & BHK Detection
  if (/\b(?:office|offices|corporate desk|it park|workspace)\b/i.test(lower)) {
    criteria.typology = 'Commercial Office';
  } else if (/\b(?:showroom|display center)\b/i.test(lower)) {
    criteria.typology = 'Commercial Showroom';
  } else if (/\b(?:shop|shops|retail store|boutique)\b/i.test(lower)) {
    criteria.typology = 'Commercial Shop';
  } else if (/\b(?:hospital|clinic|healthcare|medical)\b/i.test(lower)) {
    criteria.typology = 'Hospital';
  } else if (/\b(?:warehouse|godown|industrial|shed)\b/i.test(lower)) {
    criteria.typology = 'Warehouse / Industrial';
  } else if (/\b(?:plot|plots|land|na plot)\b/i.test(lower)) {
    criteria.typology = 'Plot / Land';
  } else if (/\b(?:penthouse|sky villa)\b/i.test(lower)) {
    criteria.typology = 'Penthouse';
    criteria.bhk = '4.5+ BHK Penthouse';
  } else if (/\b(?:bungalow|bunglow|villa|row house)\b/i.test(lower)) {
    criteria.typology = 'Villa / Bungalow';
  } else {
    // Check specific BHK (1 to 6 BHK)
    const bhkMatch = lower.match(/\b([1-6])\s*(?:bhk|bed|bedroom)s?\b/i);
    if (bhkMatch) {
      criteria.bhk = `${bhkMatch[1]} BHK`;
      criteria.typology = 'Apartment';
    }
  }

  // 3. Locality & Radius
  for (const [key, loc] of Object.entries(PUNE_LOCALITIES_GEO)) {
    if (new RegExp(`\\b${loc.name}\\b`, 'i').test(lower)) {
      criteria.locality = loc.name;
      break;
    }
  }

  // Radius extraction (e.g. "within 5 km", "in 3 km radius", "near baner 5km")
  const radiusMatch = lower.match(/(?:within|in|near|around)\s*(\d+)\s*(?:km|kms|kilometer|kilometre)/i) ||
                      lower.match(/(\d+)\s*(?:km|kms)\s*(?:radius|proximity|distance)/i);
  if (radiusMatch) {
    const rKm = parseInt(radiusMatch[1], 10);
    criteria.radiusKm = rKm;
    if (criteria.locality) {
      const neighbors = getLocalitiesWithinRadius(criteria.locality, rKm);
      criteria.radiusLocalities = neighbors.map((n) => n.name);
    }
  } else if (criteria.locality) {
    // Default to target locality
    criteria.radiusLocalities = [criteria.locality];
  }

  // 4. Budget / Price Parsing (under 2 Cr, between 1.5 and 2.5 Cr, under 50 Lakhs)
  // Check for "under / below / max / up to ₹X Cr / L"
  const underPriceMatch = lower.match(/(?:under|below|less than|up to|upto|max|within)\s*(?:₹|rs\.?|inr)?\s*([\d.]+)\s*(cr|crore|crores|l|lakh|lakhs|k)?/i);
  if (underPriceMatch) {
    const val = parseFloat(underPriceMatch[1]);
    const unit = (underPriceMatch[2] || 'cr').toLowerCase();
    if (unit.startsWith('cr')) {
      criteria.maxPrice = val * 10000000;
    } else if (unit.startsWith('l')) {
      criteria.maxPrice = val * 100000;
    } else if (unit.startsWith('k')) {
      criteria.maxPrice = val * 1000;
    } else if (val < 100) {
      criteria.maxPrice = val * 10000000; // assume Cr if small number like 2 or 1.5
    }
  }

  // Check for range "between X and Y Cr"
  const rangeMatch = lower.match(/(?:between|from)?\s*(?:₹|rs\.?|inr)?\s*([\d.]+)\s*(?:cr|l)?\s*(?:to|-|and)\s*(?:₹|rs\.?|inr)?\s*([\d.]+)\s*(cr|crore|l|lakh)?/i);
  if (rangeMatch) {
    const val1 = parseFloat(rangeMatch[1]);
    const val2 = parseFloat(rangeMatch[2]);
    const unit = (rangeMatch[3] || 'cr').toLowerCase();
    const multiplier = unit.startsWith('l') ? 100000 : 10000000;
    criteria.minPrice = Math.min(val1, val2) * multiplier;
    criteria.maxPrice = Math.max(val1, val2) * multiplier;
  }

  // 5. Area Range Parsing (e.g. "1200 sqft", "above 1500 sq ft", "800 to 1200 carpet")
  const areaRangeMatch = lower.match(/(?:above|min|over)\s*(\d{3,5})\s*(?:sq\.?\s*ft|sqft)/i);
  if (areaRangeMatch) {
    criteria.carpetAreaMin = parseInt(areaRangeMatch[1], 10);
  }
  const areaExactMatch = lower.match(/(\d{3,5})\s*(?:sq\.?\s*ft|sqft)/i);
  if (areaExactMatch && !criteria.carpetAreaMin) {
    const a = parseInt(areaExactMatch[1], 10);
    criteria.carpetAreaMin = Math.round(a * 0.85);
    criteria.carpetAreaMax = Math.round(a * 1.15);
  }

  // 6. Parking Filter
  if (/\b(?:with parking|has parking|car park|car parking|covered parking|2 car parking)\b/i.test(lower)) {
    criteria.hasParking = true;
    if (/\b2\s*car\b/i.test(lower)) {
      criteria.parkingCount = 2;
    } else {
      criteria.parkingCount = 1;
    }
  }

  // 7. Furnishing Filter
  if (/\b(?:fully furnished|furnished)\b/i.test(lower)) {
    criteria.furnishing = 'furnished';
  } else if (/\b(?:semi[-_\s]*furnished)\b/i.test(lower)) {
    criteria.furnishing = 'semi-furnished';
  } else if (/\b(?:unfurnished|bare[-_\s]*shell|raw)\b/i.test(lower)) {
    criteria.furnishing = 'bare-shell';
  }

  // 8. Possession Timeline
  if (/\b(?:ready|ready to move|rtm|immediate|oc received)\b/i.test(lower)) {
    criteria.possession = 'ready';
  } else if (/\b(?:under[-_\s]*construction|uc|new launch|pre launch)\b/i.test(lower)) {
    criteria.possession = 'under-construction';
  }

  // 9. Floor Preference
  if (/\b(?:top floor|highest floor|penthouse floor)\b/i.test(lower)) {
    criteria.floorPreference = 'penthouse';
  } else if (/\b(?:ground floor|garden floor)\b/i.test(lower)) {
    criteria.floorPreference = 'ground';
  } else if (/\b(?:high floor|higher floor)\b/i.test(lower)) {
    criteria.floorPreference = 'high';
  }

  // 10. Investment Parameters (ROI & Preleased)
  const roiMatch = lower.match(/(\d+(?:\.\d+)?)\s*%\s*(?:roi|rental yield|yield)/i);
  if (roiMatch) {
    criteria.minRoi = parseFloat(roiMatch[1]);
    criteria.isPreleased = true;
  }
  if (/\b(?:pre[-_\s]*leased|pre[-_\s]*rented|grade[-_\s]*a tenant)\b/i.test(lower)) {
    criteria.isPreleased = true;
  }

  return criteria;
}

// ==========================================
// 3. BUYER–PROPERTY MATCHING CRM ALGORITHM
// ==========================================

export interface BuyerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  code?: string;
  assignedTo?: string;
  transactionType?: 'buy' | 'rent' | 'sell';
  bhk?: string;
  targetBudgetRaw?: number; // In Rupees e.g. 22000000
  targetBudgetStr?: string; // e.g. "₹2.20 Cr"
  preferredLocations?: string[];
  primaryLocality?: string;
  minCarpetSqft?: number;
  maxCarpetSqft?: number;
  preferredTypology?: string;
  possessionTimeline?: 'ready' | 'under-construction' | 'any';
  furnishingPreference?: string;
  parkingNeeded?: boolean;
  minRoi?: number;
  notes?: string;
}

export interface PropertyProfile {
  id: string | number;
  title: string;
  locality: string;
  address?: string;
  priceRaw: number;
  priceStr: string;
  bhk?: string;
  carpetSqft: number;
  saleableSqft?: number;
  typology: string; // 'residential' | 'commercial_office' | 'commercial_shop' | etc.
  transactionType?: 'buy' | 'rent';
  status: string; // 'Ready to Move', 'Under Construction', etc.
  parking?: boolean | string;
  furnishing?: string;
  roi?: number;
  slug?: string;
}

export interface MatchScoreResult {
  matchScore: number; // 0 - 100%
  tier: 'exceptional' | 'strong' | 'moderate' | 'low';
  breakdown: {
    budgetScore: number; // Max 30 pts
    locationScore: number; // Max 25 pts
    typologyScore: number; // Max 20 pts
    areaScore: number; // Max 15 pts
    otherScore: number; // Max 10 pts
  };
  isHardExcluded: boolean;
  hardExclusionReason?: string;
  reasons: string[];
  mismatches: string[];
  whatsappPitch: string;
}

/**
 * Enterprise Buyer-to-Property Match Scoring Formula
 *
 * Scoring Distribution (Total = 100 Points):
 * 1. Hard Exclusions (applied first): Transaction Type & Major Category Mismatch
 * 2. Budget (30 Points): buyer target budget vs property price
 * 3. Location (25 Points): exact locality (25 pts), <=3km (20 pts), <=5km (14 pts), <=10km (8 pts)
 * 4. Property Type (20 Points): exact BHK / typology match
 * 5. Area / Sqft (15 Points): carpet area matching within preferred range
 * 6. Other Requirements (10 Points): possession timeline, parking, furnishing, investment yield
 */
export function calculateBuyerPropertyMatch(
  property: PropertyProfile,
  buyer: BuyerProfile
): MatchScoreResult {
  const reasons: string[] = [];
  const mismatches: string[] = [];

  // ----------------------------------------
  // Step 1: Check Hard Exclusions
  // ----------------------------------------

  // A. Transaction Type Mismatch (e.g. Buyer looking for Rent vs Property for Buy/Sale)
  const propTx = (property.transactionType || 'buy').toLowerCase();
  const buyerTx = (buyer.transactionType || 'buy').toLowerCase();
  if (buyerTx !== 'sell' && propTx !== buyerTx) {
    return {
      matchScore: 0,
      tier: 'low',
      breakdown: { budgetScore: 0, locationScore: 0, typologyScore: 0, areaScore: 0, otherScore: 0 },
      isHardExcluded: true,
      hardExclusionReason: `Hard mismatch on transaction intent: Buyer is seeking to ${buyerTx.toUpperCase()} while property is listed for ${propTx.toUpperCase()}.`,
      reasons: [],
      mismatches: [`Transaction intent mismatch: Buyer wants ${buyerTx}, property is ${propTx}`],
      whatsappPitch: ''
    };
  }

  // B. Major Typology Boundary (Commercial vs Residential hard barrier)
  const propIsCommercial =
    property.typology.includes('commercial') ||
    property.typology.includes('office') ||
    property.typology.includes('shop') ||
    property.typology.includes('hospital');

  const buyerText = `${buyer.bhk || ''} ${buyer.preferredTypology || ''} ${buyer.notes || ''}`.toLowerCase();
  const buyerIsCommercial =
    buyerText.includes('office') ||
    buyerText.includes('commercial') ||
    buyerText.includes('shop') ||
    buyerText.includes('showroom');

  const buyerIsResidential =
    buyerText.includes('bhk') ||
    buyerText.includes('apartment') ||
    buyerText.includes('flat') ||
    buyerText.includes('penthouse') ||
    buyerText.includes('villa');

  if (propIsCommercial && buyerIsResidential && !buyerIsCommercial) {
    return {
      matchScore: 0,
      tier: 'low',
      breakdown: { budgetScore: 0, locationScore: 0, typologyScore: 0, areaScore: 0, otherScore: 0 },
      isHardExcluded: true,
      hardExclusionReason: 'Category barrier: Buyer is looking for Residential housing, but this is a Commercial asset.',
      reasons: [],
      mismatches: ['Asset class mismatch (Commercial vs Residential)'],
      whatsappPitch: ''
    };
  }

  if (!propIsCommercial && buyerIsCommercial && !buyerIsResidential) {
    return {
      matchScore: 0,
      tier: 'low',
      breakdown: { budgetScore: 0, locationScore: 0, typologyScore: 0, areaScore: 0, otherScore: 0 },
      isHardExcluded: true,
      hardExclusionReason: 'Category barrier: Buyer requires Commercial premises, but this is a Residential home.',
      reasons: [],
      mismatches: ['Asset class mismatch (Residential vs Commercial)'],
      whatsappPitch: ''
    };
  }

  // ----------------------------------------
  // Step 2: Budget Scoring (30 Points Max)
  // ----------------------------------------
  let budgetScore = 0;
  const buyerBudget = buyer.targetBudgetRaw || 0;
  const propPrice = property.priceRaw || 0;

  if (buyerBudget > 0 && propPrice > 0) {
    const ratio = propPrice / buyerBudget;
    if (ratio >= 0.95 && ratio <= 1.05) {
      budgetScore = 30;
      reasons.push(`✓ Budget: ₹${(propPrice / 10000000).toFixed(2)} Cr is an exact fit with target budget (30/30 pts)`);
    } else if (ratio >= 0.85 && ratio <= 1.12) {
      budgetScore = 25;
      reasons.push(`✓ Budget: Price aligns within ±12% of buyer's bracket (25/30 pts)`);
    } else if (ratio >= 0.75 && ratio <= 1.25) {
      budgetScore = 18;
      reasons.push(`✓ Budget: Within negotiable stretch of buyer's budget (+18 pts)`);
    } else if (ratio < 0.75) {
      budgetScore = 14;
      mismatches.push(`⚠ Budget: Property price is significantly below buyer's premium bracket`);
    } else if (ratio <= 1.4) {
      budgetScore = 8;
      mismatches.push(`⚠ Budget: ₹${(propPrice / 10000000).toFixed(2)} Cr exceeds buyer target by ${Math.round((ratio - 1) * 100)}%`);
    } else {
      budgetScore = 0;
      mismatches.push(`❌ Budget: Price exceeds buyer capacity by over 40%`);
    }
  } else {
    // If budget unstated, award neutral baseline
    budgetScore = 20;
    reasons.push(`✓ Budget: Flexible or open budget profile (20/30 baseline pts)`);
  }

  // ----------------------------------------
  // Step 3: Location Scoring (25 Points Max)
  // ----------------------------------------
  let locationScore = 0;
  const propLoc = (property.locality || '').trim().toLowerCase();
  const buyerLocations = (buyer.preferredLocations || [buyer.primaryLocality || ''])
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);

  const exactLocMatch = buyerLocations.some(
    (bl) => propLoc.includes(bl) || bl.includes(propLoc)
  );

  if (exactLocMatch) {
    locationScore = 25;
    reasons.push(`✓ Location: Exact locality match in ${property.locality} (25/25 pts)`);
  } else if (buyerLocations.length > 0) {
    // Check radius distance against preferred locations
    let closestDist = 999;
    for (const bLoc of buyerLocations) {
      const pCoord = PUNE_LOCALITIES_GEO[propLoc.replace(/[^a-z]/g, '')];
      const bCoord = PUNE_LOCALITIES_GEO[bLoc.replace(/[^a-z]/g, '')];
      if (pCoord && bCoord) {
        const d = calculateGeoDistanceKm(pCoord.lat, pCoord.lng, bCoord.lat, bCoord.lng);
        if (d < closestDist) closestDist = d;
      }
    }

    if (closestDist <= 3) {
      locationScore = 20;
      reasons.push(`✓ Location: Adjacent micro-market (${closestDist} km from requested area, 20/25 pts)`);
    } else if (closestDist <= 6) {
      locationScore = 14;
      reasons.push(`✓ Location: Within prime 6 km radius corridor (+14 pts)`);
    } else if (closestDist <= 12) {
      locationScore = 8;
      mismatches.push(`⚠ Location: ${closestDist} km away from requested micro-market`);
    } else {
      locationScore = 3;
      mismatches.push(`❌ Location: Different corridor in Pune`);
    }
  } else {
    locationScore = 18;
    reasons.push(`✓ Location: Flexible Pune city mandate (18/25 baseline pts)`);
  }

  // ----------------------------------------
  // Step 4: Property Type Scoring (20 Points Max)
  // ----------------------------------------
  let typologyScore = 0;
  const propBhk = (property.bhk || '').toLowerCase();
  const buyerBhk = (buyer.bhk || '').toLowerCase();

  if (buyerBhk && propBhk) {
    const propDigit = propBhk.match(/\d+/)?.[0];
    const buyerDigit = buyerBhk.match(/\d+/)?.[0];

    if (propDigit && buyerDigit && propDigit === buyerDigit) {
      typologyScore = 20;
      reasons.push(`✓ Typology: Exact ${property.bhk} configuration match (20/20 pts)`);
    } else if (propDigit && buyerDigit && Math.abs(parseInt(propDigit, 10) - parseInt(buyerDigit, 10)) === 1) {
      typologyScore = 12;
      reasons.push(`✓ Typology: Compatible ${property.bhk} (±1 BHK tolerance, 12/20 pts)`);
    } else if (propIsCommercial && buyerIsCommercial) {
      typologyScore = 20;
      reasons.push(`✓ Typology: Prime commercial office/retail space match (20/20 pts)`);
    } else {
      typologyScore = 5;
      mismatches.push(`⚠ Typology: ${property.bhk} vs requested ${buyer.bhk}`);
    }
  } else if (propIsCommercial && buyerIsCommercial) {
    typologyScore = 20;
    reasons.push(`✓ Typology: Commercial premises match (20/20 pts)`);
  } else {
    typologyScore = 15;
    reasons.push(`✓ Typology: Adaptable layout configuration (15/20 baseline pts)`);
  }

  // ----------------------------------------
  // Step 5: Area / Size Scoring (15 Points Max)
  // ----------------------------------------
  let areaScore = 0;
  const propArea = property.carpetSqft || 0;
  const minArea = buyer.minCarpetSqft || 0;
  const maxArea = buyer.maxCarpetSqft || (minArea > 0 ? minArea * 1.35 : 0);

  if (minArea > 0 && propArea > 0) {
    if (propArea >= minArea && (maxArea === 0 || propArea <= maxArea)) {
      areaScore = 15;
      reasons.push(`✓ Area: ${propArea} sq.ft carpet is inside buyer's desired range (15/15 pts)`);
    } else if (propArea >= minArea * 0.88 && propArea <= (maxArea || minArea) * 1.15) {
      areaScore = 11;
      reasons.push(`✓ Area: ${propArea} sq.ft is within acceptable 12% tolerance (+11 pts)`);
    } else if (propArea < minArea * 0.88) {
      areaScore = 4;
      mismatches.push(`⚠ Area: ${propArea} sq.ft is smaller than minimum ${minArea} sq.ft required`);
    } else {
      areaScore = 8;
      reasons.push(`✓ Area: ${propArea} sq.ft provides bonus extra space (+8 pts)`);
    }
  } else {
    areaScore = 12;
    reasons.push(`✓ Area: Well-proportioned layout (12/15 baseline pts)`);
  }

  // ----------------------------------------
  // Step 6: Other Requirements (10 Points Max)
  // ----------------------------------------
  let otherScore = 0;

  // Possession timeline match
  const propStatus = (property.status || '').toLowerCase();
  const buyerHorizon = (buyer.possessionTimeline || '').toLowerCase();

  if (buyerHorizon.includes('ready') || buyerHorizon.includes('immediate')) {
    if (propStatus.includes('ready') || propStatus.includes('oc')) {
      otherScore += 5;
      reasons.push('✓ Possession: Ready to move matches buyer urgency (+5 pts)');
    } else {
      mismatches.push('⚠ Possession: Buyer prefers ready possession; property is under construction');
    }
  } else {
    otherScore += 4;
  }

  // Parking & Amenities
  if (property.parking) {
    otherScore += 3;
    reasons.push('✓ Amenities: Includes reserved dedicated parking (+3 pts)');
  }

  // Commercial ROI yield check
  if (buyer.minRoi && property.roi) {
    if (property.roi >= buyer.minRoi) {
      otherScore += 2;
      reasons.push(`✓ Investment: Yield of ${property.roi}% meets or exceeds ${buyer.minRoi}% target (+2 pts)`);
    }
  } else {
    otherScore += 2;
  }

  otherScore = Math.min(10, otherScore);

  // Total Score Calculation
  const totalScore = Math.min(
    100,
    Math.round(budgetScore + locationScore + typologyScore + areaScore + otherScore)
  );

  let tier: 'exceptional' | 'strong' | 'moderate' | 'low' = 'low';
  if (totalScore >= 88) tier = 'exceptional';
  else if (totalScore >= 72) tier = 'strong';
  else if (totalScore >= 52) tier = 'moderate';

  // ----------------------------------------
  // Step 7: Auto-generated WhatsApp Pitch Text
  // ----------------------------------------
  const buyerFirstName = (buyer.name || 'Patron').split(/\s+/)[0];
  const priceDisplay = property.priceStr || (property.priceRaw > 0 ? `₹${(property.priceRaw / 10000000).toFixed(2)} Cr` : 'Price on Request');

  const whatsappPitch = `Hello ${buyerFirstName}, regarding your requirement for a ${buyer.bhk || 'premium property'} in ${buyer.primaryLocality || property.locality}, our advisory team has matched an exclusive option:

🏢 *${property.title}*
📍 Location: ${property.locality}
📐 Carpet Area: ${property.carpetSqft} sq.ft
💰 Quoted Valuation: ${priceDisplay}
⚡ Match Score: ${totalScore}%

${reasons.slice(0, 2).map((r) => r.replace(/[✓⚠❌]/g, '•')).join('\n')}

Would you like me to share the confidential architectural dossier and schedule an escorted viewing this week?`;

  return {
    matchScore: totalScore,
    tier,
    breakdown: {
      budgetScore,
      locationScore,
      typologyScore,
      areaScore,
      otherScore
    },
    isHardExcluded: false,
    reasons,
    mismatches,
    whatsappPitch
  };
}
