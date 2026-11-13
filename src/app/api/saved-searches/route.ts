import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

const SETTING_KEY = 'user_saved_searches';

export interface SavedSearchItem {
  id: string;
  name: string;
  query: string;
  filters: {
    locality?: string;
    bhk?: string;
    priceRange?: string;
    carpetAreaMin?: number;
    carpetAreaMax?: number;
    radiusKm?: number;
    parking?: boolean;
    furnishing?: string;
    possession?: string;
    minRoi?: number;
  };
  resultsCount?: number;
  createdAt: string;
}

const DEFAULT_SAVED_SEARCHES: SavedSearchItem[] = [
  {
    id: 'saved-1',
    name: 'Baner 3 BHK under ₹2.5 Cr',
    query: '3 BHK in Baner under 2.5 Cr',
    filters: { locality: 'Baner', bhk: '3 BHK', priceRange: '₹1.5 Cr - ₹2.5 Cr', parking: true },
    resultsCount: 8,
    createdAt: new Date().toISOString()
  },
  {
    id: 'saved-2',
    name: 'Koregaon Park Luxury Penthouses',
    query: 'Penthouse in Koregaon Park ready to move',
    filters: { locality: 'Koregaon Park', bhk: '4.5+ BHK Penthouse', possession: 'ready' },
    resultsCount: 4,
    createdAt: new Date().toISOString()
  },
  {
    id: 'saved-3',
    name: 'Hinjewadi IT Offices (ROI 8%+)',
    query: 'Commercial Office in Hinjewadi with 8% ROI',
    filters: { locality: 'Hinjewadi', minRoi: 8 },
    resultsCount: 6,
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  try {
    const row = await queryOne<{ value: SavedSearchItem[] }>(
      `SELECT "value" FROM "GlobalSetting" WHERE "key" = $1 LIMIT 1;`,
      [SETTING_KEY]
    );

    if (row && Array.isArray(row.value)) {
      return NextResponse.json({ success: true, savedSearches: row.value });
    }

    return NextResponse.json({ success: true, savedSearches: DEFAULT_SAVED_SEARCHES });
  } catch (error: any) {
    console.error('GET /api/saved-searches error:', error);
    return NextResponse.json({ success: true, savedSearches: DEFAULT_SAVED_SEARCHES });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, query: searchTxt, filters, resultsCount } = body;

    const newItem: SavedSearchItem = {
      id: `save-${Date.now()}`,
      name: name || searchTxt || 'Custom Search Filter',
      query: searchTxt || '',
      filters: filters || {},
      resultsCount: resultsCount || 0,
      createdAt: new Date().toISOString()
    };

    const row = await queryOne<{ value: SavedSearchItem[] }>(
      `SELECT "value" FROM "GlobalSetting" WHERE "key" = $1 LIMIT 1;`,
      [SETTING_KEY]
    );

    const list = row && Array.isArray(row.value) ? row.value : [...DEFAULT_SAVED_SEARCHES];
    const updated = [newItem, ...list.filter((item) => item.name !== newItem.name)].slice(0, 20);

    await query(
      `
      INSERT INTO "GlobalSetting" ("key", "value", "group", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT ("key") DO UPDATE
      SET "value" = EXCLUDED."value",
          "updatedAt" = NOW();
      `,
      [SETTING_KEY, JSON.stringify(updated), 'search_engine']
    );

    return NextResponse.json({
      success: true,
      message: 'Search combination saved successfully!',
      item: newItem,
      savedSearches: updated
    });
  } catch (error: any) {
    console.error('POST /api/saved-searches error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save search' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }

    const row = await queryOne<{ value: SavedSearchItem[] }>(
      `SELECT "value" FROM "GlobalSetting" WHERE "key" = $1 LIMIT 1;`,
      [SETTING_KEY]
    );

    if (row && Array.isArray(row.value)) {
      const filtered = row.value.filter((i) => i.id !== id);
      await query(
        `UPDATE "GlobalSetting" SET "value" = $1, "updatedAt" = NOW() WHERE "key" = $2;`,
        [JSON.stringify(filtered), SETTING_KEY]
      );
      return NextResponse.json({ success: true, savedSearches: filtered });
    }

    return NextResponse.json({ success: true, savedSearches: [] });
  } catch (error: any) {
    console.error('DELETE /api/saved-searches error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete saved search' },
      { status: 500 }
    );
  }
}
