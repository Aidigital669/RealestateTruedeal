/**
 * Browser- & Server-safe 8-Field Real Estate Requirement Parser.
 * Extracts structured filters matching all 8 core database search fields:
 * 1. Transaction Type (listingType / Lease_Sale)
 * 2. Property Type (PropertyType.name / configuration)
 * 3. Transaction Classification (transactionClassification / TransactionName)
 * 4. Locality (Location.name / address)
 * 5. City (dossierData CityName / Location.city)
 * 6. Built-up Area (builtupArea / BuiltAreaName)
 * 7. Carpet Area (carpetArea / CarpetAreaName)
 * 8. Expected Price (price / rent / ExpectedPrice / RentPM)
 */

import { KNOWN_PUNE_LOCALITIES, parseBudgetAmounts } from './property-matching';

export interface AreaBounds {
  min: number | null;
  max: number | null;
}

export interface EightFieldCriteria {
  rawQuery: string;
  transactionType: 'Sale' | 'Rent' | 'Joint Development' | null;
  propertyTypes: string[];
  bhkNums: number[];
  transactionClassification: string | null;
  localities: string[];
  cities: string[];
  builtupArea: AreaBounds;
  carpetArea: AreaBounds;
  genericArea: AreaBounds;
  expectedPrice: { min: number | null; max: number | null };
  keywords: string[];
  hasAnyConstraint: boolean;
}

export const KNOWN_CITIES = [
  'navi mumbai',
  'mumbai harbour line',
  'mumbai bandra',
  'mumbai central suburbs',
  'mumbai beyond thane',
  'mumbai south',
  'mumbai',
  'pune(east)',
  'pune east',
  'pune(west)',
  'pune west',
  'pune(north)',
  'pune north',
  'pune(south)',
  'pune south',
  'east pune',
  'west pune',
  'north pune',
  'south pune',
  'pune(all)',
  'pune',
  'north goa',
  'margao',
  'goa',
  'dubai',
  'nashik',
  'nagpur',
  'bhusawal',
  'satara',
  'karjat',
  'aurangabad',
  'raipur',
  'ratnagiri',
  'satara district',
  'delhi',
  'thane',
  'pcmc'
];

const EXTRA_DB_LOCALITIES = [
  'koregaon park annex',
  'mundhwa',
  'nibm road',
  'nibm',
  'chakan',
  'pimpri',
  'bund garden',
  'undri',
  'wagholi',
  'wanowrie',
  'bibwewadi',
  'camp',
  'peth'
];

export const CLASSIFICATION_RULES: { value: string; patterns: RegExp[] }[] = [
  {
    value: 'Pre Lease/Pre Rented',
    patterns: [/\b(?:pre[-_\s]*leased?|pre[-_\s]*leases?|pre[-_\s]*rent(?:ed)?|roi\s*property|rental\s*yield|tenanted)\b/i]
  },
  {
    value: 'Pre Launch',
    patterns: [
      /\b(?:pre[-_\s]*launch(?:ed)?|prelaunch(?:ed)?|newly\s*launch(?:ed)?|new\s*launch(?:ed)?|upcoming|launching\s*soon|ready[-\s]*to[-\s]*move|early\s*bird|eoi)\b/i
    ]
  },
  {
    value: 'Resale',
    patterns: [/\b(?:resale|re-sale|secondary\s*market|second\s*hand)\b/i]
  },
  {
    value: 'Individual/Company',
    patterns: [/\b(?:individual\s*\/\s*company|company\s*owned|corporate\s*owned)\b/i]
  },
  {
    value: 'Group Booking',
    patterns: [/\b(?:group\s*booking|bulk\s*booking|bulk\s*units?)\b/i]
  },
  {
    value: 'Individual',
    patterns: [/\bindividual\b/i]
  },
  {
    value: 'New',
    patterns: [
      /^\s*(?:new|latest|fresh|newly)\s*$/i,
      /\b(?:latest|fresh|newly|new\s*(?:project|projects|booking|launch|property|properties|office|shop|showroom|flat|apartment|villa|space|unit|listing)|brand\s*new|primary\s*sale)\b/i
    ]
  }
];

const PROPERTY_TYPE_SYNONYMS: { label: string; dbTerms: string[]; regex: RegExp }[] = [
  {
    label: 'Office Space',
    dbTerms: ['office space', 'commercial office', 'commercial office/space', 'office/space', 'office (new)', 'office (preleased)', 'office', 'it park'],
    regex: /\b(?:office\s*(?:\/|\s)*space|commercial\s*office(?:\s*\/\s*space)?|offices?|it\s*park|tech\s*park|workspace|corporate\s*(?:office|space)|coworking|co-working)\b/i
  },
  {
    label: 'Shop/Showroom',
    dbTerms: ['shop/showroom', 'showroom', 'shop', 'retail', 'showroom (preleased)', 'showroom (new)', 'shop (new)'],
    regex: /\b(?:showrooms?|shops?|retail(?:\s*space)?|boutique|store)\b/i
  },
  {
    label: 'Residential Apartment',
    dbTerms: ['residential apartment', 'apartment', 'flat'],
    regex: /\b(?:residential\s*apartments?|apartments?|flats?|residences?)\b/i
  },
  {
    label: 'Residential Bunglow',
    dbTerms: ['residential bunglow', 'bunglow', 'bungalow', 'villa', 'row house'],
    regex: /\b(?:bungalows?|bunglows?|villas?|row\s*houses?)\b/i
  },
  {
    label: 'Residential Duplex',
    dbTerms: ['residential duplex', 'duplex'],
    regex: /\bduplex(?:es)?\b/i
  },
  {
    label: 'Penthouse',
    dbTerms: ['penthouse', 'sky villa', 'sky suite'],
    regex: /\b(?:penthouses?|sky\s*villas?|sky\s*suites?)\b/i
  },
  {
    label: 'Residential/Commercial Land/Plot',
    dbTerms: ['land/plot', 'plot', 'land'],
    regex: /\b(?:plots?|lands?|open\s*land|na\s*plot)\b/i
  },
  {
    label: 'Warehouse',
    dbTerms: ['warehouse', 'godown'],
    regex: /\b(?:warehouses?|godowns?|storage|logistics\s*park)\b/i
  },
  {
    label: 'Industrial Factory',
    dbTerms: ['industrial factory', 'factory'],
    regex: /\b(?:factory|factories)\b/i
  },
  {
    label: 'Industrial Shed/Gala',
    dbTerms: ['industrial shed/gala', 'shed', 'gala'],
    regex: /\b(?:industrial\s*shed|sheds?|galas?)\b/i
  },
  {
    label: 'Industrial Manufacturing',
    dbTerms: ['industrial manufacturing', 'manufacturing'],
    regex: /\b(?:industrial(?:\s*manufacturing)?|manufacturing(?:\s*unit)?)\b/i
  },
  {
    label: 'Hospital',
    dbTerms: ['hospital', 'hospital (new)', 'clinic', 'medical'],
    regex: /\b(?:hospitals?|clinics?|medical\s*(?:center|centre|space)?|healthcare|nursing\s*home|diagnostic)\b/i
  },
  {
    label: 'Restaurant',
    dbTerms: ['restaurant', 'restaurant (new)', 'cafe'],
    regex: /\b(?:restaurants?|cafes?|coffee\s*shops?|bistro|dining|food\s*court|f&b|lounge|bar)\b/i
  },
  {
    label: 'Hotel / Resort',
    dbTerms: ['hotel / resort', 'hotel', 'resort'],
    regex: /\b(?:hotels?|resorts?|hospitality)\b/i
  },
  {
    label: 'Commercial Built to Suit',
    dbTerms: ['commercial built to suit', 'built to suit', 'bts'],
    regex: /\b(?:built\s*to\s*suit|build\s*to\s*suit|\bbts\b)\b/i
  }
];

const EXTRA_STOP_WORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'a', 'an', 'the', 'in', 'at', 'on', 'by', 'for',
  'of', 'to', 'from', 'with', 'and', 'or', 'is', 'are', 'was', 'have', 'want', 'need', 'looking',
  'look', 'search', 'find', 'show', 'give', 'get', 'please', 'required', 'requirement', 'requirements',
  'person', 'his', 'her', 'their', 'property', 'properties', 'project', 'projects', 'listing', 'listings', 'space', 'unit',
  'buyer', 'buyers', 'seller', 'sellers', 'client', 'clients', 'lead', 'leads', 'mandate', 'mandates', 'data', 'list', 'record', 'records',
  'units', 'available', 'area', 'areas', 'size', 'built', 'builtup', 'buildup', 'build', 'up', 'carpet',
  'super', 'sqft', 'sq', 'ft', 'feet', 'price', 'expected', 'budget', 'cost', 'under', 'below',
  'above', 'over', 'between', 'from', 'upto', 'within', 'min', 'max', 'more', 'less', 'than', 'approx',
  'around', 'transaction', 'type', 'classification', 'class', 'locality', 'city', 'location',
  'buy', 'buying', 'purchase', 'sale', 'sell', 'selling', 'rent', 'rental', 'renting', 'rented', 'lease', 'leases',
  'leasing', 'leased', 'joint', 'development', 'jv', 'new', 'newly', 'resale', 'pre', 'launch', 'launched', 'launching', 'prelaunch', 'prelaunched', 'upcoming', 'ready', 'move', 'soon',
  'preleased', 'prelease', 'preleases', 'prerent', 'prerented', 'rerented', 'tenanted', 'yield', 'roi',
  'eoi', 'early', 'bird', 'fresh', 'latest', 'brand', 'secondary', 'market', 'second', 'hand',
  'individual', 'company', 'corporate', 'owned', 'group', 'booking', 'bulk',
  'cr', 'crore', 'crores', 'lakh', 'lakhs', 'lac', 'lacs', 'th', 'thousand', 'k', 'rs', 'inr',
  'month', 'monthly', 'per', 'office', 'offices', 'commercial', 'commercials', 'residential',
  'shop', 'shops', 'showroom', 'showrooms', 'retail', 'boutique', 'store',
  'apartment', 'apartments', 'flat', 'flats', 'residences', 'residence',
  'villa', 'villas', 'bungalow', 'bungalows', 'bunglow', 'bunglows', 'row', 'house',
  'duplex', 'duplexes', 'penthouse', 'penthouses', 'sky', 'suite', 'suites',
  'warehouse', 'warehouses', 'godown', 'godowns', 'storage', 'logistics',
  'factory', 'factories', 'industrial', 'shed', 'sheds', 'gala', 'galas', 'manufacturing',
  'hospital', 'hospitals', 'clinic', 'clinics', 'medical', 'healthcare', 'diagnostic',
  'restaurant', 'restaurants', 'cafe', 'cafes', 'dining', 'hotel', 'hotels', 'resort', 'resorts',
  'plot', 'plots', 'land', 'lands', 'built', 'suit', 'bts', 'coworking', 'tech', 'park',
  'saleable', 'superarea', 'builtuparea', 'carpetarea', 'bhk', 'bed', 'bedroom', 'bedrooms',
  'pune', 'mumbai', 'dubai', 'goa', 'nashik', 'nagpur', 'navi', 'pcmc', 'bhusawal', 'margao',
  'delhi', 'thane', 'satara', 'karjat', 'aurangabad', 'raipur', 'ratnagiri',
  'east', 'west', 'north', 'south', 'all'
]);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseLabeledArea(lower: string, labelPattern: string): AreaBounds {
  // Pattern A: "built-up 1500 to 2500 sqft" / "carpet area 1200-1800 sq ft"
  const afterRange = lower.match(
    new RegExp(
      `(?:${labelPattern})\\s*(?:area)?\\s*(?:of|:|between|from)?\\s*(\\d[\\d,]*(?:\\.\\d+)?)\\s*(?:to|-|–|and)\\s*(\\d[\\d,]*(?:\\.\\d+)?)\\s*(?:sq\\.?\\s*ft|sqft|sq\\s*feet)?`,
      'i'
    )
  );
  if (afterRange) {
    const n1 = parseFloat(afterRange[1].replace(/,/g, ''));
    const n2 = parseFloat(afterRange[2].replace(/,/g, ''));
    if (!isNaN(n1) && !isNaN(n2) && n1 > 0 && n2 > 0) {
      return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
    }
  }

  // Pattern B: "1500 to 2500 sqft built-up area"
  const beforeRange = lower.match(
    new RegExp(
      `(\\d[\\d,]*(?:\\.\\d+)?)\\s*(?:to|-|–|and)\\s*(\\d[\\d,]*(?:\\.\\d+)?)\\s*(?:sq\\.?\\s*ft|sqft|sq\\s*feet)?\\s*(?:${labelPattern})`,
      'i'
    )
  );
  if (beforeRange) {
    const n1 = parseFloat(beforeRange[1].replace(/,/g, ''));
    const n2 = parseFloat(beforeRange[2].replace(/,/g, ''));
    if (!isNaN(n1) && !isNaN(n2) && n1 > 0 && n2 > 0) {
      return { min: Math.min(n1, n2), max: Math.max(n1, n2) };
    }
  }

  // Pattern C: min/max qualifier + label + single number ("above 2000 builtup", "under 1500 sqft carpet", "carpet 1200 sqft", "2000 sqft carpet area")
  // Never match currency numbers like "carpet area under 2 cr" or "₹1.5 lakh"
  const noCurr = '(?!\\s*(?:cr|crore|crores|lakh|lakhs|lac|lacs|th|thousand|k)\\b)';
  const singleBefore = lower.match(
    new RegExp(
      `(?:(above|over|min(?:imum)?|more\\s*than|>=?)|(under|below|max(?:imum)?|upto|up\\s*to|less\\s*than|<=?))?\\s*(?:(?!(?:rs\\.?|₹|inr)\\s*))(\\d[\\d,]*(?:\\.\\d+)?)${noCurr}\\s*(?:sq\\.?\\s*ft|sqft|sq\\s*feet)?\\s*(?:${labelPattern})\\b`,
      'i'
    )
  );
  const singleAfter = lower.match(
    new RegExp(
      `(?:(above|over|min(?:imum)?|more\\s*than|>=?)|(under|below|max(?:imum)?|upto|up\\s*to|less\\s*than|<=?))?\\s*(?:${labelPattern})\\s*(?:area)?\\s*(?:of|:|is)?\\s*(?:(above|over|min(?:imum)?|>=?)|(under|below|max(?:imum)?|upto|<=?))?\\s*(?!(?:rs\\.?|₹|inr)\\s*)(\\d[\\d,]*(?:\\.\\d+)?)${noCurr}\\s*(?:sq\\.?\\s*ft|sqft|sq\\s*feet)?`,
      'i'
    )
  );

  const match = singleBefore || singleAfter;
  if (match) {
    const isBefore = Boolean(singleBefore);
    const numStr = isBefore ? match[3] : match[5];
    const val = parseFloat(numStr.replace(/,/g, ''));
    if (!isNaN(val) && val > 0) {
      const hasMinMod = Boolean(match[1] || (!isBefore ? match[3] : undefined));
      const hasMaxMod = Boolean(match[2] || (!isBefore ? match[4] : undefined));
      if (hasMinMod && !hasMaxMod) return { min: val, max: null };
      if (hasMaxMod && !hasMinMod) return { min: null, max: val };
      return { min: Math.round(val * 0.8), max: Math.round(val * 1.2) };
    }
  }

  return { min: null, max: null };
}

/**
 * Parses a natural-language requirement string plus optional explicit field parameters
 * into structured filters across all 8 database fields.
 */
export function parseEightFieldRequirements(
  rawQuery: string,
  explicit?: {
    transactionType?: string | null;
    propertyType?: string | null;
    bhk?: string | null;
    transactionClassification?: string | null;
    locality?: string | null;
    city?: string | null;
    minBuiltupArea?: number | null;
    maxBuiltupArea?: number | null;
    minCarpetArea?: number | null;
    maxCarpetArea?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    priceRange?: string | null;
  }
): EightFieldCriteria {
  const q = (rawQuery || '').trim();
  const lower = q.toLowerCase().replace(/\s+/g, ' ');

  // 1. TRANSACTION TYPE
  let transactionType: EightFieldCriteria['transactionType'] = null;
  const expLt = String(explicit?.transactionType || '').toLowerCase().trim();
  if (expLt && expLt !== 'all') {
    if (expLt.includes('joint')) transactionType = 'Joint Development';
    else if (expLt.includes('rent') || expLt.includes('lease')) transactionType = 'Rent';
    else if (expLt.includes('buy') || expLt.includes('sale')) transactionType = 'Sale';
  }
  if (!transactionType && q) {
    const lowerWithoutPre = lower.replace(/\bpre[-_\s]*(?:leased?|rented?)\b/gi, ' ');
    if (/\b(?:joint\s*development|jv)\b/i.test(lowerWithoutPre)) {
      transactionType = 'Joint Development';
    } else if (/\b(?:for\s*rent|on\s*rent|rent(?:al)?|to\s*let|lease(?:d)?|leasing|per\s*month|\/month)\b/i.test(lowerWithoutPre)) {
      transactionType = 'Rent';
    } else if (/\b(?:for\s*sale|sale|buy|buying|purchase)\b/i.test(lowerWithoutPre)) {
      transactionType = 'Sale';
    }
  }

  // 2. PROPERTY TYPE (+ BHK numbers)
  const propertyTypes: string[] = [];
  const expPt = String(explicit?.propertyType || explicit?.bhk || '').trim();
  if (expPt && expPt !== 'All' && expPt !== 'All Types' && expPt !== 'All Typologies') {
    propertyTypes.push(expPt);
  }
  if (q) {
    for (const rule of PROPERTY_TYPE_SYNONYMS) {
      if (rule.regex.test(lower) && !propertyTypes.includes(rule.label)) {
        propertyTypes.push(rule.label);
      }
    }
    if (/\bcommercial\b/i.test(lower) && propertyTypes.length === 0) {
      propertyTypes.push('Commercial');
    }
  }

  const bhkNums: number[] = [];
  const bhkText = `${expPt} ${lower}`;
  for (const m of bhkText.matchAll(/\b([1-9](?:\.5)?)\s*(?:bhk|bed|bedroom)s?\b/gi)) {
    const n = parseFloat(m[1]);
    if (!isNaN(n) && !bhkNums.includes(n)) bhkNums.push(n);
  }

  // 3. TRANSACTION CLASSIFICATION
  let transactionClassification: string | null = null;
  const expClass = String(explicit?.transactionClassification || '').trim();
  if (expClass && expClass !== 'All') {
    transactionClassification = expClass;
  } else if (q) {
    for (const rule of CLASSIFICATION_RULES) {
      if (rule.patterns.some((rx) => rx.test(lower))) {
        transactionClassification = rule.value;
        break;
      }
    }
  }

  // 4. LOCALITY
  const localities: string[] = [];
  const expLoc = String(explicit?.locality || '').trim();
  if (expLoc && expLoc !== 'All' && expLoc !== 'All Localities') {
    localities.push(expLoc);
  }
  if (q) {
    for (const loc of [...KNOWN_PUNE_LOCALITIES, ...EXTRA_DB_LOCALITIES]) {
      if (loc === 'pune' || loc === 'pcmc') continue;
      if (new RegExp(`\\b${escapeRegex(loc)}\\b`, 'i').test(lower)) {
        if (!localities.some((l) => l.toLowerCase() === loc.toLowerCase())) {
          localities.push(loc);
        }
      }
    }
  }

  // 5. CITY
  const cities: string[] = [];
  const expCity = String(explicit?.city || '').trim();
  if (expCity && expCity !== 'All' && expCity !== 'All Cities') {
    cities.push(expCity);
  }
  if (q) {
    for (const c of KNOWN_CITIES) {
      const rx = new RegExp(`(?:^|\\b|\\()${escapeRegex(c)}(?:\\)|\\b|$)`, 'i');
      if (rx.test(lower)) {
        // Avoid adding "pune" if user already typed specific zone like "pune east"
        if (c === 'pune' && cities.some((x) => x.includes('pune'))) continue;
        if (c === 'mumbai' && cities.some((x) => x.includes('mumbai'))) continue;
        if (!cities.some((x) => x.toLowerCase() === c.toLowerCase())) {
          cities.push(c);
        }
      }
    }
  }

  // 6 & 7. BUILT-UP AREA & CARPET AREA
  let builtupArea: AreaBounds = {
    min: explicit?.minBuiltupArea ?? null,
    max: explicit?.maxBuiltupArea ?? null
  };
  let carpetArea: AreaBounds = {
    min: explicit?.minCarpetArea ?? null,
    max: explicit?.maxCarpetArea ?? null
  };
  let genericArea: AreaBounds = { min: null, max: null };

  if (q) {
    if (builtupArea.min === null && builtupArea.max === null) {
      builtupArea = parseLabeledArea(lower, 'built[-\\s]*up|buildup|build[-\\s]*up|built\\s*area|super\\s*built[-\\s]*up');
    }
    if (carpetArea.min === null && carpetArea.max === null) {
      carpetArea = parseLabeledArea(lower, 'carpet(?:\\s*area)?');
    }

    // If neither explicit built-up nor carpet label was matched, check generic "1200 sqft" / "1000-2000 sq ft"
    if (
      builtupArea.min === null &&
      builtupArea.max === null &&
      carpetArea.min === null &&
      carpetArea.max === null
    ) {
      const genRange = lower.match(
        /(\d[\d,]*(?:\.\d+)?)\s*(?:to|-|–)\s*(\d[\d,]*(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|square\s*feet|sq\s*ft)/i
      );
      if (genRange) {
        const a1 = parseFloat(genRange[1].replace(/,/g, ''));
        const a2 = parseFloat(genRange[2].replace(/,/g, ''));
        if (!isNaN(a1) && !isNaN(a2) && a1 > 0 && a2 > 0) {
          genericArea = { min: Math.min(a1, a2), max: Math.max(a1, a2) };
        }
      } else {
        const genMod = lower.match(
          /(?:(above|over|min(?:imum)?|more\s*than|>=?)|(under|below|max(?:imum)?|upto|up\s*to|less\s*than|<=?))?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|square\s*feet|sq\s*ft)\b/i
        );
        if (genMod) {
          const val = parseFloat(genMod[3].replace(/,/g, ''));
          if (!isNaN(val) && val > 0) {
            if (genMod[1]) genericArea = { min: val, max: null };
            else if (genMod[2]) genericArea = { min: null, max: val };
            else genericArea = { min: Math.round(val * 0.8), max: Math.round(val * 1.2) };
          }
        }
      }
    }
  }

  // 8. EXPECTED PRICE
  let expectedPrice: { min: number | null; max: number | null } = {
    min: explicit?.minPrice ?? null,
    max: explicit?.maxPrice ?? null
  };
  if (explicit?.priceRange && explicit.priceRange !== 'All' && explicit.priceRange !== 'Any Budget' && explicit.priceRange !== 'all') {
    const pr = explicit.priceRange;
    if (pr.includes('Under ₹1.5') || pr === 'under_1.5cr') {
      expectedPrice.max = 15000000;
    } else if ((pr.includes('1.5') && pr.includes('2.5')) || pr === '1.5_2.5cr') {
      expectedPrice.min = 15000000;
      expectedPrice.max = 25000000;
    } else if ((pr.includes('2.5') && pr.includes('4.0')) || pr === '2.5_4cr') {
      expectedPrice.min = 25000000;
      expectedPrice.max = 40000000;
    } else if (pr.includes('4.0') || pr === 'above_4cr') {
      expectedPrice.min = 40000000;
    }
  }
  if (q && expectedPrice.min === null && expectedPrice.max === null) {
    // Strip explicit area segments first so "2000 sqft" isn't confused as a raw rupee price
    const priceProbe = q
      .replace(/\d[\d,]*(?:\.\d+)?\s*(?:to|-|–)\s*\d[\d,]*(?:\.\d+)?\s*(?:sq\.?\s*ft|sqft|sq\s*ft|carpet|super\s*built[-\s]*up|built[-\s]*up)/gi, ' ')
      .replace(/\d[\d,]*(?:\.\d+)?\s*(?:sq\.?\s*ft|sqft|sq\s*ft|carpet|super\s*built[-\s]*up|built[-\s]*up)/gi, ' ');
    const parsedBudget = parseBudgetAmounts(priceProbe);
    expectedPrice = { min: parsedBudget.minBudget, max: parsedBudget.maxBudget };
  }

  // Residual distinctive project/building keywords
  const localityTokens = new Set<string>();
  for (const loc of localities) {
    loc.toLowerCase().split(/\s+/).forEach((t) => t.length >= 2 && localityTokens.add(t));
  }
  const cityTokens = new Set<string>();
  for (const c of cities) {
    c.toLowerCase().replace(/[()]/g, ' ').split(/\s+/).forEach((t) => t.length >= 2 && cityTokens.add(t));
  }

  const keywords = lower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => {
      if (w.length < 3) return false;
      if (EXTRA_STOP_WORDS.has(w)) return false;
      if (localityTokens.has(w)) return false;
      if (cityTokens.has(w)) return false;
      if (/^\d+(?:sq|sqft|sq\.?ft|bhk|cr|crore|crores|lakh|lakhs|lac|lacs|l|th|thousand|k)?$/.test(w)) return false;
      return true;
    });

  const hasAnyConstraint = Boolean(
    transactionType ||
    propertyTypes.length > 0 ||
    bhkNums.length > 0 ||
    transactionClassification ||
    localities.length > 0 ||
    cities.length > 0 ||
    builtupArea.min !== null ||
    builtupArea.max !== null ||
    carpetArea.min !== null ||
    carpetArea.max !== null ||
    genericArea.min !== null ||
    genericArea.max !== null ||
    expectedPrice.min !== null ||
    expectedPrice.max !== null ||
    keywords.length > 0
  );

  return {
    rawQuery: q,
    transactionType,
    propertyTypes,
    bhkNums,
    transactionClassification,
    localities,
    cities,
    builtupArea,
    carpetArea,
    genericArea,
    expectedPrice,
    keywords,
    hasAnyConstraint
  };
}

/**
 * Returns DB matching tokens for a canonical or raw property type label.
 */
export function getPropertyTypeMatchTerms(label: string): string[] {
  const lower = label.toLowerCase().trim();
  for (const rule of PROPERTY_TYPE_SYNONYMS) {
    if (rule.label.toLowerCase() === lower || rule.dbTerms.some((t) => t === lower)) {
      return rule.dbTerms;
    }
  }
  if (lower === 'commercial') {
    return ['office', 'commercial', 'shop', 'showroom', 'retail', 'restaurant', 'hotel', 'built to suit'];
  }
  return [lower];
}
