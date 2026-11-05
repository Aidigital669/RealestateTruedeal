import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch distinct locations from "Location" table and "Property" address
    const dbLocs = await query(`
      SELECT DISTINCT name FROM "Location" WHERE name IS NOT NULL AND TRIM(name) != '' ORDER BY name ASC;
    `);
    const propLocs = await query(`
      SELECT DISTINCT address FROM "Property" WHERE address IS NOT NULL AND TRIM(address) != '';
    `);

    const localitiesSet = new Set<string>();
    // Baseline Pune prime localities
    [
      "Koregaon Park",
      "Baner",
      "Balewadi",
      "Kalyani Nagar",
      "Bavdhan",
      "Mahalunge",
      "Shivajinagar",
      "Kharadi",
      "Worli",
      "Hinjewadi",
      "Wakad"
    ].forEach((l) => localitiesSet.add(l));

    dbLocs.forEach((r: any) => {
      if (r.name && r.name.trim()) localitiesSet.add(r.name.trim());
    });

    propLocs.forEach((r: any) => {
      if (r.address) {
        const first = r.address.split(/[,–-]/)[0].trim();
        if (
          first &&
          first.length >= 3 &&
          !first.toLowerCase().includes("pune") &&
          !first.toLowerCase().includes("mumbai")
        ) {
          localitiesSet.add(first);
        }
      }
    });

    // 2. Fetch distinct property types from "PropertyType" table
    const dbTypes = await query(`
      SELECT DISTINCT name FROM "PropertyType" WHERE name IS NOT NULL AND TRIM(name) != '' ORDER BY name ASC;
    `);

    const typologiesList: { value: string; label: string }[] = [

      { value: "Commercial Office", label: "Office Space" },
      { value: "Hospital / Healthcare", label: "Hospital / Healthcare" },
      { value: "1 BHK", label: "1 BHK" },
      { value: "2 BHK", label: "2 BHK" },
      { value: "3 BHK", label: "3 BHK" },
      { value: "4 BHK", label: "4 BHK" },
      { value: "4.5+ BHK Penthouse", label: "4.5+ BHK Penthouse" }
    ];

    const existingTypeValues = new Set(typologiesList.map((t) => t.value.toLowerCase()));

    dbTypes.forEach((r: any) => {
      const name = r.name.trim();
      const lower = name.toLowerCase();
      // If it's not already in typologies, add it!
      if (!existingTypeValues.has(lower) && !lower.includes("commercial")) {
        existingTypeValues.add(lower);
        typologiesList.push({ value: name, label: name });
      }
    });

    // 3. Fetch distinct statuses from "Property" table
    const propStatuses = await query(`
      SELECT DISTINCT status FROM "Property" WHERE status IS NOT NULL AND TRIM(status) != '';
    `);

    const statusesSet = new Set<string>(["Ready to Move", "Under-Construction", "Newly Launched"]);
    propStatuses.forEach((r: any) => {
      if (r.status && r.status.trim() && r.status !== "Draft" && r.status !== "Published") {
        statusesSet.add(r.status.trim());
      }
    });

    // 4. Standard price range brackets
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
      priceRanges
    });
  } catch (error: any) {
    console.error("GET /api/filter-options error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to fetch filter options",
      localities: [
        "Koregaon Park",
        "Baner",
        "Balewadi",
        "Kalyani Nagar",
        "Bavdhan",
        "Mahalunge",
        "Shivajinagar",
        "Kharadi",
        "Worli",
        "Hinjewadi",
        "Wakad"
      ],
      typologies: [
        { value: "Commercial Office", label: "Office Space" },
        { value: "1 BHK", label: "1 BHK" },
        { value: "2 BHK", label: "2 BHK" },
        { value: "3 BHK", label: "3 BHK" },
        { value: "4 BHK", label: "4 BHK" },
        { value: "4.5+ BHK Penthouse", label: "4.5+ BHK Penthouse" }
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
