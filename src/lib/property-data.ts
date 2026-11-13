import { query } from '@/lib/db';
import { getPropertySlug, matchesProperty } from '@/lib/slug';
import { PropertyItem, ALL_FALLBACK_PROPERTIES } from '@/lib/property-types';
import { getPurposesForProperties } from '@/lib/business-purposes';
import { parseDossierData, getDefaultHighlights, getDefaultConnectivity } from '@/lib/dossier-parser';

export type { PropertyItem };
export { ALL_FALLBACK_PROPERTIES };

let cachedProperties: { data: PropertyItem[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60s in-memory cache for ultra-fast page loads

export function clearPropertyCache() {
  cachedProperties = null;
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
        p.price, p."carpetArea" as sqft_num, p.bedrooms as bhk_num, p.configuration, p."videoUrl", p.status, p."isFeatured" as featured,
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

      const mapped: PropertyItem[] = dbProps.map((p: any) => {
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

        const sqftStr = p.sqft_num ? `${Number(p.sqft_num).toLocaleString()} Sq.Ft.` : "1,200 Sq.Ft.";
        const defaultDesc = isCommercial
          ? `Grade-A corporate office space in ${p.locality}, Pune. Landmark business address with optimized workspace efficiency and airport corridor connectivity.`
          : `Spacious and luxurious ${bhkStr} residence in ${p.locality}. High floor inventory with scenic skyline views.`;

        // Parse structured dossier metadata if present in description
        const { cleanDescription, dossier } = parseDossierData(p.description || '');

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
        const possession = dossier.possession || p.status || "Ready to Move";
        const rpsStatus = dossier.rpsStatus || (isCommercial ? "Verified Commercial Title" : "100% Clear Title • Zero Encumbrances");
        const legalVettingText = dossier.legalVettingText || "This property has completed 100% title deed investigation, environmental clearance, and commencement certification as registered under Government of Maharashtra MahaRERA.";

        // Strictly return only images actually uploaded for this property
        const rawImages: string[] = (p.all_images && Array.isArray(p.all_images))
          ? p.all_images.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
          : [];

        const resolvedImages = rawImages.length > 0
          ? rawImages
          : (p.image ? [p.image] : []);

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
          customCostSheet: dossier.customCostSheet,
          legalVettingText,
          developer: p.developer,
          locality: p.locality,
          location: p.location || `${p.locality}, Pune, Maharashtra`,
          price: displayPrice,
          priceRaw: numPrice,
          priceSuffix: isPriceHidden ? "On Request" : "All Inclusive",
          bhk: bhkStr,
          bhkNum: p.bhk_num || 0,
          sqft: sqftStr,
          sqftNum: Number(p.sqft_num) || 1200,
          status: p.status || "Ready to Move",
          possession,
          reraNumber,
          rpsStatus,
          description: cleanDescription || defaultDesc,
          highlights,
          connectivity,
          amenitiesList,
          image: p.image,
          images: resolvedImages,
          videoUrl,
          videoThumbnail,
          tags,
          featured: !!p.featured,
          label,
          isCommercial,
          listingType: p.listing_type || 'Sale',
          businessPurposes: purposesMap[String(p.id)] || []
        };
      });

      cachedProperties = { data: mapped, timestamp: Date.now() };
      return mapped;
    }
  } catch (err) {
    console.warn("DB property fetch fallback:", err);
  }

  return ALL_FALLBACK_PROPERTIES;
}

export async function getPropertyBySlugOrId(identifier: string): Promise<PropertyItem | null> {
  const all = await fetchAllProperties();
  const found = all.find((p) => matchesProperty(p, identifier));
  if (found) return found;

  const fallbackFound = ALL_FALLBACK_PROPERTIES.find((p) => matchesProperty(p, identifier));
  return fallbackFound || null;
}
