import { NextRequest, NextResponse } from 'next/server';
import {
  standardizePropertyDescription,
  PropertyContext
} from '@/lib/gemini-description-standardizer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawDescription = typeof body.rawDescription === 'string' ? body.rawDescription : '';
    const context: PropertyContext = body.context || {};

    if (!rawDescription.trim() && !context.title) {
      return NextResponse.json({
        success: false,
        error: 'Missing raw description or property title'
      }, { status: 400 });
    }

    const standardized = await standardizePropertyDescription(rawDescription, context);

    return NextResponse.json({
      success: true,
      standardizedDescription: standardized
    });
  } catch (err: any) {
    console.error('Error in standardize-description API:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to standardize description'
    }, { status: 500 });
  }
}

