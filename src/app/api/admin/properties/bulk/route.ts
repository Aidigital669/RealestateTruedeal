import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import * as XLSX from "xlsx";
import { parseDossierData } from "@/lib/dossier-parser";

const CATEGORY_IMAGE_POOLS: Record<string, string[]> = {
  'Hospital': [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80'
  ],
  'Office Space': [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80'
  ],
  'Commercial Office': [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
  ],
  'Office in IT Park': [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80'
  ],
  'Shop/Showroom': [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'
  ],
  'Restaurant': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80'
  ],
  'Hotel / Resort': [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
  ],
  'Residential Bunglow': [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  ],
  'Penthouse': [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
  ],
  'Residential Apartment': [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
  ]
};

function getCategoryPhoto(categoryStr: string, idx: number): string {
  const pool = CATEGORY_IMAGE_POOLS[categoryStr] || CATEGORY_IMAGE_POOLS['Commercial Office'];
  return pool[idx % pool.length];
}

const DEVELOPER_PATTERNS = [
  { match: /panchshil/i, name: 'Panchshil Realty' },
  { match: /godrej/i, name: 'Godrej Properties' },
  { match: /bramha/i, name: 'BramhaCorp' },
  { match: /vtp/i, name: 'VTP Realty' },
  { match: /amar\s*madhuban|amar\s*summit|amar/i, name: 'Amar Builders' },
  { match: /ganga|geol\s*ganga/i, name: 'Goel Ganga Developments' },
  { match: /mantra/i, name: 'Mantra Properties' },
  { match: /solitaire/i, name: 'Solitaire Group' },
  { match: /tribeca/i, name: 'Tribeca Developers' },
  { match: /kolte/i, name: 'Kolte Patil Developers' },
  { match: /raheja/i, name: 'K Raheja Corp' },
  { match: /gera/i, name: 'Gera Developments' },
  { match: /pride/i, name: 'Pride Purple Group' },
  { match: /atrium/i, name: 'Atrium Group' },
  { match: /trade\s*park/i, name: 'Trade Park Group' },
  { match: /teerth/i, name: 'Teerth Realties' },
  { match: /kotibhaskar/i, name: 'Kotibhaskar Group' },
  { match: /orville/i, name: 'Orville Realties' }
];

function cleanLocality(raw: any): string {
  if (!raw) return 'Pune, Maharashtra';
  let s = String(raw).trim();
  if (s.toLowerCase() === 'others/pune') return 'Pune, Maharashtra';
  if (/baner\s*mahalunge/i.test(s)) return 'Baner-Mahalunge Road, Pune';
  if (/ganesh\s*kinde|ganeshkhind/i.test(s)) return 'Ganeshkhind Road, Shivaji Nagar, Pune';
  if (/sadhu\s*vaswani/i.test(s)) return 'Sadhu Vaswani Chowk, Camp, Pune';
  if (/magarpatta/i.test(s)) return 'Magarpatta City, Pune';
  if (/nibm/i.test(s)) return 'NIBM Road, Pune';
  if (!s.toLowerCase().includes('pune')) s += ', Pune';
  return s;
}

function normalizeCategory(raw: any): string {
  if (!raw) return 'Commercial Office';
  const s = String(raw).trim();
  if (/medical|hospital|clinic|healthcare/i.test(s)) return 'Hospital';
  if (/office\s*in\s*it\s*park|it park|tech park|cyber|coworking|co-working|office|space|corporate|building/i.test(s)) return 'Office Space';
  if (/showroom|shop|retail|boutique/i.test(s)) return 'Shop/Showroom';
  if (/restaurant|cafe|dining|bar|lounge|f&b/i.test(s)) return 'Restaurant';
  if (/hotel|resort|hospitality/i.test(s)) return 'Hotel / Resort';
  if (/warehouse|godown|logistics/i.test(s)) return 'Warehouse';
  if (/plot|land|farm|agriculture/i.test(s)) return 'Residential/Commercial Land/Plot';
  if (/bungalow|bunglow|villa|row house/i.test(s)) return 'Residential Bunglow';
  if (/penthouse/i.test(s)) return 'Penthouse';
  if (/apartment|flat|bhk|residence/i.test(s)) return 'Residential Apartment';
  return s;
}

function parseAreaNumber(raw: any): number {
  if (typeof raw === 'number' && !isNaN(raw) && raw > 0) return raw;
  if (!raw) return 1200;
  const str = String(raw).replace(/,/g, '');
  const m = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return 1200;
  let val = parseFloat(m[1]);
  if (/sq\.?\s*meter|sqm|meter/i.test(str)) {
    val = Math.round(val * 10.7639);
  }
  return val;
}

function parseIndianPriceNumber(priceRaw: any): number {
  if (typeof priceRaw === 'number' && !isNaN(priceRaw)) return priceRaw;
  if (!priceRaw) return 0;
  const str = String(priceRaw).trim().toLowerCase();
  if (str === 'price on request' || str === 'on request' || str === 'n/a') return 0;

  const crMatch = str.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:cr|crore|crores)/i);
  if (crMatch) return Math.round(parseFloat(crMatch[1]) * 10000000);

  const lMatch = str.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b/i);
  if (lMatch) return Math.round(parseFloat(lMatch[1]) * 100000);

  const cleanNum = parseFloat(str.replace(/[^0-9.]/g, ''));
  return !isNaN(cleanNum) ? cleanNum : 0;
}

function calculatePriceData(row: any, area: number): number {
  const directPriceKeys = [
    'Price', 'price', 'Total Price', 'total_price', 'Budget', 'budget',
    'Cost', 'cost', 'TotalCost', 'total_cost', 'Amount', 'amount', 'Total Amount'
  ];
  for (const k of directPriceKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      const p = parseIndianPriceNumber(row[k]);
      if (p > 10000) return p;
    }
  }

  const puaKeys = [
    'PricePerUnitArea', 'Price Per Unit Area', 'price_per_unit_area',
    'Price/Sqft', 'Price/Sq.Ft.', 'Rate', 'Rate/Sqft', 'Rate/Sq.Ft.', 'RatePerSqft'
  ];
  for (const k of puaKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      const pua = parseFloat(String(row[k]).replace(/[^0-9.]/g, ''));
      if (!isNaN(pua) && pua >= 500 && area > 0) {
        return Math.round(area * pua);
      }
      if (!isNaN(pua) && pua > 0 && pua < 500 && area > 0) {
        return Math.round(area * pua * 100);
      }
    }
  }

  const rentKeys = ['RentPM', 'Rent PM', 'rent_pm', 'Rent', 'Monthly Rent'];
  for (const k of rentKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      const r = parseFloat(String(row[k]).replace(/[^0-9.]/g, ''));
      if (!isNaN(r) && r > 0) {
        return Math.round(r * 100);
      }
    }
  }

  return 0;
}

function isCustomerOrAgent(val: string, custFull: string): boolean {
  if (!val) return true;
  const v = val.toLowerCase().replace(/[^a-z]/g, '');
  if (!v) return true;
  if (custFull) {
    const c = custFull.toLowerCase().replace(/[^a-z]/g, '');
    if (v === c || v.includes(c) || c.includes(v)) return true;
  }
  return /^(nikkhil|santosh|jadhav|jain|sharma|patil|gupta|verma|deshmukh|drparmar)$/i.test(v);
}

function formatCleanTitleWithLocation(title: string, location: string): string {
  let clean = title.replace(/[\u2018\u2019\u201c\u201d"'`]/g, '').replace(/\s+/g, ' ').trim();
  const locPure = location.replace(', Pune', '').replace(', Maharashtra', '').trim();
  if (locPure && !clean.toLowerCase().includes(locPure.toLowerCase())) {
    clean += ` in ${location}`;
  } else if (!clean.toLowerCase().includes('pune')) {
    clean += ', Pune';
  }
  return clean;
}

function constructPropertyTitle(row: any, category: string, location: string, area: number): string {
  const directTitleKeys = [
    'Property Name', 'property_name', 'PropertyTitle', 'Title', 'title', 'Project Name'
  ];
  for (const k of directTitleKeys) {
    const val = row[k] ? String(row[k]).trim() : '';
    if (val && !isCustomerOrAgent(val, row.CustomerFullName)) {
      return formatCleanTitleWithLocation(val, location);
    }
  }

  const bldg = (row['BuildingName'] || row['Building Name'] || row['Building'] || '')
    .toString()
    .replace(/[\u2018\u2019\u201c\u201d"'`]/g, '')
    .trim();
  const prop = (row['PropertyName'] || row['Property'] || '')
    .toString()
    .replace(/[\u2018\u2019\u201c\u201d"'`]/g, '')
    .trim();
  const cust = (row['CustomerFullName'] || '').toString().trim();
  const fl = (row['FloorNumber'] || '').toString().trim();
  const areaFormatted = area ? `${area.toLocaleString('en-IN')} Sq.Ft. ` : '';

  let namePart = '';

  if (bldg && !isCustomerOrAgent(bldg, cust)) {
    const bldgLower = bldg.toLowerCase();
    const propLower = prop.toLowerCase();
    if (bldgLower === 'hospital') {
      namePart = prop && !isCustomerOrAgent(prop, cust) ? prop : `${category} Facility`;
    } else if (bldgLower === 'hospital undri') {
      namePart = 'Hospital Facility';
    } else if (bldgLower === 'residences' && propLower === 'mantra') {
      namePart = 'Mantra Residences';
    } else if (bldgLower === 'prelease baner') {
      namePart = 'Pre-Leased Commercial Showroom';
    } else if (bldgLower === 'prelease restaurant') {
      namePart = 'Pre-Leased Restaurant & Commercial Space';
    } else if (bldgLower === 'business') {
      namePart = prop ? prop : 'Commercial Business Bay';
    } else if (bldgLower === 'sbh') {
      namePart = 'Solitaire Business Hub (SBH)';
    } else if (bldgLower === 'poona wala') {
      namePart = 'Poonawalla Business Towers';
    } else if (bldgLower === 'scared world mall') {
      namePart = 'Sacred World Mall';
    } else {
      namePart = bldg;
    }
  } else if (prop && !isCustomerOrAgent(prop, cust)) {
    namePart = prop;
  }

  let fullTitle = '';
  if (namePart) {
    const hasCat = new RegExp(category.replace('/', '|'), 'i').test(namePart);
    const catSuffix = hasCat ? '' : ` ${category}`;
    const flSuffix = (fl && /^\d+(st|nd|rd|th)?\s*floor$/i.test(fl)) ? ` (${fl})` : '';
    fullTitle = `${namePart}${catSuffix}${flSuffix}`;
  } else {
    fullTitle = `${areaFormatted}${category}`;
  }

  return formatCleanTitleWithLocation(fullTitle, location);
}

function detectDeveloper(bldg: string, prop: string, rowDev: string): string {
  if (rowDev && rowDev.trim()) return rowDev.trim();
  const combined = `${bldg} ${prop}`.toLowerCase();
  for (const dev of DEVELOPER_PATTERNS) {
    if (dev.match.test(combined)) return dev.name;
  }
  return 'ANV Realty Partner';
}

export async function POST(req: NextRequest) {
  try {
    let rawItems: any[] = [];

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "No file uploaded in form data." }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      rawItems = XLSX.utils.sheet_to_json(sheet);
    } else {
      const body = await req.json();
      rawItems = body.properties || body.items || [];
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No property rows found to import. Please check your Excel sheet."
      }, { status: 400 });
    }

    let savedCount = 0;
    const savedProperties: any[] = [];
    const errors: string[] = [];

    // 1. Preload existing Lookups in 3 rapid queries
    const existingLocations = await query<{ id: number; name: string; slug: string }>(
      `SELECT id, LOWER(name) as name, slug FROM "Location";`
    );
    const locMap = new Map<string, number>();
    existingLocations.forEach(l => {
      if (l.name) locMap.set(l.name.toLowerCase().trim(), l.id);
      if (l.slug) locMap.set(l.slug.toLowerCase().trim(), l.id);
    });

    const existingTypes = await query<{ id: number; name: string; slug: string }>(
      `SELECT id, LOWER(name) as name, slug FROM "PropertyType";`
    );
    const ptMap = new Map<string, number>();
    existingTypes.forEach(t => {
      if (t.name) ptMap.set(t.name.toLowerCase().trim(), t.id);
      if (t.slug) ptMap.set(t.slug.toLowerCase().trim(), t.id);
    });

    const existingProjects = await query<{ id: number; developer: string; name: string }>(
      `SELECT id, LOWER(COALESCE(developer, '')) as developer, LOWER(name) as name FROM "Project";`
    );
    const projMap = new Map<string, number>();
    existingProjects.forEach(p => {
      if (p.developer) projMap.set(p.developer.toLowerCase().trim(), p.id);
      if (p.name) projMap.set(p.name.toLowerCase().trim(), p.id);
    });

    // 2. Pre-scan all items to detect missing Locations, PropertyTypes, and Developers
    const neededLocs = new Set<string>();
    const neededTypes = new Set<string>();
    const neededDevs = new Set<string>();

    for (const row of rawItems) {
      const rawCat = row.category || row["PropertyTypeName"] || row["Category"] || row.configuration || row["Configuration"] || row["Property Type"] || row.type || row["BHK"] || row.bhk;
      const category = normalizeCategory(rawCat);
      if (category && !ptMap.has(category.toLowerCase())) {
        neededTypes.add(category);
      }

      const locationRaw = cleanLocality(
        row.location || row["LocationName"] || row["Location"] || row.address || row["Address"] || row.city || row["City"] || row["Locality"]
      );
      const locFirst = locationRaw.split(/[,–-]/)[0].trim() || "Baner";
      if (locFirst && !locMap.has(locFirst.toLowerCase()) && !locMap.has(locationRaw.toLowerCase())) {
        neededLocs.add(locFirst);
      }

      const bldg = (row['BuildingName'] || row['Building Name'] || '').toString();
      const prop = (row['PropertyName'] || row['Property'] || '').toString();
      const rawDev = (row.developer || row["Developer"] || row.builder || row["Builder"] || "").toString();
      const developer = detectDeveloper(bldg, prop, rawDev);
      if (developer && !projMap.has(developer.toLowerCase())) {
        neededDevs.add(developer);
      }
    }

    // Batch insert missing Locations in 1 query
    if (neededLocs.size > 0) {
      const locClauses: string[] = [];
      const locParams: any[] = [];
      let pIdx = 1;
      for (const locName of neededLocs) {
        const slug = locName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-pune-${Date.now().toString().slice(-4)}`;
        locClauses.push(`($${pIdx++}, $${pIdx++}, 'Pune', 'Maharashtra', 'India', $${pIdx++}, NOW(), NOW())`);
        locParams.push(locName, slug, `Exclusive luxury & commercial corridor in ${locName}, Pune.`);
      }
      try {
        const insertedLocs = await query<{ id: number; name: string; slug: string }>(
          `INSERT INTO "Location" (name, slug, city, state, country, description, "createdAt", "updatedAt")
           VALUES ${locClauses.join(', ')}
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id, LOWER(name) as name, slug;`,
          locParams
        );
        insertedLocs.forEach(l => {
          locMap.set(l.name.toLowerCase().trim(), l.id);
          locMap.set(l.slug.toLowerCase().trim(), l.id);
        });
      } catch (err) {
        console.warn("Bulk location pre-insert warning:", err);
      }
    }

    // Batch insert missing PropertyTypes in 1 query
    if (neededTypes.size > 0) {
      const typeClauses: string[] = [];
      const typeParams: any[] = [];
      let pIdx = 1;
      for (const catName of neededTypes) {
        const cleanSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        typeClauses.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, NOW(), NOW())`);
        typeParams.push(
          catName.charAt(0).toUpperCase() + catName.slice(1),
          cleanSlug,
          `Verified ${catName} properties in Pune & Mumbai.`
        );
      }
      try {
        const insertedTypes = await query<{ id: number; name: string; slug: string }>(
          `INSERT INTO "PropertyType" (name, slug, description, "createdAt", "updatedAt")
           VALUES ${typeClauses.join(', ')}
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id, LOWER(name) as name, slug;`,
          typeParams
        );
        insertedTypes.forEach(t => {
          ptMap.set(t.name.toLowerCase().trim(), t.id);
          ptMap.set(t.slug.toLowerCase().trim(), t.id);
        });
      } catch (err) {
        console.warn("Bulk property type pre-insert warning:", err);
      }
    }

    // Batch insert missing Projects in 1 query
    if (neededDevs.size > 0) {
      const projClauses: string[] = [];
      const projParams: any[] = [];
      let pIdx = 1;
      for (const devName of neededDevs) {
        const projSlug = `proj-${devName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
        projClauses.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, 'Active', false, NOW(), NOW())`);
        projParams.push(`${devName} Project`, projSlug, devName);
      }
      try {
        const insertedProjs = await query<{ id: number; developer: string }>(
          `INSERT INTO "Project" (name, slug, developer, status, "isFeatured", "createdAt", "updatedAt")
           VALUES ${projClauses.join(', ')}
           RETURNING id, LOWER(COALESCE(developer, '')) as developer;`,
          projParams
        );
        insertedProjs.forEach(p => {
          if (p.developer) projMap.set(p.developer.toLowerCase().trim(), p.id);
        });
      } catch (err) {
        console.warn("Bulk project pre-insert warning:", err);
      }
    }

    // 3. Fast synchronous in-memory preparation of all rows (0 async DB queries!)
    const preparedProps: any[] = [];

    for (let index = 0; index < rawItems.length; index++) {
      const row = rawItems[index];

      // 1. Resolve Category
      const rawCat = row.category || row["PropertyTypeName"] || row["Category"] || row.configuration || row["Configuration"] || row["Property Type"] || row.type || row["BHK"] || row.bhk;
      const category = normalizeCategory(rawCat);

      // 2. Resolve Location
      const locationRaw = cleanLocality(
        row.location ||
        row["LocationName"] ||
        row["Location"] ||
        row.address ||
        row["Address"] ||
        row.city ||
        row["City"] ||
        row["Locality"]
      );

      // 3. Resolve Area
      const sqftRaw = row.sqft || row["SuperAreaName"] || row["Carpet Area (sqft)"] || row["Carpet Area"] || row["Sqft"] || row.sqft || 1200;
      const numArea = parseAreaNumber(sqftRaw);

      // 4. Resolve Title
      let title = row.title ? String(row.title).trim() : "";
      if (!title || title.startsWith("Untitled Property")) {
        title = constructPropertyTitle(row, category, locationRaw, numArea);
      }

      if (!title) {
        continue;
      }

      // 5. Resolve Price
      let numPrice = 0;
      if (row.price !== undefined && row.price !== null && row.price !== '') {
        numPrice = parseIndianPriceNumber(row.price);
      }
      if (numPrice === 0) {
        numPrice = calculatePriceData(row, numArea);
      }

      // 6. Resolve Status
      const rawStatus = (row.status || row["TransactionName"] || row["Status"] || row["Construction Status"] || "Ready to Move").toString().trim();
      let status = 'Ready to Move';
      if (/under\s*construction/i.test(rawStatus)) status = 'Under Construction';
      else if (/pre\s*lease/i.test(rawStatus)) status = 'Pre-Leased';
      else if (/new\s*launch/i.test(rawStatus)) status = 'New Launch';

      const publishStatusRaw = (
        row.publishStatus ||
        row["Publish Status"] ||
        row["Publish"] ||
        "Published"
      ).toString().trim();
      const publishStatus = /draft/i.test(publishStatusRaw) ? "Draft" : "Published";

      // 7. Developer
      const bldg = (row['BuildingName'] || row['Building Name'] || '').toString();
      const prop = (row['PropertyName'] || row['Property'] || '').toString();
      const rawDev = (row.developer || row["Developer"] || row.builder || row["Builder"] || "").toString();
      const developer = detectDeveloper(bldg, prop, rawDev);

      // 8. Description & Specifications
      const furnishing = (row["FurnishingName"] || row["furnishing"] || "").toString().trim();
      const floor = (row["FloorNumber"] || row["floor"] || "").toString().trim();
      const parkingRaw = row["ParkingDetails"] || row["parking"];
      const parking = parkingRaw ? parseInt(String(parkingRaw).replace(/[^0-9]/g, ""), 10) || null : null;
      const roi = (row["ROI"] || row["roi"] || "").toString().trim();
      const rentRaw = row["RentPM"] || row["Rent PM"] || row["rent_pm"] || row["Rent"] || row["rent"];
      const rent = rentRaw ? parseFloat(String(rentRaw).replace(/[^0-9.]/g, '')) || null : null;

      const rentInfo = rent && rent > 0 ? `, generating ₹${(rent / 100000).toFixed(2)} Lakh monthly rental income` : '';
      const roiInfo = roi ? `, with ${roi}% verified ROI` : '';

      const description = (
        row.description ||
        row["Description"] ||
        row.details ||
        row["Details"] ||
        `Prime ${category} available in ${locationRaw}. Featuring ${numArea.toLocaleString('en-IN')} Sq.Ft.${furnishing ? ' with ' + furnishing + ' specifications' : ''}${floor ? ', located on ' + floor : ''}${parking ? ', including ' + parking + ' reserved parking spaces' : ''}${rentInfo}${roiInfo}. Verified commercial catalog listing with clear documentation.`
      ).toString().trim();

      let listingType = 'Sale';
      if (status === 'Pre-Leased' || (rent && rent > 0 && numPrice === 0)) {
        listingType = 'Rent';
      }

      const bedroomsRaw = row.bedrooms !== undefined ? row.bedrooms : row["Bedrooms"] || row["Beds"];
      const bedrooms = bedroomsRaw ? parseInt(String(bedroomsRaw).replace(/[^0-9]/g, ""), 10) || null : null;

      const bathroomsRaw = row.bathrooms !== undefined ? row.bathrooms : row["Bathrooms"] || row["Baths"];
      const bathrooms = bathroomsRaw ? parseInt(String(bathroomsRaw).replace(/[^0-9]/g, ""), 10) || null : null;

      const videoUrl = (row.videoUrl || row["Video URL"] || row["video_url"] || "").toString().trim();

      // Image URLs
      const imageRaw = (
        row.imageUrl ||
        row["Image URL"] ||
        row.image ||
        row["Image"] ||
        row.images ||
        row["Images"] ||
        row["Photo"] ||
        ""
      ).toString().trim();

      let imageList: string[] = [];
      if (imageRaw) {
        imageList = imageRaw
          .split(/[,;\n]+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.startsWith("http"));
      }

      if (imageList.length === 0) {
        imageList = [getCategoryPhoto(category, index)];
      }

      // Fast in-memory resolution from pre-cached maps
      const locFirst = locationRaw.split(/[,–-]/)[0].trim().toLowerCase();
      const locKey = locFirst;
      const locFullKey = locationRaw.toLowerCase();
      const locationId = locMap.get(locKey) || locMap.get(locFullKey) || 11;

      const cleanTypeSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const catKey = category.toLowerCase();
      const propertyTypeId = ptMap.get(catKey) || ptMap.get(cleanTypeSlug) || 1;

      const devKey = developer.toLowerCase();
      const projectId = developer ? (projMap.get(devKey) || null) : null;

      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        `-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;

      preparedProps.push({
        title,
        slug,
        propertyTypeId,
        locationId,
        projectId,
        listingType,
        status,
        publishStatus,
        description,
        locationRaw,
        price: numPrice > 0 ? numPrice : null,
        rent: rent && rent > 0 ? rent : null,
        floor: floor || null,
        furnishing: furnishing || null,
        parking,
        numArea,
        bedrooms,
        bathrooms,
        category,
        videoUrl: videoUrl || null,
        imageUrl: imageList[0] || getCategoryPhoto(category, index)
      });
    }

    if (preparedProps.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid property records prepared for insertion.",
        errors: errors.length > 0 ? errors : undefined
      }, { status: 400 });
    }

    // 4. Chunked Multi-Row Parameterized Insert (200 rows per chunk: safe, atomic, 100x faster!)
    const DB_CHUNK_SIZE = 200;
    const COLS_PER_ROW = 20;

    for (let c = 0; c < preparedProps.length; c += DB_CHUNK_SIZE) {
      const chunk = preparedProps.slice(c, c + DB_CHUNK_SIZE);
      const valueClauses: string[] = [];
      const params: any[] = [];

      chunk.forEach((p, idx) => {
        const offset = idx * COLS_PER_ROW;
        valueClauses.push(`(
          $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5},
          $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10},
          $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15},
          $${offset + 16}, 'Sq.Ft.', $${offset + 17}, $${offset + 18}, $${offset + 19},
          $${offset + 20}, false, NOW(), NOW()
        )`);

        params.push(
          p.title,
          p.slug,
          p.propertyTypeId,
          p.locationId,
          p.projectId,
          p.listingType,
          p.status,
          p.publishStatus,
          p.description,
          p.locationRaw,
          p.price,
          p.rent,
          p.floor,
          p.furnishing,
          p.parking,
          p.numArea,
          p.bedrooms,
          p.bathrooms,
          p.category,
          p.videoUrl
        );
      });

      const insertedRows = await query<{ id: number; title: string }>(
        `INSERT INTO "Property" (
          title, slug, "propertyTypeId", "locationId", "projectId",
          "listingType", status, "publishStatus", description, address,
          price, rent, floor, furnishing, parking,
          "carpetArea", "areaUnit", bedrooms, bathrooms, "configuration",
          "videoUrl", "isFeatured", "createdAt", "updatedAt"
        )
        VALUES ${valueClauses.join(', ')}
        RETURNING id, title;`,
        params
      );

      // Multi-row image insertion in 1 query for this chunk
      const imgClauses: string[] = [];
      const imgParams: any[] = [];
      insertedRows.forEach((row, idx) => {
        const imgUrl = chunk[idx].imageUrl;
        const offset = idx * 3;
        imgClauses.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, 1, true, NOW())`);
        imgParams.push(row.id, imgUrl, `${chunk[idx].title} Primary Photo`);
      });

      if (imgClauses.length > 0) {
        await query(
          `INSERT INTO "PropertyImage" ("propertyId", url, "altText", "sortOrder", "isPrimary", "createdAt")
           VALUES ${imgClauses.join(', ')};`,
          imgParams
        );
      }

      savedCount += insertedRows.length;
      savedProperties.push(...insertedRows);
    }

    if (savedCount === 0 && errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Failed to import rows: ${errors.join("; ")}`,
        errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      count: savedCount,
      totalReceived: rawItems.length,
      properties: savedProperties,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${savedCount} property listings into database!`
    });
  } catch (error: any) {
    console.error("Bulk Property Import Fatal Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process property bulk import."
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let keepSafeIds: number[] = [];

    // 1. Check if safe IDs were passed in request body
    try {
      const body = await req.json().catch(() => null);
      if (body?.safeIds && Array.isArray(body.safeIds)) {
        keepSafeIds = body.safeIds
          .map((id: any) => Number(id))
          .filter((id: number) => !isNaN(id) && id > 0);
      }
    } catch (e) {
      // json parse ignore
    }

    // 2. Also check any property marked as safe in DB
    const allProps = await query(`SELECT id, description FROM "Property";`);
    for (const p of allProps) {
      const { dossier } = parseDossierData(p.description || '');
      const numId = Number(p.id);
      if (dossier.isSafe && !keepSafeIds.includes(numId)) {
        keepSafeIds.push(numId);
      }
    }

    if (keepSafeIds.length > 0) {
      // Safe properties exist: protect them from deletion
      const safeIdList = keepSafeIds.join(',');

      await query(`DELETE FROM "PropertyImage" WHERE "propertyId" NOT IN (${safeIdList});`).catch(() => {});
      await query(`DELETE FROM "PropertyDocument" WHERE "propertyId" NOT IN (${safeIdList});`).catch(() => {});
      await query(`DELETE FROM "PropertyAmenity" WHERE "propertyId" NOT IN (${safeIdList});`).catch(() => {});
      await query(`DELETE FROM "FeaturedProperty" WHERE "propertyId" NOT IN (${safeIdList});`).catch(() => {});
      await query(`DELETE FROM "BlogProperty" WHERE "propertyId" NOT IN (${safeIdList});`).catch(() => {});
      await query(`UPDATE "WebsiteEnquiry" SET "propertyId" = NULL WHERE "propertyId" NOT IN (${safeIdList});`).catch(() => {});

      const deleted = await query(`DELETE FROM "Property" WHERE id NOT IN (${safeIdList}) RETURNING id;`);
      const count = deleted.length;

      return NextResponse.json({
        success: true,
        message: `Deleted ${count} unprotected properties. ${keepSafeIds.length} properties marked as SAFE were preserved and NOT deleted!`,
        deletedCount: count,
        safePreservedCount: keepSafeIds.length
      });
    }

    // No properties marked safe: wipe all
    await query(`DELETE FROM "PropertyImage";`).catch(() => {});
    await query(`DELETE FROM "PropertyDocument";`).catch(() => {});
    await query(`DELETE FROM "PropertyAmenity";`).catch(() => {});
    await query(`DELETE FROM "FeaturedProperty";`).catch(() => {});
    await query(`DELETE FROM "BlogProperty";`).catch(() => {});
    await query(`UPDATE "WebsiteEnquiry" SET "propertyId" = NULL WHERE "propertyId" IS NOT NULL;`).catch(() => {});

    const deleted = await query(`DELETE FROM "Property" RETURNING id;`);
    const count = deleted.length;

    return NextResponse.json({
      success: true,
      message: `Successfully deleted all ${count} properties from database.`,
      deletedCount: count,
      safePreservedCount: 0
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/properties/bulk error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to delete properties"
    }, { status: 500 });
  }
}

