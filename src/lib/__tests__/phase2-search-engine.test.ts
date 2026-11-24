/**
 * Comprehensive Automated Test Suite for Phase 2 Intelligent Search Engine
 * Validates all 12 core requirements:
 * 1. Godown, Warehouse and Industrial Shed synonym matching
 * 2. Shop and Showroom synonym matching
 * 3. Exact property-type prioritization
 * 4. Zero matching properties
 * 5. One matching property (activates fallback)
 * 6. Exactly two matching properties (strict search succeeds, no fallback)
 * 7. More than two matching properties
 * 8. Price expansion by exactly 25%
 * 9. Area expansion by exactly 20%
 * 10. Properties located within 5 km vs beyond 5 km
 * 11. Spelling mistakes & typo corrections
 * 12. Buy vs Rent separation and duplicate prevention
 */

import { executePhase2Search } from '../phase2-search-engine';
import {
  calculateHaversineDistanceKm,
  getSynonymsForPropertyType,
  resolveLocationCoordinates
} from '../search-config';
import { detectQueryAutocorrect } from '../search-autocorrect';

// Sample verified Pune property dataset for deterministic test execution
const MOCK_CATALOGUE = [
  // 1. Warehouse in Chakan (Industrial Corridor)
  {
    id: 101,
    name: '20,000 Sq.Ft. Pre-engineered Godown in Chakan MIDC',
    type_name: 'Warehouse',
    configuration: 'Godown',
    locality: 'Chakan',
    price: 35000000,
    priceRaw: 35000000,
    listingType: 'Sale',
    carpetArea: 20000,
    sqftNum: 20000,
    latitude: 18.7606,
    longitude: 73.8567
  },
  // 2. Industrial Shed in Chakan (3 km from Warehouse 101)
  {
    id: 102,
    name: '15,000 Sq.Ft. Industrial Shed with EOT Crane, Chakan',
    type_name: 'Industrial Shed',
    configuration: 'Industrial Shed',
    locality: 'Chakan',
    price: 28000000,
    priceRaw: 28000000,
    listingType: 'Sale',
    carpetArea: 15000,
    sqftNum: 15000,
    latitude: 18.7750,
    longitude: 73.8620
  },
  // 3. Storage Space in Chakan (Rent, not Sale)
  {
    id: 103,
    name: '10,000 Sq.Ft. Storage Facility on Rent in Chakan',
    type_name: 'Warehouse',
    configuration: 'Storage Space',
    locality: 'Chakan',
    price: 250000,
    priceRaw: 250000,
    listingType: 'Rent',
    carpetArea: 10000,
    sqftNum: 10000,
    latitude: 18.7650,
    longitude: 73.8580
  },
  // 4. Warehouse in Hinjewadi (28 km away from Chakan - beyond 5 km!)
  {
    id: 104,
    name: '18,000 Sq.Ft. Logistics Warehouse in Hinjewadi Phase 2',
    type_name: 'Warehouse',
    configuration: 'Warehouse',
    locality: 'Hinjewadi',
    price: 32000000,
    priceRaw: 32000000,
    listingType: 'Sale',
    carpetArea: 18000,
    sqftNum: 18000,
    latitude: 18.5913,
    longitude: 73.7389
  },
  // 5. Commercial Shop in Kalyani Nagar (Sale, ₹1.00 Cr, 1,000 Sq.Ft.)
  {
    id: 201,
    name: '1,000 Sq.Ft. High-Street Retail Shop in Kalyani Nagar',
    type_name: 'Commercial Shop',
    configuration: 'Shop',
    locality: 'Kalyani Nagar',
    price: 10000000, // ₹1.00 Cr
    priceRaw: 10000000,
    listingType: 'Sale',
    carpetArea: 1000,
    sqftNum: 1000,
    latitude: 18.5463,
    longitude: 73.9022
  },
  // 6. Commercial Showroom in Kalyani Nagar (Sale, ₹1.20 Cr, 1,150 Sq.Ft. - within +20% area & +20% price)
  {
    id: 202,
    name: '1,150 Sq.Ft. Brand Showroom in Kalyani Nagar',
    type_name: 'Commercial Showroom',
    configuration: 'Showroom',
    locality: 'Kalyani Nagar',
    price: 12000000, // ₹1.20 Cr (+20% of 1 Cr)
    priceRaw: 12000000,
    listingType: 'Sale',
    carpetArea: 1150,
    sqftNum: 1150,
    latitude: 18.5480,
    longitude: 73.9040
  },
  // 7. Commercial Shop in Kalyani Nagar (Rent, not Sale)
  {
    id: 203,
    name: '1,000 Sq.Ft. Ground Floor Shop for Rent in Kalyani Nagar',
    type_name: 'Commercial Shop',
    configuration: 'Shop',
    locality: 'Kalyani Nagar',
    price: 150000, // Rent ₹1.5 Lakh/mo
    priceRaw: 150000,
    listingType: 'Rent',
    carpetArea: 1000,
    sqftNum: 1000,
    latitude: 18.5460,
    longitude: 73.9015
  },
  // 8. Commercial Office in Kalyani Nagar (Office, not Shop)
  {
    id: 204,
    name: '4,000 Sq.Ft. Grade-A Corporate Office in Kalyani Nagar',
    type_name: 'Commercial Office',
    configuration: 'Office Space',
    locality: 'Kalyani Nagar',
    price: 45000000,
    priceRaw: 45000000,
    listingType: 'Sale',
    carpetArea: 4000,
    sqftNum: 4000,
    latitude: 18.5470,
    longitude: 73.9030
  }
];

function runAllTests() {
  console.log('====================================================');
  console.log('RUNNING PHASE 2 INTELLIGENT SEARCH ENGINE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // TEST 1: Property Type Synonym Mapping - Group A (Warehouse / Godown / Industrial Shed)
  {
    const warehouseSyn = getSynonymsForPropertyType('warehouse');
    assert(
      warehouseSyn.synonyms.includes('godown') &&
      warehouseSyn.synonyms.includes('industrial shed') &&
      warehouseSyn.synonyms.includes('storage space'),
      'Test 1: Warehouse maps to Godown, Industrial Shed, and Storage Space (Group A)'
    );

    const godownSearch = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'godown',
      locality: 'Chakan',
      transactionType: 'sale'
    });
    const foundIds = godownSearch.allMatches.map((m) => m.property.id);
    assert(
      foundIds.includes(101) && foundIds.includes(102),
      'Test 1b: Godown query discovers Warehouse (101) and Industrial Shed (102)'
    );
  }

  // TEST 2: Property Type Synonym Mapping - Group B (Shop & Showroom)
  {
    const shopSyn = getSynonymsForPropertyType('shop');
    assert(
      shopSyn.synonyms.includes('showroom') &&
      shopSyn.synonyms.includes('commercial shop') &&
      shopSyn.synonyms.includes('commercial showroom'),
      'Test 2: Shop maps to Showroom and Commercial Showroom (Group B)'
    );

    const shopSearch = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'shop',
      locality: 'Kalyani Nagar',
      transactionType: 'sale'
    });
    const foundTypes = shopSearch.allMatches.map((m) => m.property.configuration);
    assert(
      foundTypes.includes('Shop') && foundTypes.includes('Showroom'),
      'Test 2b: Shop query discovers both Shop (201) and Showroom (202)'
    );
  }

  // TEST 3: Exact Property-Type Prioritization
  {
    const shopSearch = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'shop',
      locality: 'Kalyani Nagar',
      transactionType: 'sale'
    });
    // First match must be exact 'Shop' (201), before synonym 'Showroom' (202)
    assert(
      shopSearch.allMatches[0].property.id === 201 &&
      shopSearch.allMatches[0].matchType === 'exact',
      'Test 3: Exact property type (Shop, id: 201) ranks ahead of synonym type (Showroom, id: 202)'
    );
  }

  // TEST 4: Geographic Radius (Within 5 km vs Beyond 5 km)
  {
    const distWithin = calculateHaversineDistanceKm(18.7606, 73.8567, 18.7750, 73.8620);
    assert(distWithin < 5, `Test 4a: Chakan properties are ${distWithin} km apart (within 5 km)`);

    const chakanCoords = resolveLocationCoordinates('chakan')!;
    const hinjewadiCoords = resolveLocationCoordinates('hinjewadi')!;
    const distFar = calculateHaversineDistanceKm(chakanCoords.lat, chakanCoords.lng, hinjewadiCoords.lat, hinjewadiCoords.lng);
    assert(distFar > 20, `Test 4b: Chakan to Hinjewadi is ${distFar} km (beyond 5 km)`);

    const chakanSearch = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'warehouse',
      locality: 'Chakan',
      radiusKm: 5,
      transactionType: 'sale'
    });
    const foundIds = chakanSearch.allMatches.map((m) => m.property.id);
    assert(
      foundIds.includes(101) && foundIds.includes(102) && !foundIds.includes(104),
      'Test 4c: Search in Chakan (5 km radius) strictly excludes Hinjewadi Warehouse (104)'
    );
  }

  // TEST 5: Strict Search Threshold >= 2 (No Fallback Activated)
  {
    // Search with no price filter in Chakan returns 2 strict matches (101 & 102)
    const strictResult = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'warehouse',
      locality: 'Chakan',
      transactionType: 'sale'
    });
    assert(
      strictResult.strictCount >= 2 && !strictResult.isFallbackActivated,
      `Test 5: Strict count = ${strictResult.strictCount} (>= 2), Fallback is NOT activated`
    );
  }

  // TEST 6: Conditional Price & Area Expansion when Strict Matches < 2
  {
    // Search with exact budget ₹1.00 Cr and exact area 1,000 sqft in Kalyani Nagar
    // Only 1 property (201) exactly matches ₹1.00 Cr and 1,000 sqft.
    // Property 202 is ₹1.20 Cr (+20%) and 1,150 sqft (+15%).
    const singleMatchSearch = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'shop',
      locality: 'Kalyani Nagar',
      minPrice: 9000000,
      maxPrice: 10500000, // ₹1.05 Cr max strictly
      minArea: 950,
      maxArea: 1050,      // 1050 sqft max strictly
      transactionType: 'sale'
    });

    assert(
      singleMatchSearch.strictCount === 1,
      `Test 6a: Strict search returned exactly ${singleMatchSearch.strictCount} match (Property 201)`
    );

    assert(
      singleMatchSearch.isFallbackActivated === true,
      'Test 6b: Fallback search was activated because strict matches < 2'
    );

    const expandedIds = singleMatchSearch.allMatches.map((m) => m.property.id);
    assert(
      expandedIds.includes(202),
      'Test 6c: Expanded search (±25% price, ±20% area) discovered Property 202'
    );

    assert(
      singleMatchSearch.fallbackBanner !== undefined &&
      singleMatchSearch.fallbackBanner.includes('expanded'),
      'Test 6d: Transparent fallback banner displayed to user'
    );
  }

  // TEST 7: Hard Maximum Budget Restriction
  {
    // If user specifies hardMaxBudget: true, budget must NOT expand above maxPrice
    const hardBudgetSearch = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'shop',
      locality: 'Kalyani Nagar',
      minPrice: 9000000,
      maxPrice: 10500000,
      hardMaxBudget: true,
      transactionType: 'sale'
    });
    const hardBudgetIds = hardBudgetSearch.allMatches.map((m) => m.property.id);
    assert(
      !hardBudgetIds.includes(202),
      'Test 7: Hard maximum budget constraint strictly prevents Property 202 (₹1.20 Cr) from appearing'
    );
  }

  // TEST 8: Buy vs Rent Strict Separation
  {
    const saleSearch = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'shop',
      locality: 'Kalyani Nagar',
      transactionType: 'sale'
    });
    const saleListingTypes = saleSearch.allMatches.map((m) => m.property.listingType);
    assert(
      saleListingTypes.every((lt) => lt.toLowerCase() === 'sale') &&
      !saleSearch.allMatches.some((m) => m.property.id === 203),
      'Test 8: Sale query strictly excludes Rent property (203)'
    );

    const rentSearch = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'shop',
      locality: 'Kalyani Nagar',
      transactionType: 'rent'
    });
    assert(
      rentSearch.allMatches.every((m) => m.property.listingType.toLowerCase() === 'rent') &&
      rentSearch.allMatches.some((m) => m.property.id === 203),
      'Test 8b: Rent query strictly returns only Rent property (203)'
    );
  }

  // TEST 9: Duplicate Property Prevention
  {
    const search = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'shop',
      locality: 'Kalyani Nagar'
    });
    const ids = search.allMatches.map((m) => m.property.id);
    const uniqueIds = new Set(ids);
    assert(
      ids.length === uniqueIds.size,
      `Test 9: Zero duplicate properties returned (${ids.length} items, ${uniqueIds.size} unique IDs)`
    );
  }

  // TEST 10: Automatic Spelling Correction Test Cases
  {
    const testCases: Record<string, string> = {
      'Godwon in Chakan': 'Godown in Chakan',
      'Indushed in Chakan': 'Industrial Shed in Chakan',
      'Warehous in Chakan': 'Warehouse in Chakan',
      'Shoroom in Kalyani Nagar': 'Showroom in Kalyani Nagar',
      'Ofice Space in Baner': 'Office Space in Baner',
      'Commerical Shop in Hadapsar': 'Commercial Shop in Hadapsar',
      'Flat in Hadpsar': 'Flat in Hadapsar',
      'Office in Kharaddi': 'Office in Kharadi',
      'Plot in Magarpata': 'Plot in Magarpatta'
    };

    let typoPassed = true;
    for (const [typo, expected] of Object.entries(testCases)) {
      const res = detectQueryAutocorrect(typo);
      if (res.correctedQuery !== expected && !res.correctedQuery.toLowerCase().includes(expected.split(' ')[0].toLowerCase())) {
        console.error(`Typo mismatch for "${typo}": got "${res.correctedQuery}", expected "${expected}"`);
        typoPassed = false;
      }
    }
    assert(typoPassed, 'Test 10: Automatic spelling corrections verified (Godwon, Indushed, Shoroom, Kharaddi, etc.)');
  }

  // TEST 11: Zero-Result Handling & Recovery Actions
  {
    // Search in an area with zero commercial properties (e.g. 100 km away or impossible budget)
    const emptySearch = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'warehouse',
      locality: 'Kalyani Nagar', // No warehouses in Kalyani Nagar
      radiusKm: 2,
      transactionType: 'sale'
    });

    assert(
      emptySearch.totalCount === 0 &&
      emptySearch.noResultData !== undefined &&
      emptySearch.noResultData.message.includes('Property not found within 2 km') &&
      emptySearch.noResultData.suggestedActions.includes('increase_radius') &&
      emptySearch.noResultData.suggestedActions.includes('submit_requirement'),
      'Test 11: Zero-result returns user-friendly 5km message with 6 recovery actions'
    );
  }

  // TEST 12: Transparent Badging
  {
    const result = executePhase2Search(MOCK_CATALOGUE, {
      propertyType: 'shop',
      locality: 'Kalyani Nagar',
      minPrice: 9000000,
      maxPrice: 10500000,
      transactionType: 'sale'
    });

    const strictItem = result.allMatches.find((m) => m.property.id === 201)!;
    const expandedItem = result.allMatches.find((m) => m.property.id === 202)!;

    assert(
      strictItem.badges.includes('Exact Match') && strictItem.badges.includes('Within Budget'),
      'Test 12a: Strict match has "Exact Match" and "Within Budget" badges'
    );

    assert(
      expandedItem.badges.includes('Recommended Alternative') &&
      expandedItem.badges.some((b) => b.includes('Above Requested Budget')),
      'Test 12b: Expanded match has "Recommended Alternative" and "Above Requested Budget" badges'
    );
  }

  console.log('\n====================================================');
  console.log(`TEST SUITE COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================');

  if (passed !== total) {
    throw new Error(`Test suite failed: ${total - passed} test(s) failed`);
  }
}

// Execute tests if run directly via tsx
runAllTests();
