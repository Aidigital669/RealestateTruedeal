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

  console.log('5. Testing all Pre-lease / Prelease / PreLease / Pre lease variants match identical 62 DB rows across SQL & HTTP routes...');
  const preVariants = [
    'prelease',
    'pre lease',
    'PreLease',
    'Pre Lease',
    'Pre lease',
    'Prelease',
    'pre leased',
    'pre-lease',
    'pre-leased',
    'Pre Lease/Pre Rented'
  ];
  let baselineIds: string[] | null = null;
  for (const pv of preVariants) {
    const parsedPv = parseEightFieldRequirements(pv);
    assert.equal(parsedPv.transactionClassification, 'Pre Lease/Pre Rented', `Failed classification for "${pv}"`);
    assert.equal(parsedPv.keywords.length, 0, `Unexpected leftover keywords for "${pv}": ${parsedPv.keywords}`);
    const builtPv = buildEightFieldWhereClause(parsedPv);
    const pvRows = await executeEightFieldSqlRows(builtPv.whereSql, builtPv.params, 300);
    assert.equal(pvRows.length, 62, `Expected exact 62 Pre Lease/Pre Rented rows for "${pv}", got ${pvRows.length}`);
    for (const r of pvRows) {
      const tcVal = String(r.transactionClassification || r.dossierData?.TransactionName || '');
      assert.equal(tcVal, 'Pre Lease/Pre Rented', `Wrong Transaction Classification returned for prelease search: id=${r.id} tc="${tcVal}"`);
    }
    const uVariantRes = await unifiedSearchRoute.GET(
      new NextRequest('http://localhost:3000/api/unified-search?search=' + encodeURIComponent(pv))
    );
    const uVariantJson = await uVariantRes.json();
    assert.equal(uVariantJson.success, true);
    assert.equal(uVariantJson.properties.length, 62, `HTTP /api/unified-search mismatch for "${pv}": ${uVariantJson.properties.length}`);

    const pVariantRes = await publicPropertiesRoute.GET(
      new NextRequest('http://localhost:3000/api/properties?search=' + encodeURIComponent(pv))
    );
    const pVariantJson = await pVariantRes.json();
    assert.equal(pVariantJson.success, true);
    assert.equal(pVariantJson.properties.length, 62, `HTTP /api/properties mismatch for "${pv}": ${pVariantJson.properties.length}`);

    const sortedSqlIds = pvRows.map((r: any) => String(r.id)).sort();
    const sortedUnifiedIds = uVariantJson.properties.map((p: any) => String(p.id)).sort();
    const sortedPropsIds = pVariantJson.properties.map((p: any) => String(p.id)).sort();
    assert.deepEqual(sortedUnifiedIds, sortedSqlIds, `Unified search ID set mismatch for "${pv}"`);
    assert.deepEqual(sortedPropsIds, sortedSqlIds, `/api/properties ID set mismatch for "${pv}"`);
    if (baselineIds === null) baselineIds = sortedSqlIds;
    else assert.deepEqual(sortedSqlIds, baselineIds, `SQL ID set mismatch for variant "${pv}"`);
  }
  console.log(`   ✓ All ${preVariants.length} pre-lease variants matched exact ${baselineIds?.length} identical IDs across SQL, /api/unified-search, and /api/properties!`);

  console.log('5b. Testing all other TransactionName classifications match DB schema strictly...');
  const txChecks: Array<{ query: string; expectedMin: number; verify: (tc: string, r?: any) => boolean }> = [
    { query: 'New', expectedMin: 1750, verify: (tc) => tc === 'New' },
    { query: 'New project', expectedMin: 1750, verify: (tc) => tc === 'New' },
    { query: 'Resale', expectedMin: 500, verify: (tc) => tc === 'Resale' },
    {
      query: 'Pre Launch',
      expectedMin: 150,
      verify: (tc, r) =>
        tc === 'Pre Launch' ||
        /prelaunch|newlylaunch|newlaunch|upcoming|readytomove/i.test(
          `${r?.status || ''} ${r?.configuration || ''} ${r?.type_name || ''}`.replace(/[-_\s]+/g, '')
        )
    },
    { query: 'Individual/Company', expectedMin: 85, verify: (tc) => tc === 'Individual/Company' },
    { query: 'Group Booking', expectedMin: 5, verify: (tc) => tc === 'Group Booking' },
    { query: 'Individual', expectedMin: 95, verify: (tc) => tc.startsWith('Individual') }
  ];
  for (const txc of txChecks) {
    const critTx = parseEightFieldRequirements(txc.query);
    const builtTx = buildEightFieldWhereClause(critTx);
    const txFacets = await fetchEightFieldGroupByFacets(builtTx.whereSql, builtTx.params);
    const txTotal = txFacets.transactionTypes.reduce((s, x) => s + x.count, 0);
    const txSample = await executeEightFieldSqlRows(builtTx.whereSql, builtTx.params, 100);
    assert.ok(txTotal >= txc.expectedMin, `Expected >=${txc.expectedMin} rows for "${txc.query}", got ${txTotal}`);
    for (const r of txSample) {
      const tcVal = String(r.transactionClassification || r.dossierData?.TransactionName || '');
      assert.ok(txc.verify(tcVal, r), `Classification "${tcVal}" invalid for query "${txc.query}" on id=${r.id}`);
    }
    console.log(`   ✓ TransactionName "${txc.query}" -> ${txTotal} exact matching rows`);
  }

  console.log('6. Testing strict WHERE ... AND ... invariants & DB anomaly guards...');
  // 6a. "3 BHK apartment in Kharadi" -> MUST be 3 BHK AND apartment AND Kharadi (not 2BHK/4BHK apartments)
  const bhkCrit = parseEightFieldRequirements('3 BHK apartment in Kharadi');
  assert.deepEqual(bhkCrit.bhkNums, [3]);
  assert.ok(bhkCrit.propertyTypes.includes('Residential Apartment'));
  const bhkBuilt = buildEightFieldWhereClause(bhkCrit);
  const bhkRows = await executeEightFieldSqlRows(bhkBuilt.whereSql, bhkBuilt.params, 100);
  assert.ok(bhkRows.length > 0, 'Expected >0 3 BHK apartments in Kharadi');
  for (const r of bhkRows) {
    const combined = `${r.bhk_num || ''} ${r.configuration || ''} ${r.name || ''} ${r.description || ''}`.toLowerCase();
    assert.ok(
      Number(r.bhk_num) === 3 || /(?:^|[^0-9.])3\s*[- ]*\s*(?:bhk|bed|bedroom)/i.test(combined),
      `Non-3BHK row leaked into 3 BHK query: id=${r.id} title="${r.name}"`
    );
  }
  console.log(`   ✓ 3 BHK apartment in Kharadi -> ${bhkRows.length} exact 3 BHK rows (0 wrong-BHK leaks)`);

  // 6b. Decimal BHK support ("4.5 BHK")
  const halfBhkCrit = parseEightFieldRequirements('4.5 BHK');
  assert.deepEqual(halfBhkCrit.bhkNums, [4.5]);
  const halfBhkBuilt = buildEightFieldWhereClause(halfBhkCrit);
  const halfBhkRows = await executeEightFieldSqlRows(halfBhkBuilt.whereSql, halfBhkBuilt.params, 50);
  assert.ok(halfBhkRows.length > 0, 'Expected >0 4.5 BHK properties');
  for (const r of halfBhkRows) {
    const combined = `${r.configuration || ''} ${r.name || ''} ${r.description || ''}`.toLowerCase();
    assert.match(combined, /4\.5\s*[- ]*\s*(?:bhk|bed|bedroom)/i, `Non-4.5 BHK leaked: id=${r.id}`);
  }
  console.log(`   ✓ 4.5 BHK query -> ${halfBhkRows.length} exact 4.5 BHK rows`);

  // 6c. "Hospital" MUST NOT return Office (New) / Showroom (New) / Restaurant (New) rows with polluted pt.name='Hospital'
  const hospCrit = parseEightFieldRequirements('Hospital');
  assert.equal(hospCrit.keywords.length, 0);
  const hospBuilt = buildEightFieldWhereClause(hospCrit);
  const hospRows = await executeEightFieldSqlRows(hospBuilt.whereSql, hospBuilt.params, 200);
  assert.ok(hospRows.length > 0 && hospRows.length <= 45, `Expected ~34-36 true hospital rows, got ${hospRows.length}`);
  for (const r of hospRows) {
    const isGenuineTitleHospital = /\b(?:hospital|medical|clinic)\b/i.test(String(r.name || ''));
    assert.ok(
      isGenuineTitleHospital || !/^(office|showroom|restaurant|sky villa)\b/i.test(String(r.configuration || '')),
      `Polluted non-hospital row (${r.configuration}: "${r.name}") leaked into Hospital search: id=${r.id}`
    );
  }
  console.log(`   ✓ Hospital query -> ${hospRows.length} true hospital rows (0 Office/Showroom/Restaurant leaks)`);

  // 6d. Plurals ("shops for sale" and "villas in kharadi") strip stop words cleanly & return exact rows
  const shopsCrit = parseEightFieldRequirements('shops for sale');
  assert.equal(shopsCrit.transactionType, 'Sale');
  assert.ok(shopsCrit.propertyTypes.includes('Shop/Showroom'));
  assert.equal(shopsCrit.keywords.length, 0, `Unexpected keywords for "shops for sale": ${shopsCrit.keywords}`);
  const shopsRows = await executeEightFieldSqlRows(...Object.values(buildEightFieldWhereClause(shopsCrit)).slice(0, 2) as [string, any[]], 50);
  assert.ok(shopsRows.length > 0, 'Expected >0 shops for sale');

  const villasCrit = parseEightFieldRequirements('villas in kharadi');
  assert.ok(villasCrit.propertyTypes.includes('Residential Bunglow'));
  assert.equal(villasCrit.keywords.length, 0, `Unexpected keywords for "villas in kharadi": ${villasCrit.keywords}`);
  const villasBuilt = buildEightFieldWhereClause(villasCrit);
  const villasRows = await executeEightFieldSqlRows(villasBuilt.whereSql, villasBuilt.params, 50);
  assert.ok(villasRows.length > 0, 'Expected >0 villas in kharadi');
  console.log(`   ✓ Plural typologies verified: "shops for sale" (${shopsRows.length}+), "villas in kharadi" (${villasRows.length})`);

  // 6e. City isolation: "Pune" MUST NOT leak Dubai/Goa/Mumbai rows even when loc.city='Pune'
  const puneCrit = parseEightFieldRequirements('Pune');
  const puneBuilt = buildEightFieldWhereClause(puneCrit);
  const puneRows = await executeEightFieldSqlRows(puneBuilt.whereSql, puneBuilt.params, 3000);
  for (const r of puneRows) {
    assert.ok(
      !/(dubai|goa|margao|bhusawal|mumbai)/i.test(String(r.city_name || '')),
      `Non-Pune city leaked into Pune query: id=${r.id} city_name=${r.city_name}`
    );
  }
  console.log(`   ✓ City isolation verified: Pune query (${puneRows.length} rows) has 0 Dubai/Goa/Mumbai leaks`);

  // 6f. Word boundary Locality: "Camp Pune" must NOT match unrelated "IT Campus" rows
  const campCrit = parseEightFieldRequirements('Camp Pune');
  const campBuilt = buildEightFieldWhereClause(campCrit);
  const campRows = await executeEightFieldSqlRows(campBuilt.whereSql, campBuilt.params, 100);
  for (const r of campRows) {
    const locTxt = `${r.locality || ''} ${r.location || ''} ${r.name || ''}`.toLowerCase();
    assert.match(locTxt, /\bcamp\b/i, `Campus false-match in Camp search: id=${r.id} loc="${locTxt}"`);
  }
  console.log(`   ✓ Locality boundary verified: "Camp Pune" -> ${campRows.length} exact Camp rows`);

  // 6g. "prelease office in viman nagar" -> Sale prelease OR preleased office in Viman Nagar
  const preOfficeRes = await unifiedSearchRoute.GET(
    new NextRequest('http://localhost:3000/api/unified-search?search=' + encodeURIComponent('prelease office in viman nagar'))
  );
  const preOfficeJson = await preOfficeRes.json();
  assert.equal(preOfficeJson.success, true);
  assert.ok(preOfficeJson.properties.length > 0, 'Expected >0 prelease offices in Viman Nagar');
  for (const p of preOfficeJson.properties) {
    assert.ok(
      `${p.locality} ${p.location} ${p.name}`.toLowerCase().includes('viman nagar'),
      `Expected Viman Nagar on prelease office id=${p.id}`
    );
    assert.equal(
      p.transactionClassification,
      'Pre Lease/Pre Rented',
      `Expected Transaction Classification "Pre Lease/Pre Rented" on id=${p.id}, got ${p.transactionClassification}`
    );
  }
  console.log(`   ✓ "prelease office in viman nagar" -> ${preOfficeJson.properties.length} verified pre-leased office rows`);

  console.log('7. Testing Buyer/Seller intent routing & direct crm_leads PostgreSQL WHERE ... AND ... queries...');
  for (const bq of ['buyer', 'buyers', 'seller', 'sellers']) {
    const res = await unifiedSearchRoute.GET(
      new NextRequest('http://localhost:3000/api/unified-search?search=' + encodeURIComponent(bq))
    );
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.ai.primaryView, 'buyer_leads', `Expected buyer_leads view for "${bq}"`);
    assert.equal(json.properties.length, 0, `Expected 0 properties when searching "${bq}"`);
    assert.equal(json.propertiesCount, 0);
    assert.ok(json.buyerDemands.length >= 250, `Expected >=250 active buyers for "${bq}", got ${json.buyerDemands.length}`);
  }
  console.log('   ✓ Standalone buyer/buyers/seller/sellers queries return ONLY buyer data & 0 properties');

  const banerBuyerRes = await unifiedSearchRoute.GET(
    new NextRequest(
      'http://localhost:3000/api/unified-search?search=' +
        encodeURIComponent('i need a buyer for my commercial property in Baner')
    )
  );
  const banerBuyerJson = await banerBuyerRes.json();
  assert.equal(banerBuyerJson.success, true);
  assert.equal(banerBuyerJson.ai.primaryView, 'buyer_leads');
  assert.equal(banerBuyerJson.properties.length, 0, 'Expected 0 properties for seller Baner commercial query');
  assert.ok(banerBuyerJson.buyerDemands.length > 0, 'Expected >0 Baner commercial buyers in crm_leads');
  for (const bd of banerBuyerJson.buyerDemands) {
    const bText = `${bd.locality} ${bd.bhk} ${bd.requirements} ${bd.purpose}`.toLowerCase();
    assert.ok(bText.includes('baner'), `Expected Baner on buyer ${bd.code}: "${bd.locality}"`);
    assert.match(
      bText,
      /\b(?:commercial|office|shop|showroom|retail|workspace|warehouse|industrial|hospital|restaurant|hotel|building)\b/i,
      `Expected commercial requirement on buyer ${bd.code}: "${bd.bhk}"`
    );
  }
  console.log(`   ✓ "i need a buyer for my commercial property in Baner" -> ${banerBuyerJson.buyerDemands.length} verified Baner commercial buyers (0 properties)`);

  const buyFlatRes = await unifiedSearchRoute.GET(
    new NextRequest('http://localhost:3000/api/unified-search?search=' + encodeURIComponent('want to buy 3 bhk flat in kharadi'))
  );
  const buyFlatJson = await buyFlatRes.json();
  assert.equal(buyFlatJson.ai.primaryView, 'properties');
  assert.ok(buyFlatJson.properties.length > 0, 'Expected >0 properties when user wants to buy a 3 bhk flat');
  console.log(`   ✓ Contrast check: "want to buy 3 bhk flat in kharadi" -> primaryView=properties (${buyFlatJson.properties.length} properties)`);

  console.log('8. Testing Newly Launched / Pre-Launch / Upcoming / Ready to Move return IDENTICAL results...');
  const launchVariants = ['Newly Launched', 'Pre-Launch', 'Pre Launch', 'prelaunch', 'Upcoming', 'Ready to Move'];
  let launchBaselineIds: string[] | null = null;
  for (const lv of launchVariants) {
    const parsedLv = parseEightFieldRequirements(lv);
    assert.equal(parsedLv.transactionClassification, 'Pre Launch', `Failed classification for "${lv}"`);
    assert.equal(parsedLv.keywords.length, 0, `Unexpected leftover keywords for "${lv}": ${parsedLv.keywords}`);

    const builtLv = buildEightFieldWhereClause(parsedLv);
    const sqlLv = await executeEightFieldSqlRows(builtLv.whereSql, builtLv.params, 300);

    const uLvRes = await unifiedSearchRoute.GET(
      new NextRequest('http://localhost:3000/api/unified-search?search=' + encodeURIComponent(lv))
    );
    const uLvJson = await uLvRes.json();
    assert.equal(uLvJson.success, true);
    assert.equal(uLvJson.ai.primaryView, 'properties');

    const pLvRes = await publicPropertiesRoute.GET(
      new NextRequest('http://localhost:3000/api/properties?search=' + encodeURIComponent(lv))
    );
    const pLvJson = await pLvRes.json();
    assert.equal(pLvJson.success, true);

    const sortedSqlIds = sqlLv.map((r: any) => String(r.id)).sort();
    const sortedUnifiedIds = uLvJson.properties.map((p: any) => String(p.id)).sort();
    const sortedPropsIds = pLvJson.properties.map((p: any) => String(p.id)).sort();
    assert.ok(sortedSqlIds.length >= 150, `Expected >=150 rows for "${lv}", got ${sortedSqlIds.length}`);
    assert.deepEqual(sortedUnifiedIds, sortedSqlIds, `Unified ID mismatch for "${lv}"`);
    assert.deepEqual(sortedPropsIds, sortedSqlIds, `Properties API ID mismatch for "${lv}"`);

    if (launchBaselineIds === null) launchBaselineIds = sortedSqlIds;
    else assert.deepEqual(sortedSqlIds, launchBaselineIds, `Variant "${lv}" returned different IDs from "${launchVariants[0]}"`);
  }
  console.log(`   ✓ All ${launchVariants.length} launch/status variants ("Newly Launched", "Pre-Launch", "Upcoming", "Ready to Move", etc.) matched identical ${launchBaselineIds?.length} IDs!`);

  console.log('9. Testing New / Latest / Fresh / Newly return IDENTICAL results across SQL & HTTP routes...');
  const newVariants = ['New', 'Latest', 'Fresh', 'Newly'];
  let newBaselineIds: string[] | null = null;
  for (const nv of newVariants) {
    const parsedNv = parseEightFieldRequirements(nv);
    assert.equal(parsedNv.transactionClassification, 'New', `Failed classification for "${nv}"`);
    assert.equal(parsedNv.keywords.length, 0, `Unexpected leftover keywords for "${nv}": ${parsedNv.keywords}`);

    const builtNv = buildEightFieldWhereClause(parsedNv);
    const sqlNv = await executeEightFieldSqlRows(builtNv.whereSql, builtNv.params, 200);
    const facetsNv = await fetchEightFieldGroupByFacets(builtNv.whereSql, builtNv.params);
    const totalNv = facetsNv.transactionTypes.reduce((s, x) => s + x.count, 0);
    assert.equal(totalNv, 1754, `Expected exact 1754 total rows for "${nv}", got ${totalNv}`);

    const uNvRes = await unifiedSearchRoute.GET(
      new NextRequest('http://localhost:3000/api/unified-search?search=' + encodeURIComponent(nv))
    );
    const uNvJson = await uNvRes.json();
    assert.equal(uNvJson.success, true);
    assert.equal(uNvJson.phase2.totalCount, 1754, `Unified totalCount mismatch for "${nv}"`);

    const pNvRes = await publicPropertiesRoute.GET(
      new NextRequest('http://localhost:3000/api/properties?search=' + encodeURIComponent(nv))
    );
    const pNvJson = await pNvRes.json();
    assert.equal(pNvJson.success, true);
    assert.equal(pNvJson.count, 1754, `/api/properties count mismatch for "${nv}"`);

    const sortedSqlIds = sqlNv.map((r: any) => String(r.id)).sort();
    const sortedUnifiedIds = uNvJson.properties.map((p: any) => String(p.id)).sort();
    assert.deepEqual(sortedUnifiedIds, sortedSqlIds, `Unified ID mismatch for "${nv}"`);

    if (newBaselineIds === null) newBaselineIds = sortedSqlIds;
    else assert.deepEqual(sortedSqlIds, newBaselineIds, `Variant "${nv}" returned different IDs from "New"`);
  }
  console.log(`   ✓ All ${newVariants.length} variants ("New", "Latest", "Fresh", "Newly") matched exact 1754 total & identical ${newBaselineIds?.length} returned IDs!`);

  console.log('\nALL 8-FIELD SQL SEARCH TESTS PASSED!');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n8-FIELD SQL TEST FAILED:', err);
  process.exit(1);
});
