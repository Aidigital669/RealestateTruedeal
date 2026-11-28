/**
 * Pure parsing and intent classification for seller queries.
 * Safe to import in both Client and Server Components (no node/db dependencies).
 */

export interface SellerIntentAnalysis {
  isGeneralSellerQuery: boolean;
  isUnrecognized: boolean;
  unrecognizedTerm?: string;
  categoryLabel?: string;
  hasSpecificCriteria: boolean;
  matchedLocality?: string;
  isCommercialGeneral?: boolean;
  isOffice?: boolean;
  isResidential?: boolean;
}

/**
 * Robustly detects whether a user is an owner/seller based on current query and multi-turn conversation context.
 */
export function isUserSeller(queryText: string, conversationContext?: string): boolean {
  const lowerQuery = (queryText || '').toLowerCase().trim();

  // 1. Direct buyer looking to purchase/rent property (explicitly wants to BUY properties, not looking for buyers)
  const isDirectBuyerOverride =
    /\b(?:i\s*am\s*a\s*buyer\s*(?:looking|wanting)?\s*to\s*buy|buyer\s*looking\s*to\s*buy|want\s*to\s*buy|looking\s*to\s*buy|plan\s*to\s*buy|wish\s*to\s*buy|ready\s*to\s*buy|buy\s+(?:a|an|the|\d+|me|properties|property|flat|apartment|office|commercial|hospital)|show\s*(?:me\s*)?(?:\d+\s*bhk|properties|flats|apartments|offices)|i\s*want\s*to\s*invest)\b/i.test(lowerQuery) &&
    !/\b(?:buyers?\s*for|need\s*(?:a\s*)?buyers?|want\s*(?:a\s*)?buyers?|looking\s*for\s*(?:a\s*)?buyers?|sell|selling|seller)\b/i.test(lowerQuery);
  if (isDirectBuyerOverride) {
    return false;
  }

  // 2. Direct seller / "show buyers" phrases in current query ("buyer", "buyers", "seller", "i need a buyer...")
  const directSellerRegex =
    /\b(?:sell|selling|sellers?|buyers?|list\s*(?:my)?\s*property|owner|property\s*person\s*says)\b/i;
  const ownerPropertyRegex =
    /\b(?:my\s+(?:this\s+)?(?:property|flat|apartment|office|shop|showroom|penthouse|building|land|plot|commercial|residence)\s*(?:is|in|at|located|asking|needs?)|i\s+(?:have|own|got)\s+(?:a\s+)?(?:\d+\s*bhk|flat|apartment|office|property|commercial)|asking\s*price|quoting\s*price|expected\s*price|carpet\s*area\s*of\s*my|builtup\s*area\s*of\s*my)\b/i;

  if (directSellerRegex.test(lowerQuery) || ownerPropertyRegex.test(lowerQuery)) {
    return true;
  }

  // 3. Conversation context check: Was this user identified as a seller in earlier turns?
  if (conversationContext) {
    const userLines = conversationContext
      .split('\n')
      .filter((line) => line.toLowerCase().startsWith('user:'))
      .map((line) => line.replace(/^user:\s*/i, '').trim());

    let wasSeller = false;
    for (const line of userLines) {
      if (directSellerRegex.test(line) || ownerPropertyRegex.test(line)) {
        wasSeller = true;
      }
      if (/\b(?:want\s*to\s*buy|looking\s*to\s*buy|buy\s*a\s*property)\b/i.test(line)) {
        wasSeller = false;
      }
    }

    if (wasSeller) {
      return true;
    }
  }

  return false;
}

export function detectSellerTypologyAndLocality(queryText: string): SellerIntentAnalysis {
  const lower = queryText.toLowerCase().trim();

  // Strip common seller and intent boilerplate words to isolate genuine typologies or unrecognized subjects
  const stripped = lower
    .replace(
      /\b(?:i|we|my|me|please|can|you|want|need|looking|seek|would|like|to|sell|selling|seller|list|listing|have|a|an|the|is|in|at|for|it|pune|maharashtra|property|properties|real\s*estate|buyer|buyers|client|clients|mandate|mandates|investor|investors|customer|customers|lead|leads|find|match|matching|get|connect|give|show|provide|space|spaces|unit|units|premise|premises|commercial|residential|flat|flats|apartment|apartments|penthouse|penthouses|villa|villas|bungalow|bungalows|office|offices|showroom|showrooms|shop|shops|hospital|hospitals|clinic|clinics)\b/gi,
      ' '
    )
    .replace(/\b\d+\s*bhk\b/gi, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const isHospital = /\b(?:hospital|medical|clinic|doctor|healthcare|dispensary)\b/i.test(lower);
  const isShowroom = /\b(?:showroom|display\s*center)\b/i.test(lower);
  const isOffice = /\b(?:office|it\s*park|coworking|workspace|corporate|commercial\s*office|business\s*center)\b/i.test(lower);
  const isShop = /\b(?:shop|retail|commercial\s*shop)\b/i.test(lower);
  const isPreleased = /\b(?:pre[-_\s]*leased|prelease|roi|yield|investment)\b/i.test(lower);
  const isCommercialGeneral = !isOffice && !isShowroom && !isShop && !isHospital && !isPreleased && /\b(?:commercial|commercial\s*property|commercial\s*space|commercial\s*unit|commercial\s*real\s*estate)\b/i.test(lower);
  const bhkMatch = lower.match(/\b([1-9])\s*bhk\b/i);
  const isResidential = Boolean(bhkMatch) || /\b(?:flat|flats|apartment|apartments|penthouse|penthouses|villa|villas|bungalow|bungalows|residence|residences|residential)\b/i.test(lower);
  const isPlot = /\b(?:plot|land|industrial\s*land|na\s*plot)\b/i.test(lower);

  const localities = [
    'baner', 'balewadi', 'kalyani nagar', 'koregaon park', 'undri', 'nibm',
    'hinjewadi', 'wakad', 'camp', 'viman nagar', 'kharadi', 'jm road',
    'shivaji nagar', 'magarpatta', 'hadapsar', 'kothrud', 'bavdhan', 'aundh',
    'pashan', 'senapati bapat', 'sb road', 'wanowrie', 'kondhwa', 'fatima nagar'
  ];
  const matchedLocality = localities.find((loc) => lower.includes(loc));

  const hasSpecificCriteria = Boolean(
    isHospital || isShowroom || isOffice || isShop || isPreleased ||
    isCommercialGeneral || bhkMatch || isResidential || isPlot || matchedLocality
  );

  let categoryLabel: string | undefined;
  if (isOffice) categoryLabel = 'Commercial Office Space';
  else if (isHospital) categoryLabel = 'Commercial Medical / Hospital';
  else if (isShowroom) categoryLabel = 'Commercial Showroom';
  else if (isShop) categoryLabel = 'Commercial Retail Shop';
  else if (isPreleased) categoryLabel = 'Pre-Leased Commercial';
  else if (isCommercialGeneral) categoryLabel = 'Commercial Properties (Offices, Showrooms & Pre-Leased)';
  else if (bhkMatch) categoryLabel = `${bhkMatch[1]} BHK Residential`;
  else if (isResidential) categoryLabel = 'Luxury Residential (Apartments & Penthouses)';
  else if (isPlot) categoryLabel = 'Plot & Land';
  else if (matchedLocality) categoryLabel = `Properties in ${matchedLocality.toUpperCase()}`;

  // If there are words left over that don't match any criteria
  const isUnrecognized = !hasSpecificCriteria && stripped.length > 1;

  return {
    isGeneralSellerQuery: !hasSpecificCriteria && !isUnrecognized,
    isUnrecognized,
    unrecognizedTerm: isUnrecognized ? stripped : undefined,
    categoryLabel,
    hasSpecificCriteria,
    matchedLocality,
    isCommercialGeneral,
    isOffice,
    isResidential
  };
}
