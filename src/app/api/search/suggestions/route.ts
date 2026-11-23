import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  generateSearchSuggestions,
  detectQueryAutocorrect,
  PUNE_LOCALITIES_DICTIONARY,
  REAL_ESTATE_TYPOLOGIES,
  PUNE_DEVELOPERS
} from '@/lib/search-autocorrect';

export const dynamic = 'force-dynamic';

// In-memory cache for fast sub-millisecond response times
let cachedData: {
  timestamp: number;
  localities: string[];
  developers: string[];
  properties: Array<{ id: string; name: string; locality?: string; developer?: string; bhk?: string }>;
} | null = null;

const CACHE_TTL = 60 * 1000; // 1 minute cache

async function getCachedSearchCorpus() {
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < CACHE_TTL) {
    return cachedData;
  }

  try {
    // 1. Fetch locations
    const locRows = await query(`
      SELECT DISTINCT name FROM "Location" WHERE name IS NOT NULL AND TRIM(name) != '' ORDER BY name ASC;
    `);
    const localitiesSet = new Set<string>(PUNE_LOCALITIES_DICTIONARY);
    locRows.forEach((r: any) => {
      if (r.name?.trim()) localitiesSet.add(r.name.trim());
    });

    // 2. Fetch properties & developers
    const propRows = await query(`
      SELECT id, title as name, developer, address, bedrooms, status
      FROM "Property"
      WHERE status != 'Draft'
      ORDER BY "createdAt" DESC
      LIMIT 250;
    `);

    const developersSet = new Set<string>(PUNE_DEVELOPERS);
    const propertiesList: Array<{ id: string; name: string; locality?: string; developer?: string; bhk?: string }> = [];

    propRows.forEach((r: any) => {
      const pName = r.name?.trim();
      const dev = r.developer?.trim();
      const addr = r.address?.trim() || '';
      const locality = addr.split(/[,–-]/)[0]?.trim();

      if (dev && !/anv\b/i.test(dev)) {
        developersSet.add(dev);
      }
      if (locality && locality.length >= 3 && !locality.toLowerCase().includes('pune')) {
        localitiesSet.add(locality);
      }
      if (pName) {
        propertiesList.push({
          id: String(r.id),
          name: pName,
          locality,
          developer: dev,
          bhk: r.bedrooms ? `${r.bedrooms} BHK` : undefined
        });
      }
    });

    cachedData = {
      timestamp: now,
      localities: Array.from(localitiesSet),
      developers: Array.from(developersSet),
      properties: propertiesList
    };

    return cachedData;
  } catch (err) {
    console.warn('Failed to load search corpus from database, using built-in dictionary:', err);
    return {
      timestamp: now,
      localities: PUNE_LOCALITIES_DICTIONARY,
      developers: PUNE_DEVELOPERS,
      properties: []
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || searchParams.get('search') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        query: q,
        didYouMean: null,
        hasCorrection: false,
        suggestions: []
      });
    }

    const corpus = await getCachedSearchCorpus();

    const { didYouMean, hasCorrection, suggestions } = generateSearchSuggestions(q, {
      localities: corpus.localities,
      developers: corpus.developers,
      properties: corpus.properties,
      limit: 7
    });

    return NextResponse.json({
      success: true,
      query: q,
      didYouMean,
      hasCorrection,
      suggestions
    });
  } catch (error: any) {
    console.error('GET /api/search/suggestions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch suggestions',
        suggestions: [],
        didYouMean: null
      },
      { status: 500 }
    );
  }
}

