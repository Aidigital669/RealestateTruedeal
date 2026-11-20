import { NextRequest, NextResponse } from "next/server";
import {
  TRAINING_QUERIES_CORPUS,
  extractQueryLines,
  detectQueryIntent,
  filterBuyerDemandsByQuery,
  PUNE_LOCALITIES,
  TYPOLOGY_MAP
} from "@/lib/search-training-corpus";
import { getAllLiveBuyerDemands } from "@/lib/buyer-demands-service";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testQuery = searchParams.get("query") || searchParams.get("q");

    // If testing a single query live
    if (testQuery) {
      const extracted = extractQueryLines(testQuery);
      const allDemands = await getAllLiveBuyerDemands();
      const matchedDemands = filterBuyerDemandsByQuery(allDemands, testQuery);

      return NextResponse.json({
        success: true,
        query: testQuery,
        extractedLines: extracted,
        matchedBuyersCount: matchedDemands.length,
        sampleMatchedBuyers: matchedDemands.slice(0, 5)
      });
    }

    // Default: summary statistics of the training corpus
    const total = TRAINING_QUERIES_CORPUS.length;
    const buyerQueries = TRAINING_QUERIES_CORPUS.filter(q => q.intent === 'buyer');
    const sellerQueries = TRAINING_QUERIES_CORPUS.filter(q => q.intent === 'seller');

    return NextResponse.json({
      success: true,
      totalQueriesCount: total,
      breakdown: {
        buyerQueriesCount: buyerQueries.length,
        sellerQueriesCount: sellerQueries.length,
        puneLocalitiesCount: PUNE_LOCALITIES.length,
        typologiesCount: TYPOLOGY_MAP.length
      },
      coverageLines: [
        "Line 1: Persona Intent (Buyer seeking property vs Seller seeking buyer)",
        "Line 2: Locality (Baner, Wakad, Hinjewadi, Kharadi, Undri, Nana Peth, etc.)",
        "Line 3: Typology / BHK (1 BHK to 4.5+ BHK, Offices, Retail Shops, Showrooms, Plots)",
        "Line 4: Budget Range (Under 50L, 1-2 Cr, 2-5 Cr, 5 Cr+)",
        "Line 5: Purpose / Transaction (Buy, Rent, Pre-leased with ROI, Ready to Move)"
      ],
      sampleBuyerQueries: buyerQueries.slice(0, 10).map(q => q.query),
      sampleSellerQueries: sellerQueries.slice(0, 10).map(q => q.query),
      allQueriesPreviewUrl: "/api/search-training?limit=100"
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
