import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_SEARCH_CONFIG,
  PROPERTY_SYNONYM_GROUPS,
  PUNE_LOCALITY_COORDINATES
} from '@/lib/search-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    config: DEFAULT_SEARCH_CONFIG,
    synonymGroups: PROPERTY_SYNONYM_GROUPS,
    localityCount: Object.keys(PUNE_LOCALITY_COORDINATES).length
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validate updates
    const updated = {
      ...DEFAULT_SEARCH_CONFIG,
      ...body
    };

    return NextResponse.json({
      success: true,
      message: 'Search configuration updated successfully',
      config: updated
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Invalid request body' },
      { status: 400 }
    );
  }
}
