import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPropertyBySlugOrId, fetchAllProperties } from '@/lib/property-data';
import { getPropertyUrl } from '@/lib/slug';
import { CATEGORIES_DATA, getCategoryBySlug } from '@/lib/categories-data';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { HomepageSearchablePortal, PropertyItem, BlogItem } from '@/components/public/HomepageSearchablePortal';
import { CategoryHeroSEOHeader } from '@/components/public/CategoryHeroSEOHeader';

interface PageProps {
  params: Promise<{ slug: string }>;
}

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

export async function generateStaticParams() {
  return CATEGORIES_DATA.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (slug === 'office-in-it-park' || slug === 'coworking-office-space') {
    redirect('/office-space');
  }

  // 1. Check if category (e.g. /hospital, /office-space)
  const category = getCategoryBySlug(slug);
  if (category) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anvreeality.com';
    const canonicalUrl = `${baseUrl}/${category.slug}`;

    return {
      title: category.metaTitle,
      description: category.metaDescription,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: category.metaTitle,
        description: category.metaDescription,
        url: canonicalUrl,
        siteName: 'ANV REEALTY',
        type: 'website',
        locale: 'en_IN',
        images: [
          {
            url: category.heroImage,
            width: 1200,
            height: 630,
            alt: `${category.title} in Pune - ANV Reealty`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: category.metaTitle,
        description: category.metaDescription,
        images: [category.heroImage],
      },
      keywords: [
        `${category.title} in Pune`,
        `Pune ${category.title} for sale`,
        `${category.shortTitle} real estate Pune`,
        'ANV Reealty',
        'MahaRERA verified properties',
        'commercial real estate Pune',
        'zero brokerage properties'
      ]
    };
  }

  // 2. Check if single property
  const property = await getPropertyBySlugOrId(slug);
  if (property) {
    const title = `${property.name} in ${property.locality || 'Pune'} | ${property.price} | ANV Reealty`;
    const description = `${property.bhk} luxury residence in ${property.location} by ${property.developer}. RERA Registered: ${property.reraNumber || 'Verified'}. Quoted Price: ${property.price}.`;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anvreeality.com';
    const canonicalUrl = `${baseUrl}${getPropertyUrl(property)}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'ANV Reealty',
        images: [
          {
            url: property.image,
            width: 1200,
            height: 630,
            alt: property.name,
          }
        ],
        type: 'website',
        locale: 'en_IN'
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [property.image]
      }
    };
  }

  return {
    title: 'Property & Category Dossier | ANV Reealty Pune',
    description: 'Explore verified luxury and commercial real estate properties across Pune Western and Eastern corridors.'
  };
}

export default async function DirectSlugPage({ params }: PageProps) {
  const { slug } = await params;

  if (slug === 'office-in-it-park' || slug === 'coworking-office-space') {
    redirect('/office-space');
  }

  // 1. Direct Category Match (e.g. /hospital, /office-space, etc.)
  const category = getCategoryBySlug(slug);
  if (category) {
    const allProperties = await fetchAllProperties();
    const searchTerm = category.slug === 'hospital' ? 'hospital' : (category.shortTitle || category.title);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anvreeality.com';

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: baseUrl,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Categories',
              item: `${baseUrl}/properties`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: category.title,
              item: `${baseUrl}/${category.slug}`,
            },
          ],
        },
        {
          '@type': 'CollectionPage',
          name: category.metaTitle,
          description: category.metaDescription,
          url: `${baseUrl}/${category.slug}`,
          provider: {
            '@type': 'RealEstateAgent',
            name: 'ANV REEALTY',
            url: baseUrl,
            telephone: '+91 93730 20701',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'East Wing, M.G. Road, Camp',
              addressLocality: 'Pune',
              addressRegion: 'Maharashtra',
              postalCode: '411001',
              addressCountry: 'IN',
            },
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: category.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="min-h-screen flex flex-col bg-zinc-50 font-sans text-zinc-900">
          <PublicHeader />
          <main className="flex-1">
            {/* Top SEO-Friendly Category Header & Intent Overview */}
            <CategoryHeroSEOHeader
              category={category}
              totalPropertiesCount={allProperties.length}
            />

            {/* Properties & Search Portal Section */}
            <div id="search-portal-section">
              <HomepageSearchablePortal
                initialProperties={allProperties}
                initialBlogs={fallbackInsights}
                initialSearchParams={{ search: searchTerm }}
              />
            </div>

            {/* Category Institutional Advisory, Features & FAQs Section */}
            <section className="bg-white border-t border-zinc-200 py-16">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 text-xs font-bold uppercase tracking-wider">
                    <span>Verified Category Dossier</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                    {category.title} in Pune — Advisory Overview
                  </h2>
                  <p className="text-sm text-zinc-600 leading-relaxed font-light">
                    {category.overview}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-6 space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider text-amber-800">
                      Institutional Criteria
                    </h3>
                    <ul className="space-y-2 text-xs text-zinc-700">
                      {category.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-6 space-y-3">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider text-amber-800">
                      Investment Benefits
                    </h3>
                    <ul className="space-y-2 text-xs text-zinc-700">
                      {category.investmentBenefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {category.faqs && category.faqs.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <h3 className="text-xl font-bold text-zinc-950">
                      Frequently Asked Questions: {category.title}
                    </h3>
                    <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                      {category.faqs.map((faq, i) => (
                        <div key={i} className="p-5 space-y-1.5">
                          <h4 className="text-sm font-bold text-zinc-900">{faq.question}</h4>
                          <p className="text-xs text-zinc-600 leading-relaxed font-light">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </main>
          <PublicFooter />
        </div>
      </>
    );
  }

  // 2. Direct Property Match
  const property = await getPropertyBySlugOrId(slug);
  if (property) {
    redirect(getPropertyUrl(property));
  }

  notFound();
}
