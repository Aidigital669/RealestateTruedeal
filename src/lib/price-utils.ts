/**
 * Shared Indian real estate price parsing, formatting, and resolution utilities.
 * Browser-safe (zero Node/DB imports) so both API routes and Client Components stay 100% consistent.
 */

const ZERO_TEXT_RE = /^(?:price\s*on\s*request|on\s*request|not\s*disclosed|negotiable|confidential|n\/?a|tbd|-|—)$/i;
const ZERO_NUM_RE = /^[₹\s]*(?:rs\.?|inr)?\s*0+(?:\.0+)?\s*(?:cr|crore|crores|lac|lakh|lakhs|lacs|l|th|thousand|k)?(?:\s*(?:\/|per)\s*(?:mo|month|months|pm|p\.m\.?))?$/i;

/**
 * Parses any Indian currency string or number (Cr, Crore, Lakh, Lac, L, Th, Thousand, K,
 * `/ month`, `₹`, `Rs.`, plain numbers, or `Price on Request` -> `0`) into an integer Rupee amount.
 * Returns `null` only when the input is empty or completely unparseable.
 */
export function parseIndianPriceToNumber(rawVal: unknown): number | null {
  if (rawVal === undefined || rawVal === null) return null;
  if (typeof rawVal === 'number') {
    return isNaN(rawVal) || !isFinite(rawVal) ? null : Math.round(rawVal);
  }

  const s = String(rawVal).trim();
  if (!s) return null;
  if (ZERO_TEXT_RE.test(s) || ZERO_NUM_RE.test(s)) return 0;

  // Strip currency prefixes, commas, and billing/descriptive suffixes
  const cleaned = s
    .replace(/,/g, '')
    .replace(/₹|\brs\.?|\binr\b/gi, ' ')
    .replace(/(?:\/|\bper\b)\s*(?:mo|month|months|pm|p\.m\.?)\b/gi, ' ')
    .replace(/\b(?:all\s*inclusive|onwards|approx\.?|only)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return null;
  if (ZERO_TEXT_RE.test(cleaned) || ZERO_NUM_RE.test(cleaned)) return 0;

  // 1. Crore (e.g. "1.26 Cr", "2.5Cr", "15 Crore")
  const crMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)\b/i);
  if (crMatch) {
    const val = parseFloat(crMatch[1]);
    return isNaN(val) || !isFinite(val) ? null : Math.round(val * 10000000);
  }

  // 2. Lakh / Lac / L (e.g. "5.40 Lac", "85 Lakh", "40 L")
  const lacMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:lac|lakh|lakhs|lacs|l)\b/i);
  if (lacMatch) {
    const val = parseFloat(lacMatch[1]);
    return isNaN(val) || !isFinite(val) ? null : Math.round(val * 100000);
  }

  // 3. Thousand / Th / K (e.g. "60 Th", "45 Thousand", "50k")
  const thMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:th|thousand|k)\b/i);
  if (thMatch) {
    const val = parseFloat(thMatch[1]);
    return isNaN(val) || !isFinite(val) ? null : Math.round(val * 1000);
  }

  // 4. Plain numeric string (e.g. "60000", "7500000", "14000.00")
  const plainMatch = cleaned.match(/\d+(?:\.\d+)?/);
  if (plainMatch) {
    const val = parseFloat(plainMatch[0]);
    return isNaN(val) || !isFinite(val) ? null : Math.round(val);
  }

  return null;
}

/**
 * Formats a Rupee value (number or Indian currency string) into the canonical UI string:
 * - `>= 1 Cr`: `₹X.XX Cr`
 * - `>= 1 Lakh`: `₹X.X Lakh` (preserves 2 decimals like `₹1.25 Lakh`, uses 1 decimal like `₹40.0 Lakh`)
 * - `> 0 && < 1 Lakh`: `₹60,000` (comma-formatted IN locale, never `₹0.6 Lakh`)
 * - `<= 0` or empty: `Price on Request`
 */
export function formatIndianPrice(rawPrice: unknown): string {
  const num = typeof rawPrice === 'number' ? rawPrice : parseIndianPriceToNumber(rawPrice);
  if (num === null || isNaN(num) || !isFinite(num) || num <= 0) {
    return 'Price on Request';
  }
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    const lakhStr = (num / 100000).toFixed(2).replace(/(\.\d)0$/, '$1');
    return `₹${lakhStr} Lakh`;
  }
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

/**
 * Checks whether a price value represents zero / undisclosable ("Price on Request").
 */
export function isZeroPrice(val: string | number | undefined | null): boolean {
  if (val === undefined || val === null || val === '') return true;
  const parsed = parseIndianPriceToNumber(val);
  return parsed === null || parsed <= 0;
}

/**
 * Formats any display price cleanly while preserving pre-formatted strings when valid.
 */
export function formatPriceDisplay(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === '') return 'Price on Request';
  if (isZeroPrice(val)) return 'Price on Request';
  const parsed = parseIndianPriceToNumber(val);
  if (parsed === null || parsed <= 0) return 'Price on Request';
  return formatIndianPrice(parsed);
}

/**
 * Canonical price resolver across DB columns (`price`, `rent`, `monthlyRent`, `listingType`)
 * and dossier metadata (`ExpectedPrice`, `RentPM`, `Price`).
 *
 * Positive `p.price` (set by Admin/Sales edits or Sale imports) always wins over stale `dossier.ExpectedPrice`
 * so price edits immediately propagate across every endpoint without being shadowed by legacy Excel metadata.
 */
export function resolvePropertyPrice(
  row: {
    price?: unknown;
    rent?: unknown;
    monthlyRent?: unknown;
    listingType?: unknown;
    listing_type?: unknown;
  },
  dossier: Record<string, any> = {}
): { numPrice: number; formattedPrice: string; isRent: boolean; priceSuffix: string } {
  const rawLt = String(
    row.listingType ?? row.listing_type ?? dossier.Lease_Sale ?? dossier.TransactionName ?? ''
  ).toLowerCase();
  const isRent = rawLt.includes('rent') || rawLt.includes('lease');

  const pPrice =
    row.price !== null && row.price !== undefined && String(row.price).trim() !== ''
      ? parseIndianPriceToNumber(row.price)
      : null;
  const pRent =
    row.rent !== null && row.rent !== undefined && String(row.rent).trim() !== ''
      ? parseIndianPriceToNumber(row.rent)
      : null;
  const pMonthlyRent =
    row.monthlyRent !== null && row.monthlyRent !== undefined && String(row.monthlyRent).trim() !== ''
      ? parseIndianPriceToNumber(row.monthlyRent)
      : null;

  const dExpected =
    dossier.ExpectedPrice !== undefined && dossier.ExpectedPrice !== null && String(dossier.ExpectedPrice).trim() !== ''
      ? parseIndianPriceToNumber(dossier.ExpectedPrice)
      : null;
  const dRentPM =
    dossier.RentPM !== undefined && dossier.RentPM !== null && String(dossier.RentPM).trim() !== ''
      ? parseIndianPriceToNumber(dossier.RentPM)
      : null;
  const dPrice =
    dossier.Price !== undefined && dossier.Price !== null && String(dossier.Price).trim() !== ''
      ? parseIndianPriceToNumber(dossier.Price)
      : null;

  let numPrice = 0;

  if (isRent) {
    if (pPrice !== null && pPrice > 0) {
      numPrice = pPrice;
    } else if (pPrice === 0 && (pRent === null || pRent === 0) && (dRentPM === null || dRentPM === 0)) {
      numPrice = 0;
    } else if (pRent !== null && pRent > 0) {
      numPrice = pRent;
    } else if (dRentPM !== null && dRentPM > 0) {
      numPrice = dRentPM;
    } else if (pMonthlyRent !== null && pMonthlyRent > 0) {
      numPrice = pMonthlyRent;
    } else if (dExpected !== null && dExpected > 0) {
      numPrice = dExpected;
    } else if (dPrice !== null && dPrice > 0) {
      numPrice = dPrice;
    }
  } else {
    if (pPrice !== null && pPrice > 0) {
      numPrice = pPrice;
    } else if (pPrice === 0) {
      numPrice = 0;
    } else if (dExpected !== null && dExpected > 0) {
      numPrice = dExpected;
    } else if (dPrice !== null && dPrice > 0) {
      numPrice = dPrice;
    } else if (pRent !== null && pRent > 0) {
      numPrice = pRent;
    } else if (dRentPM !== null && dRentPM > 0) {
      numPrice = dRentPM;
    }
  }

  return {
    numPrice,
    formattedPrice: formatIndianPrice(numPrice),
    isRent,
    priceSuffix: isRent ? '/ month' : 'All Inclusive'
  };
}
