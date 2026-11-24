import { cache } from 'react';
import { query } from '@/lib/db';
import { getPropertySlug, matchesProperty } from '@/lib/slug';
import { PropertyItem, ALL_FALLBACK_PROPERTIES } from '@/lib/property-types';
import { getPurposesForProperties } from '@/lib/business-purposes';
import { parseDossierData, getDefaultHighlights, getDefaultConnectivity } from '@/lib/dossier-parser';
import { saveImageIfBase64 } from '@/lib/image-storage';

export type { PropertyItem };
export { ALL_FALLBACK_PROPERTIES };

let cachedProperties: { data: PropertyItem[]; timestamp: number } | null = null;
const propertyMapById = new Map<string, PropertyItem>();
const propertyMapBySlug = new Map<string, PropertyItem>();
const CACHE_TTL_MS = 60 * 1000; // 60s in-memory cache for ultra-fast page loads

export function clearPropertyCache() {
  cachedProperties = null;
  propertyMapById.clear();
  propertyMapBySlug.clear();
}

export async function fetchAllProperties(forceFresh = false): Promise<PropertyItem[]> {
  const now = Date.now();
  if (!forceFresh && cachedProperties && now - cachedProperties.timestamp < CACHE_TTL_MS) {
    return cachedProperties.data;
  }

  try {
    const dbProps = await query(`
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
        COALESCE(pt.name, 'Apartment') as type_name,
        COALESCE(img.url, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80') as image,
        imgs.urls as all_images
      FROM "Property" p
      LEFT JOIN "Project" proj ON p."projectId" = proj.id
      LEFT JOIN "Location" loc ON p."locationId" = loc.id
      LEFT JOIN "PropertyType" pt ON p."propertyTypeId" = pt.id
      LEFT JOIN LATERAL (
        SELECT url FROM "PropertyImage" WHERE "propertyId" = p.id ORDER BY "sortOrder" ASC LIMIT 1
      ) img ON true
      LEFT JOIN LATERAL (
        SELECT array_agg(url ORDER BY "sortOrder" ASC) as urls FROM "PropertyImage" WHERE "propertyId" = p.id
      ) imgs ON true
      WHERE p."publishStatus" = 'Published'
      ORDER BY p."isFeatured" DESC, p."createdAt" DESC;
    `);

    if (dbProps && dbProps.length > 0) {
      const propIds = dbProps.map((p: any) => p.id);
      const purposesMap = await getPurposesForProperties(propIds);

      const mapped = dbProps.map((p: any) => {
        const numPrice = Number(p.price) || 15000000;
        const formattedPrice =
          numPrice >= 10000000
            ? `₹${(numPrice / 10000000).toFixed(2)} Cr`
            : `₹${(numPrice / 100000).toFixed(1)} Lakh`;

        const isCommercial =
          (p.type_name && p.type_name.toLowerCase().includes('commercial')) ||
          (p.name && (p.name.toLowerCase().includes('commercial') || p.name.toLowerCase().includes('office') || p.name.toLowerCase().includes('hospital'))) ||
          (p.configuration && !p.configuration.toLowerCase().includes('bhk')) ||
          p.bhk_num === null ||
          p.bhk_num === 0;

        const bhkStr = p.configuration
          ? p.configuration
          : (isCommercial
            ? (p.type_name || "Commercial Office")
            : (p.bhk_num ? `${p.bhk_num} BHK` : "3 BHK"));

        const defaultDesc = isCommercial
          ? `Grade-A corporate office space in ${p.locality}, Pune. Landmark business address with optimized workspace efficiency and airport corridor connectivity.`
          : `Spacious and luxurious ${bhkStr} residence in ${p.locality}. High floor inventory with scenic skyline views.`;

        // Parse structured dossier metadata if present in description or dedicated column
        const { cleanDescription, dossier: parsedDossier } = parseDossierData(p.description || '', p.name);
        const mergedDossier = {
          ...(typeof p.dossierData === 'object' && p.dossierData !== null ? p.dossierData : {}),
          ...parsedDossier
        };
        const dossier = mergedDossier;
        const sqftStr = dossier.CarpetAreaName || dossier.SuperAreaName || (p.sqft_num ? `${Number(p.sqft_num).toLocaleString()} Sq.Ft.` : "");

        const highlights = dossier.highlights && dossier.highlights.length > 0
          ? dossier.highlights
          : (dossier.hideHighlights ? [] : getDefaultHighlights(isCommercial, bhkStr));

        const connectivity = dossier.connectivity && dossier.connectivity.length > 0
          ? dossier.connectivity
          : (dossier.hideConnectivity ? [] : getDefaultConnectivity(p.location || '', p.locality || ''));

        const amenitiesList = dossier.amenitiesList && dossier.amenitiesList.length > 0
          ? dossier.amenitiesList
          : undefined;

        const rawRera = dossier.reraNumber || p.rera_number || "";
        const reraNumber = (rawRera === "PRM/PUN/RERA/2026/0491" || rawRera === "PRM/PUN/COM/2026/0882") ? "" : rawRera;
        const rawPos = (dossier.PossessionName || dossier.possession || "").toString().trim();
        const possession = rawPos
          ? (/immediately|immediate/i.test(rawPos) ? "Immediate Possession" : rawPos)
          : (p.status && p.status !== "Ready to Move" ? p.status : "Possession on Request");
        const rpsStatus = dossier.rpsStatus || (isCommercial ? "Verified Commercial Title" : "100% Clear Title • Zero Encumbrances");
        const legalVettingText = dossier.legalVettingText || "This property has completed 100% title deed investigation, environmental clearance, and commencement certification as registered under Government of Maharashtra MahaRERA.";

        // Strictly return only images actually uploaded for this property
        const rawImages: string[] = (p.all_images && Array.isArray(p.all_images))
          ? p.all_images.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
          : [];

        const candidateImages = rawImages.length > 0
          ? rawImages
          : (p.image ? [p.image] : []);

        // Automatically save any base64 images to disk so the user's authentic photos are always preserved
        const resolvedImages = candidateImages.map((u: string, idx: number) => {
          if (typeof u === 'string' && u.startsWith('data:image/')) {
            return saveImageIfBase64(u, p.id, idx + 1);
          }
          return u;
        });

        const coverImage = (typeof p.image === 'string' && p.image.startsWith('data:image/'))
          ? saveImageIfBase64(p.image, p.id, 0)
          : (p.image || resolvedImages[0]);

        const videoUrl: string | null = (p.videoUrl && String(p.videoUrl).trim().length > 0) ? String(p.videoUrl).trim() : null;
        const videoThumbnail: string | null = videoUrl ? (resolvedImages[0] || null) : null;

        const tags = isCommercial
          ? ["Grade-A Tower", "Warm Shell", "Airport & KP Connectivity", "100% DG Backup"]
          : ["Verified Listing", "Vastu Compliant", "Private Balcony"];

        const label = isCommercial
          ? "Commercial Landmark"
          : (p.featured ? "Top Choice" : "New Launch");

        const isNameHidden = Boolean(dossier.hideName);
        const isPriceHidden = Boolean(dossier.hidePrice);

        const displayName = isNameHidden
          ? `Confidential ${bhkStr} in ${p.locality || 'Pune'}`
          : p.name;

        const displayPrice = isPriceHidden
          ? 'Price on Request'
          : formattedPrice;

        const finalSlug = p.slug || getPropertySlug({ id: p.id, name: p.name, locality: p.locality });

        return {
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
          customCostSheet: dossier.customCostSheet,
          legalVettingText,
          developer: (p.developer && !/anv\b/i.test(p.developer)) ? p.developer : '',
          locality: p.locality,
          location: p.location || `${p.locality}, Pune, Maharashtra`,
          price: displayPrice,
          priceRaw: numPrice,
          priceSuffix: isPriceHidden ? "On Request" : "All Inclusive",
          bhk: bhkStr,
          bhkNum: p.bhk_num || 0,
          sqft: sqftStr,
          sqftNum: Number(p.sqft_num) || 0,
          status: possession,
          possession,
          reraNumber,
          rpsStatus,
          description: cleanDescription || defaultDesc,
          highlights,
          connectivity,
          amenitiesList,
          image: coverImage,
          images: resolvedImages,
          videoUrl,
          videoThumbnail,
          tags,
          featured: !!p.featured,
          label,
          isCommercial,
          listingType: p.listing_type || 'Sale',
          dossier,
          refNumber: p.refNumber || dossier.RefNumber || '',
          propertyName: p.propertyName || dossier.PropertyName || '',
          buildingName: p.buildingName || dossier.BuildingName || '',
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
          searchKeywords: p.searchKeywords || dossier.SearchKeyword || null,
          branchName: p.branchName || dossier.BranchName || null,
          sourceName: p.sourceName || dossier.SourceName || null,
          customerName: p.customerName || dossier.CustomerFullName || null,
          customerMobile: p.customerMobile || dossier.CustomerMobile || null,
          customerEmail: p.customerEmail || dossier.CustomerEmail || null,
          employeeName: p.employeeName || dossier.EmployeeName || null,
          employeeMobile: p.employeeMobile || dossier.EmployeeMobile || null,
          employeeEmail: p.employeeEmail || dossier.EmployeeEmail || null,
          businessPurposes: purposesMap[String(p.id)] || []
        };
      });

      // Populate direct O(1) lookup maps
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

      cachedProperties = { data: mapped, timestamp: Date.now() };
      return mapped;
    }
  } catch (err) {
    console.warn("DB property fetch fallback:", err);
  }

  return ALL_FALLBACK_PROPERTIES;
}

export const getPropertyBySlugOrId = cache(async (identifier: string): Promise<PropertyItem | null> => {
  if (!identifier) return null;
  const decoded = decodeURIComponent(identifier).trim().toLowerCase();

  // Fast direct lookup
  if (propertyMapById.has(decoded)) return propertyMapById.get(decoded)!;
  if (propertyMapBySlug.has(decoded)) return propertyMapBySlug.get(decoded)!;

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
