/**
 * Property Matching & Relevance Engine for ANV REEALTY
 * Evaluates user queries against properties with strict category boundaries
 * so users only see accurate, relevant property cards.
 */

export type PropertyTypology =
  | 'residential'
  | 'commercial_office'
  | 'commercial_retail'
  | 'commercial_showroom'
  | 'commercial_shop'
  | 'healthcare_hospital'
  | 'industrial'
  | 'preleased'
  | 'land_plot';

export interface PropertyMatchCriteria {
  isHospital: boolean;
  isShowroom: boolean;
  isOffice: boolean;
  isShop: boolean;
  isWarehouse: boolean;
  isIndustrial: boolean;
  isLand: boolean;
  isPreleased: boolean;
  isResidential: boolean;
  isPenthouse: boolean;
  bhkNum: number | null;
  bhkNums?: number[];
  locality: string | null;
  localities?: string[];
  isExplicitLocality?: boolean;
  minBudget: number | null;
  maxBudget: number | null;
  typologyIntent: PropertyTypology | null;
  typologyIntents?: PropertyTypology[];
  purposeSlugs?: string[];
  nameWords: string[];
  descriptionKeywords?: string[];
  hasSpecificIntent: boolean;
  isMultiCategory?: boolean;
  transactionType?: 'sale' | 'rent' | 'preleased' | null;
  minSqft?: number | null;
  maxSqft?: number | null;
}

export function detectPropertyTypology(prop: {
  name?: string;
  title?: string;
  configuration?: string;
  bhk?: string;
  type_name?: string;
  description?: string;
  isCommercial?: boolean;
}): PropertyTypology {
  const text = `${prop.title || ''} ${prop.name || ''} ${prop.configuration || ''} ${prop.bhk || ''} ${prop.type_name || ''} ${prop.description || ''}`.toLowerCase();

  // 1. Healthcare / Hospital / Medical
  if (/\b(?:hospital|clinic|medical|healthcare|dispensary|doctor|nursing\s*home)\b/i.test(text)) {
    return 'healthcare_hospital';
  }

  // 2. Pre-leased
  if (/\b(?:pre[-_\s]*leased?|pre[-_\s]*rented?|roi|rental\s*yield)\b/i.test(text)) {
    return 'preleased';
  }

  // 3. Industrial / Warehouse / Factory
  if (/\b(?:warehouse|godown|industrial|factory|logistics|manufacturing|shed)\b/i.test(text)) {
    return 'industrial';
  }

  // 4. Retail / Showroom / Shop
  if (/\b(?:showroom|display\s*center)\b/i.test(text)) {
    return 'commercial_showroom';
  }
  if (/\b(?:shop|retail|store|boutique)\b/i.test(text)) {
    return 'commercial_shop';
  }
  if (/\b(?:restaurant|cafe|dining|lounge|bar|f&b)\b/i.test(text)) {
    return 'commercial_shop';
  }

  // 5. Commercial Office
  if (/\b(?:office|it\s*park|tech\s*park|workspace|corporate|business\s*tower|coworking)\b/i.test(text)) {
    return 'commercial_office';
  }

  // 6. Residential Penthouse / Villa / Bungalow
  if (/\b(?:penthouse|sky\s*villa|sky\s*suite)\b/i.test(text)) {
    return 'residential';
  }
  if (/\b(?:bungalow|bunglow|villa|row\s*house)\b/i.test(text)) {
    return 'residential';
  }
  if (/\b(?:plot|land)\b/i.test(text)) {
    return 'land_plot';
  }

  // 7. Residential Apartment / Flat / BHK
  if (/\b(?:apartment|flat|residence|residential|bhk)\b/i.test(text)) {
    return 'residential';
  }

  if (prop.isCommercial) return 'commercial_office';
  return 'residential';
}

export const KNOWN_PUNE_LOCALITIES = [
  // Multi-word chowks, junctions & roads (ordered longer first for accurate greedy matching)
  'sadhu vaswani chowk',
  'sadhu vaswani',
  'sant kabir chowk',
  'balewadi high street',
  'senapati bapat road',
  'boat club road',
  'dhole patil road',
  'law college road',
  'prabhat road',
  'bhandarkar road',
  'karve road',
  'paud road',
  'sinhagad road',
  'satara road',
  'solapur road',
  'nagar road',
  'ahmednagar road',
  'old mumbai pune highway',
  'bt kawade road',
  'm g road',
  'mg road',
  'east street',
  'west street',
  'dange chowk',
  'chandani chowk',
  'bhumkar chowk',
  'kokate chowk',
  'goodluck chowk',
  'alka talkies chowk',
  'alka talkies',
  'nal stop',
  'parihar chowk',
  'bremen chowk',
  'jagtap dairy',
  'pune station',
  'eon free zone',
  'eon it park',
  'world trade center',
  'koregaon park',
  'kalyani nagar',
  'viman nagar',
  'pimple saudagar',
  'pimple nilakh',
  'pimple gurav',
  'senapati bapat',
  'deccan gymkhana',
  'fatima nagar',
  'karve nagar',
  'keshav nagar',
  'tingre nagar',
  'loni kalbhor',
  'chandan nagar',
  'wadgaon sheri',
  'nana peth',
  'rasta peth',
  'somwar peth',
  'mangalwar peth',
  'budhwar peth',
  'guruwar peth',
  'shukrawar peth',
  'shaniwar peth',
  'raviwar peth',
  'bhavani peth',
  'kasba peth',
  'ganj peth',
  'market yard',
  'salunke vihar',
  'lulla nagar',
  'lullanagar',
  'chakan midc',
  'bhosari midc',
  'talawade it park',
  'ranjangaon midc',
  'ranjangaon',
  'shikrapur',
  'sanaswadi',
  'supa midc',
  'talegaon',
  'mohammadwadi',
  'gultekadi',
  'model colony',
  'sb road',
  'dp road',
  'fc road',
  'jm road',
  'baner',
  'balewadi',
  'bavdhan',
  'mahalunge',
  'shivajinagar',
  'kharadi',
  'hinjewadi',
  'hinjawadi',
  'wakad',
  'undri',
  'nibm road',
  'nibm',
  'camp',
  'bund garden',
  'magarpatta',
  'hadapsar',
  'wagholi',
  'kothrud',
  'talawade',
  'aundh',
  'pashan',
  'chinchwad',
  'pimpri',
  'ravet',
  'moshi',
  'chakan',
  'bhosari',
  'dhanori',
  'kondhwa',
  'wanowrie',
  'swargate',
  'bibwewadi',
  'katraj',
  'dhankawadi',
  'warje',
  'erandwane',
  'deccan',
  'yerawada',
  'phursungi',
  'tathawade',
  'punawale',
  'marunji',
  'maan',
  'dighi',
  'charholi',
  'alandi',
  'mundhwa',
  'manjri',
  'handewadi',
  'pisoli',
  'ambegaon',
  'narhe',
  'dhayari',
  'pcmc',
  'pune'
];

/**
 * Extracts numeric budget bounds (in INR) from user search text
 * Handles expressions like "under 2 cr", "below 1.5 crore", "between 2 and 4 cr", "budget 80 lakh", "range 1 to 2 cr", "under 50k"
 */
export function parseBudgetAmounts(text: string): { minBudget: number | null; maxBudget: number | null } {
  if (!text) return { minBudget: null, maxBudget: null };
  const lower = text.toLowerCase().replace(/,/g, '');

  const toINR = (val: string, unit?: string): number => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return 0;
    const u = (unit || '').toLowerCase().trim();
    if (u.startsWith('cr') || u.startsWith('crore')) return Math.round(num * 10000000);
    if (u.startsWith('l') || u.startsWith('lac') || u.startsWith('lakh')) return Math.round(num * 100000);
    if (u.startsWith('k') || u.startsWith('thousand')) return Math.round(num * 1000);
    // If no unit but number is small like "2", check if "cr" or "crore" was anywhere nearby
    if (num <= 100 && /\b(?:cr|crore|crores)\b/i.test(lower)) return Math.round(num * 10000000);
    if (num <= 999 && /\b(?:lakh|lakhs|lac|lacs)\b/i.test(lower)) return Math.round(num * 100000);
    return Math.round(num);
  };

  // 1. Range: "between 1 cr to 2 cr", "between 1 and 2 cr", "1 to 2 cr", "1 - 2 cr", "1-2 cr", "range 1 to 2 cr", "50 to 80 lakh", "50l - 1cr"
  const rangeMatch = lower.match(
    /(?:between|range|from)?\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|lakh|lakhs|lac|lacs|l|k)?\s*(?:to|-|and|till)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|lakh|lakhs|lac|lacs|l|k)\b/i
  );
  if (rangeMatch) {
    const unit1 = rangeMatch[2] || rangeMatch[4];
    const unit2 = rangeMatch[4];
    const minBudget = toINR(rangeMatch[1], unit1);
    const maxBudget = toINR(rangeMatch[3], unit2);
    if (minBudget > 0 && maxBudget > 0) {
      return {
        minBudget: Math.min(minBudget, maxBudget),
        maxBudget: Math.max(minBudget, maxBudget)
      };
    }
  }

  // 2. Max: "under 2 cr", "below 2 cr", "less than 2 cr", "max 2 cr", "within 2 cr", "upto 2 cr", "up to 2 cr", "<= 2 cr", "< 2 cr", "budget under 2 cr", "sub-2 cr", "under 50l", "under 75k"
  const maxMatch = lower.match(
    /(?:under|below|less\s*than|up\s*to|upto|within|sub[-_\s]*|max(?:imum)?|<=?)\s*(?:budget\s*(?:of)?)?\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|lakh|lakhs|lac|lacs|l|k)?\b/i
  );
  if (maxMatch) {
    const maxBudget = toINR(maxMatch[1], maxMatch[2]);
    if (maxBudget > 0) {
      return { minBudget: null, maxBudget };
    }
  }

  // 3. Min: "above 2 cr", "over 2 cr", "more than 2 cr", "min 2 cr", "at least 2 cr", ">= 2 cr", "> 2 cr", "starting 2 cr", "starts from 2 cr"
  const minMatch = lower.match(
    /(?:above|over|more\s*than|min(?:imum)?|at\s*least|>=?|starting\s*(?:at|from)?|starts?\s*(?:at|from)?)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|lakh|lakhs|lac|lacs|l|k)?\b/i
  );
  if (minMatch) {
    const minBudget = toINR(minMatch[1], minMatch[2]);
    if (minBudget > 0) {
      return { minBudget, maxBudget: null };
    }
  }

  // 4. Exact/Target: "budget 2 cr", "budget of 2 cr", "budget: 2 cr", "around 2 cr", "in 2 cr", "for 2 cr", "approx 2 cr"
  const targetMatch = lower.match(
    /\b(?:budget\s*(?:is|of|around|:|approx)?|around|approx(?:imate)?|in|for)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|lakh|lakhs|lac|lacs|l|k)\b/i
  );
  if (targetMatch) {
    const target = toINR(targetMatch[1], targetMatch[2]);
    if (target > 0) {
      return {
        minBudget: Math.round(target * 0.7),
        maxBudget: Math.round(target * 1.15)
      };
    }
  }

  // 5. Standalone budget: "6cr", "6 cr", "6 crore", "₹6 cr", "around 6 cr", "50 lakh", "80l"
  const standaloneMatch = lower.match(/(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|lakh|lakhs|lac|lacs|l|k)\b/i);
  if (standaloneMatch) {
    const target = toINR(standaloneMatch[1], standaloneMatch[2]);
    if (target > 0) {
      return {
        minBudget: Math.round(target * 0.7),
        maxBudget: Math.round(target * 1.15)
      };
    }
  }

  // 6. Raw standalone numbers >= 10,000 (e.g. "under 5000000" or "under 50000")
  const rawNumMatch = lower.match(/(?:under|below|upto|within|<=?)\s*(?:rs\.?|₹|inr)?\s*(\d{5,10})\b/i);
  if (rawNumMatch) {
    const num = parseInt(rawNumMatch[1], 10);
    if (!isNaN(num) && num > 0) {
      return { minBudget: null, maxBudget: num };
    }
  }

  return { minBudget: null, maxBudget: null };
}

/**
 * Extracts raw price in INR number from property object
 */
export function getPropertyRawPrice(prop: {
  priceRaw?: number;
  price?: string;
}): number {
  if (typeof prop.priceRaw === 'number' && prop.priceRaw > 0) {
    return prop.priceRaw;
  }
  if (!prop.price) return 0;
  const str = prop.price.toLowerCase().replace(/,/g, '');
  const crMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore)/i);
  if (crMatch) return Math.round(parseFloat(crMatch[1]) * 10000000);
  const lMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)/i);
  if (lMatch) return Math.round(parseFloat(lMatch[1]) * 100000);
  const kMatch = str.match(/(\d+(?:\.\d+)?)\s*k/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
  const num = parseFloat(str.replace(/[^\d.]/g, ''));
  return isNaN(num) ? 0 : Math.round(num);
}

const STOP_NAME_WORDS = new Set([
  // Conversational & Search Filler
  'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them',
  'a', 'an', 'the', 'in', 'at', 'on', 'by', 'for', 'of', 'to', 'from', 'with', 'without', 'into',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'can', 'cant', "can't", 'could', 'should', 'would', 'will', 'shall',
  'want', 'wants', 'wanted', 'need', 'needs', 'needed', 'give', 'gives', 'gave', 'show', 'shows', 'showing',
  'tell', 'provide', 'providing', 'share', 'send', 'get', 'please', 'kindly', 'help',
  'search', 'searching', 'find', 'finding', 'look', 'looking', 'around',
  'some', 'any', 'all', 'every', 'other', 'this', 'that', 'these', 'those', 'here', 'there',
  'where', 'which', 'what', 'who', 'how', 'much', 'many',
  'like', 'type', 'types', 'kind', 'kinds', 'sort', 'sorts', 'thing', 'things', 'stuff', 'item', 'items',
  'related', 'fitting', 'fits', 'fitted', 'according', 'filter', 'filters', 'filtering', 'filtration',
  'filteration', 'searchbar', 'searchable', 'query', 'queries', 'wording', 'word', 'words', 'mean', 'means', 'meaning',
  'ready', 'move', 'available', 'availability', 'option', 'options', 'suggest', 'suggestions',
  'recommend', 'recommendation', 'recommendations', 'suitable', 'good', 'best', 'top', 'new', 'latest',
  'verified', 'verifieds', 'requirement', 'requirements', 'detail', 'details', 'info', 'information',
  'dossier', 'walkthrough', 'brochure', 'contact', 'call', 'inquiry', 'enquiry',
  'lead', 'leads', 'buyer', 'buyers', 'seller', 'sellers', 'owner', 'owners', 'investor', 'investors',
  'client', 'clients', 'person', 'persons', 'party', 'parties', 'match', 'matches', 'matched', 'matching',
  'connect', 'quote', 'quoting', 'explore',

  // Budget, Range & Number Terms
  'budget', 'budgets', 'budgeting', 'price', 'prices', 'pricing', 'cost', 'costs', 'costing',
  'rate', 'rates', 'value', 'valuation', 'target', 'range', 'ranges', 'bracket', 'segment',
  'under', 'below', 'above', 'over', 'upto', 'up', 'less', 'than', 'more', 'between',
  'min', 'minimum', 'max', 'maximum', 'sub', 'within', 'approx', 'approximate', 'approximately',
  'starting', 'starts', 'start', 'nearly', 'about', 'affordable', 'cheap', 'inexpensive',
  'low', 'high', 'mid', 'premium', 'luxury', 'ultra',
  'cr', 'crore', 'crores', 'lakh', 'lakhs', 'lac', 'lacs', 'k', 'thousand', 'thousands',
  'rs', 'inr', 'rupee', 'rupees', 'sqft', 'sq', 'ft', 'feet', 'foot', 'meter', 'meters',
  'yard', 'yards', 'carpet', 'builtup', 'super',

  // Typology, Category and Functional Terms (evaluated semantically, never as project names)
  'property', 'properties', 'real', 'estate', 'realty', 'commercial', 'residential',
  'office', 'offices', 'workspace', 'coworking', 'shop', 'shops', 'retail', 'store', 'stores',
  'showroom', 'showrooms', 'boutique', 'restaurant', 'restaurants', 'cafe', 'cafes', 'dining',
  'food', 'bistro', 'eatery', 'lounge', 'bar', 'pub', 'bakery', 'apartment', 'apartments',
  'flat', 'flats', 'villa', 'villas', 'bungalow', 'bunglow', 'bungalows', 'rowhouse', 'rowhouses',
  'penthouse', 'penthouses', 'home', 'homes', 'house', 'houses', 'bhk', 'rk', 'bed', 'bedroom', 'bedrooms',
  'hospital', 'hospitals', 'clinic', 'clinics', 'medical', 'healthcare', 'doctor', 'nursing',
  'dispensary', 'pharmacy', 'chemist', 'diagnostic', 'pathology', 'lab', 'dentist',
  'industrial', 'warehouse', 'warehouses', 'godown', 'godowns', 'factory', 'factories',
  'manufacturing', 'shed', 'sheds', 'logistics', 'land', 'plot', 'plots', 'agricultural',
  'prelease', 'preleases', 'preleased', 'pre-lease', 'pre-leased', 'prerent', 'prerented', 'pre-rented', 'roi', 'yield',
  'new', 'newly', 'latest', 'fresh', 'launch', 'launched', 'launching', 'prelaunch', 'pre-launch', 'upcoming', 'ready', 'move', 'resale', 'individual', 'group', 'booking', 'project', 'projects',
  'space', 'spaces', 'premise', 'premises', 'unit', 'units', 'floor', 'floors', 'tower', 'towers',
  'building', 'buildings', 'complex', 'center', 'centre', 'plaza',
  'buy', 'buyer', 'buying', 'bought', 'sale', 'sales', 'sell', 'seller', 'selling', 'sold',
  'lease', 'leasing', 'leased', 'rent', 'renting', 'rented', 'rental', 'rentals', 'tenanted', 'tenant', 'tenants',
  'jewellery', 'jewelry', 'gold', 'diamond', 'clothing', 'clothes', 'apparel', 'fashion', 'garment',
  'gym', 'fitness', 'crossfit', 'salon', 'spa', 'beauty', 'parlour', 'parlor',
  'supermarket', 'grocery', 'mart', 'bank', 'banking', 'atm', 'furniture', 'hardware', 'decor',
  'interior', 'footwear', 'shoes', 'optical', 'eyewear', 'glasses', 'coaching', 'tuition', 'classes', 'institute',

  // Generic Geographic, Street & Directional Suffixes (Never treated as distinctive project name words)
  'chowk', 'chowks', 'road', 'roads', 'rd', 'street', 'streets', 'st', 'lane', 'lanes',
  'circle', 'square', 'corner', 'junction', 'cross', 'crossroad', 'crossroads',
  'nagar', 'wadi', 'peth', 'pet', 'gali', 'marg', 'chowki', 'highway', 'bypass',
  'station', 'camp', 'bridge', 'flyover', 'annexe', 'east', 'west', 'north', 'south', 'central',
  'side', 'front', 'facing', 'touch', 'main', 'prime', 'near', 'nearby', 'opp', 'opposite', 'beside', 'behind',
  'gate', 'sector', 'phase', 'block'
]);

/**
 * Parses user search query into structured criteria flags with multi-category and multi-typology support.
 * The latest query takes absolute precedence over historical conversation context.
 */
export function parseQueryCriteria(queryText: string, conversationContext?: string): PropertyMatchCriteria {
  const lowerQuery = queryText.toLowerCase().replace(/[\/\\_-]+/g, ' ').trim();

  // 1. Strict Typology Detection on Current Query (collect ALL matched typologies)
  const typologyIntents: PropertyTypology[] = [];

  const hasResidential = /\b(?:residential|apartment|flat|home|house|villa|bungalow|bunglow|row\s*house)\b/i.test(lowerQuery);
  const hasApartment = /\b(?:apartment|apartments|flat|flats)\b/i.test(lowerQuery);
  const hasBungalow = /\b(?:bungalow|bunglow|villa|row\s*house)\b/i.test(lowerQuery);
  const hasHospital = /\b(?:hospital|clinic|medical|healthcare|doctor|nursing\s*home|dispensary)\b/i.test(lowerQuery);
  const hasIndustrial = /\b(?:industrial|warehouse|godown|factory|manufacturing|shed|logistics)\b/i.test(lowerQuery);
  const hasShowroom = /\b(?:showroom|display\s*center)\b/i.test(lowerQuery);
  const hasShop = /\b(?:shop|retail|store|boutique)\b/i.test(lowerQuery);
  const hasRestaurant = /\b(?:restaurant|restaurants|cafe|cafes|dining|food\s*court|coffee\s*shop|bistro|eatery|lounge|bar|pub|f&b)\b/i.test(lowerQuery);
  const hasOffice = /\b(?:office|it\s*park|tech\s*park|workspace|corporate|business\s*tower|coworking|commercial\s*space|office\s*space)\b/i.test(lowerQuery);
  const hasPreleased = /\b(?:pre[-_\s]*leased?|pre[-_\s]*rented?|rental\s*yield|roi|yield)\b/i.test(lowerQuery);
  const hasLand = /\b(?:plot|land|agricultural)\b/i.test(lowerQuery);
  const hasPenthouse = /\b(?:penthouse|sky\s*villa|sky\s*suite)\b/i.test(lowerQuery);

  if (hasResidential || hasPenthouse) typologyIntents.push('residential');
  if (hasHospital) typologyIntents.push('healthcare_hospital');
  if (hasIndustrial) typologyIntents.push('industrial');
  if (hasShowroom) typologyIntents.push('commercial_showroom');
  if (hasShop || hasRestaurant) typologyIntents.push('commercial_shop');
  if (hasOffice) typologyIntents.push('commercial_office');
  if (hasPreleased) typologyIntents.push('preleased');
  if (hasLand) typologyIntents.push('land_plot');

  // If user searched general "commercial" without specifying office/shop/etc.
  if (/\bcommercial\b/i.test(lowerQuery) && !hasOffice && !hasShop && !hasShowroom && !hasIndustrial && !hasRestaurant) {
    typologyIntents.push('commercial_office', 'commercial_showroom', 'commercial_shop');
  }

  // Multi-BHK detection: e.g. "2 bhk and 3 bhk", "2, 3 bhk", "2 or 3 bhk", "2 bhk 3 bhk"
  const bhkNums: number[] = [];
  const individualBhkMatches = Array.from(lowerQuery.matchAll(/\b([1-5])\s*(?:bhk|bed|bedroom)s?\b/gi));
  for (const m of individualBhkMatches) {
    const val = parseInt(m[1], 10);
    if (!bhkNums.includes(val)) bhkNums.push(val);
  }

  const multiBhkRegex = /\b([1-5])\s*(?:,|\/|-|and|or|\&)\s*([1-5])\s*(?:bhk|bed|bedroom)s?\b/gi;
  let mb;
  while ((mb = multiBhkRegex.exec(lowerQuery)) !== null) {
    const v1 = parseInt(mb[1], 10);
    const v2 = parseInt(mb[2], 10);
    if (!bhkNums.includes(v1)) bhkNums.push(v1);
    if (!bhkNums.includes(v2)) bhkNums.push(v2);
  }

  if (bhkNums.length > 0 && !typologyIntents.includes('residential')) {
    typologyIntents.push('residential');
  }

  const bhkNum = bhkNums.length === 1 ? bhkNums[0] : null;
  const typologyIntent = typologyIntents.length === 1 ? typologyIntents[0] : null;
  const isMultiCategory =
    typologyIntents.length > 1 ||
    bhkNums.length > 1 ||
    (hasPenthouse && hasApartment) ||
    (hasBungalow && hasApartment) ||
    (hasPenthouse && hasBungalow);

  // Business purpose slugs detection
  const purposeSlugs: string[] = [];
  if (/\b(?:jewellery|jewelry|gold|diamond)\b/i.test(lowerQuery)) purposeSlugs.push('jewellery-showroom');
  if (/\b(?:clothing|clothes|apparel|fashion|garment)\b/i.test(lowerQuery)) purposeSlugs.push('clothing-store');
  if (/\b(?:car\s*showroom|dealership|automobile)\b/i.test(lowerQuery)) purposeSlugs.push('car-showroom');
  if (/\b(?:two[-_\s]*wheeler|bike\s*showroom)\b/i.test(lowerQuery)) purposeSlugs.push('two-wheeler-showroom');
  if (/\b(?:electronics|mobile\s*store|gadgets)\b/i.test(lowerQuery)) purposeSlugs.push('electronics-store');
  if (/\b(?:furniture)\b/i.test(lowerQuery)) purposeSlugs.push('furniture-showroom');
  if (/\b(?:grocery|supermarket|mart|daily\s*needs)\b/i.test(lowerQuery)) purposeSlugs.push('grocery-supermarket');
  if (/\b(?:restaurant|cafe|dining|coffee\s*shop|food\s*joint|bistro|eatery)\b/i.test(lowerQuery)) purposeSlugs.push('restaurant-cafe');
  if (/\b(?:bakery|sweet\s*shop|sweets|pastry)\b/i.test(lowerQuery)) purposeSlugs.push('bakery-sweet-shop');
  if (/\b(?:pharmacy|medical\s*store|chemist)\b/i.test(lowerQuery)) purposeSlugs.push('pharmacy-medical-store');
  if (/\b(?:salon|beauty\s*parlour|parlor|spa)\b/i.test(lowerQuery)) purposeSlugs.push('salon-beauty-parlour');
  if (/\b(?:gym|fitness|crossfit)\b/i.test(lowerQuery)) purposeSlugs.push('gym-fitness-centre');
  if (/\b(?:bank|financial|atm)\b/i.test(lowerQuery)) purposeSlugs.push('bank-financial-services');
  if (/\b(?:consultancy|corporate\s*office)\b/i.test(lowerQuery)) purposeSlugs.push('office-consultancy');
  if (/\b(?:hardware|building\s*material)\b/i.test(lowerQuery)) purposeSlugs.push('hardware-building-materials');
  if (/\b(?:home\s*decor|interior)\b/i.test(lowerQuery)) purposeSlugs.push('home-decor-interior-showroom');
  if (/\b(?:footwear|shoes)\b/i.test(lowerQuery)) purposeSlugs.push('footwear-store');
  if (/\b(?:optical|optician|eyewear|glasses)\b/i.test(lowerQuery)) purposeSlugs.push('optical-store');
  if (/\b(?:coaching|tuition|educational|classes|institute)\b/i.test(lowerQuery)) purposeSlugs.push('educational-coaching-centre');
  if (/\b(?:clinic|diagnostic|pathology|lab|dentist)\b/i.test(lowerQuery)) purposeSlugs.push('clinic-diagnostic-centre');

  // Only if current query specifies NO typology, check previous user message (NEVER assistant text!)
  if (typologyIntents.length === 0 && conversationContext) {
    const userLines = conversationContext
      .split('\n')
      .filter((line) => line.toLowerCase().startsWith('user:'))
      .reverse()
      .map((line) => line.replace(/^user:\s*/i, '').toLowerCase());

    for (const uLine of userLines) {
      if (/\b(?:residential|apartment|flat|[1-5]\s*bhk|penthouse|villa|bungalow|home|house)\b/i.test(uLine)) {
        typologyIntents.push('residential');
        break;
      }
      if (/\b(?:hospital|clinic|medical|healthcare|doctor)\b/i.test(uLine)) {
        typologyIntents.push('healthcare_hospital');
        break;
      }
      if (/\b(?:industrial|warehouse|godown|factory|manufacturing|shed)\b/i.test(uLine)) {
        typologyIntents.push('industrial');
        break;
      }
      if (/\b(?:office|it\s*park|workspace|corporate)\b/i.test(uLine)) {
        typologyIntents.push('commercial_office');
        break;
      }
      if (/\b(?:shop|retail|showroom)\b/i.test(uLine)) {
        typologyIntents.push('commercial_retail');
        break;
      }
    }
  }

  // Locality: prioritize latest query first (collect all matches for multi-locality e.g. "Baner and Wakad")
  const matchedLocalities: string[] = [];
  let isExplicitLocality = false;
  for (const loc of KNOWN_PUNE_LOCALITIES) {
    if (new RegExp(`\\b${loc}\\b`, 'i').test(lowerQuery)) {
      matchedLocalities.push(loc);
      isExplicitLocality = true;
    }
  }

  // Natural language location extraction: matches "in <location>", "at <location>", "near <location>", etc.
  const prepLocMatch = lowerQuery.match(/\b(?:in|at|near|around|opposite|opp|close\s*to|towards)\s+([a-z0-9\s.,–-]+?)(?:\s+(?:under|below|above|upto|within|budget|for|with|having|from|requiring|needing|wanted|sale|rent|buy|lease)|\s*$)/i);
  if (prepLocMatch) {
    const rawCandidate = prepLocMatch[1].trim();
    const cleanedCandidate = rawCandidate
      .replace(/\b(?:property|properties|flat|flats|office|shop|showroom|space|pune|area|location|commercial|residential|residence|unit|units|site)\b/gi, '')
      .replace(/^[,\s–-]+|[,\s–-]+$/g, '')
      .trim();
    if (cleanedCandidate.length >= 3 && !['pune', 'pcmc', 'area', 'city'].includes(cleanedCandidate)) {
      if (!matchedLocalities.includes(cleanedCandidate)) {
        matchedLocalities.unshift(cleanedCandidate);
        isExplicitLocality = true;
      }
    }
  }

  let matchedLocality: string | null = matchedLocalities.length > 0 ? matchedLocalities[0] : null;

  if (!matchedLocality && conversationContext) {
    const userLines = conversationContext
      .split('\n')
      .filter((line) => line.toLowerCase().startsWith('user:'))
      .map((line) => line.replace(/^user:\s*/i, ''))
      .join('\n')
      .toLowerCase();

    for (const loc of KNOWN_PUNE_LOCALITIES) {
      if (new RegExp(`\\b${loc}\\b`, 'i').test(userLines)) {
        matchedLocality = loc;
        matchedLocalities.push(loc);
        isExplicitLocality = false;
        break;
      }
    }
  }

  // Budget
  let { minBudget, maxBudget } = parseBudgetAmounts(queryText);
  if (minBudget === null && maxBudget === null && conversationContext) {
    const reversedUserLines = conversationContext
      .split('\n')
      .reverse()
      .filter((line) => line.toLowerCase().startsWith('user:'));
    for (const line of reversedUserLines) {
      const cleanLine = line.replace(/^user:\s*/i, '');
      if (/\b(?:asking|quoting|expected\s*price)\b/i.test(cleanLine)) continue;
      const parsed = parseBudgetAmounts(cleanLine);
      if (parsed.minBudget !== null || parsed.maxBudget !== null) {
        minBudget = parsed.minBudget;
        maxBudget = parsed.maxBudget;
        break;
      }
    }
  }

  // Locality tokens to exclude from project name words
  const localityWordTokens = new Set<string>();
  for (const loc of KNOWN_PUNE_LOCALITIES) {
    loc.toLowerCase().split(/\s+/).forEach((tok) => {
      if (tok.length >= 2) localityWordTokens.add(tok);
    });
  }

  // Name words extracted from query (distinctive project/developer/building names)
  const nameWords = lowerQuery
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => {
      if (w.length < 3) return false;
      if (STOP_NAME_WORDS.has(w)) return false;
      if (localityWordTokens.has(w)) return false;
      if (/^\d+(?:cr|crore|lakh|lac|l|k)?$/.test(w)) return false;
      return true;
    });

  // Transaction Type Extraction (Sale vs Rent vs Preleased)
  let transactionType: 'sale' | 'rent' | 'preleased' | null = null;
  if (/\b(?:pre[-_\s]*leased?|pre[-_\s]*rented?|roi|rental\s*yield)\b/i.test(lowerQuery)) {
    transactionType = 'preleased';
  } else if (/\b(?:for\s*rent|rent|lease|on\s*rent|to\s*let|per\s*month|\/month)\b/i.test(lowerQuery)) {
    transactionType = 'rent';
  } else if (/\b(?:for\s*sale|sale|buy|purchase|resale)\b/i.test(lowerQuery)) {
    transactionType = 'sale';
  }

  // Sq.Ft. Area Range or Amount Extraction (e.g. "870-900 Sq.Ft.", "1200 sqft")
  let minSqft: number | null = null;
  let maxSqft: number | null = null;
  const sqftRangeMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s*(?:[-–to]+)\s*(\d+(?:\.\d+)?)\s*(?:sqft|sq\.ft|square\s*feet|sq\s*ft)?/i);
  if (sqftRangeMatch && lowerQuery.includes('sq')) {
    minSqft = parseFloat(sqftRangeMatch[1]);
    maxSqft = parseFloat(sqftRangeMatch[2]);
  } else {
    const singleSqftMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s*(?:sqft|sq\.ft|square\s*feet|sq\s*ft)/i);
    if (singleSqftMatch) {
      const val = parseFloat(singleSqftMatch[1]);
      minSqft = Math.round(val * 0.85);
      maxSqft = Math.round(val * 1.15);
    }
  }

  // Descriptive property keywords: e.g. "terrace", "frontage", "ceiling height", "pillar free", "mezzanine", "basement", "restaurant", "cafe", "highway facing", "main road", "high footfall", "ready to move", "immediate possession"
  const descriptionKeywords: string[] = [];
  const descCandidates = [
    'terrace', 'restaurant', 'cafe', 'frontage', 'ceiling', 'pillar', 'mezzanine', 'basement',
    'power backup', 'backup', 'parking', 'footfall', 'furnished', 'unfurnished', 'bare shell',
    'warm shell', 'glass facade', 'facade', 'high street', 'road facing', 'road touch', 'highway touch',
    'highway facing', 'corner', 'ground floor', 'penthouse', 'garden', 'pool', 'gym', 'amenities',
    'preleased', 'pre-leased', 'roi', 'rental yield', 'hospital', 'clinic', 'diagnostic', 'doctor'
  ];
  for (const dc of descCandidates) {
    if (lowerQuery.includes(dc)) {
      descriptionKeywords.push(dc);
    }
  }

  const isViewOrProvideRequest = /\b(?:prov(?:ide|iede)|show|view|see|give|send|share|details|dossier|walkthrough)\b/i.test(lowerQuery);

  const hasSpecificIntent =
    typologyIntents.length > 0 ||
    bhkNums.length > 0 ||
    matchedLocality !== null ||
    minBudget !== null ||
    maxBudget !== null ||
    purposeSlugs.length > 0 ||
    nameWords.length > 0 ||
    descriptionKeywords.length > 0 ||
    transactionType !== null ||
    minSqft !== null ||
    isViewOrProvideRequest;

  return {
    isHospital: typologyIntents.includes('healthcare_hospital'),
    isShowroom: typologyIntents.includes('commercial_showroom'),
    isOffice: typologyIntents.includes('commercial_office'),
    isShop: typologyIntents.includes('commercial_shop'),
    isWarehouse: typologyIntents.includes('industrial'),
    isIndustrial: typologyIntents.includes('industrial'),
    isLand: typologyIntents.includes('land_plot'),
    isPreleased: typologyIntents.includes('preleased'),
    isResidential: typologyIntents.includes('residential'),
    isPenthouse: hasPenthouse,
    bhkNum,
    bhkNums,
    locality: matchedLocality,
    localities: matchedLocalities,
    isExplicitLocality,
    minBudget,
    maxBudget,
    typologyIntent,
    typologyIntents,
    purposeSlugs,
    nameWords,
    descriptionKeywords,
    hasSpecificIntent,
    isMultiCategory,
    transactionType,
    minSqft,
    maxSqft
  };
}

/**
 * Calculates a relevance score for a property against query criteria.
 * Strict zero-tolerance disqualification for cross-typology matches (e.g. hospital for residential).
 * Supports union / OR matching when multiple categories, typologies, or BHKs are searched.
 */
export function scorePropertyMatch(
  prop: {
    name?: string;
    title?: string;
    locality?: string;
    location?: string;
    description?: string;
    configuration?: string;
    bhk?: string;
    type_name?: string;
    bhkNum?: number;
    isCommercial?: boolean;
    priceRaw?: number;
    price?: string;
    businessPurposes?: { id: number; name: string; slug: string }[];
  },
  criteria: PropertyMatchCriteria
): number {
  if (!criteria.hasSpecificIntent) {
    return 10;
  }

  const pTypology = detectPropertyTypology(prop);

  // Construct comprehensive searchable text covering description, highlights, dossier, tags, landmarks
  const pDossier = (prop as any).dossier || (prop as any).dossierData || {};
  const dossierHighlights = Array.isArray(pDossier.highlights) ? pDossier.highlights.join(' ') : '';
  const dossierSuitable = Array.isArray(pDossier.suitableFor) ? pDossier.suitableFor.join(' ') : (typeof pDossier.suitableFor === 'string' ? pDossier.suitableFor : '');
  const tagsText = Array.isArray((prop as any).tags) ? (prop as any).tags.join(' ') : String((prop as any).tags || '');
  const searchKeywordsText = String((prop as any).searchKeyword || (prop as any).SearchKeyword || '');
  const landmarkText = String((prop as any).landmark || (prop as any).Landmark || '');
  const bldgText = String((prop as any).buildingName || (prop as any).BuildingName || (prop as any).propertyName || '');
  const addressText = String((prop as any).address || (prop as any).fullAddress || '');

  const txClassText = `${(prop as any).transactionClassification || ''} ${pDossier.TransactionName || ''} ${pDossier.PropertyTypeName || ''}`;
  const titleAndDesc = `${prop.title || ''} ${prop.name || ''} ${prop.configuration || ''} ${prop.bhk || ''} ${prop.type_name || ''} ${txClassText} ${prop.locality || ''} ${prop.location || ''} ${prop.description || ''} ${dossierHighlights} ${dossierSuitable} ${tagsText} ${searchKeywordsText} ${landmarkText} ${bldgText} ${addressText}`.toLowerCase();

  // 0. STRICT TYPOLOGY BOUNDARY ENFORCEMENT (UNION / OR MATCHING ACROSS ALL INTENTS)
  const intentsToCheck = criteria.typologyIntents && criteria.typologyIntents.length > 0
    ? criteria.typologyIntents
    : (criteria.typologyIntent ? [criteria.typologyIntent] : []);

  if (intentsToCheck.length > 0) {
    const matchesAnyTypology = intentsToCheck.some((intent) => {
      if (intent === 'residential') return pTypology === 'residential';
      if (intent === 'healthcare_hospital') return pTypology === 'healthcare_hospital';
      if (intent === 'industrial') return pTypology === 'industrial';
      if (intent === 'commercial_office') {
        const isOfficeDirect = pTypology === 'commercial_office' || titleAndDesc.includes('office') || titleAndDesc.includes('workspace') || titleAndDesc.includes('it park');
        const isShopOrRetail = (pTypology === 'commercial_shop' || pTypology === 'commercial_showroom') && !titleAndDesc.includes('office');
        if (isShopOrRetail) return false;
        return isOfficeDirect || (pTypology === 'preleased' && (titleAndDesc.includes('office') || titleAndDesc.includes('commercial')));
      }
      if (intent === 'commercial_showroom') {
        return (
          pTypology === 'commercial_showroom' ||
          pTypology === 'commercial_shop' ||
          titleAndDesc.includes('showroom') ||
          (prop.isCommercial && !titleAndDesc.includes('residential'))
        );
      }
      if (intent === 'commercial_shop') {
        if (criteria.purposeSlugs && criteria.purposeSlugs.includes('restaurant-cafe')) {
          const isFnb =
            titleAndDesc.includes('restaurant') ||
            titleAndDesc.includes('cafe') ||
            titleAndDesc.includes('dining') ||
            titleAndDesc.includes('terrace') ||
            titleAndDesc.includes('food') ||
            titleAndDesc.includes('f&b');
          if (!isFnb && pTypology !== 'commercial_shop') return false;
        }
        return (
          pTypology === 'commercial_shop' ||
          pTypology === 'commercial_showroom' ||
          titleAndDesc.includes('shop') ||
          (prop.isCommercial && !titleAndDesc.includes('residential'))
        );
      }
      if (intent === 'commercial_retail') {
        return (
          pTypology === 'commercial_retail' ||
          pTypology === 'commercial_showroom' ||
          pTypology === 'commercial_shop' ||
          (prop.isCommercial && !titleAndDesc.includes('residential'))
        );
      }
      if (intent === 'preleased') {
        const compactText = titleAndDesc.replace(/[-_\s/]+/g, '');
        return (
          Boolean((prop as any).isPreleased) ||
          pTypology === 'preleased' ||
          compactText.includes('prelease') ||
          compactText.includes('prerented') ||
          compactText.includes('prerent') ||
          titleAndDesc.includes('yield')
        );
      }
      if (intent === 'land_plot') return pTypology === 'land_plot';
      return false;
    });

    if (!matchesAnyTypology) {
      return -999;
    }
  }

  // 1. STRICT BUDGET ENFORCEMENT
  const propPrice = getPropertyRawPrice(prop);
  if (propPrice > 0) {
    if (criteria.maxBudget && propPrice > criteria.maxBudget) {
      return -999;
    }
    if (criteria.minBudget && propPrice < criteria.minBudget) {
      return -999;
    }
  }

  // Base score for matching typology
  let score = 80;

  // 2. NAME WORDS MATCHING (High precision bonus for project, developer, building names)
  if (criteria.nameWords && criteria.nameWords.length > 0) {
    let matchedNameWordsCount = 0;
    for (const word of criteria.nameWords) {
      if (titleAndDesc.includes(word)) {
        matchedNameWordsCount++;
        score += 120;
      }
    }
    // Strict Project / Name Enforcement:
    // If user searched distinctive project/entity keywords, any property matching 0 of them is disqualified.
    if (matchedNameWordsCount === 0) {
      return -999;
    }
  }

  // 2b. DESCRIPTION & SPECIFICATION KEYWORDS MATCHING (+150 per matched keyword in description/dossier)
  if (criteria.descriptionKeywords && criteria.descriptionKeywords.length > 0) {
    for (const dk of criteria.descriptionKeywords) {
      if (titleAndDesc.includes(dk)) {
        score += 150;
      }
    }
  }

  // 3. LOCALITY MATCHING (STRICT LOCALITY MATCHING)
  const locsToCheck = criteria.localities && criteria.localities.length > 0
    ? criteria.localities
    : (criteria.locality ? [criteria.locality] : []);

  if (locsToCheck.length > 0) {
    const propLocalityText = `${prop.locality || ''} ${prop.location || ''} ${prop.title || ''} ${prop.name || ''} ${addressText} ${landmarkText} ${bldgText}`.toLowerCase();
    const matchesPrimaryLoc = locsToCheck.some((loc) => {
      if (propLocalityText.includes(loc)) return true;
      const coreWords = loc.split(/\s+/).filter((w) => !['chowk', 'road', 'rd', 'street', 'st', 'lane', 'corner', 'circle', 'nagar', 'wadi', 'camp'].includes(w));
      if (coreWords.length > 0 && coreWords.every((w) => propLocalityText.includes(w))) {
        return true;
      }
      return false;
    });

    if (matchesPrimaryLoc) {
      score += 400; // Major boost for matching exact location / chowk
    } else if (criteria.isExplicitLocality) {
      return -999; // Disqualify non-matching locations when user explicitly asked for this location
    } else {
      score -= 80;
    }
  }

  // 3b. TRANSACTION TYPE MATCHING (Sale vs Rent)
  if (criteria.transactionType) {
    const rawListingType = String((prop as any).listingType || (prop as any).listing_type || '').toLowerCase();
    const isRentProp = rawListingType.includes('rent') || rawListingType.includes('lease') || titleAndDesc.includes('for rent');
    const isSaleProp = rawListingType.includes('sale') || rawListingType.includes('buy') || titleAndDesc.includes('for sale') || (!isRentProp && (prop.priceRaw || 0) > 1000000);

    if (criteria.transactionType === 'sale') {
      if (isSaleProp) {
        score += 250;
      } else if (isRentProp) {
        score -= 600;
      }
    } else if (criteria.transactionType === 'rent') {
      if (isRentProp) {
        score += 250;
      } else if (isSaleProp) {
        score -= 600;
      }
    }
  }

  // 3c. SQ.FT. MATCHING
  if (criteria.minSqft || criteria.maxSqft) {
    const pSqft = (prop as any).sqftNum || (prop as any).sqft_num || (typeof (prop as any).sqft === 'number' ? (prop as any).sqft : parseFloat(String((prop as any).sqft || '').replace(/,/g, '')) || 0);
    if (pSqft > 0) {
      if (criteria.minSqft && criteria.maxSqft) {
        if (pSqft >= criteria.minSqft * 0.85 && pSqft <= criteria.maxSqft * 1.15) {
          score += 300; // Major boost for matching exact size range!
        } else {
          const mid = (criteria.minSqft + criteria.maxSqft) / 2;
          const diff = Math.abs(pSqft - mid) / mid;
          if (diff > 0.3) score -= 150;
        }
      }
    }
  }

  // 4. SPECIFIC BHK (1, 2, 3, 4, 5 BHK - UNION MATCHING)
  const bhksToCheck = criteria.bhkNums && criteria.bhkNums.length > 0
    ? criteria.bhkNums
    : (criteria.bhkNum !== null ? [criteria.bhkNum] : []);

  if (bhksToCheck.length > 0) {
    if (pTypology !== 'residential') return -999;
    const propBhkMatches = bhksToCheck.some((bhkVal) => {
      return (
        prop.bhkNum === bhkVal ||
        (prop.bhk && new RegExp(`\\b${bhkVal}\\s*bhk\\b`, 'i').test(prop.bhk)) ||
        (prop.configuration && new RegExp(`\\b${bhkVal}\\s*bhk\\b`, 'i').test(prop.configuration)) ||
        new RegExp(`\\b${bhkVal}\\s*bhk\\b`, 'i').test(prop.name || prop.title || '')
      );
    });

    if (propBhkMatches) {
      score += 150;
    } else {
      return -999; // Disqualify wrong BHK
    }
  }

  // 5. BUSINESS PURPOSE MATCHING (e.g. jewellery, restaurant, clothing)
  if (criteria.purposeSlugs && criteria.purposeSlugs.length > 0) {
    const propPurposes = prop.businessPurposes || [];
    const propPurposesText = propPurposes.map((bp) => `${bp.slug} ${bp.name}`).join(' ').toLowerCase();
    const matchesAnyPurpose = criteria.purposeSlugs.some(
      (slug) => propPurposesText.includes(slug) || titleAndDesc.includes(slug.replace(/-/g, ' '))
    );
    if (matchesAnyPurpose) {
      score += 180;
    }
  }

  return score;
}

/**
 * Filter and sort properties to strictly return the most relevant matches.
 * Returns empty array if no properties match the specific user criteria.
 */
export function getBestMatchingProperties<
  T extends {
    name?: string;
    title?: string;
    locality?: string;
    location?: string;
    description?: string;
    configuration?: string;
    bhk?: string;
    type_name?: string;
    bhkNum?: number;
    isCommercial?: boolean;
    priceRaw?: number;
    price?: string;
  }
>(properties: T[], queryText: string, maxResults = 8, conversationContext?: string): T[] {
  if (!Array.isArray(properties) || properties.length === 0) return [];

  const lower = queryText.toLowerCase().trim();

  // If greeting or pure pleasantry, NEVER return property cards
  const isGreeting = /^(?:hi|hello|hey|namaste|pranam|good\s*(?:morning|afternoon|evening)|hola|sup|hii|heyy)\b/i.test(lower);
  if (isGreeting) {
    return [];
  }

  // If general inquiry about types/spectrum of properties, NEVER return property cards
  const isGeneralFAQ = /\b(?:how\s*many\s*types?|what\s*types?|types?\s*of\s*properties|property\s*types|what\s*(?:kind\s*of\s*)?properties|which\s*properties|what\s*do\s*you\s*have|tell\s*me\s*about\s*your\s*properties|which\s*of\s*these\s*fits)\b/i.test(lower);
  if (isGeneralFAQ) {
    return [];
  }

  const criteria = parseQueryCriteria(queryText, conversationContext);

  // Check if user explicitly asked to browse or view properties
  const isExplicitBrowse = /\b(?:show|view|see|browse|list|all|catalog|explore|available)\s*(?:of\s*)?(?:the\s*)?(?:verified\s*)?(?:properties|inventory|listings|projects|flats|offices|units)\b/i.test(lower);

  // If query has no specific intent, only return properties if explicitly asked to view/browse
  if (!criteria.hasSpecificIntent) {
    return isExplicitBrowse ? properties.slice(0, maxResults) : [];
  }

  const scored = properties
    .map((p) => ({ property: p, score: scorePropertyMatch(p, criteria) }))
    .filter((item) => {
      if (item.score <= 0) return false;
      const price = getPropertyRawPrice(item.property);
      if (price > 0) {
        if (criteria.maxBudget && price > criteria.maxBudget) return false;
        if (criteria.minBudget && price < criteria.minBudget) return false;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score);

  const topScore = scored.length > 0 ? scored[0].score : 0;
  const filteredByRelevance = topScore >= 200
    ? scored.filter((item) => item.score >= topScore * 0.45)
    : scored;

  return filteredByRelevance.slice(0, maxResults).map((s) => s.property);
}

