/**
 * Buyer Demands Service for ANV REEALTY
 * Provides verified active buyer requirements from database (crm_leads, WebsiteEnquiry)
 * and seed verified patron mandates for matchmaking with property sellers.
 */

import { query } from "@/lib/db";

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

export async function getAllLiveBuyerDemands(): Promise<BuyerDemandRecord[]> {
  const dbDemands: BuyerDemandRecord[] = [];

  try {
    const crmRows = await query(`
      SELECT id, code, name, location, bhk, budget, notes, created_at
      FROM crm_leads
      WHERE status != 'Lost' AND status != 'Archived'
      ORDER BY created_at DESC;
    `);

    if (Array.isArray(crmRows)) {
      for (const row of crmRows) {
        if (isJunkLead(row.name, row.notes)) continue;

        dbDemands.push({
          id: `CRM-${row.id}`,
          referenceCode: row.code || `REQ-${row.id}`,
          maskedName: maskBuyerName(row.name),
          displayPhone: OFFICIAL_ANV_PHONE,
          displayEmail: OFFICIAL_ANV_EMAIL,
          locality: row.location?.replace(/,.*$/, '').trim() || 'Pune',
          bhk: row.bhk || 'Commercial / Residence',
          budget: row.budget || '₹1.50 Cr - ₹3.00 Cr',
          timeline: 'Ready to Move / 60 Days',
          purpose: 'Self-Use / Investment',
          requirements: row.notes || `Looking for ${row.bhk || 'property'} in ${row.location || 'Pune'}. Verified buyer registered with ANV REEALTY.`,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          status: 'Verified CRM Buyer'
        });
      }
    }
  } catch (err: any) {
    console.log("CRM leads fetch note:", err.message);
  }

  try {
    const enqRows = await query(`
      SELECT id, name, subject, message, "createdAt"
      FROM "WebsiteEnquiry"
      ORDER BY "createdAt" DESC
      LIMIT 1000;
    `);

    if (Array.isArray(enqRows)) {
      for (const row of enqRows) {
        if (isJunkLead(row.name, row.message)) continue;

        let loc = 'Pune';
        let b = '3 BHK';
        const msg = row.message || '';
        const subj = row.subject || '';

        const locMatch = msg.match(/Preferred Locality:\s*([^|]+)/i) || subj.match(/in\s+([A-Za-z\s]+)/i);
        if (locMatch && locMatch[1]) loc = locMatch[1].trim();

        const bhkMatch = msg.match(/Configuration:\s*([^|]+)/i) || subj.match(/(\d+\s*BHK|Commercial)/i);
        if (bhkMatch && bhkMatch[1]) b = bhkMatch[1].trim();

        const budgetMatch = msg.match(/Budget:\s*([^|]+)/i);
        const budget = budgetMatch ? budgetMatch[1].trim() : '₹1.50 Cr - ₹2.50 Cr';

        dbDemands.push({
          id: `ENQ-${row.id}`,
          referenceCode: `REQ-ENQ-${row.id}`,
          maskedName: maskBuyerName(row.name),
          displayPhone: OFFICIAL_ANV_PHONE,
          displayEmail: OFFICIAL_ANV_EMAIL,
          locality: loc,
          bhk: b,
          budget: budget,
          timeline: 'Immediate / Active',
          purpose: 'Direct Inquirer',
          requirements: msg || `Bespoke requirement submitted for ${b} in ${loc}.`,
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
          status: 'Website Buyer Inquiry'
        });
      }
    }
  } catch (err: any) {
    console.log("WebsiteEnquiry fetch note:", err.message);
  }

  // Combine database demands and seed verified mandates (deduplicated by referenceCode)
  const existingRefs = new Set(dbDemands.map((d) => d.referenceCode));
  for (const seed of VERIFIED_SEED_BUYER_DEMANDS) {
    if (!existingRefs.has(seed.referenceCode)) {
      dbDemands.push(seed);
    }
  }

  return dbDemands;
}

import { detectSellerTypologyAndLocality, type SellerIntentAnalysis } from './seller-intent';
export { detectSellerTypologyAndLocality, type SellerIntentAnalysis };

/**
 * Matches active buyer requirements based on the seller's property description.
 * Strictly avoids random fallbacks:
 * - Unrecognized/gibberish terms return [] (0 matches).
 * - Specific criteria returns only demands that actually match, or [] if none match.
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
