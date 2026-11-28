/**
 * Automated Test Suite for the 8-Field SQL Search (WHERE ... AND ... + GROUP BY)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf-8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

async function main() {
  const { NextRequest } = await import('next/server');
  const { parseEightFieldRequirements } = await import('../src/lib/eight-field-parser');
  const { buildEightFieldWhereClause, fetchEightFieldGroupByFacets, executeEightFieldSqlRows } = await import('../src/lib/sql-8field-search');
  const filterOptionsRoute = await import('../src/app/api/filter-options/route');
  const unifiedSearchRoute = await import('../src/app/api/unified-search/route');
  const publicPropertiesRoute = await import('../src/app/api/properties/route');

  console.log('1. Testing 8-field natural-language parser...');
  const parsedComplex = parseEightFieldRequirements(
    'rent preleased office space in Baner Pune East built-up 2000-3500 sqft carpet 1500 sqft under 2 lakh'
  );
  assert.equal(parsedComplex.transactionType, 'Rent');
  assert.ok(parsedComplex.propertyTypes.includes('Office Space'));
  assert.equal(parsedComplex.transactionClassification, 'Pre Lease/Pre Rented');
  assert.ok(parsedComplex.localities.some((l) => l.toLowerCase() === 'baner'));
  assert.ok(parsedComplex.cities.some((c) => c.toLowerCase().includes('pune')));
  assert.equal(parsedComplex.builtupArea.min, 2000);
  assert.equal(parsedComplex.builtupArea.max, 3500);
  assert.ok(parsedComplex.carpetArea.min !== null && parsedComplex.carpetArea.max !== null);
  assert.equal(parsedComplex.expectedPrice.max, 200000);
  console.log('   ✓ Complex 8-field requirement parsed cleanly!');

  console.log('2. Testing /api/filter-options GROUP BY facets...');
  const foRes = await filterOptionsRoute.GET(new NextRequest('http://localhost:3000/api/filter-options'));
  const foJson = await foRes.json();
  assert.equal(foJson.success, true);
  assert.ok(foJson.eightFieldFacets.transactionTypes.length >= 2);
  assert.ok(foJson.eightFieldFacets.propertyTypes.length >= 5);
  assert.ok(foJson.eightFieldFacets.transactionClassifications.length >= 3);
  assert.ok(foJson.eightFieldFacets.localities.length >= 10);
  assert.ok(foJson.eightFieldFacets.cities.length >= 3);
  assert.ok(foJson.eightFieldFacets.builtupAreaStats.count > 0);
  assert.ok(foJson.eightFieldFacets.carpetAreaStats.count > 0);
  assert.ok(foJson.eightFieldFacets.expectedPriceStats.count > 0);
  console.log(
    `   ✓ GROUP BY facets verified: ${foJson.eightFieldFacets.transactionTypes.length} tx types, ` +
    `${foJson.eightFieldFacets.propertyTypes.length} property types, ` +
    `${foJson.eightFieldFacets.transactionClassifications.length} classifications, ` +
    `${foJson.eightFieldFacets.cities.length} cities`
  );

  console.log('3. Testing live SQL WHERE ... AND ... queries across individual & combined 8 fields...');
  const cases = [
    { label: 'Rent + Office Space + Baner', q: 'rent office space in baner' },
    { label: 'Resale + Residential Apartment + Kharadi', q: 'resale apartment kharadi' },
    { label: 'City = Dubai', q: 'properties in dubai' },
    { label: 'Pre Launch property', q: 'pre launch property in pune' },
    { label: 'Built-up Area 2000 sqft + Office', q: 'office built-up 2000 sqft' },
    { label: 'Carpet Area 1500 sqft + Budget under 2 Cr', q: 'sale office 1500 carpet area under 2 cr' },
    { label: 'Screenshot Full 8-Field Match (Orville Viman Nagar)', q: 'Rent Commercial Office/Space Resale Viman Nagar Pune(East) 3342 sqft 3.32 lakh' },
    { label: 'Building Name (Orville Business Port)', q: 'Orville Business Port' }
  ];

  for (const c of cases) {
    const crit = parseEightFieldRequirements(c.q);
    const built = buildEightFieldWhereClause(crit);
    const rows = await executeEightFieldSqlRows(built.whereSql, built.params, 25);
    const facets = await fetchEightFieldGroupByFacets(built.whereSql, built.params);
    assert.ok(built.whereSql.includes('AND'), `Expected WHERE ... AND ... SQL for ${c.label}`);
    console.log(`   ✓ [${c.label}] -> matched ${rows.length} SQL rows (${facets.propertyTypes.map((f) => `${f.value}:${f.count}`).slice(0, 3).join(', ')})`);
    assert.ok(rows.length > 0, `Expected >0 DB rows for "${c.q}"`);
  }

  console.log('4. Testing /api/unified-search & /api/properties HTTP handlers...');
  const uRes = await unifiedSearchRoute.GET(
    new NextRequest('http://localhost:3000/api/unified-search?search=' + encodeURIComponent('rent office space in baner under 2 lakh'))
  );
  const uJson = await uRes.json();
  assert.equal(uJson.success, true);
  assert.ok(uJson.properties.length > 0);
  assert.ok(uJson.groupByFacets?.propertyTypes?.length > 0);
  for (const p of uJson.properties) {
    assert.match(String(p.listingType || '').toLowerCase(), /rent|lease/);
    assert.ok(p.priceRaw <= 200000 || uJson.phase2?.isFallbackActivated, `Price exceeded budget on ${p.id}: ${p.priceRaw}`);
  }

  const pRes = await publicPropertiesRoute.GET(
    new NextRequest('http://localhost:3000/api/properties?city=Dubai&transactionType=Sale')
  );
  const pJson = await pRes.json();
  assert.equal(pJson.success, true);
  assert.ok(pJson.properties.length > 0);
  for (const p of pJson.properties) {
    assert.ok(String(p.city || p.location || '').toLowerCase().includes('dubai'), `Expected Dubai city on ${p.id}, got ${p.city}`);
  }
  console.log(`   ✓ Verified /api/unified-search (${uJson.properties.length} rows) & /api/properties Dubai query (${pJson.properties.length} rows)`);

  console.log('5. Testing all Pre-lease / Prelease / Pre leased / Pre lease variants produce consistent DB results...');
  const preVariants = ['prelease', 'pre leased', 'Prelease', 'Pre lease', 'pre-lease', 'pre-leased'];
  let baselineCount: number | null = null;
  for (const pv of preVariants) {
    const parsedPv = parseEightFieldRequirements(pv);
    assert.equal(parsedPv.transactionClassification, 'Pre Lease/Pre Rented', `Failed classification for "${pv}"`);
    assert.equal(parsedPv.keywords.length, 0, `Unexpected leftover keywords for "${pv}": ${parsedPv.keywords}`);
    const builtPv = buildEightFieldWhereClause(parsedPv);
    const pvRows = await executeEightFieldSqlRows(builtPv.whereSql, builtPv.params, 200);
    assert.ok(pvRows.length >= 60, `Expected >=60 preleased rows for "${pv}", got ${pvRows.length}`);
    if (baselineCount === null) baselineCount = pvRows.length;
    else assert.equal(pvRows.length, baselineCount, `Count mismatch for variant "${pv}"`);
  }
  console.log(`   ✓ All 6 pre-lease spelling variants matched identical ${baselineCount} DB rows cleanly!`);

  console.log('\nALL 8-FIELD SQL SEARCH TESTS PASSED!');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n8-FIELD SQL TEST FAILED:', err);
  process.exit(1);
});
