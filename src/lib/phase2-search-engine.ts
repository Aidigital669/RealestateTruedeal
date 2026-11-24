/**
 * Phase 2 Intelligent Real Estate Search Engine
 * Implements:
 * 1. Property type synonym mapping (Groups A through F)
 * 2. Location-based geographic search (5 km radius with Haversine distance)
 * 3. Strict property search with unique property count (threshold >= 2)
 * 4. Conditional price range expansion (±25%)
 * 5. Conditional property area expansion (±20%)
 * 6. 14-step search fallback execution order
 * 7. Search result ranking & transparent badge labeling
 * 8. Zero-result handling with recovery actions
 */

import {
  DEFAULT_SEARCH_CONFIG,
  SearchEngineConfig,
  getSynonymsForPropertyType,
  calculateHaversineDistanceKm,
  resolveLocationCoordinates
} from './search-config';
import { detectQueryAutocorrect } from './search-autocorrect';
import { extractStructuredIntent } from './search-engine-core';

export interface Phase2SearchRequest {
  query?: string;
  propertyType?: string;
  transactionType?: 'sale' | 'rent' | 'preleased' | null;
  locality?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  hardMaxBudget?: boolean; // If true, strictly never expand above requested maximum budget
  minArea?: number;
  maxArea?: number;
  hardMaxArea?: boolean;   // If true, strictly never expand above requested maximum area
  areaMeasurementType?: 'carpet' | 'builtup' | 'saleable';
  mandatoryFilters?: Record<string, any>;
  config?: Partial<SearchEngineConfig>;
}

export interface Phase2PropertyMatch {
  property: any;
  matchType: 'exact' | 'synonym' | 'expanded';
  distanceKm: number | null;
  isStrictMatch: boolean;
  isExpandedMatch: boolean;
  badges: string[];
  priceComparison: 'within' | 'below' | 'above' | null;
  areaComparison: 'within' | 'similar' | null;
  score: number;
}

export interface Phase2SearchResult {
  strictMatches: Phase2PropertyMatch[];
  expandedMatches: Phase2PropertyMatch[];
  allMatches: Phase2PropertyMatch[];
  totalCount: number;
  strictCount: number;
  expandedCount: number;
  isFallbackActivated: boolean;
  fallbackReason?: string;
  fallbackBanner?: string;
  appliedFilters: {
    propertyType?: string;
    synonymTypes?: string[];
    transactionType?: string;
    locality?: string;
    centerCoordinates?: { lat: number; lng: number };
    radiusKm: number;
    priceRange?: { min: number | null; max: number | null };
    expandedPriceRange?: { min: number | null; max: number | null };
    areaRange?: { min: number | null; max: number | null };
    expandedAreaRange?: { min: number | null; max: number | null };
    areaMeasurementType?: string;
  };
  noResultData?: {
    message: string;
    suggestedActions: Array<
      | 'change_location'
      | 'increase_radius'
      | 'modify_budget'
      | 'modify_area'
      | 'change_property_type'
      | 'submit_requirement'
    >;
  };
}

/**
 * Normalizes property type string from a property record
 */
function extractPropertyTypeString(prop: any): string {
  const parts = [
    prop.type_name,
    prop.propertyType,
    prop.bhk,
    prop.configuration,
    prop.name,
    prop.title
  ].filter(Boolean).map(String).join(' ').toLowerCase();

  if (/\b(?:godown|warehouse|industrial shed|storage)\b/i.test(parts)) {
    if (/\bgodown\b/i.test(parts)) return 'godown';
    if (/\bindustrial shed\b/i.test(parts)) return 'industrial shed';
    return 'warehouse';
  }
  if (/\b(?:showroom|display center)\b/i.test(parts)) return 'showroom';
  if (/\b(?:shop|retail store|commercial shop)\b/i.test(parts)) return 'shop';
  if (/\b(?:office|commercial office|workspace|it park)\b/i.test(parts)) return 'commercial office';
  if (/\b(?:factory|manufacturing unit)\b/i.test(parts)) return 'factory';
  if (/\b(?:commercial plot|commercial land)\b/i.test(parts)) return 'commercial land';
  if (/\b(?:industrial plot|industrial land)\b/i.test(parts)) return 'industrial land';
  if (/\b(?:apartment|flat|residence)\b/i.test(parts)) return 'apartment';
  if (/\bpenthouse\b/i.test(parts)) return 'penthouse';
  if (/\b(?:villa|bungalow)\b/i.test(parts)) return 'villa';

  return 'commercial space';
}

/**
 * Extracts raw numeric price from property
 */
function getRawPrice(prop: any): number {
  if (typeof prop.priceRaw === 'number' && prop.priceRaw > 0) return prop.priceRaw;
  if (typeof prop.price === 'number') return prop.price;
  if (typeof prop.rent === 'number') return prop.rent;
  if (typeof prop.price === 'string') {
    const p = prop.price.replace(/[^\d.]/g, '');
    const num = parseFloat(p);
    if (!isNaN(num) && num > 0) {
      if (/cr\b/i.test(prop.price)) return num * 10000000;
      if (/lakh|lac\b/i.test(prop.price)) return num * 100000;
      return num;
    }
  }
  return 0;
}

/**
 * Extracts area matching the requested measurement type
 */
function getRawArea(prop: any, areaType: 'carpet' | 'builtup' | 'saleable' = 'carpet'): number {
  if (areaType === 'carpet') {
    if (typeof prop.carpetArea === 'number') return prop.carpetArea;
    if (typeof prop.sqftNum === 'number') return prop.sqftNum;
    if (typeof prop.sqft_num === 'number') return prop.sqft_num;
  }
  if (areaType === 'builtup' && typeof prop.builtupArea === 'number') return prop.builtupArea;
  if (areaType === 'saleable' && typeof prop.saleableArea === 'number') return prop.saleableArea;

  const raw = prop.sqft || prop.carpetArea || prop.builtupArea || prop.saleableArea;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const match = raw.replace(/,/g, '').match(/\d+(\.\d+)?/);
    if (match) return parseFloat(match[0]);
  }
  return 0;
}

/**
 * Resolves coordinates for a property from its fields or known locality
 */
function getPropertyCoordinates(prop: any): { lat: number; lng: number } | null {
  if (prop.latitude && prop.longitude) {
    const lat = parseFloat(String(prop.latitude));
    const lng = parseFloat(String(prop.longitude));
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  const locStr = prop.locality || prop.location || prop.address || '';
  return resolveLocationCoordinates(locStr);
}

/**
 * Executes the complete Phase 2 intelligent search algorithm
 */
export function executePhase2Search(
  propertiesList: any[],
  request: Phase2SearchRequest
): Phase2SearchResult {
  const config = { ...DEFAULT_SEARCH_CONFIG, ...request.config };
  const rawQuery = (request.query || '').trim();

  // Step 1: Normalize and correct query
  const autocorrect = detectQueryAutocorrect(rawQuery);
  const effectiveQuery = autocorrect.hasCorrection ? autocorrect.correctedQuery : rawQuery;
  const structuredIntent = extractStructuredIntent(effectiveQuery);

  // Step 2: Identify requirements
  const requestedPropertyType = (
    request.propertyType ||
    structuredIntent.extractedTypology ||
    ''
  ).toLowerCase().trim();

  const requestedTransactionType = (
    request.transactionType ||
    structuredIntent.transactionType ||
    null
  );

  const requestedLocality = (
    request.locality ||
    structuredIntent.extractedLocality ||
    ''
  ).trim();

  // Resolve search center coordinates
  let centerCoords: { lat: number; lng: number } | null = null;
  if (request.lat && request.lng) {
    centerCoords = { lat: request.lat, lng: request.lng };
  } else if (requestedLocality && requestedLocality !== 'All') {
    centerCoords = resolveLocationCoordinates(requestedLocality);
  }

  const radiusKm = request.radiusKm && request.radiusKm > 0 ? request.radiusKm : config.defaultSearchRadiusKm;

  // Requested Price & Area
  const minPrice = request.minPrice || structuredIntent.extractedBudget.min || null;
  const maxPrice = request.maxPrice || structuredIntent.extractedBudget.max || null;
  const minArea = request.minArea || structuredIntent.extractedSqft.min || null;
  const maxArea = request.maxArea || structuredIntent.extractedSqft.max || null;
  const areaType = request.areaMeasurementType || 'carpet';

  // Step 3: Apply property-type synonym mapping
  const synonymMapping = requestedPropertyType
    ? getSynonymsForPropertyType(requestedPropertyType)
    : { group: null, synonyms: [], isExactGroupMember: false };

  // Step 4: Execute strict property search within selected radius
  const strictMatches: Phase2PropertyMatch[] = [];
  const seenStrictIds = new Set<string>();

  for (const prop of propertiesList) {
    const propId = String(prop.id);
    const propTypeStr = extractPropertyTypeString(prop);
    const propListingType = String(prop.listingType || prop.listing_type || '').toLowerCase();
    const propPrice = getRawPrice(prop);
    const propArea = getRawArea(prop, areaType);
    const propCoords = getPropertyCoordinates(prop);

    // Distance calculation
    let distanceKm: number | null = null;
    if (centerCoords && propCoords) {
      distanceKm = calculateHaversineDistanceKm(centerCoords.lat, centerCoords.lng, propCoords.lat, propCoords.lng);
      // Strictly enforce radius: properties beyond radiusKm are excluded
      if (distanceKm > radiusKm) {
        continue;
      }
    } else if (requestedLocality && requestedLocality !== 'All') {
      // If coordinates missing, verify text locality match
      const pLoc = `${prop.locality || ''} ${prop.location || ''} ${prop.address || ''}`.toLowerCase();
      if (!pLoc.includes(requestedLocality.toLowerCase())) {
        continue;
      }
    }

    // Transaction Type matching (Sale vs Rent strict separation)
    if (requestedTransactionType) {
      const isRentProp = propListingType.includes('rent') || propListingType.includes('lease');
      const isSaleProp = propListingType.includes('sale') || propListingType.includes('buy') || (!isRentProp && propPrice > 1000000);
      if (requestedTransactionType === 'sale' && !isSaleProp) continue;
      if (requestedTransactionType === 'rent' && !isRentProp) continue;
    }

    // Property Type & Synonym matching
    let isExactTypeMatch = false;
    let isSynonymTypeMatch = false;

    if (requestedPropertyType) {
      if (propTypeStr === requestedPropertyType || propTypeStr.includes(requestedPropertyType) || requestedPropertyType.includes(propTypeStr)) {
        isExactTypeMatch = true;
      } else if (synonymMapping.synonyms.some((syn) => propTypeStr.includes(syn) || syn.includes(propTypeStr))) {
        isSynonymTypeMatch = true;
      } else {
        continue; // Does not match property type or its approved synonyms
      }
    } else {
      isExactTypeMatch = true;
    }

    // Strict Price Range check
    if (minPrice && propPrice > 0 && propPrice < minPrice) continue;
    if (maxPrice && propPrice > 0 && propPrice > maxPrice) continue;

    // Strict Area Range check
    if (minArea && propArea > 0 && propArea < minArea) continue;
    if (maxArea && propArea > 0 && propArea > maxArea) continue;

    // Badges & Scoring
    const badges: string[] = [];
    if (isExactTypeMatch) {
      badges.push('Exact Match');
    } else if (isSynonymTypeMatch) {
      badges.push('Similar Property Type');
    }

    if (distanceKm !== null) {
      badges.push(distanceKm === 0 ? 'Exact Location' : `Nearby (${distanceKm} km away)`);
    }

    if (maxPrice && propPrice > 0 && propPrice <= maxPrice) {
      badges.push('Within Budget');
    }

    if (minArea && maxArea && propArea >= minArea && propArea <= maxArea) {
      badges.push('Exact Size');
    }

    // Ranking Score calculation
    let score = config.rankingWeights.exactMatch;
    if (isExactTypeMatch) score += config.rankingWeights.exactPropertyType;
    if (isSynonymTypeMatch) score += config.rankingWeights.synonymPropertyType;
    if (distanceKm !== null) {
      score -= distanceKm * config.rankingWeights.distanceWeight;
    }

    seenStrictIds.add(propId);
    strictMatches.push({
      property: prop,
      matchType: isExactTypeMatch ? 'exact' : 'synonym',
      distanceKm,
      isStrictMatch: true,
      isExpandedMatch: false,
      badges,
      priceComparison: maxPrice && propPrice > 0 ? (propPrice <= maxPrice ? 'within' : 'above') : null,
      areaComparison: minArea && maxArea && propArea >= minArea && propArea <= maxArea ? 'within' : null,
      score
    });
  }

  // Sort strict matches by score descending
  strictMatches.sort((a, b) => b.score - a.score);

  // Step 5 & 6: Check unique count threshold (threshold = 2)
  const strictCount = strictMatches.length;
  if (strictCount >= config.minStrictMatchCount || !config.fallbackSearchEnabled) {
    return {
      strictMatches,
      expandedMatches: [],
      allMatches: strictMatches,
      totalCount: strictCount,
      strictCount,
      expandedCount: 0,
      isFallbackActivated: false,
      appliedFilters: {
        propertyType: requestedPropertyType || undefined,
        synonymTypes: synonymMapping.synonyms,
        transactionType: requestedTransactionType || undefined,
        locality: requestedLocality || undefined,
        centerCoordinates: centerCoords || undefined,
        radiusKm,
        priceRange: { min: minPrice, max: maxPrice },
        areaRange: { min: minArea, max: maxArea },
        areaMeasurementType: areaType
      }
    };
  }

  // Step 7: Activate fallback search (strict count is 0 or 1)
  // Step 8 & 9: Compute expanded price (±25%) and expanded area (±20%)
  const hasPriceConstraint = minPrice !== null || maxPrice !== null;
  const hasAreaConstraint = minArea !== null || maxArea !== null;

  const expandedMinPrice = minPrice ? Math.round(minPrice * (1 - config.priceExpansionPct)) : null;
  const expandedMaxPrice = maxPrice
    ? (request.hardMaxBudget ? maxPrice : Math.round(maxPrice * (1 + config.priceExpansionPct)))
    : null;

  const expandedMinArea = minArea ? Math.round(minArea * (1 - config.areaExpansionPct)) : null;
  const expandedMaxArea = maxArea
    ? (request.hardMaxArea ? maxArea : Math.round(maxArea * (1 + config.areaExpansionPct)))
    : null;

  // Step 10: Execute expanded search within same 5 km radius
  const expandedMatches: Phase2PropertyMatch[] = [];

  for (const prop of propertiesList) {
    const propId = String(prop.id);
    if (seenStrictIds.has(propId)) continue; // Discard strict matches already collected

    const propTypeStr = extractPropertyTypeString(prop);
    const propListingType = String(prop.listingType || prop.listing_type || '').toLowerCase();
    const propPrice = getRawPrice(prop);
    const propArea = getRawArea(prop, areaType);
    const propCoords = getPropertyCoordinates(prop);

    // Keep same radius (NEVER automatically expand radius beyond requested limit)
    let distanceKm: number | null = null;
    if (centerCoords && propCoords) {
      distanceKm = calculateHaversineDistanceKm(centerCoords.lat, centerCoords.lng, propCoords.lat, propCoords.lng);
      if (distanceKm > radiusKm) continue;
    } else if (requestedLocality && requestedLocality !== 'All') {
      const pLoc = `${prop.locality || ''} ${prop.location || ''} ${prop.address || ''}`.toLowerCase();
      if (!pLoc.includes(requestedLocality.toLowerCase())) continue;
    }

    // Keep same transaction type (Sale vs Rent never mixed)
    if (requestedTransactionType) {
      const isRentProp = propListingType.includes('rent') || propListingType.includes('lease');
      const isSaleProp = propListingType.includes('sale') || propListingType.includes('buy') || (!isRentProp && propPrice > 1000000);
      if (requestedTransactionType === 'sale' && !isSaleProp) continue;
      if (requestedTransactionType === 'rent' && !isRentProp) continue;
    }

    // Property Type (Exact or Synonym group)
    let isExactTypeMatch = false;
    let isSynonymTypeMatch = false;
    if (requestedPropertyType) {
      if (propTypeStr === requestedPropertyType || propTypeStr.includes(requestedPropertyType) || requestedPropertyType.includes(propTypeStr)) {
        isExactTypeMatch = true;
      } else if (synonymMapping.synonyms.some((syn) => propTypeStr.includes(syn) || syn.includes(propTypeStr))) {
        isSynonymTypeMatch = true;
      } else {
        continue;
      }
    }

    // Check expanded price range
    if (expandedMinPrice && propPrice > 0 && propPrice < expandedMinPrice) continue;
    if (expandedMaxPrice && propPrice > 0 && propPrice > expandedMaxPrice) continue;

    // Check expanded area range
    if (expandedMinArea && propArea > 0 && propArea < expandedMinArea) continue;
    if (expandedMaxArea && propArea > 0 && propArea > expandedMaxArea) continue;

    // Badges & Labels
    const badges: string[] = ['Recommended Alternative'];
    if (isSynonymTypeMatch) badges.push('Similar Property Type');

    let priceComp: 'within' | 'below' | 'above' | null = null;
    if (maxPrice && propPrice > 0) {
      if (propPrice <= maxPrice) {
        priceComp = 'within';
        badges.push('Within Budget');
      } else {
        priceComp = 'above';
        badges.push('Above Requested Budget (+25% range)');
      }
    } else if (minPrice && propPrice > 0 && propPrice < minPrice) {
      priceComp = 'below';
      badges.push('Below Requested Budget');
    }

    let areaComp: 'within' | 'similar' | null = null;
    if (minArea && maxArea && propArea > 0) {
      if (propArea >= minArea && propArea <= maxArea) {
        areaComp = 'within';
        badges.push('Exact Size');
      } else {
        areaComp = 'similar';
        badges.push('Similar Area (±20%)');
      }
    }

    if (distanceKm !== null) {
      badges.push(`Nearby (${distanceKm} km away)`);
    }

    let score = 200;
    if (isExactTypeMatch) score += 100;
    if (isSynonymTypeMatch) score += 50;
    if (distanceKm !== null) score -= distanceKm * config.rankingWeights.distanceWeight;
    if (priceComp === 'within') score += 100;

    expandedMatches.push({
      property: prop,
      matchType: 'expanded',
      distanceKm,
      isStrictMatch: false,
      isExpandedMatch: true,
      badges,
      priceComparison: priceComp,
      areaComparison: areaComp,
      score
    });
  }

  // Sort expanded matches by score descending
  expandedMatches.sort((a, b) => b.score - a.score);

  // Step 11 & 12: Merge results with strict matches first, duplicates removed
  const allMatches = [...strictMatches, ...expandedMatches];
  const totalCount = allMatches.length;

  // Step 13: Construct transparent fallback banner
  const expandedFields: string[] = [];
  if (hasPriceConstraint && !request.hardMaxBudget) expandedFields.push('price (±25%)');
  if (hasAreaConstraint && !request.hardMaxArea) expandedFields.push('area (±20%)');

  const fallbackBanner = expandedFields.length > 0
    ? `Limited exact matches found (${strictCount}). Showing similar properties within ${radiusKm} km of your selected location, with an expanded ${expandedFields.join(' and ')} range.`
    : `Limited exact matches found (${strictCount}). Showing similar properties within ${radiusKm} km of your selected location.`;

  // Step 14: Zero-result handling if total matches == 0
  let noResultData: Phase2SearchResult['noResultData'] = undefined;
  if (totalCount === 0) {
    noResultData = {
      message: `Property not found within ${radiusKm} km of your selected location.`,
      suggestedActions: [
        'change_location',
        'increase_radius',
        'modify_budget',
        'modify_area',
        'change_property_type',
        'submit_requirement'
      ]
    };
  }

  return {
    strictMatches,
    expandedMatches,
    allMatches,
    totalCount,
    strictCount,
    expandedCount: expandedMatches.length,
    isFallbackActivated: true,
    fallbackReason: `Strict search returned ${strictCount} matches (threshold is ${config.minStrictMatchCount}).`,
    fallbackBanner,
    appliedFilters: {
      propertyType: requestedPropertyType || undefined,
      synonymTypes: synonymMapping.synonyms,
      transactionType: requestedTransactionType || undefined,
      locality: requestedLocality || undefined,
      centerCoordinates: centerCoords || undefined,
      radiusKm,
      priceRange: { min: minPrice, max: maxPrice },
      expandedPriceRange: { min: expandedMinPrice, max: expandedMaxPrice },
      areaRange: { min: minArea, max: maxArea },
      expandedAreaRange: { min: expandedMinArea, max: expandedMaxArea },
      areaMeasurementType: areaType
    },
    noResultData
  };
}
