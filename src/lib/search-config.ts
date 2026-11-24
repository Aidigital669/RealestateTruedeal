/**
 * Centralized Configuration for ANV REEALTY Phase 2 Intelligent Search Engine
 * Manages:
 * - Search radius (default 5 km)
 * - Minimum strict match count threshold (default 2)
 * - Expansion percentages (Price ±25%, Area ±20%)
 * - Property-type synonym groups (Groups A through F)
 * - Known Pune locality geographic coordinates (Lat/Lng)
 * - Spelling correction dictionary & location aliases
 * - Haversine distance calculator
 */

export interface PropertyTypeSynonymGroup {
  id: string;
  name: string;
  description: string;
  types: string[]; // Lowercase normalized types
}

export interface SearchEngineConfig {
  defaultSearchRadiusKm: number;
  minStrictMatchCount: number;
  priceExpansionPct: number; // 0.25 (25%)
  areaExpansionPct: number;  // 0.20 (20%)
  fallbackSearchEnabled: boolean;
  fuzzyConfidenceThreshold: number; // 0.75
  rankingWeights: {
    exactMatch: number;
    exactPropertyType: number;
    synonymPropertyType: number;
    exactLocality: number;
    distanceWeight: number; // per km penalty
    priceCloseness: number;
    areaCloseness: number;
    availability: number;
  };
}

export const DEFAULT_SEARCH_CONFIG: SearchEngineConfig = {
  defaultSearchRadiusKm: 5,
  minStrictMatchCount: 2,
  priceExpansionPct: 0.25, // 25%
  areaExpansionPct: 0.20,  // 20%
  fallbackSearchEnabled: true,
  fuzzyConfidenceThreshold: 0.75,
  rankingWeights: {
    exactMatch: 500,
    exactPropertyType: 200,
    synonymPropertyType: 100,
    exactLocality: 250,
    distanceWeight: 30, // -30 points per km away
    priceCloseness: 150,
    areaCloseness: 150,
    availability: 50
  }
};

/**
 * 1. Property-Type Synonym Groups (Configurable)
 */
export const PROPERTY_SYNONYM_GROUPS: PropertyTypeSynonymGroup[] = [
  {
    id: 'group_a',
    name: 'Industrial and Storage Properties',
    description: 'Warehouses, Godowns, Industrial Sheds and Storage Facilities',
    types: [
      'godown',
      'warehouse',
      'industrial shed',
      'storage space',
      'storage facility',
      'logistics park'
    ]
  },
  {
    id: 'group_b',
    name: 'Retail Properties',
    description: 'Shops, Showrooms, Retail Spaces and Commercial Stores',
    types: [
      'shop',
      'showroom',
      'retail space',
      'commercial shop',
      'commercial showroom',
      'retail store',
      'high street retail'
    ]
  },
  {
    id: 'group_c',
    name: 'Office Properties',
    description: 'Corporate Offices, IT Parks, and Commercial Workspaces',
    types: [
      'office',
      'office space',
      'commercial office',
      'corporate office',
      'it park',
      'coworking space',
      'tech park'
    ]
  },
  {
    id: 'group_d',
    name: 'Industrial Manufacturing Properties',
    description: 'Factories, Manufacturing Units and Industrial Plants',
    types: [
      'factory',
      'manufacturing unit',
      'industrial property',
      'industrial plant',
      'manufacturing plant'
    ]
  },
  {
    id: 'group_e',
    name: 'Commercial Land',
    description: 'Commercial Plots and Commercial Land Parcels',
    types: [
      'commercial plot',
      'commercial land',
      'commercial land / plot'
    ]
  },
  {
    id: 'group_f',
    name: 'Industrial Land',
    description: 'Industrial Plots, MIDC Land and Industrial Land Parcels',
    types: [
      'industrial plot',
      'industrial land',
      'midc plot'
    ]
  }
];

/**
 * Returns all synonym types for a given property type string
 */
export function getSynonymsForPropertyType(typeString: string): {
  group: PropertyTypeSynonymGroup | null;
  synonyms: string[];
  isExactGroupMember: boolean;
} {
  const norm = typeString.toLowerCase().trim();
  for (const group of PROPERTY_SYNONYM_GROUPS) {
    if (group.types.some((t) => norm.includes(t) || t.includes(norm))) {
      return {
        group,
        synonyms: group.types,
        isExactGroupMember: true
      };
    }
  }
  return { group: null, synonyms: [norm], isExactGroupMember: false };
}

/**
 * 2. Pune Known Locality Geographic Coordinates (WGS84 Lat/Lon)
 * Accurate centroid coordinates for all major Pune real estate corridors.
 */
export const PUNE_LOCALITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Eastern Corridor
  'kalyani nagar': { lat: 18.5463, lng: 73.9022 },
  'koregaon park': { lat: 18.5362, lng: 73.8958 },
  'viman nagar': { lat: 18.5679, lng: 73.9143 },
  'kharadi': { lat: 18.5514, lng: 73.9348 },
  'magarpatta': { lat: 18.5158, lng: 73.9272 },
  'hadapsar': { lat: 18.5089, lng: 73.9259 },
  'wagholi': { lat: 18.5808, lng: 73.9787 },
  'dhanori': { lat: 18.5912, lng: 73.8863 },
  'tingre nagar': { lat: 18.5772, lng: 73.8845 },
  'mundhwa': { lat: 18.5308, lng: 73.9214 },

  // Western Corridor
  'baner': { lat: 18.5590, lng: 73.7868 },
  'balewadi': { lat: 18.5762, lng: 73.7707 },
  'hinjewadi': { lat: 18.5913, lng: 73.7389 },
  'wakad': { lat: 18.5987, lng: 73.7681 },
  'bavdhan': { lat: 18.5113, lng: 73.7744 },
  'mahalunge': { lat: 18.5714, lng: 73.7533 },
  'pashan': { lat: 18.5414, lng: 73.7925 },
  'aundh': { lat: 18.5580, lng: 73.8075 },
  'punawale': { lat: 18.6318, lng: 73.7441 },
  'tathawade': { lat: 18.6186, lng: 73.7516 },
  'marunji': { lat: 18.6015, lng: 73.7258 },

  // Central Corridor
  'shivajinagar': { lat: 18.5314, lng: 73.8446 },
  'camp': { lat: 18.5152, lng: 73.8786 },
  'sadhu vaswani chowk': { lat: 18.5255, lng: 73.8744 },
  'nana peth': { lat: 18.5165, lng: 73.8682 },
  'bund garden': { lat: 18.5388, lng: 73.8814 },
  'boat club road': { lat: 18.5369, lng: 73.8821 },
  'senapati bapat road': { lat: 18.5338, lng: 73.8315 },
  'model colony': { lat: 18.5348, lng: 73.8398 },
  'deccan gymkhana': { lat: 18.5167, lng: 73.8417 },
  'swargate': { lat: 18.5018, lng: 73.8584 },
  'fc road': { lat: 18.5236, lng: 73.8415 },
  'jm road': { lat: 18.5244, lng: 73.8485 },
  'yerawada': { lat: 18.5529, lng: 73.8797 },

  // Southern Corridor
  'undri': { lat: 18.4623, lng: 73.9168 },
  'nibm': { lat: 18.4754, lng: 73.8962 },
  'nibm road': { lat: 18.4754, lng: 73.8962 },
  'kondhwa': { lat: 18.4789, lng: 73.8907 },
  'wanowrie': { lat: 18.4947, lng: 73.8926 },
  'fatima nagar': { lat: 18.5042, lng: 73.8964 },
  'kothrud': { lat: 18.5074, lng: 73.8077 },
  'erandwane': { lat: 18.5112, lng: 73.8298 },
  'warje': { lat: 18.4827, lng: 73.7997 },
  'karve nagar': { lat: 18.4907, lng: 73.8188 },
  'katraj': { lat: 18.4575, lng: 73.8677 },
  'bibwewadi': { lat: 18.4764, lng: 73.8643 },
  'gultekadi': { lat: 18.4944, lng: 73.8669 },
  'sinhagad road': { lat: 18.4812, lng: 73.8288 },

  // Northern & Industrial Corridor
  'pimpri': { lat: 18.6279, lng: 73.8009 },
  'chinchwad': { lat: 18.6298, lng: 73.7997 },
  'pimple saudagar': { lat: 18.5987, lng: 73.7978 },
  'pimple nilakh': { lat: 18.5802, lng: 73.7925 },
  'bhosari': { lat: 18.6247, lng: 73.8488 },
  'chakan': { lat: 18.7606, lng: 73.8567 },
  'talawade': { lat: 18.6836, lng: 73.7892 },
  'moshi': { lat: 18.6757, lng: 73.8489 },
  'ravet': { lat: 18.6536, lng: 73.7483 },
  'talegaon': { lat: 18.7348, lng: 73.6749 }
};

/**
 * Calculates Haversine distance in kilometres between two coordinate points
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth's mean radius in kilometres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place (e.g. 2.4 km)
  return Math.round(distance * 10) / 10;
}

/**
 * Resolves coordinates for a location string from known Pune coordinates dictionary
 */
export function resolveLocationCoordinates(locationName: string): { lat: number; lng: number } | null {
  if (!locationName) return null;
  const lower = locationName.toLowerCase().trim();

  // 1. Direct match
  if (PUNE_LOCALITY_COORDINATES[lower]) {
    return PUNE_LOCALITY_COORDINATES[lower];
  }

  // 2. Substring or multi-word match
  for (const [name, coords] of Object.entries(PUNE_LOCALITY_COORDINATES)) {
    if (lower.includes(name) || name.includes(lower)) {
      return coords;
    }
  }

  // Default Pune Central Coordinates if generally in Pune
  if (lower.includes('pune')) {
    return { lat: 18.5204, lng: 73.8567 };
  }

  return null;
}
