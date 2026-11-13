import type { Metadata } from 'next';
import { queryOne } from '@/lib/db';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anvreeality.com';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const canonicalUrl = `${baseUrl}/blogs/${encodeURIComponent(id)}`;

  try {
    const blog = await queryOne(
      `SELECT title, COALESCE(excerpt, content) as description, "featuredImage" as image FROM "Blog" WHERE id = $1`,
      [id]
    );

    if (blog) {
      const cleanDesc = blog.description ? String(blog.description).replace(/<[^>]*>/g, '').slice(0, 160) : 'Pune Real Estate insights and market intelligence.';
      return {
        title: `${blog.title} | ANV REEALTY Insights`,
        description: cleanDesc,
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title: blog.title,
          description: cleanDesc,
          url: canonicalUrl,
          images: blog.image ? [{ url: blog.image }] : [],
          type: 'article',
          siteName: 'ANV REEALTY',
        },
        twitter: {
          card: 'summary_large_image',
          title: blog.title,
          description: cleanDesc,
          images: blog.image ? [blog.image] : [],
        }
      };
    }
  } catch (e) {
    // fallback
  }

  return {
    title: 'Market Insights & Advisory | ANV REEALTY',
    description: 'Pune real estate advisory, research, and micro-market analysis.',
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function BlogDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
