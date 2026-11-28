import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { fetchEightFieldGroupByFacets } from "@/lib/sql-8field-search";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const [facets, propStatuses] = await Promise.all([
      fetchEightFieldGroupByFacets(),
      query(`
        SELECT status, COUNT(*)::int AS count
        FROM "Property"
        WHERE "publishStatus" = 'Published'
          AND status IS NOT NULL
          AND TRIM(status) != ''
          AND status NOT IN ('Draft', 'Published')
        GROUP BY status
        ORDER BY count DESC;
      `)
    ]);

    const localitiesSet = new Set<string>([
      "Baner", "Kharadi", "Magarpatta City", "Viman Nagar", "Shivaji Nagar",
      "Mundhwa", "NIBM Road", "Camp", "Hinjewadi", "Chakan",
      "Kalyani Nagar", "Koregaon Park", "Balewadi", "Wakad", "Bavdhan"
    ]);
    facets.localities.forEach((r) => {
      if (r.value && r.value.trim()) localitiesSet.add(r.value.trim());
    });

    const typologiesList: { value: string; label: string; count?: number }[] = [
      { value: "Office Space", label: "Office Space" },
      { value: "Residential Apartment", label: "Residential Apartment" },
      { value: "Shop/Showroom", label: "Shop/Showroom" },
      { value: "Hospital", label: "Hospital" },
      { value: "1 BHK", label: "1 BHK" },
      { value: "2 BHK", label: "2 BHK" },
      { value: "3 BHK", label: "3 BHK" },
      { value: "4 BHK", label: "4 BHK" },
      { value: "4.5+ BHK Penthouse", label: "4.5+ BHK Penthouse" }
    ];
    const seenTypes = new Set(typologiesList.map((t) => t.value.toLowerCase()));
    facets.propertyTypes.forEach((pt) => {
      const name = pt.value?.trim();
      if (!name) return;
      const existing = typologiesList.find((t) => t.value.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.count = pt.count;
      } else if (!seenTypes.has(name.toLowerCase())) {
        seenTypes.add(name.toLowerCase());
        typologiesList.push({ value: name, label: name, count: pt.count });
      }
    });

    const statusesSet = new Set<string>(["Ready to Move", "Under-Construction", "Newly Launched"]);
    propStatuses.forEach((r: any) => {
      if (r.status?.trim()) statusesSet.add(r.status.trim());
    });

    const priceRanges = [
      { value: "Under ₹1.5 Cr", label: "Under ₹1.5 Cr" },
      { value: "₹1.5 Cr - ₹2.5 Cr", label: "₹1.5 Cr - ₹2.5 Cr" },
      { value: "₹2.5 Cr - ₹4.0 Cr", label: "₹2.5 Cr - ₹4.0 Cr" },
      { value: "₹4.0 Cr+", label: "₹4.0 Cr+ (Ultra-Luxury)" }
    ];

    return NextResponse.json({
      success: true,
      localities: Array.from(localitiesSet),
      typologies: typologiesList,
      statuses: Array.from(statusesSet),
      priceRanges,
      // Real GROUP BY counts across all 8 database search fields
      eightFieldFacets: {
        transactionTypes: facets.transactionTypes,
        propertyTypes: facets.propertyTypes,
        transactionClassifications: facets.transactionClassifications,
        localities: facets.localities,
        cities: facets.cities,
        builtupAreaStats: facets.builtupAreaStats,
        carpetAreaStats: facets.carpetAreaStats,
        expectedPriceStats: facets.expectedPriceStats
      }
    });
  } catch (error: any) {
    console.error("GET /api/filter-options error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to fetch filter options",
      localities: ["Koregaon Park", "Baner", "Balewadi", "Kalyani Nagar", "Kharadi", "Hinjewadi", "Wakad"],
      typologies: [
        { value: "Office Space", label: "Office Space" },
        { value: "Residential Apartment", label: "Residential Apartment" },
        { value: "Shop/Showroom", label: "Shop/Showroom" },
        { value: "1 BHK", label: "1 BHK" },
        { value: "2 BHK", label: "2 BHK" },
        { value: "3 BHK", label: "3 BHK" },
        { value: "4 BHK", label: "4 BHK" }
      ],
      statuses: ["Ready to Move", "Under-Construction", "Newly Launched"],
      priceRanges: [
        { value: "Under ₹1.5 Cr", label: "Under ₹1.5 Cr" },
        { value: "₹1.5 Cr - ₹2.5 Cr", label: "₹1.5 Cr - ₹2.5 Cr" },
        { value: "₹2.5 Cr - ₹4.0 Cr", label: "₹2.5 Cr - ₹4.0 Cr" },
        { value: "₹4.0 Cr+", label: "₹4.0 Cr+ (Ultra-Luxury)" }
      ]
    });
  }
}
