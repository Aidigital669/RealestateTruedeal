import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { DEFAULT_PAGE_HEADINGS, PageHeadings } from '@/lib/page-headings-config';

const SETTING_KEY = 'page_headings';

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
    const sanitized: Record<string, string> = {};
    for (const key of allowedKeys) {
      const val = (headings as Record<string, unknown>)[key];
      if (typeof val === 'string') {
        sanitized[key] = val;
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
