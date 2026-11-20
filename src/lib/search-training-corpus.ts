/**
 * ANV REEALTY Intelligent Listening Search Bar Training Corpus & NLU Classifier
 * 
 * Contains 1,000+ realistic buyer and seller natural language queries across Pune
 * with multi-line entity extraction (Persona, Locality, Typology/BHK, Budget, Purpose, Status).
 */

import { parseBudgetAmounts } from './property-matching';

export type QueryIntent = 'buyer' | 'seller' | 'general';
export type PrimaryView = 'properties' | 'buyer_leads';

export interface ExtractedQueryLines {
  intent: QueryIntent;
  primaryView: PrimaryView;
  locality: string | null;
  localityAliases: string[];
  typology: string | null;
  bhk: string | null;
  minBudget: number | null;
  maxBudget: number | null;
  budgetLabel: string | null;
  isCommercial: boolean;
  isResidential: boolean;
  isGeneralQuery: boolean;
  transactionType: 'buy' | 'rent' | 'sell';
  possession: 'ready' | 'under-construction' | null;
  keywords: string[];
}

export interface TrainingQueryItem {
  id: string;
  query: string;
  intent: QueryIntent;
  expectedView: PrimaryView;
  expectedLocality: string | null;
  expectedTypology: string | null;
  expectedBhk: string | null;
  category: 'Buyer Inquiry' | 'Seller Lead' | 'Conversational General';
}

// =========================================================================
// 1. PUNE LOCALITY DIRECTORY & ALIASES
// =========================================================================
export const PUNE_LOCALITIES: { name: string; aliases: string[]; zone: string }[] = [
  { name: 'Baner', aliases: ['baner', 'baner road', 'baner phata', 'pan card club road'], zone: 'West' },
  { name: 'Balewadi', aliases: ['balewadi', 'balewadi high street', 'high street', 'balewadi stadium'], zone: 'West' },
  { name: 'Wakad', aliases: ['wakad', 'dange chowk', 'bhumi raj', 'datta mandir'], zone: 'West' },
  { name: 'Hinjewadi', aliases: ['hinjewadi', 'hinjawadi', 'phase 1', 'phase 2', 'phase 3', 'it park hinjewadi'], zone: 'West' },
  { name: 'Aundh', aliases: ['aundh', 'parihar chowk', 'bremen chowk'], zone: 'West' },
  { name: 'Pashan', aliases: ['pashan', 'pashan sus road', 'sutarwadi'], zone: 'West' },
  { name: 'Bavdhan', aliases: ['bavdhan', 'chandani chowk', 'bavdhan bk'], zone: 'West' },
  { name: 'Kothrud', aliases: ['kothrud', 'karve road', 'paud road', 'vanaz', 'mit'], zone: 'West' },
  { name: 'Mahalunge', aliases: ['mahalunge', 'mhalunge', 'godrej hill'], zone: 'West' },
  { name: 'Kharadi', aliases: ['kharadi', 'eon free zone', 'world trade center', 'wtc', 'eon'], zone: 'East' },
  { name: 'Kalyani Nagar', aliases: ['kalyani nagar', 'kalyaninagar', 'vadgaon sheri'], zone: 'East' },
  { name: 'Viman Nagar', aliases: ['viman nagar', 'vimannagar', 'symbiosis', 'phoenix marketcity'], zone: 'East' },
  { name: 'Koregaon Park', aliases: ['koregaon park', 'kp', 'north main road', 'south main road'], zone: 'East' },
  { name: 'Magarpatta', aliases: ['magarpatta', 'magarpatta city', 'cybercity'], zone: 'East' },
  { name: 'Hadapsar', aliases: ['hadapsar', 'amanora', 'solapur road'], zone: 'East' },
  { name: 'Undri', aliases: ['undri', 'undri pisoli', 'corinthians'], zone: 'South' },
  { name: 'NIBM Road', aliases: ['nibm', 'nibm road', 'nibm annexe'], zone: 'South' },
  { name: 'Wanowrie', aliases: ['wanowrie', 'wanwadi', 'salunke vihar'], zone: 'South' },
  { name: 'Camp', aliases: ['camp', 'm g road', 'mg road', 'east street'], zone: 'Central' },
  { name: 'Nana Peth', aliases: ['nana peth', 'sant kabir chowk', 'kirad hospital', 'peth area'], zone: 'Central' },
  { name: 'Shivaji Nagar', aliases: ['shivaji nagar', 'shivajinagar', 'fc road', 'fergusson', 'jm road'], zone: 'Central' },
  { name: 'Chakan', aliases: ['chakan', 'chakan midc', 'industrial chakan'], zone: 'North' },
  { name: 'Wagholi', aliases: ['wagholi', 'bakori road'], zone: 'East' },
  { name: 'Kondhwa', aliases: ['kondhwa', 'kondhwa bk', 'khadi machine'], zone: 'South' },
  { name: 'Pimpri', aliases: ['pimpri', 'chinchwad', 'pcmc'], zone: 'North' }
];

// =========================================================================
// 2. TYPOLOGY & CONFIGURATION MAP
// =========================================================================
export const TYPOLOGY_MAP = [
  {
    category: 'Commercial Office Space',
    matches: ['office', 'offices', 'commercial office', 'it park', 'workspace', 'corporate desk', 'business center', 'tech park'],
    isCommercial: true
  },
  {
    category: 'Commercial Retail Shop',
    matches: ['shop', 'shops', 'retail', 'commercial shop', 'store', 'boutique', 'road-touch shop'],
    isCommercial: true
  },
  {
    category: 'Commercial Showroom',
    matches: ['showroom', 'showrooms', 'display center', 'auto showroom', 'retail showroom', 'brand store'],
    isCommercial: true
  },
  {
    category: 'Restaurant / Cafe',
    matches: ['restaurant', 'restaurants', 'cafe', 'cafes', 'dining', 'food court', 'bistro', 'eatery', 'bar', 'lounge', 'f&b'],
    isCommercial: true
  },
  {
    category: 'Commercial Medical / Hospital',
    matches: ['hospital', 'clinic', 'medical', 'healthcare', 'doctor clinic', 'diagnostic center'],
    isCommercial: true
  },
  {
    category: 'Warehouse / Industrial',
    matches: ['warehouse', 'godown', 'industrial', 'shed', 'factory', 'logistics park'],
    isCommercial: true
  },
  {
    category: 'Plot & Land',
    matches: ['plot', 'plots', 'land', 'na plot', 'industrial land', 'commercial land', 'open land'],
    isCommercial: false
  },
  {
    category: 'Penthouse',
    matches: ['penthouse', 'penthouses', 'sky villa', 'top floor luxury'],
    isCommercial: false,
    bhk: '4.5+ BHK Penthouse'
  },
  {
    category: 'Luxury Villa / Bungalow',
    matches: ['villa', 'villas', 'bungalow', 'bungalows', 'row house'],
    isCommercial: false
  }
];

// Conversational filler words for seller and search queries
export const SELLER_FILLERS = new Set([
  'i', 'me', 'my', 'we', 'our', 'us', 'you', 'please', 'can', 'could', 'would', 'will',
  'want', 'wants', 'wanted', 'need', 'needs', 'needed', 'looking', 'look', 'looks',
  'find', 'finds', 'get', 'gets', 'got', 'give', 'gives', 'show', 'shows', 'provide',
  'buyer', 'buyers', 'client', 'clients', 'lead', 'leads', 'patron', 'patrons',
  'customer', 'customers', 'investor', 'investors',
  'property', 'properties', 'real', 'estate', 'person', 'owner', 'seller', 'sellers',
  'this', 'that', 'these', 'those', 'here', 'there',
  'says', 'said', 'say', 'saying', 'tell', 'tells', 'told',
  'have', 'has', 'having', 'own', 'owns', 'owned',
  'for', 'to', 'in', 'at', 'on', 'with', 'by', 'of', 'from',
  'a', 'an', 'the', 'some', 'any', 'all',
  'is', 'am', 'are', 'was', 'were', 'be', 'been',
  'sell', 'selling', 'sold', 'sale', 'list', 'listing', 'registered',
  'help', 'assist', 'connect', 'match', 'matching', 'matched',
  'pune', 'maharashtra',
  // Budget & range modifiers (so dangling words e.g. "under" don't become rogue keyword filters)
  'budget', 'budgets', 'price', 'prices', 'cost', 'costs', 'range', 'ranges',
  'under', 'below', 'above', 'over', 'upto', 'up', 'less', 'than', 'more', 'between',
  'min', 'max', 'minimum', 'maximum', 'sub', 'within', 'around', 'approx', 'starting',
  'cr', 'crore', 'crores', 'lakh', 'lakhs', 'lac', 'lacs', 'k', 'sqft', 'feet'
]);

// =========================================================================
// 3. ROBUST INTENT DETECTION: BUYER VS SELLER
// =========================================================================
export function detectQueryIntent(queryText: string): { intent: QueryIntent; primaryView: PrimaryView } {
  const lower = (queryText || '').toLowerCase().trim();

  // 1. Direct seller phrases (seller looking for buyer, or owner selling property)
  const explicitSellerPattern =
    /\b(?:need\s*(?:a\s*)?buyers?|want\s*(?:a\s*)?buyers?|looking\s*for\s*(?:a\s*)?buyers?|find\s*(?:me\s*)?(?:a\s*)?buyers?|get\s*(?:me\s*)?(?:a\s*)?buyers?|buyers?\s*for\s*my|buyers?\s*needed|buyers?\s*wanted|connect\s*(?:me\s*)?(?:with\s*)?buyers?|match\s*(?:my\s*)?property\s*with\s*buyers?|property\s*person\s*says|i\s*(?:have|got|own)\s+(?:a\s+)?(?:property|flat|apartment|shop|office|showroom|plot|land)\s*(?:and\s*)?(?:need|want|looking\s*for)\s*(?:a\s*)?buyers?|i\s*want\s*to\s*sell|willing\s*to\s*sell|looking\s*to\s*sell|sell\s*my\s*property|sell\s*my\s*flat|sell\s*my\s*office|sell\s*my\s*shop|list\s*my\s*property|selling\s*my|owner\s*selling)\b/i;

  // 2. Direct buyer phrases take precedence if query clearly says "want to buy", "looking to buy", etc.
  const explicitBuyerPattern =
    /\b(?:want\s*to\s*buy|looking\s*to\s*buy|plan\s*to\s*buy|wish\s*to\s*buy|ready\s*to\s*buy|seeking\s*to\s*buy|i\s*want\s*to\s*purchase|looking\s*for\s*(?:\d+\s*bhk|flat|apartment|office|shop|showroom)\s*(?:to\s*buy|for\s*sale)|buy\s+(?:a|an|the|\d+|flat|apartment|office|shop|property|home|luxury|commercial|pre\s*leased)|interested\s*in\s*buying|to\s*buy|buyer\s*says|buyer\s*looking|buyer\s*requirement|i\s*need\s*to\s*buy)\b/i;

  // 3. Natural search query patterns typical for buyers (e.g. "show me 2 BHK in Baner", "looking for prime office")
  const buyerSearchPattern =
    explicitBuyerPattern.test(lower) ||
    /\b(?:show\s*(?:me)?|looking\s*for|find\s*(?:me)?|search\s*(?:for)?)\s+(?:ready\s*to\s*move|prime|verified|luxury|affordable|new)?\s*(?:\d+\s*bhk|flat|apartment|office|shop|showroom|warehouse|plot|villa|penthouse)\b/i.test(lower) ||
    /\b(?:for\s*sale|ready\s*to\s*move\s*(?:\d+\s*bhk|flat|apartment)|buy)\b/i.test(lower);

  const hasSeller = explicitSellerPattern.test(lower);
  const hasBuyer = buyerSearchPattern;

  if (hasSeller && !hasBuyer) {
    return { intent: 'seller', primaryView: 'buyer_leads' };
  }
  if (hasBuyer && !hasSeller) {
    return { intent: 'buyer', primaryView: 'properties' };
  }
  if (hasSeller && hasBuyer) {
    // Conflict resolution: if phrases like "buyers for my", "need buyers", or "sell" are present
    if (/\b(?:buyers?\s*for|need\s*(?:a\s*)?buyers?|want\s*(?:a\s*)?buyers?|sell|selling)\b/i.test(lower)) {
      return { intent: 'seller', primaryView: 'buyer_leads' };
    }
    return { intent: 'buyer', primaryView: 'properties' };
  }

  // Fallback checks
  if (/\b(?:sell|seller|selling|list\s*my)\b/i.test(lower)) {
    return { intent: 'seller', primaryView: 'buyer_leads' };
  }
  if (/\b(?:buy|buying|purchase|rent|lease)\b/i.test(lower)) {
    return { intent: 'buyer', primaryView: 'properties' };
  }

  return { intent: 'general', primaryView: 'properties' };
}

// =========================================================================
// 4. MULTI-LINE ENTITY EXTRACTOR (LINE-BY-LINE SEARCH CRITERIA)
// =========================================================================
export function extractQueryLines(rawQuery: string): ExtractedQueryLines {
  const text = (rawQuery || '').trim();
  const lower = text.toLowerCase();
  const { intent, primaryView } = detectQueryIntent(text);

  // A. Locality Extraction
  let matchedLocality: string | null = null;
  let localityAliases: string[] = [];

  for (const loc of PUNE_LOCALITIES) {
    for (const alias of loc.aliases) {
      const reg = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (reg.test(lower)) {
        matchedLocality = loc.name;
        localityAliases = loc.aliases;
        break;
      }
    }
    if (matchedLocality) break;
  }

  // B. Typology & BHK Extraction
  let matchedTypology: string | null = null;
  let matchedBhk: string | null = null;
  let isCommercial = false;
  let isResidential = false;

  // 1) BHK detection (e.g. 1 BHK, 2 BHK, 3 BHK, 4 BHK, 5 BHK)
  const bhkMatch = lower.match(/\b([1-6])\s*(?:bhk|bed|bedroom|b|rk)s?\b/i);
  if (bhkMatch) {
    matchedBhk = `${bhkMatch[1]} BHK`;
    matchedTypology = 'Apartment';
    isResidential = true;
  }

  // 2) Typology categories
  for (const item of TYPOLOGY_MAP) {
    for (const phrase of item.matches) {
      const reg = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (reg.test(lower)) {
        matchedTypology = item.category;
        if (item.isCommercial) isCommercial = true;
        if (item.bhk) matchedBhk = item.bhk;
        break;
      }
    }
    if (matchedTypology && matchedTypology !== 'Apartment') break;
  }

  if (/\b(?:flat|flats|apartment|apartments|residence|residential|home|house)\b/i.test(lower) && !isCommercial) {
    isResidential = true;
    if (!matchedTypology) matchedTypology = 'Apartment';
  }

  // C. Budget Parsing
  const { minBudget, maxBudget } = parseBudgetAmounts(text);
  let budgetLabel: string | null = null;
  if (minBudget && maxBudget) {
    budgetLabel = `₹${(minBudget / 10000000).toFixed(1)} - ₹${(maxBudget / 10000000).toFixed(1)} Cr`;
  } else if (maxBudget) {
    budgetLabel = maxBudget >= 10000000 ? `Under ₹${(maxBudget / 10000000).toFixed(1)} Cr` : `Under ₹${(maxBudget / 100000).toFixed(0)} L`;
  } else if (minBudget) {
    budgetLabel = minBudget >= 10000000 ? `Above ₹${(minBudget / 10000000).toFixed(1)} Cr` : `Above ₹${(minBudget / 100000).toFixed(0)} L`;
  }

  // D. Transaction Type
  let transactionType: 'buy' | 'rent' | 'sell' = 'buy';
  if (intent === 'seller') {
    transactionType = 'sell';
  } else if (/\b(?:rent|for rent|on rent|to rent|lease|renting|monthly rent)\b/i.test(lower)) {
    transactionType = 'rent';
  } else {
    transactionType = 'buy';
  }

  // E. Possession Status
  let possession: 'ready' | 'under-construction' | null = null;
  if (/\b(?:ready|ready to move|rtm|immediate|oc received)\b/i.test(lower)) {
    possession = 'ready';
  } else if (/\b(?:under construction|under-construction|uc|new launch)\b/i.test(lower)) {
    possession = 'under-construction';
  }

  // F. General check: e.g. "i need a buyer for my this property" has no specific criteria
  const isGeneralQuery = !matchedLocality && !matchedBhk && !matchedTypology && maxBudget === null;

  // G. Meaningful keywords
  const words = lower.split(/\s+/).filter(Boolean);
  const keywords = words.filter((w) => !SELLER_FILLERS.has(w));

  return {
    intent,
    primaryView,
    locality: matchedLocality,
    localityAliases,
    typology: matchedTypology,
    bhk: matchedBhk,
    minBudget,
    maxBudget,
    budgetLabel,
    isCommercial,
    isResidential,
    isGeneralQuery,
    transactionType,
    possession,
    keywords
  };
}

// =========================================================================
// 5. INTENTION FILTER FUNCTION FOR ACTIVE BUYERS (CLIENT & SERVER SAFE)
// =========================================================================
export function filterBuyerDemandsByQuery<T extends { locality: string; bhk: string; budget: string; requirements?: string; purpose?: string }>(
  demands: T[],
  queryText: string
): T[] {
  const trimmed = (queryText || '').trim();
  if (!trimmed) return demands;

  const lines = extractQueryLines(trimmed);

  // If general seller query like "i need a buyer for my this property", return all active verified buyers!
  if (lines.intent === 'seller' && lines.isGeneralQuery) {
    return demands;
  }

  return demands.filter((demand) => {
    const demandText = `${demand.locality} ${demand.bhk} ${demand.budget} ${demand.requirements || ''} ${demand.purpose || ''}`.toLowerCase();

    // Line 1: Locality match
    if (lines.locality) {
      const locMatched = lines.localityAliases.some((alias) => demandText.includes(alias.toLowerCase()));
      if (!locMatched && !demandText.includes(lines.locality.toLowerCase())) {
        return false;
      }
    }

    // Line 2: BHK match
    if (lines.bhk) {
      const bhkDigit = lines.bhk.match(/\d+/)?.[0];
      if (bhkDigit) {
        const matchesBhk =
          demandText.includes(`${bhkDigit} bhk`) ||
          demandText.includes(`${bhkDigit}bhk`) ||
          demandText.includes(`${bhkDigit} bed`) ||
          demandText.includes(`${bhkDigit} &`) ||
          demandText.includes(`& ${bhkDigit}`);
        if (!matchesBhk && !demandText.includes(lines.bhk.toLowerCase())) {
          return false;
        }
      }
    }

    // Line 3: Typology match
    if (lines.typology) {
      const tLower = lines.typology.toLowerCase();
      if (tLower.includes('shop') || tLower.includes('retail')) {
        if (!demandText.includes('shop') && !demandText.includes('retail') && !demandText.includes('store') && !demandText.includes('showroom')) {
          return false;
        }
      } else if (tLower.includes('office')) {
        if (!demandText.includes('office') && !demandText.includes('commercial') && !demandText.includes('workspace')) {
          return false;
        }
      } else if (tLower.includes('showroom')) {
        if (!demandText.includes('showroom') && !demandText.includes('retail') && !demandText.includes('shop')) {
          return false;
        }
      } else if (tLower.includes('restaurant') || tLower.includes('cafe')) {
        if (!demandText.includes('restaurant') && !demandText.includes('cafe') && !demandText.includes('food') && !demandText.includes('shop') && !demandText.includes('retail') && !demandText.includes('commercial')) {
          return false;
        }
      } else if (tLower.includes('plot') || tLower.includes('land')) {
        if (!demandText.includes('plot') && !demandText.includes('land')) {
          return false;
        }
      } else if (tLower.includes('warehouse') || tLower.includes('industrial')) {
        if (!demandText.includes('warehouse') && !demandText.includes('industrial') && !demandText.includes('godown')) {
          return false;
        }
      }
    }

    // Line 4: Commercial vs Residential filter
    if (lines.isCommercial && !lines.isResidential) {
      const hasComm = demandText.includes('commercial') || demandText.includes('office') || demandText.includes('shop') || demandText.includes('retail') || demandText.includes('showroom') || demandText.includes('warehouse');
      if (!hasComm) return false;
    }

    // Line 5: Budget matching for buyers
    if (lines.maxBudget || lines.minBudget) {
      const bText = (demand.budget || '').toLowerCase().replace(/,/g, '');
      const crMatch = bText.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore)/i);
      const lMatch = bText.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)/i);
      let dPrice = 0;
      if (crMatch) dPrice = parseFloat(crMatch[1]) * 10000000;
      else if (lMatch) dPrice = parseFloat(lMatch[1]) * 100000;
      if (dPrice > 0) {
        if (lines.maxBudget && dPrice > lines.maxBudget * 1.35) return false;
        if (lines.minBudget && dPrice < lines.minBudget * 0.65) return false;
      }
    }

    // Line 6: Remaining meaningful keywords if no specific lines were extracted
    if (!lines.locality && !lines.bhk && !lines.typology && lines.keywords.length > 0) {
      return lines.keywords.some((kw) => demandText.includes(kw));
    }

    return true;
  });
}

// =========================================================================
// 6. 1000+ COMPREHENSIVE TRAINING QUERIES CORPUS
// =========================================================================
function buildTrainingCorpus(): TrainingQueryItem[] {
  const corpus: TrainingQueryItem[] = [];
  let idCounter = 1;

  // Buyer phrasing templates (20 templates)
  const buyerTemplates = [
    'i want to buy {typology} in {locality}',
    'looking to buy {typology} in {locality}',
    'need {bhk} flat in {locality} to buy',
    'plan to buy luxury {typology} in {locality}',
    'ready to buy {bhk} in {locality}',
    'buyer looking for {typology} near {locality}',
    'want to purchase {bhk} apartment in {locality}',
    'i am looking for {typology} in {locality} for investment',
    'show me ready to move {bhk} in {locality}',
    'buy commercial {typology} in {locality}',
    'i want to buy {bhk} under 2 Cr in {locality}',
    'looking for road touch {typology} in {locality} to buy',
    'want to buy {typology} with parking in {locality}',
    'verified {bhk} for sale in {locality}',
    'find me {typology} to buy in {locality}',
    'buyer requirement for {bhk} in {locality}',
    'looking for prime {typology} in {locality}',
    'want to buy {bhk} residential home in {locality}',
    'buy pre leased {typology} in {locality}',
    'i need to buy a {bhk} property in {locality}'
  ];

  // Seller phrasing templates (20 templates)
  const sellerTemplates = [
    'i need a buyer for my {bhk} in {locality}',
    'have {typology} in {locality} looking for buyers',
    'i want to sell my {bhk} flat in {locality}',
    'find buyers for my {typology} in {locality}',
    'need active buyers for my {bhk} property in {locality}',
    'property person says i need a buyer for my this property in {locality}',
    'i want a buyer for my {typology} in {locality}',
    'connect me with buyers for my {bhk} in {locality}',
    'match buyers for my {typology} in {locality}',
    'got {bhk} in {locality} looking for buyers',
    'selling my {typology} in {locality} need buyer',
    'owner selling {bhk} in {locality} want buyers',
    'i have a commercial {typology} in {locality} need buyer',
    'list my {bhk} flat in {locality} to buyers',
    'looking for buyer for my {typology} in {locality}',
    'i need a buyer for my this property',
    'i need buyers for my property in {locality}',
    'find me genuine buyer for my {bhk} in {locality}',
    'got commercial {typology} in {locality} looking for buyers',
    'i want to connect with verified buyers in {locality}'
  ];

  const testLocalities = PUNE_LOCALITIES.slice(0, 15);
  const testBhks = ['1 BHK', '2 BHK', '3 BHK', '4 BHK'];
  const testTypologies = [
    'commercial shop', 'office space', 'commercial showroom',
    'warehouse', 'plot', 'penthouse', 'apartment', 'villa'
  ];

  // Generate 500+ Buyer Queries
  for (const loc of testLocalities) {
    for (const bhk of testBhks) {
      for (let i = 0; i < buyerTemplates.length; i += 4) {
        const tpl = buyerTemplates[i];
        const q = tpl.replace('{typology}', `${bhk} flat`).replace('{locality}', loc.name).replace('{bhk}', bhk);
        corpus.push({
          id: `TRN-BYR-${String(idCounter++).padStart(4, '0')}`,
          query: q,
          intent: 'buyer',
          expectedView: 'properties',
          expectedLocality: loc.name,
          expectedTypology: 'Apartment',
          expectedBhk: bhk,
          category: 'Buyer Inquiry'
        });
      }
    }
    for (const typo of testTypologies) {
      for (let i = 1; i < buyerTemplates.length; i += 4) {
        const tpl = buyerTemplates[i];
        const q = tpl.replace('{typology}', typo).replace('{locality}', loc.name).replace('{bhk}', '3 BHK');
        corpus.push({
          id: `TRN-BYR-${String(idCounter++).padStart(4, '0')}`,
          query: q,
          intent: 'buyer',
          expectedView: 'properties',
          expectedLocality: loc.name,
          expectedTypology: typo,
          expectedBhk: null,
          category: 'Buyer Inquiry'
        });
      }
    }
  }

  // Generate 500+ Seller Queries
  for (const loc of testLocalities) {
    for (const bhk of testBhks) {
      for (let i = 0; i < sellerTemplates.length; i += 4) {
        const tpl = sellerTemplates[i];
        const q = tpl.replace('{typology}', `${bhk} flat`).replace('{locality}', loc.name).replace('{bhk}', bhk);
        corpus.push({
          id: `TRN-SLR-${String(idCounter++).padStart(4, '0')}`,
          query: q,
          intent: 'seller',
          expectedView: 'buyer_leads',
          expectedLocality: loc.name,
          expectedTypology: 'Apartment',
          expectedBhk: bhk,
          category: 'Seller Lead'
        });
      }
    }
    for (const typo of testTypologies) {
      for (let i = 1; i < sellerTemplates.length; i += 4) {
        const tpl = sellerTemplates[i];
        const q = tpl.replace('{typology}', typo).replace('{locality}', loc.name).replace('{bhk}', '3 BHK');
        corpus.push({
          id: `TRN-SLR-${String(idCounter++).padStart(4, '0')}`,
          query: q,
          intent: 'seller',
          expectedView: 'buyer_leads',
          expectedLocality: loc.name,
          expectedTypology: typo,
          expectedBhk: null,
          category: 'Seller Lead'
        });
      }
    }
  }

  // Edge cases explicitly requested by user
  corpus.push(
    {
      id: `TRN-SLR-${String(idCounter++).padStart(4, '0')}`,
      query: 'i need a buyer for my this property',
      intent: 'seller',
      expectedView: 'buyer_leads',
      expectedLocality: null,
      expectedTypology: null,
      expectedBhk: null,
      category: 'Seller Lead'
    },
    {
      id: `TRN-SLR-${String(idCounter++).padStart(4, '0')}`,
      query: 'property person says i need a buyer for my this property',
      intent: 'seller',
      expectedView: 'buyer_leads',
      expectedLocality: null,
      expectedTypology: null,
      expectedBhk: null,
      category: 'Seller Lead'
    },
    {
      id: `TRN-BYR-${String(idCounter++).padStart(4, '0')}`,
      query: 'buyer says i want to buy property',
      intent: 'buyer',
      expectedView: 'properties',
      expectedLocality: null,
      expectedTypology: null,
      expectedBhk: null,
      category: 'Buyer Inquiry'
    },
    {
      id: `TRN-BYR-${String(idCounter++).padStart(4, '0')}`,
      query: 'i want to buy property',
      intent: 'buyer',
      expectedView: 'properties',
      expectedLocality: null,
      expectedTypology: null,
      expectedBhk: null,
      category: 'Buyer Inquiry'
    }
  );

  return corpus;
}

export const TRAINING_QUERIES_CORPUS: TrainingQueryItem[] = buildTrainingCorpus();

export const classifySearchIntent = detectQueryIntent;

export function getSuggestionsFromCorpus(
  prefix: string,
  limit = 8
): string[] {
  const lower = (prefix || '').toLowerCase().trim();
  if (!lower) return [];
  return TRAINING_QUERIES_CORPUS
    .filter((item) => item.query.toLowerCase().includes(lower))
    .slice(0, limit)
    .map((item) => item.query);
}
