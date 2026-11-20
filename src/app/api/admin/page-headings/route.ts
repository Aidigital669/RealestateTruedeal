import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

const SETTING_KEY = 'page_headings';

// Default headings (used when no custom setting saved yet)
export const DEFAULT_PAGE_HEADINGS = {
  // Footer nav columns
  footer_col_commercial: 'Showroom & Office',
  footer_col_residential: 'Residential & Land',
  footer_col_specialized: 'Specialized & Advisory',
  footer_col_portals: 'Portals & Access',

  // Homepage section headings
  home_hero_title: 'Premium Real Estate in Pune',
  home_hero_subtitle: 'Find your perfect property with ANV Reealty',
  home_featured_title: 'Featured Properties',
  home_featured_subtitle: 'Handpicked premium listings',
  home_active_buyers_title: 'Active Buyers',
  home_why_us_title: 'Why Choose ANV Reealty',
  home_explore_title: 'Explore by Category',

  // Properties listing page
  properties_page_title: 'All Properties',
  properties_page_subtitle: 'Browse our complete portfolio',

  // Category page
  category_page_subtitle: 'Explore verified listings',

  // Buyer section
  buyers_section_title: 'Active Buyers',
  buyers_section_subtitle: 'Connect with verified buyers looking for properties',

  // Property detail page sections
  detail_location_title: 'Location & Connectivity',
  detail_amenities_title: 'Amenities & Features',
  detail_schedule_title: 'Schedule Site Visit',
  detail_similar_title: 'Similar Properties',
};

export type PageHeadings = typeof DEFAULT_PAGE_HEADINGS;

export async function GET() {
  try {
    const row = await queryOne<{ value: unknown }>(
      `SELECT value FROM "GlobalSetting" WHERE key = $1`,
      [SETTING_KEY]
    );

    const saved = row?.value as Partial<PageHeadings> | null;
    const merged = { ...DEFAULT_PAGE_HEADINGS, ...(saved || {}) };

    return NextResponse.json({ success: true, headings: merged, defaults: DEFAULT_PAGE_HEADINGS });
  } catch (error: any) {
    console.error('GET /api/admin/page-headings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch page headings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { headings } = body as { headings: Partial<PageHeadings> };

    if (!headings || typeof headings !== 'object') {
      return NextResponse.json({ success: false, error: 'headings object required' }, { status: 400 });
    }

    // Merge with defaults, only allow known keys
    const allowedKeys = Object.keys(DEFAULT_PAGE_HEADINGS) as Array<keyof PageHeadings>;
    const sanitized: Partial<PageHeadings> = {};
    for (const key of allowedKeys) {
      if (typeof headings[key] === 'string') {
        sanitized[key] = headings[key] as string;
      }
    }

    await query(
      `INSERT INTO "GlobalSetting" (key, value, "group", "createdAt", "updatedAt")
       VALUES ($1, $2::jsonb, 'cms', NOW(), NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, "updatedAt" = NOW()`,
      [SETTING_KEY, JSON.stringify(sanitized)]
    );

    return NextResponse.json({ success: true, message: 'Page headings saved successfully!' });
  } catch (error: any) {
    console.error('PUT /api/admin/page-headings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save page headings' },
      { status: 500 }
    );
  }
}
