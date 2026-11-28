import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPropertyBySlugOrId } from '@/lib/property-data';
import { getPropertySlug, getPropertyUrl, getPropertyCategorySlug } from '@/lib/slug';
import { PropertyDetailPageClient } from '@/components/public/PropertyDetailPageClient';

export const dynamic = 'force-dynamic';

interface PropertyDetailPageProps {
  params: Promise<{ slug: string; propertySlug: string }>;
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const { slug: categoryParam, propertySlug } = await params;
  const property = await getPropertyBySlugOrId(propertySlug) || await getPropertyBySlugOrId(categoryParam);

  if (!property) {
    return {
      title: 'Property Dossier | ANV Reealty Pune',
      description: 'Explore verified luxury and commercial real estate properties across Pune Western and Eastern corridors.'
    };
  }

  const category = getPropertyCategorySlug(property);
  const canonicalSlug = property.slug || getPropertySlug(property);
  const title = `${property.name} in ${property.locality || 'Pune'} | ${property.price} | ANV Reealty`;
  const description = `${property.bhk} ${category} in ${property.location} by ${property.developer}. RERA Registered: ${property.reraNumber || 'Verified'}. Quoted Price: ${property.price}.`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anvreeality.com';
  const canonicalUrl = `${baseUrl}/${category}/${canonicalSlug}`;

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

export default async function PropertyDetailPageTwoSegment({ params }: PropertyDetailPageProps) {
  const { slug: categoryParam, propertySlug } = await params;
  const property = await getPropertyBySlugOrId(propertySlug) || await getPropertyBySlugOrId(categoryParam);

  if (!property) {
    notFound();
  }

  const category = getPropertyCategorySlug(property);
  const canonicalSlug = property.slug || getPropertySlug(property);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anvreeality.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': property.isCommercial ? 'CommercialBuilding' : 'SingleFamilyResidence',
    name: property.name,
    description: property.description,
    image: property.images && property.images.length > 0 ? property.images : [property.image],
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.location,
      addressLocality: property.locality || 'Pune',
      addressRegion: 'Maharashtra',
      addressCountry: 'IN'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 18.5204,
      longitude: 73.8567
    },
    offers: {
      '@type': 'Offer',
      price: property.priceRaw || 15000000,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/${category}/${canonicalSlug}`
    }
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Properties in Pune',
        item: `${baseUrl}/properties`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.charAt(0).toUpperCase() + category.slice(1),
        item: `${baseUrl}/${category}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: property.locality || 'Pune',
        item: `${baseUrl}/properties?locality=${encodeURIComponent(property.locality || 'Pune')}`
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: property.name,
        item: `${baseUrl}/${category}/${canonicalSlug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PropertyDetailPageClient initialProperty={property} identifier={propertySlug} />
    </>
  );
}
