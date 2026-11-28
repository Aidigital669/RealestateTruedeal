import { cache } from 'react';
import { query, queryOne } from '@/lib/db';
import { getPropertySlug, matchesProperty } from '@/lib/slug';
import { PropertyItem, ALL_FALLBACK_PROPERTIES } from '@/lib/property-types';
import { getPurposesForProperties, type BusinessPurpose } from '@/lib/business-purposes';
import { parseDossierData, getDefaultHighlights, getDefaultConnectivity } from '@/lib/dossier-parser';
import { saveImageIfBase64 } from '@/lib/image-storage';
import { resolvePropertyPrice } from '@/lib/price-utils';
import { parseAreaToSqft } from '@/lib/excel-import-engine';

export type { PropertyItem };
export { ALL_FALLBACK_PROPERTIES };

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

let cachedProperties: { data: PropertyItem[]; timestamp: number } | null = null;
let cachedHomepageProperties: { data: PropertyItem[]; timestamp: number } | null = null;
let inflightFetchPromise: Promise<PropertyItem[]> | null = null;
let cacheVersion = 1;
const propertyMapById = new Map<string, PropertyItem>();
const propertyMapBySlug = new Map<string, PropertyItem>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache; invalidated on any mutation

export function getPropertyCacheVersion(): number {
  return cacheVersion;
}

export function clearPropertyCache() {
  cachedProperties = null;
  cachedHomepageProperties = null;
  inflightFetchPromise = null;
  cacheVersion++;
  propertyMapById.clear();
  propertyMapBySlug.clear();
}

const PROPERTY_SELECT_SQL = `
  SELECT 
    p.id, p.slug, p.title as name, p.description, p.address as location,
    p.price, p.rent, p."carpetArea" as sqft_num, p."builtupArea", p."saleableArea",
    p."plotArea", p."minArea", p."maxArea", p."ratePsf", p."securityDeposit",
    p."maintenanceCharges", p."propertyTax", p.facing, p."propertyAge",
    p."transactionClassification", p."possessionName", p.status, p.roi,
    p."monthlyRent", p."rentStartDate", p."lockinPeriod", p."leasePeriod",
    p."searchKeywords", p."branchName", p."sourceName",
    p."customerName", p."customerMobile", p."customerEmail",
    p."employeeName", p."employeeMobile", p."employeeEmail",
    p."refNumber", p."propertyName", p."buildingName", p."dossierData",
    p.bedrooms as bhk_num, p.configuration, p."videoUrl", p."isFeatured" as featured,
    p."listingType" as listing_type,
    COALESCE(proj.developer, '') as developer,
    COALESCE(proj."reraNumber", 'PRM/PUN/RERA/2026/0491') as rera_number,
    COALESCE(loc.name, 'Koregaon Park') as locality,
    COALESCE(loc.city, 'Pune') as loc_city,
    COALESCE(pt.name, 'Apartment') as type_name,
    COALESCE(imgs.urls[1], '${DEFAULT_IMG}') as image,
    imgs.urls as all_images
  FROM "Property" p
  LEFT JOIN "Project" proj ON p."projectId" = proj.id
  LEFT JOIN "Location" loc ON p."locationId" = loc.id
  LEFT JOIN "PropertyType" pt ON p."propertyTypeId" = pt.id
  LEFT JOIN (
    SELECT "propertyId", array_agg(url ORDER BY "sortOrder" ASC) as urls
    FROM "PropertyImage"
    GROUP BY "propertyId"
  ) imgs ON imgs."propertyId" = p.id
`;

function mapDbPropertyRow(p: any, purposes: BusinessPurpose[], includeFullDossier = true): PropertyItem {
  const { cleanDescription, dossier: parsedDossier } = parseDossierData(p.description || '', p.name);
  const mergedDossier = {
    ...(typeof p.dossierData === 'object' && p.dossierData !== null ? p.dossierData : {}),
    ...parsedDossier
  };
  const dossier = mergedDossier;

  // Pricing resolved consistently across DB columns and dossier metadata
  const { numPrice, formattedPrice, isRent } = resolvePropertyPrice(p, dossier);

  const isCommercial =
    (p.type_name && p.type_name.toLowerCase().includes('commercial')) ||
    (p.name &&
      (p.name.toLowerCase().includes('commercial') ||
        p.name.toLowerCase().includes('office') ||
        p.name.toLowerCase().includes('hospital'))) ||
    (p.configuration && !p.configuration.toLowerCase().includes('bhk')) ||
    p.bhk_num === null ||
    p.bhk_num === 0;

  const bhkStr = p.configuration
    ? p.configuration
    : isCommercial
      ? p.type_name || 'Commercial Office'
      : p.bhk_num
        ? `${p.bhk_num} BHK`
        : '3 BHK';

  const defaultDesc = isCommercial
    ? `Grade-A corporate office space in ${p.locality}, Pune. Landmark business address with optimized workspace efficiency and airport corridor connectivity.`
    : `Spacious and luxurious ${bhkStr} residence in ${p.locality}. High floor inventory with scenic skyline views.`;

  const sqftStr =
    dossier.CarpetAreaName ||
    dossier.SuperAreaName ||
    (p.sqft_num ? `${Number(p.sqft_num).toLocaleString()} Sq.Ft.` : '');

  const rawRera = dossier.reraNumber || p.rera_number || '';
  const reraNumber =
    rawRera === 'PRM/PUN/RERA/2026/0491' || rawRera === 'PRM/PUN/COM/2026/0882' ? '' : rawRera;
  const rawPos = (dossier.PossessionName || dossier.possession || '').toString().trim();
  const possession = rawPos
    ? /immediately|immediate/i.test(rawPos)
      ? 'Immediate Possession'
      : rawPos
    : p.status && p.status !== 'Ready to Move'
      ? p.status
      : 'Possession on Request';

  const rawImages: string[] =
    p.all_images && Array.isArray(p.all_images)
      ? p.all_images.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
      : [];

  const candidateImages = rawImages.length > 0 ? rawImages : p.image ? [p.image] : [];

  const resolvedImages = candidateImages.map((u: string, idx: number) => {
    if (typeof u === 'string' && u.startsWith('data:image/')) {
      return saveImageIfBase64(u, p.id, idx + 1);
    }
    return u;
  });

  const coverImage =
    typeof p.image === 'string' && p.image.startsWith('data:image/')
      ? saveImageIfBase64(p.image, p.id, 0)
      : p.image || resolvedImages[0];

  const videoUrl: string | null =
    p.videoUrl && String(p.videoUrl).trim().length > 0 ? String(p.videoUrl).trim() : null;
  const videoThumbnail: string | null = videoUrl ? resolvedImages[0] || null : null;

  const label = isCommercial ? 'Commercial Landmark' : p.featured ? 'Top Choice' : 'New Launch';

  const isNameHidden = Boolean(dossier.hideName);
  const isPriceHidden = Boolean(dossier.hidePrice);

  const displayName = isNameHidden ? `Confidential ${bhkStr} in ${p.locality || 'Pune'}` : p.name;
  const displayPrice = isPriceHidden ? 'Price on Request' : formattedPrice;
  const finalSlug = p.slug || getPropertySlug({ id: p.id, name: p.name, locality: p.locality });

  const carpetNum =
    Number(p.sqft_num) ||
    parseAreaToSqft(dossier.CarpetAreaName) ||
    0;
  const builtupNum =
    Number(p.builtupArea) ||
    parseAreaToSqft(dossier.BuiltAreaName) ||
    Number(p.saleableArea) ||
    parseAreaToSqft(dossier.SuperAreaName) ||
    0;
  const resolvedCity = String(dossier.CityName || p.loc_city || 'Pune').trim();
  const resolvedTxClass = String(p.transactionClassification || dossier.TransactionName || '').trim() || null;

  const isPreleasedAsset = Boolean(
    resolvedTxClass && /prelease|prerent/i.test(resolvedTxClass.replace(/[-_\s/]+/g, ''))
  );

  const baseItem: PropertyItem = {
    id: String(p.id),
    slug: finalSlug,
    name: displayName,
    realName: p.name,
    hideName: isNameHidden,
    hidePrice: isPriceHidden,
    hideRera: Boolean(dossier.hideRera),
    hideComplianceTab: Boolean(dossier.hideComplianceTab),
    hideCostSheet: Boolean(dossier.hideCostSheet),
    hideAmenities: Boolean(dossier.hideAmenities),
    hideHighlights: Boolean(dossier.hideHighlights),
    hideConnectivity: Boolean(dossier.hideConnectivity),
    hideDirectContact: dossier.hideDirectContact === false ? false : true,
    hideBreadcrumbs: dossier.hideBreadcrumbs === undefined ? true : Boolean(dossier.hideBreadcrumbs),
    developer: p.developer && !/anv\b/i.test(p.developer) ? p.developer : '',
    locality: p.locality,
    city: resolvedCity,
    location: p.location || `${p.locality}, Pune, Maharashtra`,
    price: displayPrice,
    priceRaw: numPrice,
    priceSuffix: isPriceHidden ? 'On Request' : isRent ? '/ month' : 'All Inclusive',
    configuration: p.configuration || undefined,
    bhk: bhkStr,
    bhkNum: p.bhk_num || 0,
    sqft: sqftStr,
    sqftNum:
      carpetNum ||
      builtupNum ||
      parseAreaToSqft(dossier.SuperAreaName) ||
      0,
    carpetAreaNum: carpetNum,
    builtupAreaNum: builtupNum,
    transactionClassification: resolvedTxClass,
    status: possession,
    possession,
    reraNumber,
    rpsStatus: dossier.rpsStatus || (isCommercial ? 'Verified Commercial Title' : '100% Clear Title • Zero Encumbrances'),
    description: cleanDescription || defaultDesc,
    image: coverImage,
    images: resolvedImages,
    videoUrl,
    videoThumbnail,
    featured: !!p.featured,
    label,
    isCommercial,
    isPreleased: isPreleasedAsset || undefined,
    listingType: p.listing_type || 'Sale',
    refNumber: p.refNumber || dossier.RefNumber || '',
    propertyName: p.propertyName || dossier.PropertyName || '',
    buildingName: p.buildingName || dossier.BuildingName || '',
    availableUnits: dossier.availableUnits || dossier.AvailableUnits || undefined,
    searchKeywords: p.searchKeywords || dossier.SearchKeyword || null,
    businessPurposes: purposes
  };

  if (!includeFullDossier) {
    return baseItem;
  }

  const highlights =
    dossier.highlights && dossier.highlights.length > 0
      ? dossier.highlights
      : dossier.hideHighlights
        ? []
        : getDefaultHighlights(isCommercial, bhkStr);

  const connectivity =
    dossier.connectivity && dossier.connectivity.length > 0
      ? dossier.connectivity
      : dossier.hideConnectivity
        ? []
        : getDefaultConnectivity(p.location || '', p.locality || '');

  const amenitiesList =
    dossier.amenitiesList && dossier.amenitiesList.length > 0 ? dossier.amenitiesList : undefined;

  const legalVettingText =
    dossier.legalVettingText ||
    'This property has completed 100% title deed investigation, environmental clearance, and commencement certification as registered under Government of Maharashtra MahaRERA.';

  const tags = isCommercial
    ? ['Grade-A Tower', 'Warm Shell', 'Airport & KP Connectivity', '100% DG Backup']
    : ['Verified Listing', 'Vastu Compliant', 'Private Balcony'];

  return {
    ...baseItem,
    customCostSheet: dossier.customCostSheet,
    legalVettingText,
    highlights,
    connectivity,
    amenitiesList,
    tags,
    dossier,
    plotArea: p.plotArea || dossier.PlotSizeName || null,
    minArea: p.minArea || dossier.MinAreaName || null,
    maxArea: p.maxArea || dossier.MaxAreaName || null,
    ratePsf: p.ratePsf || dossier.PricePerUnitArea || null,
    securityDeposit: p.securityDeposit || dossier.DepositePrice || null,
    maintenanceCharges: p.maintenanceCharges || dossier.MaintainCharges || null,
    propertyTax: p.propertyTax || dossier.PropertyTax || null,
    facing: p.facing || dossier.FacingText || null,
    propertyAge: p.propertyAge || dossier.PropertyAge || null,
    transactionClassification: p.transactionClassification || dossier.TransactionName || null,
    possessionName: p.possessionName || dossier.PossessionName || null,
    availabilityStatus: p.availabilityStatus || dossier.Status || null,
    roi: p.roi || dossier.ROI || null,
    monthlyRent: p.monthlyRent || dossier.RentPM || null,
    rentStartDate: p.rentStartDate || dossier.RentStartDate || null,
    lockinPeriod: p.lockinPeriod || dossier.LockinPeriod || null,
    leasePeriod: p.leasePeriod || dossier.LeasePeriod || null,
    branchName: p.branchName || dossier.BranchName || null,
    sourceName: p.sourceName || dossier.SourceName || null,
    customerName: p.customerName || dossier.CustomerFullName || null,
    customerMobile: p.customerMobile || dossier.CustomerMobile || null,
    customerEmail: p.customerEmail || dossier.CustomerEmail || null,
    employeeName: p.employeeName || dossier.EmployeeName || null,
    employeeMobile: p.employeeMobile || dossier.EmployeeMobile || null,
    employeeEmail: p.employeeEmail || dossier.EmployeeEmail || null,
    ...dossier
  };
}

/**
 * Strips heavy detail/dossier/PII fields from a PropertyItem so homepage & list endpoints
 * stay compact (~1.5 MB instead of 16.5+ MB across 2,846 properties).
 */
export function toHomepageSummary(p: PropertyItem): PropertyItem {
  const d = (p.dossier || {}) as Record<string, any>;
  const compactDesc = (p.description || '').trim().slice(0, 320);
  const compactDossier: Record<string, any> = {};
  if (d.BuildingName) compactDossier.BuildingName = d.BuildingName;
  if (d.PlotSizeName) compactDossier.PlotSizeName = d.PlotSizeName;
  if (d.SuperAreaName) compactDossier.SuperAreaName = d.SuperAreaName;
  if (d.CarpetAreaName) compactDossier.CarpetAreaName = d.CarpetAreaName;
  if (d.BuiltAreaName) compactDossier.BuiltAreaName = d.BuiltAreaName;
  if (d.FloorNumber) compactDossier.FloorNumber = d.FloorNumber;
  if (d.ParkingDetails) compactDossier.ParkingDetails = d.ParkingDetails;
  if (d.availableUnits || d.AvailableUnits) compactDossier.availableUnits = d.availableUnits || d.AvailableUnits;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    realName: p.realName !== p.name ? p.realName : undefined,
    developer: p.developer,
    buildingName: p.buildingName || undefined,
    locality: p.locality,
    city: p.city || d.CityName || undefined,
    location: p.location,
    price: p.price,
    priceRaw: p.priceRaw,
    priceSuffix: p.priceSuffix,
    hideName: p.hideName || undefined,
    hidePrice: p.hidePrice || undefined,
    hideDirectContact: p.hideDirectContact === false ? false : undefined,
    hideBreadcrumbs: p.hideBreadcrumbs === false ? false : undefined,
    configuration: p.configuration,
    bhk: p.bhk,
    bhkNum: p.bhkNum || undefined,
    sqft: p.sqft,
    sqftNum: p.sqftNum || undefined,
    carpetAreaNum: p.carpetAreaNum || undefined,
    builtupAreaNum: p.builtupAreaNum || undefined,
    transactionClassification: p.transactionClassification || d.TransactionName || undefined,
    status: p.status,
    possession: p.possession !== p.status ? p.possession : undefined,
    availableUnits: p.availableUnits || d.availableUnits || d.AvailableUnits || undefined,
    reraNumber: p.reraNumber || undefined,
    description: compactDesc,
    image: p.image,
    images: p.images && p.images.length > 1 ? p.images.slice(0, 4) : undefined,
    videoUrl: p.videoUrl || undefined,
    featured: p.featured || undefined,
    label: p.label,
    isCommercial: p.isCommercial || undefined,
    isPreleased: p.isPreleased || undefined,
    listingType: p.listingType,
    searchKeywords: p.searchKeywords || undefined,
    businessPurposes: p.businessPurposes && p.businessPurposes.length > 0 ? p.businessPurposes : undefined,
    dossier: Object.keys(compactDossier).length > 0 ? compactDossier : undefined
  };
}

export async function fetchAllProperties(forceFresh = false): Promise<PropertyItem[]> {
  const now = Date.now();
  if (!forceFresh && cachedProperties && now - cachedProperties.timestamp < CACHE_TTL_MS) {
    return cachedProperties.data;
  }

  if (!forceFresh && inflightFetchPromise) {
    return inflightFetchPromise;
  }

  inflightFetchPromise = (async () => {
    try {
      const dbProps = await query(`
        ${PROPERTY_SELECT_SQL}
        WHERE p."publishStatus" = 'Published'
        ORDER BY p."isFeatured" DESC, p."createdAt" DESC;
      `);

      if (dbProps && dbProps.length > 0) {
        const propIds = dbProps.map((p: any) => p.id);
        const purposesMap = await getPurposesForProperties(propIds);

        const mapped = dbProps.map((p: any) =>
          mapDbPropertyRow(p, purposesMap[String(p.id)] || [], true)
        );

        propertyMapById.clear();
        propertyMapBySlug.clear();
        mapped.forEach((item) => {
          if (item.id !== undefined && item.id !== null) {
            propertyMapById.set(String(item.id), item);
          }
          if (item.slug) {
            propertyMapBySlug.set(item.slug.toLowerCase(), item);
          }
          const compSlug = getPropertySlug(item);
          if (compSlug) {
            propertyMapBySlug.set(compSlug.toLowerCase(), item);
          }
        });

        const ts = Date.now();
        cachedProperties = { data: mapped, timestamp: ts };
        cachedHomepageProperties = { data: mapped.map(toHomepageSummary), timestamp: ts };
        return mapped;
      }
    } catch (err) {
      console.warn('DB property fetch fallback:', err);
    } finally {
      inflightFetchPromise = null;
    }

    return ALL_FALLBACK_PROPERTIES;
  })();

  return inflightFetchPromise;
}

/**
 * Returns compact property summaries for homepage and list endpoints (90% smaller payload).
 */
export async function fetchHomepageProperties(forceFresh = false): Promise<PropertyItem[]> {
  const now = Date.now();
  if (!forceFresh && cachedHomepageProperties && now - cachedHomepageProperties.timestamp < CACHE_TTL_MS) {
    return cachedHomepageProperties.data;
  }

  const all = await fetchAllProperties(forceFresh);
  if (cachedHomepageProperties && cachedHomepageProperties.data.length > 0) {
    return cachedHomepageProperties.data;
  }
  const summaries = all.map(toHomepageSummary);
  cachedHomepageProperties = { data: summaries, timestamp: Date.now() };
  return summaries;
}

export const getPropertyBySlugOrId = cache(async (identifier: string): Promise<PropertyItem | null> => {
  if (!identifier) return null;
  const decoded = decodeURIComponent(identifier).trim().toLowerCase();

  // Fast direct in-memory lookup
  if (propertyMapById.has(decoded)) return propertyMapById.get(decoded)!;
  if (propertyMapBySlug.has(decoded)) return propertyMapBySlug.get(decoded)!;

  // Fast single-row PostgreSQL lookup before falling back to scanning all rows
  try {
    const isNumericId = /^\d+$/.test(decoded);
    const whereClause = isNumericId
      ? `p.id = $1::int`
      : `(p.slug = $1 OR LOWER(p.slug) = $1)`;
    const row = await queryOne(
      `
      SELECT 
        p.id, p.slug, p.title as name, p.description, p.address as location,
        p.price, p.rent, p."carpetArea" as sqft_num, p."builtupArea", p."saleableArea",
        p."plotArea", p."minArea", p."maxArea", p."ratePsf", p."securityDeposit",
        p."maintenanceCharges", p."propertyTax", p.facing, p."propertyAge",
        p."transactionClassification", p."possessionName", p.status, p.roi,
        p."monthlyRent", p."rentStartDate", p."lockinPeriod", p."leasePeriod",
        p."searchKeywords", p."branchName", p."sourceName",
        p."customerName", p."customerMobile", p."customerEmail",
        p."employeeName", p."employeeMobile", p."employeeEmail",
        p."refNumber", p."propertyName", p."buildingName", p."dossierData",
        p.bedrooms as bhk_num, p.configuration, p."videoUrl", p."isFeatured" as featured,
        p."listingType" as listing_type,
        COALESCE(proj.developer, '') as developer,
        COALESCE(proj."reraNumber", 'PRM/PUN/RERA/2026/0491') as rera_number,
        COALESCE(loc.name, 'Koregaon Park') as locality,
        COALESCE(loc.city, 'Pune') as loc_city,
        COALESCE(pt.name, 'Apartment') as type_name,
        COALESCE(imgs.urls[1], '${DEFAULT_IMG}') as image,
        imgs.urls as all_images
      FROM "Property" p
      LEFT JOIN "Project" proj ON p."projectId" = proj.id
      LEFT JOIN "Location" loc ON p."locationId" = loc.id
      LEFT JOIN "PropertyType" pt ON p."propertyTypeId" = pt.id
      LEFT JOIN LATERAL (
        SELECT array_agg(url ORDER BY "sortOrder" ASC) as urls
        FROM "PropertyImage"
        WHERE "propertyId" = p.id
      ) imgs ON true
      WHERE p."publishStatus" = 'Published'
        AND ${whereClause}
      LIMIT 1;
      `,
      [isNumericId ? Number(decoded) : decoded]
    );

    if (row) {
      const purposesMap = await getPurposesForProperties([row.id]);
      const item = mapDbPropertyRow(row, purposesMap[String(row.id)] || [], true);
      propertyMapById.set(String(item.id), item);
      if (item.slug) propertyMapBySlug.set(item.slug.toLowerCase(), item);
      return item;
    }
  } catch (err) {
    console.warn('Direct single-row lookup fallback:', err);
  }

  const all = await fetchAllProperties();
  if (propertyMapById.has(decoded)) return propertyMapById.get(decoded)!;
  if (propertyMapBySlug.has(decoded)) return propertyMapBySlug.get(decoded)!;

  const found = all.find((p) => matchesProperty(p, identifier));
  if (found) {
    propertyMapBySlug.set(decoded, found);
    return found;
  }

  const fallbackFound = ALL_FALLBACK_PROPERTIES.find((p) => matchesProperty(p, identifier));
  if (fallbackFound) {
    propertyMapBySlug.set(decoded, fallbackFound);
    return fallbackFound;
  }
  return null;
});
