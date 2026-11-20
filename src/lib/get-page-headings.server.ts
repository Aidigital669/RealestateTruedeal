/**
 * Server-side helper to fetch page headings.
 * Only import this from Server Components or API routes — never from client components.
 */
import { query } from '@/lib/db';
import { DEFAULT_PAGE_HEADINGS, PageHeadings } from '@/lib/page-headings-config';

const SETTING_KEY = 'page_headings';

export async function getPageHeadings(): Promise<PageHeadings> {
  try {
    const rows = await query<{ value: unknown }>(
      `SELECT value FROM "GlobalSetting" WHERE key = $1 LIMIT 1`,
      [SETTING_KEY]
    );
    const saved = rows?.[0]?.value as Partial<PageHeadings> | null;
    return { ...DEFAULT_PAGE_HEADINGS, ...(saved ?? {}) };
  } catch {
    return { ...DEFAULT_PAGE_HEADINGS };
  }
}
