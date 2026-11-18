import type { Metadata } from 'next';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { HomepageSearchablePortal, BlogItem } from '@/components/public/HomepageSearchablePortal';
import { fetchAllProperties } from '@/lib/property-data';
import { getAllLiveBuyerDemands } from '@/lib/buyer-demands-service';
import { query } from '@/lib/db';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    query?: string;
    locality?: string;
    location?: string;
    bhk?: string;
    priceRange?: string;
    status?: string;
    type?: string;
    purpose?: string;
    transactionType?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const qSearch = params.search || params.query || '';
  const qLocality = params.locality || params.location || '';
  const qBhk = params.bhk || '';
  const qPurpose = params.purpose || '';
  const qTransactionType = params.transactionType || '';

  let pageTitle = 'Properties for Sale in Pune | Verified Real Estate Catalog | ANV Reealty';
  let pageDesc = 'Browse curated luxury residential apartments, penthouses, and Grade-A commercial spaces in Pune. 100% MahaRERA & RPS compliant developer pricing with zero brokerage.';

  if (qPurpose && qPurpose !== 'All') {
    const formattedPurpose = qPurpose.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const action = qTransactionType && qTransactionType !== 'All' ? qTransactionType : 'Sale & Rent';
    const loc = qLocality && qLocality !== 'All' ? ` in ${qLocality}, Pune` : ' in Pune';
    pageTitle = `Commercial Spaces for ${formattedPurpose} for ${action}${loc} | ANV Reealty`;
    pageDesc = `Explore commercial shops, retail showrooms, and spaces suitable for ${formattedPurpose}${loc}. Verified RERA & RPS compliant commercial inventory.`;
  } else if (qLocality && qBhk && qLocality !== 'All' && qBhk !== 'All') {
    pageTitle = `${qBhk} Properties for Sale in ${qLocality}, Pune | ANV Reealty`;
    pageDesc = `Explore verified ${qBhk} homes and apartments in ${qLocality}, Pune. RERA registered projects with direct developer pricing and zero brokerage.`;
  } else if (qLocality && qLocality !== 'All') {
    pageTitle = `Properties for Sale in ${qLocality}, Pune | Verified Residences | ANV Reealty`;
    pageDesc = `Explore premium flats, sky suites, and commercial spaces in ${qLocality}, Pune. Institutional title vetting with zero brokerage.`;
  } else if (qBhk && qBhk !== 'All') {
    pageTitle = `${qBhk} for Sale in Pune | Curated Real Estate | ANV Reealty`;
    pageDesc = `Find authenticated ${qBhk} luxury residences across prime Pune corridors including Baner, Koregaon Park, and Kalyani Nagar.`;
  } else if (qSearch.trim()) {
    pageTitle = `Search Results for "${qSearch.trim()}" | ANV Reealty Pune`;
    pageDesc = `Live verified real estate inventory and active registered buyer leads matching "${qSearch.trim()}" in Pune.`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anvreeality.com';
  const canonicalUrl = `${baseUrl}/properties`;

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: canonicalUrl,
      siteName: 'ANV Reealty',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: 'ANV Reealty Curated Portfolio Pune'
        }
      ],
      type: 'website',
      locale: 'en_IN'
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc
    }
  };
}

export default async function PropertiesIndexPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const initialParams = {
    search: rawParams.search || rawParams.query || '',
    locality: rawParams.locality || rawParams.location || 'All',
    bhk: rawParams.bhk || 'All',
    priceRange: rawParams.priceRange || 'All',
    status: rawParams.status || 'All',
    purpose: rawParams.purpose || 'All',
    transactionType: rawParams.transactionType || 'All',
    type: rawParams.type || 'All'
  };

  const [properties, buyerDemands] = await Promise.all([
    fetchAllProperties(),
    getAllLiveBuyerDemands().catch(() => [])
  ]);

  // Fetch blogs for correlation
  let insights: BlogItem[] = [
    {
      id: "1",
      title: "Baner Property Market Guide: 2026 Price Appreciation",
      description: "An in-depth analysis of property trends in Baner and what to expect in the next 3 years.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Market Report",
      locality: "Baner",
      connectedTypology: "3 BHK Luxury",
      readTime: "6 min read",
      author: "Unassigned"
    },
    {
      id: "2",
      title: "Guide to Buying a 3 BHK Apartment in Pune: Costs & Taxes",
      description: "Everything you need to know about stamp duty, registration charges, and GST implications in Pune.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Buying Guide",
      locality: "Pune",
      connectedTypology: "3 BHK",
      readTime: "8 min read",
      author: "Jennifer Desai"
    }
  ];

  try {
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
  } catch (e) {
    // Fallback
  }

  // Schema.org structured data for Real Estate ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Verified Properties in Pune',
    description: 'Explore verified residential apartments, penthouses, and Grade-A commercial office spaces in Pune.',
    numberOfItems: properties.length,
    itemListElement: properties.map((prop, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': prop.isCommercial ? 'CommercialBuilding' : 'SingleFamilyResidence',
        name: prop.name,
        description: prop.description,
        image: prop.image,
        url: `https://anvreeality.com/properties/${prop.slug}`,
        offers: {
          '@type': 'Offer',
          price: prop.priceRaw || 15000000,
          priceCurrency: 'INR'
        }
      }
    }))
  };

  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://anvreeality.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Properties',
        item: 'https://anvreeality.com/properties'
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 font-sans text-zinc-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <PublicHeader />

      <main className="flex-1 flex flex-col">
        <HomepageSearchablePortal
          initialProperties={properties}
          initialBuyerDemands={buyerDemands}
          initialBlogs={insights}
          initialSearchParams={initialParams}
          isDedicatedSearchPage={true}
        />
      </main>

      {/* Luxury Portal Footer with Complete SEO Category Links */}
      <PublicFooter />
    </div>
  );
}
