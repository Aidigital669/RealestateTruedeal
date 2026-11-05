/**
 * Intelligent Autocorrect & Autofill (Autocomplete) Engine for ANV REEALTY
 * Provides instant typo tolerance (Levenshtein distance), phonetic mapping,
 * and multi-category typeahead suggestions (Locations, Typologies, Developers, Properties).
 */

export interface SearchSuggestion {
  id: string;
  type: 'location' | 'typology' | 'developer' | 'property';
  label: string;
  value: string;
  subtitle?: string;
  badge: string;
  matchedText?: string;
}

export interface AutocorrectResult {
  hasCorrection: boolean;
  originalQuery: string;
  correctedQuery: string;
  replacedTerms: Array<{ original: string; corrected: string }>;
}

// 1. Core Pune Localities & Landmarks
export const PUNE_LOCALITIES_DICTIONARY: string[] = [
  'Koregaon Park',
  'Baner',
  'Balewadi',
  'Kalyani Nagar',
  'Bavdhan',
  'Mahalunge',
  'Shivajinagar',
  'Kharadi',
  'Hinjewadi',
  'Wakad',
  'Talawade',
  'Gultekadi',
  'Undri',
  'Viman Nagar',
  'Magarpatta',
  'Hadapsar',
  'Aundh',
  'Kothrud',
  'Senapati Bapat Road',
  'Boat Club Road',
  'Model Colony',
  'Camp',
  'Bund Garden',
  'Pashan',
  'Pimple Saudagar',
  'Pimple Nilakh',
  'Chinchwad',
  'Pimpri',
  'Ravet',
  'Moshi',
  'Chakan',
  'Bhosari',
  'Dhanori',
  'Wagholi',
  'NIBM Road',
  'Kondhwa',
  'Wanowrie',
  'Fatima Nagar',
  'Camp',
  'Swargate',
  'Bibwewadi',
  'Katraj',
  'Dhankawadi',
  'Sinhagad Road',
  'Warje',
  'Karve Nagar',
  'Erandwane',
  'Deccan Gymkhana',
  'F.C. Road',
  'J.M. Road',
  'Yerawada',
  'Tingre Nagar',
  'Loni Kalbhor',
  'Uruli Kanchan',
  'Phursungi',
  'Saswad Road',
  'Tathawade',
  'Punawale',
  'Marunji',
  'Maan'
];

// 2. Real Estate Typologies & Configurations
export const REAL_ESTATE_TYPOLOGIES: string[] = [
  'Office Space',
  'Commercial Office',
  'Commercial Shop',
  'Commercial Showroom',
  'Hospital / Healthcare',
  'Industrial Factory',
  'Warehouse / Godown',
  'Preleased Property',
  '1 BHK',
  '2 BHK',
  '3 BHK',
  '4 BHK',
  '4.5+ BHK Penthouse',
  'Luxury Penthouse',
  'Studio Apartment',
  'Commercial Land / Plot',
  'Residential Plot'
];

// 3. Known Top Developers
export const PUNE_DEVELOPERS: string[] = [
  'Godrej Properties',
  'Panchshil Realty',
  'VTP Realty',
  'Kolte Patil Developers',
  'Rohan Builders',
  'BramhaCorp',
  'Marvel Realtors',
  'Gera Developments',
  'Pride Group',
  'Kumar Properties',
  'Kundan Spaces',
  'Supreme Universal',
  'Bhandari Associates',
  'Consolidated Hoists',
  'Lodha Group',
  'Shapoorji Pallonji',
  'Kasturi Housing',
  'Amanora',
  'Sobha Limited',
  'Nyati Group',
  'Paranjape Schemes',
  'Majestique Landmarks'
];

// 4. Common Phonetic & Misspelling Dictionary (Direct O(1) Lookup)
export const COMMON_TYPO_MAPPINGS: Record<string, string> = {
  // Hinjewadi variants
  hinjwadi: 'Hinjewadi',
  hinjawadi: 'Hinjewadi',
  hinjewadi: 'Hinjewadi',
  hinjewdi: 'Hinjewadi',
  hinjiwadi: 'Hinjewadi',
  hinjweadi: 'Hinjewadi',
  hinjewad: 'Hinjewadi',

  // Koregaon Park variants
  korgaon: 'Koregaon Park',
  koregon: 'Koregaon Park',
  kargon: 'Koregaon Park',
  koregao: 'Koregaon Park',
  korgoan: 'Koregaon Park',
  korgon: 'Koregaon Park',
  'koregaon prk': 'Koregaon Park',
  'koregon park': 'Koregaon Park',
  'korgaon park': 'Koregaon Park',
  'koregaon pakr': 'Koregaon Park',

  // Baner variants
  banr: 'Baner',
  baaner: 'Baner',
  bannar: 'Baner',
  banerr: 'Baner',

  // Balewadi variants
  balwadi: 'Balewadi',
  balkwadi: 'Balewadi',
  balewdi: 'Balewadi',
  balewady: 'Balewadi',

  // Wakad variants
  waakad: 'Wakad',
  wakadd: 'Wakad',
  wakda: 'Wakad',
  vakkad: 'Wakad',
  wakkad: 'Wakad',

  // Viman Nagar variants
  'viman nagr': 'Viman Nagar',
  vimannagar: 'Viman Nagar',
  vimannagr: 'Viman Nagar',
  'veeman nagar': 'Viman Nagar',
  vimanagr: 'Viman Nagar',

  // Kharadi variants
  khardi: 'Kharadi',
  karadi: 'Kharadi',
  kharaddi: 'Kharadi',
  khraadi: 'Kharadi',

  // Kalyani Nagar variants
  kalyani: 'Kalyani Nagar',
  'kalyani nagr': 'Kalyani Nagar',
  kalyaninagar: 'Kalyani Nagar',
  kalyaninagr: 'Kalyani Nagar',

  // Magarpatta variants
  magarpatacity: 'Magarpatta',
  magarpatta: 'Magarpatta',
  magarpata: 'Magarpatta',
  magarpat: 'Magarpatta',

  // Talawade / Gultekadi / Undri
  talwade: 'Talawade',
  talawde: 'Talawade',
  gultekdi: 'Gultekadi',
  gultkadi: 'Gultekadi',
  undry: 'Undri',
  undr: 'Undri',
  bavdhan: 'Bavdhan',
  bavadhan: 'Bavdhan',
  bavdan: 'Bavdhan',
  mahalunge: 'Mahalunge',
  mahalungey: 'Mahalunge',
  shivajinagar: 'Shivajinagar',
  'shivaji nagar': 'Shivajinagar',
  'shivajinagr': 'Shivajinagar',

  // Real estate typologies & words
  comercial: 'Commercial',
  commercal: 'Commercial',
  comercl: 'Commercial',
  comercile: 'Commercial',
  offce: 'Office',
  ofice: 'Office',
  ofic: 'Office',
  offices: 'Office',
  penthaus: 'Penthouse',
  penthoues: 'Penthouse',
  penthose: 'Penthouse',
  showrom: 'Showroom',
  showromm: 'Showroom',
  shoroom: 'Showroom',
  warehous: 'Warehouse',
  warehoues: 'Warehouse',
  godown: 'Warehouse',
  industril: 'Industrial',
  industral: 'Industrial',
  hospitl: 'Hospital',
  hopital: 'Hospital',
  healtcare: 'Healthcare',
  prelease: 'Preleased',
  preleased: 'Preleased',
  preleasedd: 'Preleased',
  appartment: 'Apartment',
  apartmnt: 'Apartment',
  residental: 'Residential',
  residntial: 'Residential',

  // Developers
  godrj: 'Godrej',
  godrej: 'Godrej',
  panchsheel: 'Panchshil',
  panchshil: 'Panchshil',
  panchshill: 'Panchshil',
  koltepatil: 'Kolte Patil',
  'kolte patil': 'Kolte Patil',
  bramha: 'BramhaCorp',
  bramhacorp: 'BramhaCorp',
  rohan: 'Rohan Builders',
  lodha: 'Lodha Group'
};

/**
 * Computes exact Levenshtein edit distance between string a and b.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const aLen = a.length;
  const bLen = b.length;
  const d: number[][] = [];

  for (let i = 0; i <= aLen; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= bLen; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      const cost = a.charAt(i - 1).toLowerCase() === b.charAt(j - 1).toLowerCase() ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deletion
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[aLen][bLen];
}

/**
 * Searches dictionary for the closest word matching input word within maxDistance.
 */
export function findClosestTypo(word: string, dictionary: string[], maxDistance = 2): string | null {
  const cleanWord = word.trim().toLowerCase();
  if (cleanWord.length < 3) return null;

  // Direct fast phonetic dictionary check
  if (COMMON_TYPO_MAPPINGS[cleanWord]) {
    return COMMON_TYPO_MAPPINGS[cleanWord];
  }

  let bestMatch: string | null = null;
  let minDistance = Infinity;

  for (const entry of dictionary) {
    const entryLower = entry.toLowerCase();
    if (entryLower === cleanWord) {
      return null; // Already exact match, no correction needed
    }

    const dist = getLevenshteinDistance(cleanWord, entryLower);
    const allowedDist = cleanWord.length <= 4 ? 1 : maxDistance;

    if (dist <= allowedDist && dist < minDistance) {
      minDistance = dist;
      bestMatch = entry;
    }
  }

  return bestMatch;
}

/**
 * Analyzes a full query string, checks for typos in words or phrases,
 * and returns the autocorrected suggestion if any typo was identified.
 */
export function detectQueryAutocorrect(
  rawQuery: string,
  extraDictionary: string[] = []
): AutocorrectResult {
  const trimmed = rawQuery.trim();
  if (!trimmed || trimmed.length < 3) {
    return {
      hasCorrection: false,
      originalQuery: rawQuery,
      correctedQuery: rawQuery,
      replacedTerms: []
    };
  }

  const fullDictionary = Array.from(
    new Set([
      ...PUNE_LOCALITIES_DICTIONARY,
      ...REAL_ESTATE_TYPOLOGIES,
      ...PUNE_DEVELOPERS,
      ...extraDictionary
    ])
  );

  const lowerRaw = trimmed.toLowerCase();

  // 1. Check full phrase or 2-word phrase mappings in COMMON_TYPO_MAPPINGS
  for (const [typo, replacement] of Object.entries(COMMON_TYPO_MAPPINGS)) {
    if (typo.includes(' ') && lowerRaw.includes(typo)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      if (regex.test(trimmed)) {
        const corrected = trimmed.replace(regex, replacement);
        return {
          hasCorrection: true,
          originalQuery: rawQuery,
          correctedQuery: corrected,
          replacedTerms: [{ original: typo, corrected: replacement }]
        };
      }
    }
  }

  // 2. Tokenize words and check each word against dictionary
  const words = trimmed.split(/(\s+)/); // Preserves spacing
  const replacedTerms: Array<{ original: string; corrected: string }> = [];
  let hasCorrection = false;

  const correctedTokens = words.map((token) => {
    if (/^\s+$/.test(token) || token.length < 3) return token;
    // Strip punctuation for matching
    const cleanToken = token.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanToken.length < 3) return token;

    // Check direct typo map
    const mapped = COMMON_TYPO_MAPPINGS[cleanToken.toLowerCase()];
    if (mapped && mapped.toLowerCase() !== cleanToken.toLowerCase()) {
      hasCorrection = true;
      replacedTerms.push({ original: token, corrected: mapped });
      return mapped;
    }

    // Check Levenshtein fuzzy match
    const closest = findClosestTypo(cleanToken, fullDictionary, 2);
    if (closest && closest.toLowerCase() !== cleanToken.toLowerCase()) {
      hasCorrection = true;
      replacedTerms.push({ original: token, corrected: closest });
      return closest;
    }

    return token;
  });

  const correctedQuery = correctedTokens.join('');

  return {
    hasCorrection: hasCorrection && correctedQuery.toLowerCase() !== rawQuery.toLowerCase().trim(),
    originalQuery: rawQuery,
    correctedQuery: hasCorrection ? correctedQuery : rawQuery,
    replacedTerms
  };
}

/**
 * Generates instant multi-category search suggestions (Locations, Typologies, Developers, Properties)
 * along with "Did you mean?" autocorrect suggestions.
 */
export function generateSearchSuggestions(
  rawQuery: string,
  options: {
    properties?: Array<{ id: string; name: string; locality?: string; developer?: string; bhk?: string }>;
    localities?: string[];
    developers?: string[];
    typologies?: Array<{ value: string; label: string }>;
    limit?: number;
  } = {}
): {
  didYouMean: string | null;
  hasCorrection: boolean;
  suggestions: SearchSuggestion[];
} {
  const queryText = (rawQuery || '').trim();
  if (!queryText || queryText.length < 2) {
    return { didYouMean: null, hasCorrection: false, suggestions: [] };
  }

  const queryLower = queryText.toLowerCase();
  const limit = options.limit || 8;

  // 1. Run Autocorrect Detection
  const allKnownTerms = [
    ...(options.localities || PUNE_LOCALITIES_DICTIONARY),
    ...(options.developers || PUNE_DEVELOPERS),
    ...(options.typologies ? options.typologies.map((t) => t.label) : REAL_ESTATE_TYPOLOGIES)
  ];
  const autocorrect = detectQueryAutocorrect(queryText, allKnownTerms);

  const didYouMean = autocorrect.hasCorrection ? autocorrect.correctedQuery : null;
  const effectiveQuery = (didYouMean || queryText).toLowerCase();

  const suggestions: SearchSuggestion[] = [];
  const seenLabels = new Set<string>();

  const addSuggestion = (s: SearchSuggestion) => {
    const key = `${s.type}:${s.value.toLowerCase()}`;
    if (!seenLabels.has(key) && suggestions.length < limit) {
      seenLabels.add(key);
      suggestions.push(s);
    }
  };

  // 2. Match Localities / Locations
  const localities = options.localities && options.localities.length > 0
    ? options.localities
    : PUNE_LOCALITIES_DICTIONARY;

  localities.forEach((loc) => {
    if (loc.toLowerCase().includes(queryLower) || (didYouMean && loc.toLowerCase().includes(effectiveQuery))) {
      addSuggestion({
        id: `loc-${loc}`,
        type: 'location',
        label: loc,
        value: loc,
        subtitle: 'Pune, Maharashtra',
        badge: 'Locality'
      });
    }
  });

  // 3. Match Typologies / Configurations
  const typologies = options.typologies && options.typologies.length > 0
    ? options.typologies.map((t) => t.label)
    : REAL_ESTATE_TYPOLOGIES;

  typologies.forEach((typ) => {
    if (typ.toLowerCase().includes(queryLower) || (didYouMean && typ.toLowerCase().includes(effectiveQuery))) {
      addSuggestion({
        id: `typ-${typ}`,
        type: 'typology',
        label: typ,
        value: typ,
        subtitle: 'Property Typology',
        badge: 'Typology'
      });
    }
  });

  // 4. Match Developers
  const developers = options.developers && options.developers.length > 0
    ? options.developers
    : PUNE_DEVELOPERS;

  developers.forEach((dev) => {
    if (dev.toLowerCase().includes(queryLower) || (didYouMean && dev.toLowerCase().includes(effectiveQuery))) {
      addSuggestion({
        id: `dev-${dev}`,
        type: 'developer',
        label: dev,
        value: dev,
        subtitle: 'Verified Developer in Pune',
        badge: 'Developer'
      });
    }
  });

  // 5. Match Specific Properties
  if (options.properties && options.properties.length > 0) {
    options.properties.forEach((p) => {
      const pName = p.name || '';
      if (pName.toLowerCase().includes(queryLower) || (didYouMean && pName.toLowerCase().includes(effectiveQuery))) {
        addSuggestion({
          id: `prop-${p.id}`,
          type: 'property',
          label: pName,
          value: pName,
          subtitle: `${p.locality ? `${p.locality} • ` : ''}${p.bhk || ''}`,
          badge: 'Property'
        });
      }
    });
  }

  return {
    didYouMean,
    hasCorrection: autocorrect.hasCorrection,
    suggestions
  };
}

