'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_PAGE_HEADINGS, PageHeadings } from '@/lib/page-headings-config';

// Cache headings in memory for the session so we don't refetch on every component mount
let _cache: PageHeadings | null = null;
let _fetchPromise: Promise<PageHeadings> | null = null;

async function fetchHeadings(): Promise<PageHeadings> {
  if (_cache) return _cache;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = fetch('/api/admin/page-headings', { cache: 'no-store' })
    .then((r) => r.json())
    .then((data) => {
      const result: PageHeadings = data?.headings ?? DEFAULT_PAGE_HEADINGS;
      _cache = result;
      return result;
    })
    .catch(() => DEFAULT_PAGE_HEADINGS);

  return _fetchPromise;
}

/** Call this to bust the in-memory cache (e.g. after admin saves headings) */
export function clearPageHeadingsCache() {
  _cache = null;
  _fetchPromise = null;
}

/**
 * Hook — returns the current page headings (merged with defaults).
 * Falls back to DEFAULT_PAGE_HEADINGS synchronously on first render, then updates.
 */
export function usePageHeadings(): { headings: PageHeadings; loading: boolean } {
  const [headings, setHeadings] = useState<PageHeadings>(_cache ?? DEFAULT_PAGE_HEADINGS);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) {
      setHeadings(_cache);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchHeadings().then((h) => {
      setHeadings(h);
      setLoading(false);
    });
  }, []);

  return { headings, loading };
}
