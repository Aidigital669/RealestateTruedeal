import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HomepageSearchablePortal, PropertyItem, BlogItem } from "@/components/public/HomepageSearchablePortal";
import { query } from "@/lib/db";
import { fetchAllProperties } from "@/lib/property-data";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anvreeality.com';

export const metadata: Metadata = {
  title: "Anv Reealty | Luxury Real Estate & Verified Properties in Pune",
  description: "Explore curated luxury residential apartments, penthouses, and Grade-A commercial spaces in Pune with direct title verification and bespoke advisory.",
  alternates: {
    canonical: `${baseUrl}/`,
  },
  openGraph: {
    title: "Anv Reealty | Luxury Real Estate & Verified Properties in Pune",
    description: "Explore curated luxury residential apartments, penthouses, and Grade-A commercial spaces in Pune with direct title verification and bespoke advisory.",
    url: `${baseUrl}/`,
    siteName: "ANV REEALTY",
    type: "website",
    locale: "en_IN",
  },
};

const fallbackProperties: PropertyItem[] = [];

const fallbackInsights: BlogItem[] = [
  {
    id: 'blog-1',
    title: 'Pune Real Estate Market Outlook 2026',
    description: 'An in-depth analysis of Pune\'s commercial and residential property trends, focusing on prime micro-markets like Baner and Kalyani Nagar.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'Market Report',
    author: 'ANV Research',
    readTime: '6 min read'
  },
  {
    id: 'blog-2',
    title: 'Top 5 Investment Destinations in Pune',
    description: 'Discover the emerging neighborhoods in Pune that are projected to yield the highest ROI for real estate investors over the next decade.',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'Investment',
    author: 'ANV Insights',
    readTime: '8 min read'
  },
  {
    id: 'blog-3',
    title: 'Navigating Commercial Leases in 2026',
    description: 'A comprehensive guide for corporations seeking Grade-A office spaces, covering legal considerations and modern workspace requirements.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'Commercial',
    author: 'ANV Strategy',
    readTime: '5 min read'
  }
];

export default async function Home(props: {
  searchParams?: Promise<{
    search?: string;
    query?: string;
    locality?: string;
    bhk?: string;
    priceRange?: string;
    status?: string;
    purpose?: string;
    transactionType?: string;
    type?: string;
  }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  let properties: PropertyItem[] = fallbackProperties;
  let insights: BlogItem[] = fallbackInsights;

  try {
    // 1. Fetch live properties from PostgreSQL database with business purposes and listing type
    properties = await fetchAllProperties();


    // 2. Fetch live blogs from PostgreSQL database
    const dbBlogs = await query(`
      SELECT 
        b.id, b.title, COALESCE(b.excerpt, b.content) as description,
        COALESCE(b."featuredImage", 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80') as image,
        COALESCE(c.name, 'Market Report') as category,
        COALESCE(b."authorName", 'ANV Research') as author
      FROM "Blog" b
      LEFT JOIN "BlogCategory" c ON b."categoryId" = c.id
      ORDER BY b."createdAt" DESC
      LIMIT 6;
    `);

    if (dbBlogs && dbBlogs.length > 0) {
      insights = dbBlogs.map((b: any) => ({
        id: String(b.id),
        title: b.title,
        description: b.description,
        image: b.image,
        category: b.category,
        author: b.author,
        readTime: "6 min read"
      }));
    }
  } catch (error) {
    console.log("Database connection fallback to curated properties & insights:", error);
  }

  // 3. Dynamic Filter Options: automatically increase as per products in database
  const dynamicLocalitiesSet = new Set<string>([
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
  ]);

  const dynamicTypologiesList = [

    { value: "Commercial Office", label: "Office Space" },
    { value: "Hospital / Healthcare", label: "Hospital / Healthcare" },
    { value: "1 BHK", label: "1 BHK" },
    { value: "2 BHK", label: "2 BHK" },
    { value: "3 BHK", label: "3 BHK" },
    { value: "4 BHK", label: "4 BHK" },
    { value: "4.5+ BHK Penthouse", label: "4.5+ BHK Penthouse" }
  ];

  const dynamicStatusesSet = new Set<string>([
    "Ready to Move",
    "Under-Construction",
    "Newly Launched"
  ]);

  try {
    const [dbLocs, dbTypes, dbStatuses] = await Promise.all([
      query(`SELECT DISTINCT name FROM "Location" WHERE name IS NOT NULL AND TRIM(name) != '' ORDER BY name ASC;`),
      query(`SELECT DISTINCT name FROM "PropertyType" WHERE name IS NOT NULL AND TRIM(name) != '' ORDER BY name ASC;`),
      query(`SELECT DISTINCT status FROM "Property" WHERE status IS NOT NULL AND TRIM(status) != '' AND status != 'Draft';`)
    ]);

    dbLocs?.forEach((r: any) => {
      if (r.name && r.name.trim()) dynamicLocalitiesSet.add(r.name.trim());
    });

    properties.forEach((p) => {
      if (p.locality && p.locality.trim()) dynamicLocalitiesSet.add(p.locality.trim());
    });

    const seenTypes = new Set(dynamicTypologiesList.map((t) => t.value.toLowerCase()));
    dbTypes?.forEach((r: any) => {
      const name = r.name?.trim();
      if (name && !seenTypes.has(name.toLowerCase()) && !name.toLowerCase().includes("commercial")) {
        seenTypes.add(name.toLowerCase());
        dynamicTypologiesList.push({ value: name, label: name });
      }
    });

    dbStatuses?.forEach((r: any) => {
      if (r.status && r.status.trim()) dynamicStatusesSet.add(r.status.trim());
    });

    properties.forEach((p) => {
      if (p.status && p.status.trim()) dynamicStatusesSet.add(p.status.trim());
    });
  } catch (err) {
    console.log("Filter options query fallback:", err);
  }

  const initialFilterOptions = {
    localities: Array.from(dynamicLocalitiesSet),
    typologies: dynamicTypologiesList,
    statuses: Array.from(dynamicStatusesSet),
    priceRanges: [
      { value: "Under ₹1.5 Cr", label: "Under ₹1.5 Cr" },
      { value: "₹1.5 Cr - ₹2.5 Cr", label: "₹1.5 Cr - ₹2.5 Cr" },
      { value: "₹2.5 Cr - ₹4.0 Cr", label: "₹2.5 Cr - ₹4.0 Cr" },
      { value: "₹4.0 Cr+", label: "₹4.0 Cr+ (Ultra-Luxury)" }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 font-sans text-zinc-900">
      {/* 1. Header with Login & Consultation Integration */}
      <PublicHeader />

      {/* 2. Interactive Searchable Portal with Upper Filtration Dropdowns & Card-in-Card Results */}
      <div className="flex-1 flex flex-col">
        <HomepageSearchablePortal
          initialProperties={properties}
          initialBlogs={insights}
          initialFilterOptions={initialFilterOptions}
          initialSearchParams={searchParams}
        />
      </div>

      {/* 4. Luxury Portal Footer with Complete SEO Category Links */}
      <PublicFooter />
    </div>
  );
}
