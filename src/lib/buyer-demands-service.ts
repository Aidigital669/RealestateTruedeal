/**
 * Buyer Demands Service for ANV REEALTY
 * Provides verified active buyer requirements directly from crm_leads (the single source of truth)
 * ensuring 100% exact parity between the CRM Buyers portal and public website pages.
 */

import { query } from "@/lib/db";
import { isBuyerLead } from "@/lib/crm-data";
import { detectSellerTypologyAndLocality, type SellerIntentAnalysis } from './seller-intent';

export { isBuyerLead, detectSellerTypologyAndLocality, type SellerIntentAnalysis };

const OFFICIAL_ANV_PHONE = "93730 20701";
const OFFICIAL_ANV_EMAIL = "leads@anvrealty.com";

export interface BuyerDemandRecord {
  id: string;
  referenceCode: string;
  maskedName: string;
  displayPhone: string;
  displayEmail: string;
  locality: string;
  bhk: string;
  budget: string;
  timeline: string;
  purpose: string;
  requirements: string;
  createdAt: string;
  status: string;
}

function maskBuyerName(name: string | null | undefined): string {
  if (!name || !name.trim()) return "Verified Patron (Pune)";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const p = parts[0];
    return p.length > 2 ? `${p.slice(0, 2)}*** (Verified Buyer)` : "Verified Buyer";
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
  return `${first} ${lastInitial}.*** (Verified Buyer)`;
}

export function isJunkLead(name: string | null | undefined, notes: string | null | undefined): boolean {
  const lowerName = (name || '').toLowerCase().trim();
  const lowerNotes = (notes || '').toLowerCase().trim();

  // Junk or dummy test names
  if (['hs', 'te', 'test', 'dummy', 'abc', 'xyz', 'demo', 'null', 'undefined'].includes(lowerName)) {
    return true;
  }
  if (/^[a-z]{1,2}$/i.test(lowerName)) {
    return true;
  }

  // Junk spam messages from automated form hits
  if (/\b(?:kkjkk|addasdd|asdf|qwerty|dummy|test\s*lead|testing)\b/i.test(lowerNotes)) {
    return true;
  }
  if (lowerNotes.includes('kkjkk') || lowerNotes.includes('addasdd')) {
    return true;
  }

  return false;
}

export const VERIFIED_SEED_BUYER_DEMANDS: BuyerDemandRecord[] = [];

let cachedBuyerDemands: BuyerDemandRecord[] | null = null;
let lastBuyerFetchTime = 0;
const BUYER_CACHE_TTL = 30 * 1000; // 30 seconds cache for instant response

export function clearBuyerDemandsCache(): void {
  cachedBuyerDemands = null;
  lastBuyerFetchTime = 0;
}

/**
 * Returns all active buyer demands from crm_leads.
 * Single source of truth guaranteeing identical counts across CRM and Website.
 */
export async function getAllLiveBuyerDemands(forceRefresh = false): Promise<BuyerDemandRecord[]> {
  const now = Date.now();
  if (!forceRefresh && cachedBuyerDemands && (now - lastBuyerFetchTime < BUYER_CACHE_TTL)) {
    return cachedBuyerDemands;
  }

  const dbDemands: BuyerDemandRecord[] = [];

  try {
    const crmRows = await query(`
      SELECT id, code, name, location, property_interest, bhk, budget, notes, created_at, status, source, source_type, designation
      FROM crm_leads
      WHERE status != 'Lost' AND status != 'Archived'
      ORDER BY created_at DESC;
    `);

    if (Array.isArray(crmRows)) {
      for (const row of crmRows) {
        if (isJunkLead(row.name, row.notes)) continue;
        if (!isBuyerLead(row)) continue;

        dbDemands.push({
          id: `CRM-${row.id}`,
          referenceCode: row.code || `BYR-${row.id}`,
          maskedName: maskBuyerName(row.name),
          displayPhone: OFFICIAL_ANV_PHONE,
          displayEmail: OFFICIAL_ANV_EMAIL,
          locality: row.location?.replace(/,.*$/, '').trim() || 'Pune',
          bhk: row.bhk || 'Commercial / Residence',
          budget: row.budget || '₹1.50 Cr - ₹3.00 Cr',
          timeline: 'Ready to Move / 60 Days',
          purpose: 'Self-Use / Investment',
          requirements:
            row.notes ||
            row.property_interest ||
            `Looking for ${row.bhk || 'property'} in ${row.location || 'Pune'}. Verified buyer registered with ANV REEALTY.`,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          status: row.status || 'Verified Active Buyer'
        });
      }
    }
    cachedBuyerDemands = dbDemands;
    lastBuyerFetchTime = now;
  } catch (err: any) {
    console.log("CRM leads fetch note:", err.message);
  }

  return dbDemands;
}

/**
 * Real-time Matchmaking Algorithm for Property Sellers.
 * Given a seller's requirement or description, finds the top matching buyer demands from the verified database.
 * - If the query is gibberish or unrecognized, returns STRICTLY ZERO matches.
 * - If specific typologies (hospital, showroom, office, shop, pre-leased, bhk) are mentioned, returns ONLY relevant matches, or empty if none match.
 * - General seller queries return the top genuine verified buyer mandates across Pune.
 */
export async function getMatchingBuyerDemands(
  queryText: string,
  limit = 3
): Promise<BuyerDemandRecord[]> {
  const analysis = detectSellerTypologyAndLocality(queryText);

  // If the query contains unrecognized or gibberish terms like "mrtrt", return STRICTLY ZERO matches
  if (analysis.isUnrecognized) {
    return [];
  }

  const all = await getAllLiveBuyerDemands();

  // If this is a general inquiry with no specific category/locality, return top verified Pune buyer mandates
  if (analysis.isGeneralSellerQuery) {
    return all.slice(0, limit);
  }

  const lower = queryText.toLowerCase();
  const isHospital = /\b(?:hospital|medical|clinic|doctor|healthcare|dispensary)\b/i.test(lower);
  const isShowroom = /\b(?:showroom|display\s*center)\b/i.test(lower);
  const isOffice = /\b(?:office|it\s*park|coworking|workspace|corporate|commercial\s*office|business\s*center)\b/i.test(lower);
  const isShop = /\b(?:shop|retail|commercial\s*shop)\b/i.test(lower);
  const isPreleased = /\b(?:pre[-_\s]*leased|prelease|roi|yield|investment)\b/i.test(lower);
  const isCommercialGeneral = !isOffice && !isShowroom && !isShop && !isHospital && !isPreleased && /\b(?:commercial|commercial\s*property|commercial\s*space|commercial\s*unit|commercial\s*real\s*estate)\b/i.test(lower);
  const bhkMatch = lower.match(/\b([1-9])\s*bhk\b/i);
  const bhkNum = bhkMatch ? parseInt(bhkMatch[1], 10) : null;
  const isResidential = analysis.isResidential || bhkNum !== null || /\b(?:flat|flats|apartment|apartments|penthouse|penthouses|villa|villas|bungalow|bungalows|residence|residences|residential)\b/i.test(lower);

  const scored = all.map((demand) => {
    let score = 0;
    const demandText = `${demand.bhk} ${demand.locality} ${demand.requirements} ${demand.purpose}`.toLowerCase();
    const isDemandCommercial = /\b(?:commercial|office|workspace|corporate|showroom|retail|shop|pre[-_\s]*leased|it\s*park)\b/i.test(demandText);
    const isDemandResidential = /\b(?:bhk|residential|flat|apartment|penthouse|villa)\b/i.test(demandText);

    // 1. Hospital match
    if (isHospital) {
      if (/\b(?:hospital|medical|clinic|healthcare)\b/i.test(demandText)) score += 160;
      else score -= 100;
    }

    // 2. Office specific match
    if (isOffice) {
      if (/\b(?:office|workspace|corporate|it\s*park)\b/i.test(demandText)) score += 160;
      else if (isDemandCommercial) score += 90;
      else if (isDemandResidential) score -= 100;
    }

    // 3. Showroom specific match
    if (isShowroom) {
      if (/\b(?:showroom|retail|display)\b/i.test(demandText)) score += 160;
      else if (isDemandCommercial) score += 90;
      else if (isDemandResidential) score -= 100;
    }

    // 4. Shop specific match
    if (isShop) {
      if (/\b(?:shop|retail|store)\b/i.test(demandText)) score += 160;
      else if (isDemandCommercial) score += 90;
      else if (isDemandResidential) score -= 100;
    }

    // 5. Pre-leased specific match
    if (isPreleased) {
      if (/\b(?:pre[-_\s]*leased|prelease|yield|roi|invest)\b/i.test(demandText)) score += 160;
      else if (isDemandCommercial) score += 90;
      else if (isDemandResidential) score -= 100;
    }

    // 6. General Commercial Property match (offices, showrooms, retail, pre-leased)
    if (isCommercialGeneral) {
      if (isDemandCommercial) score += 140;
      else if (isDemandResidential) score -= 100;
    }

    // 7. BHK residential match
    if (bhkNum !== null) {
      if (isDemandCommercial && !isDemandResidential) {
        score -= 100;
      } else if (demandText.includes(`${bhkNum} bhk`) || demandText.includes(`${bhkNum}+ bhk`)) {
        score += 180;
      } else if (bhkNum >= 4 && isDemandResidential && (demandText.includes('luxury') || /\b[3-6]\s*(?:&|\/|-)?\s*[4-6]\s*bhk\b/i.test(demandText) || demandText.includes('penthouse') || demandText.includes('villa'))) {
        score += 150;
      } else if (isDemandResidential) {
        score += 90;
      } else {
        score -= 50;
      }
    } else if (isResidential) {
      if (isDemandCommercial && !isDemandResidential) score -= 100;
      else if (isDemandResidential) score += 130;
    }

    // 8. Locality match
    const localities = ['baner', 'balewadi', 'kalyani nagar', 'koregaon park', 'undri', 'nibm', 'hinjewadi', 'wakad', 'camp', 'viman nagar', 'kharadi', 'jm road', 'shivaji nagar', 'sb road', 'fc road'];
    for (const loc of localities) {
      if (lower.includes(loc) && demandText.includes(loc)) {
        score += 80;
        break;
      }
    }

    return { demand, score };
  });

  const matched = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.demand);

  // If specific criteria was given, return ONLY the matching demands.
  // NEVER fallback to random buyers!
  return matched.slice(0, limit);
}
