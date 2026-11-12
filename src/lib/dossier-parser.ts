/**
 * Real Estate Executive Dossier Parser & Formatter
 * Supports full serialization of the fields displayed on the public Property Detail page:
 * - Architectural Narrative & Orientation (description)
 * - Engineering & Architectural Highlights (bullet points)
 * - Location Connectivity Advantage (bullet points)
 * - Lifestyle Amenities List
 * - MahaRERA Registration ID & Legal Title Clearance
 * - Possession Status & Timeline
 */

export interface CustomCostSheet {
  baseAgreementValue?: string;
  stampDuty?: string;
  registrationCharges?: string;
  gst?: string;
  brokerage?: string;
  totalLandedOutlay?: string;
}

export interface DossierData {
  highlights?: string[];
  connectivity?: string[];
  amenitiesList?: (string | { title: string; desc: string })[];
  reraNumber?: string;
  possession?: string;
  rpsStatus?: string;
  legalVettingText?: string;
  suitableFor?: (string | number)[] | string;

  // Visibility & privacy toggles
  hideName?: boolean;
  hidePrice?: boolean;
  hideRera?: boolean;
  hideComplianceTab?: boolean;
  hideCostSheet?: boolean;
  hideAmenities?: boolean;
  hideHighlights?: boolean;
  hideConnectivity?: boolean;

  // Custom cost sheet values (optional manual override)
  customCostSheet?: CustomCostSheet;

  isSafe?: boolean;
}

export interface ParsedDossier {
  cleanDescription: string;
  dossier: DossierData;
}

const DOSSIER_TAG_REGEX = /<!--\s*DOSSIER_DATA:\s*([\s\S]*?)\s*-->/;

import { fastDeterministicStandardizeDescription, normalizeDossierText } from '@/lib/gemini-description-standardizer';

/**
 * Ensures that every line starting with '#' is ordered according to the 42-point hierarchy
 * and placed on its own line without duplicate field prefixes.
 */
export function formatPropertyDescription(rawDescription: string = ''): string {
  if (!rawDescription) return '';
  const preformatted = rawDescription
    .replace(/(?:\r?\n)?\s*#/g, '\n#')
    .trim();
  const standardized = fastDeterministicStandardizeDescription(preformatted);
  return normalizeDossierText(standardized);
}

/**
 * Extracts structured dossier metadata from property description
 */
export function parseDossierData(rawDescription: string = ''): ParsedDossier {
  if (!rawDescription) {
    return {
      cleanDescription: '',
      dossier: {}
    };
  }

  const match = rawDescription.match(DOSSIER_TAG_REGEX);
  if (!match) {
    return {
      cleanDescription: formatPropertyDescription(rawDescription),
      dossier: {}
    };
  }

  try {
    const parsed = JSON.parse(match[1]);
    const cleanDescription = formatPropertyDescription(rawDescription.replace(DOSSIER_TAG_REGEX, ''));

    return {
      cleanDescription,
      dossier: {
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights.filter(Boolean) : undefined,
        connectivity: Array.isArray(parsed.connectivity) ? parsed.connectivity.filter(Boolean) : undefined,
        amenitiesList: Array.isArray(parsed.amenitiesList)
          ? parsed.amenitiesList.filter(Boolean)
          : Array.isArray(parsed.amenities)
          ? parsed.amenities.filter(Boolean)
          : undefined,
        reraNumber: typeof parsed.reraNumber === 'string' && parsed.reraNumber.trim() ? parsed.reraNumber.trim() : undefined,
        possession: typeof parsed.possession === 'string' && parsed.possession.trim() ? parsed.possession.trim() : undefined,
        rpsStatus: typeof parsed.rpsStatus === 'string' && parsed.rpsStatus.trim() ? parsed.rpsStatus.trim() : undefined,
        legalVettingText: typeof parsed.legalVettingText === 'string' && parsed.legalVettingText.trim() ? parsed.legalVettingText.trim() : undefined,
        suitableFor: Array.isArray(parsed.suitableFor)
          ? parsed.suitableFor.filter(Boolean)
          : typeof parsed.suitableFor === 'string' && parsed.suitableFor.trim()
          ? parsed.suitableFor.split(/[,|]/).map((s: string) => s.trim()).filter(Boolean)
          : undefined,
        hideName: Boolean(parsed.hideName),
        hidePrice: Boolean(parsed.hidePrice),
        hideRera: Boolean(parsed.hideRera),
        hideComplianceTab: Boolean(parsed.hideComplianceTab),
        hideCostSheet: Boolean(parsed.hideCostSheet),
        hideAmenities: Boolean(parsed.hideAmenities),
        hideHighlights: Boolean(parsed.hideHighlights),
        hideConnectivity: Boolean(parsed.hideConnectivity),
        customCostSheet: parsed.customCostSheet && typeof parsed.customCostSheet === 'object' ? parsed.customCostSheet : undefined,
        isSafe: Boolean(parsed.isSafe)
      }
    };
  } catch (err) {
    return {
      cleanDescription: normalizeDossierText(rawDescription.replace(DOSSIER_TAG_REGEX, '').trim()),
      dossier: {}
    };
  }
}

/**
 * Serializes narrative text and structured dossier data into a backward-compatible format
 */
export function embedDossierData(cleanNarrative: string, dossier: DossierData): string {
  const baseNarrative = normalizeDossierText(cleanNarrative.replace(DOSSIER_TAG_REGEX, '').trim());

  const payload: Record<string, any> = {};
  if (dossier.highlights && dossier.highlights.length > 0) {
    payload.highlights = dossier.highlights.filter(Boolean);
  }
  if (dossier.connectivity && dossier.connectivity.length > 0) {
    payload.connectivity = dossier.connectivity.filter(Boolean);
  }
  if (dossier.amenitiesList && dossier.amenitiesList.length > 0) {
    payload.amenitiesList = dossier.amenitiesList.filter(Boolean);
  }
  if (dossier.reraNumber) {
    payload.reraNumber = dossier.reraNumber.trim();
  }
  if (dossier.possession) {
    payload.possession = dossier.possession.trim();
  }
  if (dossier.rpsStatus) {
    payload.rpsStatus = dossier.rpsStatus.trim();
  }
  if (dossier.legalVettingText) {
    payload.legalVettingText = dossier.legalVettingText.trim();
  }
  if (dossier.suitableFor) {
    payload.suitableFor = Array.isArray(dossier.suitableFor)
      ? dossier.suitableFor.filter(Boolean)
      : [dossier.suitableFor].filter(Boolean);
  }
  if (dossier.hideName !== undefined) {
    payload.hideName = Boolean(dossier.hideName);
  }
  if (dossier.hidePrice !== undefined) {
    payload.hidePrice = Boolean(dossier.hidePrice);
  }
  if (dossier.hideRera !== undefined) {
    payload.hideRera = Boolean(dossier.hideRera);
  }
  if (dossier.hideComplianceTab !== undefined) {
    payload.hideComplianceTab = Boolean(dossier.hideComplianceTab);
  }
  if (dossier.hideCostSheet !== undefined) {
    payload.hideCostSheet = Boolean(dossier.hideCostSheet);
  }
  if (dossier.hideAmenities !== undefined) {
    payload.hideAmenities = Boolean(dossier.hideAmenities);
  }
  if (dossier.hideHighlights !== undefined) {
    payload.hideHighlights = Boolean(dossier.hideHighlights);
  }
  if (dossier.hideConnectivity !== undefined) {
    payload.hideConnectivity = Boolean(dossier.hideConnectivity);
  }
  if (dossier.customCostSheet && typeof dossier.customCostSheet === 'object') {
    payload.customCostSheet = dossier.customCostSheet;
  }
  if (dossier.isSafe !== undefined) {
    payload.isSafe = Boolean(dossier.isSafe);
  }

  if (Object.keys(payload).length === 0) {
    return baseNarrative;
  }

  return `${baseNarrative}\n\n<!-- DOSSIER_DATA: ${JSON.stringify(payload)} -->`;
}

/**
 * Generates sensible architectural highlights based on typology
 */
export function getDefaultHighlights(isCommercial: boolean = false, typology: string = ''): string[] {
  const t = typology.toLowerCase();

  if (t.includes('hospital') || t.includes('clinic')) {
    return [
      'NABH compliant infrastructure layout with dedicated medical elevators',
      'Dual power grid with 100% emergency critical care backup generators',
      'Medical gas pipeline system (MGPS) pre-installed trunking corridors',
      'Ample ambulance bay clearance and dedicated trauma triage entrance'
    ];
  }

  if (t.includes('warehouse') || t.includes('industrial')) {
    return [
      'High clear height 32ft to 40ft optimized for multi-tier heavy racking',
      'Heavy duty laser-screed FM2 flooring with 5 to 7 MT/sqm load capacity',
      'Hydraulic dock levelers with canopy sheltered loading/unloading bays',
      'Ample 40ft container turning radius and dedicated driver rest facilities'
    ];
  }

  if (t.includes('showroom') || t.includes('shop') || t.includes('retail')) {
    return [
      'Expansive high-street frontage with maximum glass facade display visibility',
      'Double-height ceiling 14ft to 18ft ideal for grand mezzanine additions',
      'High footfall arterial corridor with dedicated visitor drive-in parking',
      'Uninterrupted 3-phase commercial electrical sanction with 100% power backup'
    ];
  }

  if (isCommercial || t.includes('office')) {
    return [
      'Grade-A corporate office layout with optimized usable floor efficiency',
      'Double-glazed soundproof glass facade with superior acoustic barrier',
      'High ceilings with expansive 12ft clear floor-to-floor height',
      'Dedicated utility deck, separate AHU zones, and 100% DG power backup'
    ];
  }

  return [
    'East/West vastu layout optimizing cross-ventilation and natural daylight',
    'Double-glazed soundproof glass with acoustic barrier and heat reduction',
    'High ceilings with expansive 8ft entryway and grand living room foyer',
    'Dedicated utility deck separate from private sit-out terrace balcony'
  ];
}

import { formatConnectivityBulletPoints } from '@/lib/geo-landmarks';

/**
 * Generates sensible connectivity points based on location using 5km geospatial engine
 */
export function getDefaultConnectivity(location: string = '', locality: string = ''): string[] {
  const targetLoc = locality || location.split(/[,–-]/)[0].trim() || 'Pune';
  try {
    const computed = formatConnectivityBulletPoints({ locality: targetLoc }, 5);
    if (computed && computed.length > 0) {
      return computed;
    }
  } catch {
    // fallback gracefully
  }
  return [
    `Direct arterial access to Pune-Mumbai Expressway & Ring Road connectivity`,
    `Within 5-7 minutes of operational Metro station corridor`,
    `5-10 mins from top business parks, corporate towers, and IT hubs in ${targetLoc}`,
    `Proximity to reputed multi-specialty hospitals and premium social infrastructure`
  ];
}

/**
 * Default standard real estate amenities
 */
export const PRESET_AMENITIES = [
  'Grand Clubhouse',
  '100% Power Backup',
  'Dedicated EV Charging',
  'Biometric 3-Tier Security',
  'High Speed Elevators',
  'Infinity Rooftop Pool',
  'Fitness Sanctuary & Yoga',
  'Squash & Badminton Courts',
  'Landscaped Forest Podium',
  'Children’s Discovery Zone',
  'Dedicated Parking Bay',
  'Fire Fighting Sprinkler System',
  'CCTV Surveillance 24/7',
  'Rainwater Harvesting Plant',
  'Cafeteria & Business Lounge'
];

