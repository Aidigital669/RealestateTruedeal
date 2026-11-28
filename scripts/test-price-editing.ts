/**
 * Comprehensive End-to-End Price Editing Verification Test Suite
 * Tests unit parsing/formatting/resolution AND full API -> DB -> Cache -> Read round-trips.
 * Automatically deletes any temporary test row created during execution.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local before importing db-dependent modules
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

async function runUnitTests() {
  const {
    parseIndianPriceToNumber,
    formatIndianPrice,
    isZeroPrice,
    formatPriceDisplay,
    resolvePropertyPrice
  } = await import('../src/lib/price-utils');

  console.log('1. Running unit tests on price-utils...');

  // Parse tests
  assert.equal(parseIndianPriceToNumber('₹2.25 Cr'), 22500000);
  assert.equal(parseIndianPriceToNumber('2.25 Crore'), 22500000);
  assert.equal(parseIndianPriceToNumber('1.5cr'), 15000000);
  assert.equal(parseIndianPriceToNumber('₹85.0 Lakh'), 8500000);
  assert.equal(parseIndianPriceToNumber('40.00 Lac'), 4000000);
  assert.equal(parseIndianPriceToNumber('1.25 L'), 125000);
  assert.equal(parseIndianPriceToNumber('₹1.5 Lakh / month'), 150000);
  assert.equal(parseIndianPriceToNumber('60 Th'), 60000);
  assert.equal(parseIndianPriceToNumber('60 Thousand'), 60000);
  assert.equal(parseIndianPriceToNumber('60k / month'), 60000);
  assert.equal(parseIndianPriceToNumber('₹60,000 / month'), 60000);
  assert.equal(parseIndianPriceToNumber('7500000'), 7500000);
  assert.equal(parseIndianPriceToNumber('0.6 Lakh'), 60000);
  assert.equal(parseIndianPriceToNumber('Price on Request'), 0);
  assert.equal(parseIndianPriceToNumber('On Request'), 0);
  assert.equal(parseIndianPriceToNumber('0.00'), 0);
  assert.equal(parseIndianPriceToNumber(''), null);
  assert.equal(parseIndianPriceToNumber(null), null);

  // Format tests
  assert.equal(formatIndianPrice(22500000), '₹2.25 Cr');
  assert.equal(formatIndianPrice(4000000), '₹40.0 Lakh');
  assert.equal(formatIndianPrice(150000), '₹1.5 Lakh');
  assert.equal(formatIndianPrice(125000), '₹1.25 Lakh');
  assert.equal(formatIndianPrice(60000), '₹60,000');
  assert.equal(formatIndianPrice(0), 'Price on Request');
  assert.equal(formatIndianPrice('Price on Request'), 'Price on Request');

  // UI helpers parity
  assert.equal(isZeroPrice('Price on Request'), true);
  assert.equal(isZeroPrice('₹0.00 Cr'), true);
  assert.equal(isZeroPrice('₹60,000'), false);
  assert.equal(formatPriceDisplay('60 Th'), '₹60,000');
  assert.equal(formatPriceDisplay('₹2.25 Cr'), '₹2.25 Cr');

  // resolvePropertyPrice precedence tests
  const editedSaleOverride = resolvePropertyPrice(
    { price: 9500000, rent: null, listingType: 'Sale' },
    { ExpectedPrice: '40.00 Lakh' }
  );
  assert.equal(editedSaleOverride.numPrice, 9500000);
  assert.equal(editedSaleOverride.formattedPrice, '₹95.0 Lakh');
  assert.equal(editedSaleOverride.isRent, false);
  assert.equal(editedSaleOverride.priceSuffix, 'All Inclusive');

  const excelRentRow = resolvePropertyPrice(
    { price: null, rent: 150000, listingType: 'Rent' },
    { ExpectedPrice: '0.00', RentPM: '1.50 Lac', Lease_Sale: 'Rent' }
  );
  assert.equal(excelRentRow.numPrice, 150000);
  assert.equal(excelRentRow.formattedPrice, '₹1.5 Lakh');
  assert.equal(excelRentRow.isRent, true);
  assert.equal(excelRentRow.priceSuffix, '/ month');

  const smallRentRow = resolvePropertyPrice(
    { price: 60000, rent: 60000, listingType: 'Rent' },
    { ExpectedPrice: '₹60,000', RentPM: '₹60,000' }
  );
  assert.equal(smallRentRow.numPrice, 60000);
  assert.equal(smallRentRow.formattedPrice, '₹60,000');
  assert.equal(smallRentRow.isRent, true);

  const clearedPriceRow = resolvePropertyPrice(
    { price: 0, rent: 0, listingType: 'Sale' },
    { ExpectedPrice: '0' }
  );
  assert.equal(clearedPriceRow.numPrice, 0);
  assert.equal(clearedPriceRow.formattedPrice, 'Price on Request');

  console.log('   ✓ All unit assertions passed!');
}

async function runIntegrationTests() {
  const { NextRequest } = await import('next/server');
  const { query, queryOne } = await import('../src/lib/db');
  // Clean up any leftover test rows from interrupted prior runs
  const staleRows = await query<{ id: number }>(`SELECT id FROM "Property" WHERE title LIKE 'E2EPriceAudit_%'`);
  for (const row of staleRows) {
    await query(`DELETE FROM "PropertyImage" WHERE "propertyId" = $1`, [row.id]).catch(() => {});
    await query(`DELETE FROM "Property" WHERE id = $1`, [row.id]).catch(() => {});
  }
  const { parseDossierData, embedDossierData } = await import('../src/lib/dossier-parser');
  const { getPropertyBySlugOrId } = await import('../src/lib/property-data');
  const adminCollectionRoute = await import('../src/app/api/admin/properties/route');
  const adminItemRoute = await import('../src/app/api/admin/properties/[id]/route');
  const publicPropertiesRoute = await import('../src/app/api/properties/route');
  const unifiedSearchRoute = await import('../src/app/api/unified-search/route');

  const uniqueTag = `E2EPriceAudit_${Date.now()}`;
  let createdId: number | null = null;

  console.log(`2. Running full DB + Route integration tests (tag: ${uniqueTag})...`);

  try {
    // STEP A: POST create property
    const createReq = new NextRequest('http://localhost:3000/api/admin/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${uniqueTag} Executive Tower`,
        location: 'Baner, Pune',
        price: '₹40.0 Lakh',
        bhk: 'Office Space',
        configuration: 'Office Space',
        sqft: '1800',
        listingType: 'Sale',
        status: 'Ready to Move',
        publishStatus: 'Published',
        description: 'Automated price audit test listing.'
      })
    });
    const createRes = await adminCollectionRoute.POST(createReq);
    const createJson = await createRes.json();
    assert.equal(createRes.status, 201, `Create failed: ${JSON.stringify(createJson)}`);
    assert.equal(createJson.success, true);
    createdId = Number(createJson.property.id);
    const createdSlug = createJson.property.slug;
    assert.equal(createJson.property.priceFormatted, '₹40.0 Lakh');
    console.log(`   ✓ Step A (POST create id=${createdId}): priceFormatted = ${createJson.property.priceFormatted}`);

    // Helper to verify every read endpoint agrees on expectedFormatted & expectedRaw
    async function assertEveryReadLayer(expectedFormatted: string, expectedRaw: number, expectedSuffix: string) {
      // 1. Direct DB row check
      const dbRow = await queryOne<any>(
        `SELECT price, rent, "monthlyRent", "dossierData", description FROM "Property" WHERE id = $1`,
        [createdId]
      );
      assert.equal(Number(dbRow.price), expectedRaw, `DB price mismatch: got ${dbRow.price}, expected ${expectedRaw}`);
      const { dossier: embDossier } = parseDossierData(dbRow.description || '');
      const expectedDossierStr = expectedRaw > 0 ? expectedFormatted : '0';
      assert.equal(dbRow.dossierData?.ExpectedPrice, expectedDossierStr, 'DB JSONB dossierData.ExpectedPrice out of sync');
      assert.equal(embDossier.ExpectedPrice, expectedDossierStr, 'Embedded DOSSIER_DATA.ExpectedPrice out of sync');

      // 2. Admin GET /api/admin/properties
      const adminGetRes = await adminCollectionRoute.GET(new NextRequest(`http://localhost:3000/api/admin/properties?search=${encodeURIComponent(uniqueTag)}`));
      const adminGetJson = await adminGetRes.json();
      const adminItem = adminGetJson.properties.find((p: any) => Number(p.id) === createdId);
      assert.ok(adminItem, 'Property missing in GET /api/admin/properties');
      assert.equal(adminItem.priceFormatted, expectedFormatted, 'Admin GET priceFormatted mismatch');
      assert.equal(adminItem.priceRaw, expectedRaw, 'Admin GET priceRaw mismatch');

      // 3. Public unfiltered GET /api/properties (exercises homepage cache)
      const pubUnfilteredRes = await publicPropertiesRoute.GET(new NextRequest('http://localhost:3000/api/properties'));
      const pubUnfilteredJson = await pubUnfilteredRes.json();
      const pubItem = pubUnfilteredJson.properties.find((p: any) => Number(p.id) === createdId);
      assert.ok(pubItem, 'Property missing in unfiltered GET /api/properties');
      assert.equal(pubItem.price, expectedFormatted, 'Unfiltered GET /api/properties price mismatch');
      assert.equal(pubItem.priceRaw, expectedRaw, 'Unfiltered GET /api/properties priceRaw mismatch');
      assert.equal(pubItem.priceSuffix, expectedSuffix, 'Unfiltered GET /api/properties priceSuffix mismatch');

      // 4. Public filtered GET /api/properties?search=...
      const pubFilteredRes = await publicPropertiesRoute.GET(
        new NextRequest(`http://localhost:3000/api/properties?search=${encodeURIComponent(uniqueTag)}`)
      );
      const pubFilteredJson = await pubFilteredRes.json();
      const pubFilteredItem = pubFilteredJson.properties.find((p: any) => Number(p.id) === createdId);
      assert.ok(pubFilteredItem, 'Property missing in filtered GET /api/properties');
      assert.equal(pubFilteredItem.price, expectedFormatted, 'Filtered GET /api/properties price mismatch');
      assert.equal(pubFilteredItem.priceRaw, expectedRaw, 'Filtered GET /api/properties priceRaw mismatch');
      assert.equal(pubFilteredItem.priceSuffix, expectedSuffix, 'Filtered GET /api/properties priceSuffix mismatch');

      // 5. Public GET /api/unified-search
      const unifiedRes = await unifiedSearchRoute.GET(
        new NextRequest(`http://localhost:3000/api/unified-search?search=${encodeURIComponent(uniqueTag)}`)
      );
      const unifiedJson = await unifiedRes.json();
      const unifiedItem = unifiedJson.properties.find((p: any) => Number(p.id) === createdId);
      assert.ok(unifiedItem, 'Property missing in GET /api/unified-search');
      assert.equal(unifiedItem.price, expectedFormatted, 'Unified search price mismatch');
      assert.equal(unifiedItem.priceRaw, expectedRaw, 'Unified search priceRaw mismatch');

      // 6. Detail SSR lookup getPropertyBySlugOrId
      const detailItem = await getPropertyBySlugOrId(createdSlug);
      assert.ok(detailItem, 'Property missing in getPropertyBySlugOrId');
      assert.equal(detailItem.price, expectedFormatted, 'Detail page property.price mismatch');
      assert.equal(detailItem.priceRaw, expectedRaw, 'Detail page property.priceRaw mismatch');
      assert.equal(detailItem.priceSuffix, expectedSuffix, 'Detail page property.priceSuffix mismatch');
    }

    await assertEveryReadLayer('₹40.0 Lakh', 4000000, 'All Inclusive');
    console.log('   ✓ Verified initial ₹40.0 Lakh across DB, Admin GET, Public API (cached & filtered), Unified Search, and Detail lookup');

    // STEP B: PATCH to Crore WITH stale ExpectedPrice inside embedded description (simulating stale modal dossier)
    const staleEmbeddedDescription = embedDossierData('Updated via Sales/Admin modal', {
      ExpectedPrice: '40.00 Lakh',
      availableUnits: '3'
    });
    const patchCrRes = await adminItemRoute.PATCH(
      new NextRequest(`http://localhost:3000/api/admin/properties/${createdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: '₹2.25 Cr',
          description: staleEmbeddedDescription
        })
      }),
      { params: Promise.resolve({ id: String(createdId) }) }
    );
    const patchCrJson = await patchCrRes.json();
    assert.equal(patchCrJson.success, true);
    assert.equal(patchCrJson.property.priceFormatted, '₹2.25 Cr');
    assert.equal(patchCrJson.property.priceRaw, 22500000);
    await assertEveryReadLayer('₹2.25 Cr', 22500000, 'All Inclusive');
    console.log('   ✓ Step B (PATCH "₹2.25 Cr" even with stale embedded ExpectedPrice): propagated everywhere');

    // STEP C: PATCH to Rent listing with Thousands ("60 Th" / month)
    const patchRentThRes = await adminItemRoute.PATCH(
      new NextRequest(`http://localhost:3000/api/admin/properties/${createdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingType: 'Rent',
          price: '60 Th'
        })
      }),
      { params: Promise.resolve({ id: String(createdId) }) }
    );
    const patchRentThJson = await patchRentThRes.json();
    assert.equal(patchRentThJson.success, true);
    assert.equal(patchRentThJson.property.priceFormatted, '₹60,000');
    assert.equal(patchRentThJson.property.priceRaw, 60000);
    assert.equal(patchRentThJson.property.priceSuffix, '/ month');
    await assertEveryReadLayer('₹60,000', 60000, '/ month');
    console.log('   ✓ Step C (PATCH Rent "60 Th"): stored ₹60,000 + / month (no ₹0.6 Lakh bug) everywhere');

    // STEP D: PATCH Rent with Lakh / month string ("₹1.5 Lakh / month")
    const patchRentLakhRes = await adminItemRoute.PATCH(
      new NextRequest(`http://localhost:3000/api/admin/properties/${createdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: '₹1.5 Lakh / month'
        })
      }),
      { params: Promise.resolve({ id: String(createdId) }) }
    );
    const patchRentLakhJson = await patchRentLakhRes.json();
    assert.equal(patchRentLakhJson.success, true);
    assert.equal(patchRentLakhJson.property.priceFormatted, '₹1.5 Lakh');
    await assertEveryReadLayer('₹1.5 Lakh', 150000, '/ month');
    console.log('   ✓ Step D (PATCH Rent "₹1.5 Lakh / month"): updated everywhere');

    // STEP E: PATCH back to Sale with "Price on Request"
    const patchPorRes = await adminItemRoute.PATCH(
      new NextRequest(`http://localhost:3000/api/admin/properties/${createdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingType: 'Sale',
          price: 'Price on Request'
        })
      }),
      { params: Promise.resolve({ id: String(createdId) }) }
    );
    const patchPorJson = await patchPorRes.json();
    assert.equal(patchPorJson.success, true);
    assert.equal(patchPorJson.property.priceFormatted, 'Price on Request');
    await assertEveryReadLayer('Price on Request', 0, 'All Inclusive');
    console.log('   ✓ Step E (PATCH "Price on Request"): updated everywhere');
  } finally {
    if (createdId !== null) {
      const delRes = await adminItemRoute.DELETE(
        new NextRequest(`http://localhost:3000/api/admin/properties/${createdId}?force=true`, {
          method: 'DELETE'
        }),
        { params: Promise.resolve({ id: String(createdId) }) }
      );
      const delJson = await delRes.json();
      assert.equal(delJson.success, true, `Cleanup failed for id=${createdId}: ${JSON.stringify(delJson)}`);
      console.log(`   ✓ Cleanup deleted temporary test property id=${createdId}`);
    }
  }
}

async function main() {
  await runUnitTests();
  await runIntegrationTests();
  console.log('\nALL PRICE EDITING TESTS PASSED!');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
