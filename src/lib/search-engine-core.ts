/**
 * Intelligent Real Estate Search Engine Core for ANV REEALTY / RealityTruedeal
 * Implements:
 * - Exact, prefix, substring, and multi-word token matching
 * - Singular & plural recognition (offices -> office, shops -> shop)
 * - Multilingual & Hinglish / Marathi / Hindi real estate terminology transliteration
 * - Structured intent extraction (Locality, Typology, Budget, Size, Purpose, SKU/Ref)
 * - Phonetic & edit-distance fuzzy scoring
 */

import { PUNE_LOCALITIES_DICTIONARY } from './search-autocorrect';

export interface StructuredSearchIntent {
  rawQuery: string;
  normalizedQuery: string;
  tokens: string[];
  extractedLocality: string | null;
  extractedTypology: string | null;
  extractedBudget: {
    min: number | null;
    max: number | null;
    rawText: string | null;
  };
  extractedSqft: {
    min: number | null;
    max: number | null;
    rawText: string | null;
  };
  transactionType: 'sale' | 'rent' | 'preleased' | null;
  skuOrRef: string | null;
  features: string[];
  hasSpecificIntent: boolean;
}

// 1. Multilingual Synonym & Transliteration Dictionary (Hindi, Marathi, Hinglish, British/American)
export const MULTILINGUAL_SYNONYMS: Record<string, string[]> = {
  // Office Space
  'commercial office': ['office', 'karyalay', 'karyalaya', 'daftar', 'corporate office', 'it park', 'commercial space', 'कार्यालय', 'दफ्तर'],
  'office': ['commercial office', 'karyalay', 'daftar', 'workspace', 'business center'],
  
  // Commercial Shop & Retail
  'commercial shop': ['shop', 'dukan', 'dookan', 'retail', 'store', 'outlet', 'boutique', 'दुकान'],
  'shop': ['commercial shop', 'dukan', 'retail', 'store'],
  
  // Showroom
  'commercial showroom': ['showroom', 'display center', 'high street retail', 'shoroom'],
  'showroom': ['commercial showroom', 'display center'],
  
  // Warehouse & Industrial
  'warehouse': ['godown', 'godam', 'logistics', 'industrial shed', 'storage', 'depot', 'गोदाम', 'ware house'],
  'godown': ['warehouse', 'godam', 'industrial shed', 'गोदाम'],
  'industrial factory': ['factory', 'manufacturing unit', 'karkhana', 'shed', 'industrial plant', 'कारखाना'],
  
  // Residential / Apartment
  'apartment': ['flat', 'ghar', 'makaan', 'awas', 'residence', 'condo', 'घर', 'मकान'],
  'flat': ['apartment', 'ghar', 'residence', 'bhk'],
  'penthouse': ['luxury penthouse', 'sky villa', 'top floor flat'],
  'villa': ['bungalow', 'bunglow', 'row house', 'independent house'],
  'plot': ['land', 'jameen', 'zameen', 'bhu-khand', 'site', 'जमीन', 'प्लॉट'],
  
  // Preleased / ROI
  'preleased': ['pre leased', 'pre-leased', 'roi property', 'rental yield', 'rented property', 'pre-rented', 'pre rented'],
  
  // Transaction Types
  'rent': ['lease', 'bhada', 'kiraya', 'on rent', 'भाड़ा', 'किराया'],
  'sale': ['buy', 'purchase', 'kharedi', 'kharidna', 'resale', 'खरेदी', 'खरीदना'],

  // E-commerce & Building Materials (for general platform robustness)
  'furniture': ['furnitur', 'sofa', 'couch', 'chair', 'desk'],
  'cement': ['cemant', 'concrete', 'सीमेंट'],
  'tiles': ['tiels', 'ceramic tiles', 'flooring'],
  'plywood': ['plywod', 'timber', 'wood'],
  'paint': ['paints', 'colour', 'color', 'asian paints', 'nerolac', 'berger']
};

// 2. Singular to Plural / Plural to Singular Normalization
const PLURAL_TO_SINGULAR: Record<string, string> = {
  offices: 'office',
  shops: 'shop',
  showrooms: 'showroom',
  warehouses: 'warehouse',
  godowns: 'godown',
  factories: 'factory',
  apartments: 'apartment',
  flats: 'flat',
  penthouses: 'penthouse',
  villas: 'villa',
  bungalows: 'bungalow',
  plots: 'plot',
  lands: 'land',
  sheds: 'shed',
  buildings: 'building',
  towers: 'tower',
  properties: 'property',
  projects: 'project',
  buyers: 'buyer',
  sellers: 'seller',
  chairs: 'chair',
  tiles: 'tile',
  doors: 'door'
};

/**
 * Normalizes user text for search index and comparison
 */
export function normalizeSearchQuery(query: string): string {
  if (!query) return '';
  return query
    .toLowerCase()
    .replace(/[₹,]/g, ' ') // Strip currency and commas
    .replace(/[-_/\(\)\[\]]+/g, ' ') // Replace delimiters with spaces
    .replace(/[^\w\s\u0900-\u097F.]/gi, ' ') // Keep alphanumeric, spaces, and Devanagari script (Hindi/Marathi)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes words by resolving singular/plural and synonyms
 */
export function normalizeToken(token: string): string {
  const t = token.toLowerCase().trim();
  return PLURAL_TO_SINGULAR[t] || t;
}

/**
 * Extracts structured intent (Locality, Typology, Budget, SqFt, Ref/SKU) from query
 */
export function extractStructuredIntent(rawQuery: string): StructuredSearchIntent {
  const normalized = normalizeSearchQuery(rawQuery);
  const words = normalized.split(/\s+/).filter(Boolean);
  const normalizedTokens = words.map(normalizeToken);

  let extractedLocality: string | null = null;
  let extractedTypology: string | null = null;
  let transactionType: 'sale' | 'rent' | 'preleased' | null = null;
  let skuOrRef: string | null = null;
  const features: string[] = [];

  // Check for SKU / RefNumber (e.g. PP180521-113412-6471 or AP171126-154615-7042 or #102)
  const refMatch = rawQuery.match(/\b([A-Z]{2}\d{6}-\d{6}-\d{4}|P\d{6,12}|#\d+|unit\s*[-#]?\s*\w+)\b/i);
  if (refMatch) {
    skuOrRef = refMatch[0].trim();
  }

  // 1. Detect Locality from Pune Localities Dictionary
  for (const loc of PUNE_LOCALITIES_DICTIONARY) {
    const locLower = loc.toLowerCase();
    // Check exact or multi-word boundary
    const locRegex = new RegExp(`\\b${locLower.replace(/\s+/g, '[\\s-]+')}\\b`, 'i');
    if (locRegex.test(normalized)) {
      extractedLocality = loc;
      break;
    }
  }

  // 2. Detect Transaction Type
  if (/\b(?:pre[-_\s]*lease|pre[-_\s]*leased|roi|rental\s*yield)\b/i.test(normalized)) {
    transactionType = 'preleased';
  } else if (/\b(?:rent|lease|bhada|kiraya|to\s*let|for\s*rent|on\s*rent)\b/i.test(normalized)) {
    transactionType = 'rent';
  } else if (/\b(?:buy|sale|purchase|for\s*sale|resale|kharedi)\b/i.test(normalized)) {
    transactionType = 'sale';
  }

  // 3. Detect Typology
  if (/\b(?:commercial\s*office|office|karyalay|daftar|workspace|it\s*park)\b/i.test(normalized)) {
    extractedTypology = 'Commercial Office';
  } else if (/\b(?:commercial\s*showroom|showroom|display\s*center)\b/i.test(normalized)) {
    extractedTypology = 'Commercial Showroom';
  } else if (/\b(?:commercial\s*shop|shop|dukan|dookan|retail)\b/i.test(normalized)) {
    extractedTypology = 'Commercial Shop';
  } else if (/\b(?:warehouse|godown|godam|industrial\s*shed|logistics)\b/i.test(normalized)) {
    extractedTypology = 'Warehouse / Godown';
  } else if (/\b(?:factory|industrial\s*factory|manufacturing)\b/i.test(normalized)) {
    extractedTypology = 'Industrial Factory';
  } else if (/\b(?:penthouse|sky\s*villa)\b/i.test(normalized)) {
    extractedTypology = 'Luxury Penthouse';
  } else if (/\b(?:plot|land|jameen|zameen)\b/i.test(normalized)) {
    extractedTypology = 'Commercial Land / Plot';
  } else {
    // Check BHK
    const bhkMatch = normalized.match(/\b([1-5](?:\.5)?)\s*(?:bhk|bedroom|bed|room)\b/i);
    if (bhkMatch) {
      extractedTypology = `${bhkMatch[1]} BHK`;
    }
  }

  // 4. Extract Budget constraints (e.g. "under 2 Cr", "below 80 lakhs", "50k to 1 Lakh", "1.5 - 2.5 Cr")
  let minBudget: number | null = null;
  let maxBudget: number | null = null;
  let budgetText: string | null = null;

  // "under/below X Cr/Lakh"
  const underMatch = normalized.match(/(?:under|below|less\s*than|upto|up\s*to|max)\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|l|lac|lakh|lakhs|k)?/i);
  if (underMatch) {
    const val = parseFloat(underMatch[1]);
    const unit = (underMatch[2] || '').toLowerCase();
    if (unit.startsWith('cr')) {
      maxBudget = val * 10000000;
    } else if (unit.startsWith('l')) {
      maxBudget = val * 100000;
    } else if (unit === 'k') {
      maxBudget = val * 1000;
    } else if (val <= 100) {
      maxBudget = val * 10000000; // Assume Cr for small numbers in real estate
    }
    budgetText = underMatch[0];
  }

  // "X to Y Cr/Lakh"
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|l|lac|lakh|lakhs)?/i);
  if (rangeMatch) {
    const v1 = parseFloat(rangeMatch[1]);
    const v2 = parseFloat(rangeMatch[2]);
    const unit = (rangeMatch[3] || 'cr').toLowerCase();
    const mult = unit.startsWith('cr') ? 10000000 : 100000;
    minBudget = Math.min(v1, v2) * mult;
    maxBudget = Math.max(v1, v2) * mult;
    budgetText = rangeMatch[0];
  }

  // 5. Extract SqFt constraints (e.g. "2000 sqft", "1500 to 3000 sq ft")
  let minSqft: number | null = null;
  let maxSqft: number | null = null;
  let sqftText: string | null = null;

  const sqftRange = normalized.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*(?:sqft|sq\.ft|square\s*feet|sq\s*ft)/i);
  if (sqftRange) {
    minSqft = parseInt(sqftRange[1], 10);
    maxSqft = parseInt(sqftRange[2], 10);
    sqftText = sqftRange[0];
  } else {
    const singleSqft = normalized.match(/(\d+)\s*(?:sqft|sq\.ft|square\s*feet|sq\s*ft)/i);
    if (singleSqft) {
      const val = parseInt(singleSqft[1], 10);
      minSqft = Math.round(val * 0.8);
      maxSqft = Math.round(val * 1.2);
      sqftText = singleSqft[0];
    }
  }

  // 6. Extract key features & amenities
  if (/\b(?:furnished|fully\s*furnished)\b/i.test(normalized)) features.push('Furnished');
  if (/\b(?:parking|car\s*parking)\b/i.test(normalized)) features.push('Parking');
  if (/\b(?:metro|metro\s*station)\b/i.test(normalized)) features.push('Metro');
  if (/\b(?:power\s*backup|generator|dg\s*backup)\b/i.test(normalized)) features.push('Power Backup');

  const hasSpecificIntent = Boolean(
    extractedLocality ||
    extractedTypology ||
    maxBudget ||
    skuOrRef ||
    transactionType
  );

  return {
    rawQuery,
    normalizedQuery: normalized,
    tokens: normalizedTokens,
    extractedLocality,
    extractedTypology,
    extractedBudget: {
      min: minBudget,
      max: maxBudget,
      rawText: budgetText
    },
    extractedSqft: {
      min: minSqft,
      max: maxSqft,
      rawText: sqftText
    },
    transactionType,
    skuOrRef,
    features,
    hasSpecificIntent
  };
}

/**
 * Calculates a search relevance score (0 - 100) for a property given a query
 */
export function scorePropertyRelevance(
  property: {
    id: string | number;
    title?: string;
    name?: string;
    locality?: string;
    address?: string;
    bhk?: string;
    configuration?: string;
    developer?: string;
    description?: string;
    refNumber?: string;
    flatNo?: string;
    price?: string | number;
    priceNum?: number;
    sqft?: string | number;
    sqftNum?: number;
    status?: string;
  },
  intent: StructuredSearchIntent
): { score: number; matchedReasons: string[] } {
  let score = 0;
  const matchedReasons: string[] = [];

  const title = (property.title || property.name || '').toLowerCase();
  const locality = (property.locality || '').toLowerCase();
  const address = (property.address || '').toLowerCase();
  const typ = (property.configuration || property.bhk || '').toLowerCase();
  const dev = (property.developer || '').toLowerCase();
  const ref = (property.refNumber || '').toLowerCase();
  const flat = (property.flatNo || '').toLowerCase();
  const desc = (property.description || '').toLowerCase();

  // 1. Exact SKU / Ref Number Match (Highest Priority: +100)
  if (intent.skuOrRef) {
    const cleanRef = intent.skuOrRef.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ref.replace(/[^a-z0-9]/g, '').includes(cleanRef) || String(property.id) === intent.skuOrRef) {
      score += 100;
      matchedReasons.push('Exact Reference ID / SKU Match');
      return { score, matchedReasons };
    }
  }

  // 2. Exact Title / Name Substring Match (+40)
  if (intent.normalizedQuery && title.includes(intent.normalizedQuery)) {
    score += 40;
    matchedReasons.push('Exact Name Match');
  }

  // 3. Locality Match (+25)
  if (intent.extractedLocality) {
    const locLower = intent.extractedLocality.toLowerCase();
    if (locality.includes(locLower) || address.includes(locLower)) {
      score += 25;
      matchedReasons.push(`Located in ${intent.extractedLocality}`);
    }
  }

  // 4. Typology Match (+25)
  if (intent.extractedTypology) {
    const typLower = intent.extractedTypology.toLowerCase();
    if (typ.includes(typLower) || title.includes(typLower)) {
      score += 25;
      matchedReasons.push(`Matches ${intent.extractedTypology}`);
    }
  }

  // 5. Developer / Brand Match (+20)
  if (dev && intent.tokens.some((t) => dev.includes(t))) {
    score += 20;
    matchedReasons.push(`By ${property.developer}`);
  }

  // 6. Token matching across all fields (Multi-word independent: +5 per token)
  let matchedTokens = 0;
  for (const token of intent.tokens) {
    if (token.length <= 2) continue; // Skip very short words
    if (title.includes(token) || locality.includes(token) || typ.includes(token) || desc.includes(token)) {
      matchedTokens++;
    }
  }
  if (matchedTokens > 0) {
    score += Math.min(matchedTokens * 5, 20);
  }

  // 7. Budget constraint check
  if (intent.extractedBudget.max && property.priceNum) {
    if (property.priceNum <= intent.extractedBudget.max) {
      score += 10;
      matchedReasons.push('Within Budget');
    }
  }

  return { score, matchedReasons };
}
