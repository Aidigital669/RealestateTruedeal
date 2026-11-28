/**
 * PostgreSQL 8-Field WHERE ... AND ... Query & GROUP BY Facet Engine
 * Executes real SQL filtering & grouping across:
 * 1. Transaction Type (listingType / Lease_Sale)
 * 2. Property Type (PropertyType.name / configuration)
 * 3. Transaction Classification (transactionClassification / TransactionName)
 * 4. Locality (Location.name / address)
 * 5. City (dossierData->>'CityName' / Location.city)
 * 6. Built-up Area (builtupArea / BuiltAreaName)
 * 7. Carpet Area (carpetArea / CarpetAreaName)
 * 8. Expected Price (price / rent / monthlyRent / ExpectedPrice / RentPM)
 */

import { query } from '@/lib/db';
import { EightFieldCriteria, getPropertyTypeMatchTerms } from '@/lib/eight-field-parser';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

// Safe SQL expressions normalizing numeric columns & JSONB fallback fields (e.g. "2,000 Sq.Ft." -> 2000)
// Checks both Built-up Area and Super Built-up Area (saleableArea / SuperAreaName)
export const SQL_BUILTUP_EXPR = `
  COALESCE(
    NULLIF(p."builtupArea", 0),
    NULLIF(NULLIF(substring(REPLACE(COALESCE(p."dossierData"->>'BuiltAreaName', ''), ',', '') FROM '([0-9]+(?:\\.[0-9]+)?)'), '')::numeric, 0),
    NULLIF(p."saleableArea", 0),
    NULLIF(NULLIF(substring(REPLACE(COALESCE(p."dossierData"->>'SuperAreaName', ''), ',', '') FROM '([0-9]+(?:\\.[0-9]+)?)'), '')::numeric, 0),
    0
  )
`;

export const SQL_CARPET_EXPR = `
  COALESCE(
    NULLIF(p."carpetArea", 0),
    NULLIF(NULLIF(substring(REPLACE(COALESCE(p."dossierData"->>'CarpetAreaName', ''), ',', '') FROM '([0-9]+(?:\\.[0-9]+)?)'), '')::numeric, 0),
    0
  )
`;

export const SQL_PRICE_EXPR = `
  COALESCE(
    NULLIF(p.price, 0),
    CASE WHEN p.rent >= 100 THEN p.rent ELSE NULL END,
    CASE WHEN p."monthlyRent" >= 100 THEN p."monthlyRent" ELSE NULL END,
    0
  )
`;

export const SQL_CITY_EXPR = `
  COALESCE(NULLIF(TRIM(p."dossierData"->>'CityName'), ''), NULLIF(TRIM(loc.city), ''), 'Pune')
`;

export const SQL_CLASS_EXPR = `
  COALESCE(NULLIF(TRIM(p."transactionClassification"), ''), NULLIF(TRIM(p."dossierData"->>'TransactionName'), ''), 'Not Specified')
`;

// Canonical typology that strips status tags like "(New)"/"(Preleased)" and overrides polluted pt.name (e.g., pt.name='Hospital' when cfg='Office (New)')
export const SQL_EFFECTIVE_TYPOLOGY_EXPR = `
  CASE
    WHEN NULLIF(TRIM(p.configuration), '') IS NOT NULL
      AND LOWER(TRIM(p.configuration)) != LOWER(COALESCE(TRIM(pt.name), ''))
      AND (
        LOWER(COALESCE(pt.name, '')) = 'hospital'
        OR LOWER(p.configuration) ~ '\\((new|preleased|prelaunch|resale)\\)'
        OR LOWER(p.configuration) ~ 'bhk'
      )
    THEN TRIM(REGEXP_REPLACE(p.configuration, '\\s*\\((New|Preleased|PreLaunch|Resale)\\)\\s*$', '', 'i'))
    ELSE COALESCE(NULLIF(TRIM(pt.name), ''), NULLIF(TRIM(p.configuration), ''), 'Commercial')
  END
`;

function escapePgRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expandCityPattern(city: string): string[] {
  const c = city.toLowerCase().trim();
  if (c === 'pune east' || c === 'pune(east)' || c === 'east pune') return ['%pune(east)%', '%pune east%'];
  if (c === 'pune west' || c === 'pune(west)' || c === 'west pune') return ['%pune(west)%', '%pune west%'];
  if (c === 'pune north' || c === 'pune(north)' || c === 'north pune') return ['%pune(north)%', '%pune north%'];
  if (c === 'pune south' || c === 'pune(south)' || c === 'south pune') return ['%pune(south)%', '%pune south%'];
  if (c === 'pune' || c === 'pune(all)') return ['%pune%'];
  if (c === 'goa' || c === 'north goa') return ['%goa%', '%margao%'];
  return [`%${c}%`];
}

export interface BuiltSqlFilter {
  whereSql: string;
  params: any[];
  activeFieldCount: number;
}

/**
 * Builds parameterized PostgreSQL `WHERE ... AND ...` conditions for the 8 core fields.
 */
export function buildEightFieldWhereClause(
  criteria: EightFieldCriteria,
  options?: {
    startParamIndex?: number;
    includeStatus?: string;
    includePurpose?: string;
  }
): BuiltSqlFilter {
  const clauses: string[] = [`p."publishStatus" = 'Published'`];
  const params: any[] = [];
  let idx = options?.startParamIndex ?? 1;
  let activeFieldCount = 0;

  // 1. Transaction Type (WHERE ... AND ...)
  if (criteria.transactionType) {
    activeFieldCount++;
    if (criteria.transactionType === 'Rent') {
      clauses.push(
        `(LOWER(COALESCE(p."listingType", '')) LIKE '%rent%' OR LOWER(COALESCE(p."listingType", '')) LIKE '%lease%' OR LOWER(COALESCE(p."dossierData"->>'Lease_Sale', '')) LIKE '%rent%')`
      );
    } else if (criteria.transactionType === 'Joint Development') {
      clauses.push(
        `(LOWER(COALESCE(p."dossierData"->>'Lease_Sale', '')) LIKE '%joint%' OR LOWER(COALESCE(p."listingType", '')) LIKE '%joint%')`
      );
    } else {
      clauses.push(
        `(LOWER(COALESCE(p."listingType", '')) LIKE '%sale%' OR LOWER(COALESCE(p."listingType", '')) LIKE '%buy%' OR p."listingType" IS NULL)`
      );
    }
  }

  // 2. Property Type & BHK (separate AND clauses so "3 BHK apartment" does NOT match 1/2/4 BHK apartments)
  if (criteria.propertyTypes.length > 0) {
    activeFieldCount++;
    const ptGroupOrs: string[] = [];

    for (const ptLabel of criteria.propertyTypes) {
      const terms = getPropertyTypeMatchTerms(ptLabel);
      const termOrs: string[] = [];
      for (const term of terms) {
        const cleanTerm = term.toLowerCase().trim();
        if (!cleanTerm) continue;
        // Use Postgres word boundaries (\m...\M) so "land" doesn't match "woodland" & "shop" doesn't match "workshop"
        const boundaryPattern = `\\m${escapePgRegex(cleanTerm).replace(/\\ /g, '\\s+')}\\M`;
        params.push(boundaryPattern);
        const rIdx = idx++;
        termOrs.push(
          `(${SQL_EFFECTIVE_TYPOLOGY_EXPR} ~* $${rIdx} OR COALESCE(p.configuration, '') ~* $${rIdx} OR COALESCE(p."dossierData"->>'PropertyTypeName', '') ~* $${rIdx} OR COALESCE(p.title, '') ~* $${rIdx})`
        );
      }
      if (termOrs.length > 0) ptGroupOrs.push(`(${termOrs.join(' OR ')})`);
    }

    if (ptGroupOrs.length > 0) {
      clauses.push(`(${ptGroupOrs.join(' OR ')})`);
    }
  }

  if (criteria.bhkNums.length > 0) {
    if (criteria.propertyTypes.length === 0) activeFieldCount++;
    const bhkOrs: string[] = [];
    for (const bhkNum of criteria.bhkNums) {
      params.push(bhkNum);
      const bIdx = idx++;
      const escBhk = escapePgRegex(String(bhkNum));
      params.push(`(?:^|[^0-9.])${escBhk}\\s*[- ]*\\s*(?:bhk|bed|bedroom)`);
      const strIdx = idx++;
      bhkOrs.push(
        `(p.bedrooms::numeric = $${bIdx} OR COALESCE(p.configuration, '') ~* $${strIdx} OR COALESCE(p.title, '') ~* $${strIdx} OR (COALESCE(p.title, '') !~* '(?:^|[^0-9.])[1-9](?:\\.5)?\\s*[- ]*\\s*bhk' AND (COALESCE(p.description, '') ~* $${strIdx} OR COALESCE(p."dossierData"::text, '') ~* $${strIdx})))`
      );
    }
    if (bhkOrs.length > 0) {
      clauses.push(`(${bhkOrs.join(' OR ')})`);
    }
  }

  // 3. Transaction Classification (Strict match against Property.transactionClassification / dossierData.TransactionName)
  if (criteria.transactionClassification) {
    activeFieldCount++;
    const tc = criteria.transactionClassification.toLowerCase().trim();
    const normExpr = (col: string) => `LOWER(regexp_replace(COALESCE(${col}, ''), '[-_\\s/]+', '', 'g'))`;
    if (tc.includes('pre lease') || tc.includes('pre-lease') || tc.includes('prelease') || tc.includes('pre rent') || tc.includes('prerented')) {
      const preleaseMatch = (col: string) =>
        `(${normExpr(col)} LIKE '%prelease%' OR ${normExpr(col)} LIKE '%prerent%')`;
      clauses.push(
        `(${preleaseMatch('p."transactionClassification"')} OR ${preleaseMatch(`p."dossierData"->>'TransactionName'`)})`
      );
    } else if (tc.includes('pre launch') || tc.includes('prelaunch')) {
      clauses.push(
        `(${normExpr('p."transactionClassification"')} LIKE '%prelaunch%' OR ${normExpr(`p."dossierData"->>'TransactionName'`)} LIKE '%prelaunch%')`
      );
    } else if (tc === 'new') {
      clauses.push(
        `(LOWER(TRIM(COALESCE(p."transactionClassification", ''))) = 'new' OR LOWER(TRIM(COALESCE(p."dossierData"->>'TransactionName', ''))) = 'new')`
      );
    } else if (tc.includes('individual') && tc.includes('company')) {
      clauses.push(
        `(LOWER(TRIM(COALESCE(p."transactionClassification", ''))) LIKE 'individual%company%' OR LOWER(TRIM(COALESCE(p."dossierData"->>'TransactionName', ''))) LIKE 'individual%company%')`
      );
    } else if (tc === 'individual') {
      clauses.push(
        `(LOWER(TRIM(COALESCE(p."transactionClassification", ''))) LIKE 'individual%' OR LOWER(TRIM(COALESCE(p."dossierData"->>'TransactionName', ''))) LIKE 'individual%')`
      );
    } else if (tc.includes('group')) {
      clauses.push(
        `(LOWER(TRIM(COALESCE(p."transactionClassification", ''))) LIKE '%group%booking%' OR LOWER(TRIM(COALESCE(p."dossierData"->>'TransactionName', ''))) LIKE '%group%booking%')`
      );
    } else if (tc === 'resale') {
      clauses.push(
        `(LOWER(TRIM(COALESCE(p."transactionClassification", ''))) = 'resale' OR LOWER(TRIM(COALESCE(p."dossierData"->>'TransactionName', ''))) = 'resale')`
      );
    } else {
      params.push(`%${tc}%`);
      clauses.push(
        `(LOWER(COALESCE(p."transactionClassification", '')) LIKE $${idx} OR LOWER(COALESCE(p."dossierData"->>'TransactionName', '')) LIKE $${idx})`
      );
      idx++;
    }
  }

  // 4. Locality (WHERE ... AND ...) - word-boundary safe so "camp" does not match "IT campus"
  if (criteria.localities.length > 0) {
    activeFieldCount++;
    const locOrs: string[] = [];
    for (const loc of criteria.localities) {
      const cleanLoc = loc.toLowerCase().trim();
      if (!cleanLoc) continue;
      if (/^[a-z0-9\s]+$/.test(cleanLoc)) {
        params.push(`\\m${escapePgRegex(cleanLoc).replace(/\\ /g, '\\s+')}\\M`);
        locOrs.push(
          `(COALESCE(loc.name, '') ~* $${idx} OR COALESCE(p."dossierData"->>'LocationName', '') ~* $${idx} OR COALESCE(p.address, '') ~* $${idx} OR COALESCE(p.title, '') ~* $${idx})`
        );
      } else {
        params.push(`%${cleanLoc}%`);
        locOrs.push(
          `(LOWER(COALESCE(loc.name, '')) LIKE $${idx} OR LOWER(COALESCE(p."dossierData"->>'LocationName', '')) LIKE $${idx} OR LOWER(COALESCE(p.address, '')) LIKE $${idx} OR LOWER(COALESCE(p.title, '')) LIKE $${idx})`
        );
      }
      idx++;
    }
    if (locOrs.length > 0) clauses.push(`(${locOrs.join(' OR ')})`);
  }

  // 5. City (WHERE ... AND ...) - use authoritative CityName first so Dubai/Goa rows with loc.city='Pune' don't leak into Pune search
  if (criteria.cities.length > 0) {
    activeFieldCount++;
    const cityOrs: string[] = [];
    for (const city of criteria.cities) {
      for (const pattern of expandCityPattern(city)) {
        params.push(pattern);
        cityOrs.push(
          `(LOWER(${SQL_CITY_EXPR}) LIKE $${idx} OR (NULLIF(TRIM(p."dossierData"->>'CityName'), '') IS NULL AND LOWER(COALESCE(p.address, '')) LIKE $${idx}))`
        );
        idx++;
      }
    }
    clauses.push(`(${cityOrs.join(' OR ')})`);
  }

  // 6. Built-up Area (WHERE ... AND ...)
  if (criteria.builtupArea.min !== null || criteria.builtupArea.max !== null) {
    activeFieldCount++;
    if (criteria.builtupArea.min !== null) {
      params.push(criteria.builtupArea.min);
      clauses.push(`${SQL_BUILTUP_EXPR} >= $${idx++}`);
    }
    if (criteria.builtupArea.max !== null) {
      params.push(criteria.builtupArea.max);
      clauses.push(`(${SQL_BUILTUP_EXPR} > 0 AND ${SQL_BUILTUP_EXPR} <= $${idx++})`);
    }
  }

  // 7. Carpet Area (WHERE ... AND ...)
  if (criteria.carpetArea.min !== null || criteria.carpetArea.max !== null) {
    activeFieldCount++;
    if (criteria.carpetArea.min !== null) {
      params.push(criteria.carpetArea.min);
      clauses.push(`${SQL_CARPET_EXPR} >= $${idx++}`);
    }
    if (criteria.carpetArea.max !== null) {
      params.push(criteria.carpetArea.max);
      clauses.push(`(${SQL_CARPET_EXPR} > 0 AND ${SQL_CARPET_EXPR} <= $${idx++})`);
    }
  }

  // Generic Sq.Ft. Area (matches Carpet Area OR Built-up Area)
  if (criteria.genericArea.min !== null || criteria.genericArea.max !== null) {
    activeFieldCount++;
    const carpetConds: string[] = [];
    const builtConds: string[] = [];
    if (criteria.genericArea.min !== null && criteria.genericArea.max !== null) {
      params.push(criteria.genericArea.min, criteria.genericArea.max);
      const minIdx = idx++;
      const maxIdx = idx++;
      carpetConds.push(`(${SQL_CARPET_EXPR} >= $${minIdx} AND ${SQL_CARPET_EXPR} <= $${maxIdx})`);
      builtConds.push(`(${SQL_BUILTUP_EXPR} >= $${minIdx} AND ${SQL_BUILTUP_EXPR} <= $${maxIdx})`);
    } else if (criteria.genericArea.min !== null) {
      params.push(criteria.genericArea.min);
      const minIdx = idx++;
      carpetConds.push(`${SQL_CARPET_EXPR} >= $${minIdx}`);
      builtConds.push(`${SQL_BUILTUP_EXPR} >= $${minIdx}`);
    } else if (criteria.genericArea.max !== null) {
      params.push(criteria.genericArea.max);
      const maxIdx = idx++;
      carpetConds.push(`(${SQL_CARPET_EXPR} > 0 AND ${SQL_CARPET_EXPR} <= $${maxIdx})`);
      builtConds.push(`(${SQL_BUILTUP_EXPR} > 0 AND ${SQL_BUILTUP_EXPR} <= $${maxIdx})`);
    }
    clauses.push(`((${carpetConds.join(' AND ')}) OR (${builtConds.join(' AND ')}))`);
  }

  // 8. Expected Price (WHERE ... AND ...)
  if (criteria.expectedPrice.min !== null || criteria.expectedPrice.max !== null) {
    activeFieldCount++;
    if (criteria.expectedPrice.min !== null) {
      params.push(criteria.expectedPrice.min);
      clauses.push(`${SQL_PRICE_EXPR} >= $${idx++}`);
    }
    if (criteria.expectedPrice.max !== null) {
      params.push(criteria.expectedPrice.max);
      clauses.push(`(${SQL_PRICE_EXPR} > 0 AND ${SQL_PRICE_EXPR} <= $${idx++})`);
    }
  }

  // Optional Status filter
  if (options?.includeStatus && options.includeStatus !== 'All' && options.includeStatus !== 'All Statuses') {
    const stLower = options.includeStatus.toLowerCase();
    if (stLower.includes('ready')) {
      clauses.push(`LOWER(COALESCE(p.status, '')) LIKE '%ready%'`);
    } else if (stLower.includes('under')) {
      clauses.push(`(LOWER(COALESCE(p.status, '')) LIKE '%under%' OR LOWER(COALESCE(p.status, '')) LIKE '%construction%')`);
    } else {
      params.push(`%${stLower}%`);
      clauses.push(`LOWER(COALESCE(p.status, '')) LIKE $${idx++}`);
    }
  }

  // Optional Business Purpose filter
  if (options?.includePurpose && options.includePurpose !== 'All' && options.includePurpose !== 'all') {
    params.push(options.includePurpose.trim());
    const pIdx = idx++;
    clauses.push(`
      EXISTS (
        SELECT 1 FROM "PropertyBusinessPurpose" pbp
        JOIN "BusinessPurpose" bp ON pbp."businessPurposeId" = bp.id
        WHERE pbp."propertyId" = p.id
          AND (bp.slug = $${pIdx} OR bp.id::text = $${pIdx} OR LOWER(bp.name) = LOWER($${pIdx}))
      )
    `);
  }

  // Residual distinctive name / keyword tokens (AND across distinctive tokens)
  if (criteria.keywords.length > 0) {
    for (const kw of criteria.keywords.slice(0, 5)) {
      params.push(`%${kw.toLowerCase()}%`);
      const kIdx = idx++;
      clauses.push(`(
        LOWER(COALESCE(p.title, '')) LIKE $${kIdx} OR
        LOWER(COALESCE(p.address, '')) LIKE $${kIdx} OR
        LOWER(COALESCE(p.description, '')) LIKE $${kIdx} OR
        LOWER(COALESCE(p."propertyName", '')) LIKE $${kIdx} OR
        LOWER(COALESCE(p."buildingName", '')) LIKE $${kIdx} OR
        LOWER(COALESCE(p."dossierData"->>'PropertyName', '')) LIKE $${kIdx} OR
        LOWER(COALESCE(p."dossierData"->>'BuildingName', '')) LIKE $${kIdx} OR
        LOWER(COALESCE(p."searchKeywords", '')) LIKE $${kIdx} OR
        LOWER(COALESCE(proj.developer, '')) LIKE $${kIdx} OR
        LOWER(COALESCE(loc.name, '')) LIKE $${kIdx} OR
        LOWER(COALESCE(${SQL_EFFECTIVE_TYPOLOGY_EXPR}, '')) LIKE $${kIdx}
      )`);
    }
  }

  return {
    whereSql: clauses.join('\n  AND '),
    params,
    activeFieldCount
  };
}

export interface GroupByFacet {
  value: string;
  count: number;
}

export interface EightFieldGroupByFacets {
  transactionTypes: GroupByFacet[];
  propertyTypes: GroupByFacet[];
  transactionClassifications: GroupByFacet[];
  localities: GroupByFacet[];
  cities: GroupByFacet[];
  builtupAreaStats: { count: number; min: number | null; max: number | null };
  carpetAreaStats: { count: number; min: number | null; max: number | null };
  expectedPriceStats: { count: number; min: number | null; max: number | null };
}

const FROM_JOIN_SQL = `
  FROM "Property" p
  LEFT JOIN "Project" proj ON p."projectId" = proj.id
  LEFT JOIN "Location" loc ON p."locationId" = loc.id
  LEFT JOIN "PropertyType" pt ON p."propertyTypeId" = pt.id
`;

/**
 * Runs real SQL GROUP BY queries across all 8 fields (optionally scoped by an active WHERE clause).
 */
export async function fetchEightFieldGroupByFacets(
  whereSql: string = `p."publishStatus" = 'Published'`,
  params: any[] = []
): Promise<EightFieldGroupByFacets> {
  const [txRows, ptRows, classRows, locRows, cityRows, areaPriceRows] = await Promise.all([
    query<{ value: string; count: number }>(
      `SELECT COALESCE(NULLIF(TRIM(p."listingType"), ''), 'Sale') AS value, COUNT(*)::int AS count
       ${FROM_JOIN_SQL}
       WHERE ${whereSql}
       GROUP BY 1
       ORDER BY count DESC;`,
      params
    ),
    query<{ value: string; count: number }>(
      `SELECT ${SQL_EFFECTIVE_TYPOLOGY_EXPR} AS value, COUNT(*)::int AS count
       ${FROM_JOIN_SQL}
       WHERE ${whereSql}
       GROUP BY 1
       ORDER BY count DESC;`,
      params
    ),
    query<{ value: string; count: number }>(
      `SELECT ${SQL_CLASS_EXPR} AS value, COUNT(*)::int AS count
       ${FROM_JOIN_SQL}
       WHERE ${whereSql}
       GROUP BY 1
       ORDER BY count DESC;`,
      params
    ),
    query<{ value: string; count: number }>(
      `SELECT COALESCE(NULLIF(TRIM(loc.name), ''), 'Pune') AS value, COUNT(*)::int AS count
       ${FROM_JOIN_SQL}
       WHERE ${whereSql}
       GROUP BY 1
       ORDER BY count DESC
       LIMIT 60;`,
      params
    ),
    query<{ value: string; count: number }>(
      `SELECT ${SQL_CITY_EXPR} AS value, COUNT(*)::int AS count
       ${FROM_JOIN_SQL}
       WHERE ${whereSql}
       GROUP BY 1
       ORDER BY count DESC
       LIMIT 40;`,
      params
    ),
    query<any>(
      `SELECT
         COUNT(*) FILTER (WHERE ${SQL_BUILTUP_EXPR} > 0)::int AS builtup_cnt,
         MIN(${SQL_BUILTUP_EXPR}) FILTER (WHERE ${SQL_BUILTUP_EXPR} > 0) AS builtup_min,
         MAX(${SQL_BUILTUP_EXPR}) FILTER (WHERE ${SQL_BUILTUP_EXPR} > 0) AS builtup_max,
         COUNT(*) FILTER (WHERE ${SQL_CARPET_EXPR} > 0)::int AS carpet_cnt,
         MIN(${SQL_CARPET_EXPR}) FILTER (WHERE ${SQL_CARPET_EXPR} > 0) AS carpet_min,
         MAX(${SQL_CARPET_EXPR}) FILTER (WHERE ${SQL_CARPET_EXPR} > 0) AS carpet_max,
         COUNT(*) FILTER (WHERE ${SQL_PRICE_EXPR} > 0)::int AS price_cnt,
         MIN(${SQL_PRICE_EXPR}) FILTER (WHERE ${SQL_PRICE_EXPR} > 0) AS price_min,
         MAX(${SQL_PRICE_EXPR}) FILTER (WHERE ${SQL_PRICE_EXPR} > 0) AS price_max
       ${FROM_JOIN_SQL}
       WHERE ${whereSql};`,
      params
    )
  ]);

  const ap = areaPriceRows[0] || {};
  return {
    transactionTypes: txRows,
    propertyTypes: ptRows,
    transactionClassifications: classRows.filter((r) => r.value && r.value !== 'Not Specified'),
    localities: locRows,
    cities: cityRows,
    builtupAreaStats: {
      count: Number(ap.builtup_cnt) || 0,
      min: ap.builtup_min ? Number(ap.builtup_min) : null,
      max: ap.builtup_max ? Number(ap.builtup_max) : null
    },
    carpetAreaStats: {
      count: Number(ap.carpet_cnt) || 0,
      min: ap.carpet_min ? Number(ap.carpet_min) : null,
      max: ap.carpet_max ? Number(ap.carpet_max) : null
    },
    expectedPriceStats: {
      count: Number(ap.price_cnt) || 0,
      min: ap.price_min ? Number(ap.price_min) : null,
      max: ap.price_max ? Number(ap.price_max) : null
    }
  };
}

/**
 * Executes the parameterized SELECT + WHERE ... AND ... query returning hydrated DB rows.
 */
export async function executeEightFieldSqlRows(
  whereSql: string,
  params: any[],
  limit = 150
): Promise<any[]> {
  return query(
    `
    SELECT
      p.id, p.slug, p.title AS name, p.description, p.address AS location,
      p.price, p.rent, p."monthlyRent", p."dossierData",
      p."carpetArea" AS sqft_num,
      ${SQL_BUILTUP_EXPR} AS builtup_num,
      ${SQL_CARPET_EXPR} AS carpet_num,
      ${SQL_CITY_EXPR} AS city_name,
      p."transactionClassification",
      p.bedrooms AS bhk_num, p.configuration, p."videoUrl", p.status, p."isFeatured" AS featured,
      p."listingType" AS listing_type,
      COALESCE(proj.developer, '') AS developer,
      COALESCE(proj."reraNumber", 'PRM/PUN/RERA/2026/0491') AS rera_number,
      COALESCE(loc.name, 'Koregaon Park') AS locality,
      COALESCE(loc.city, 'Pune') AS loc_city,
      COALESCE(${SQL_EFFECTIVE_TYPOLOGY_EXPR}, pt.name, 'Apartment') AS type_name,
      (
        LOWER(regexp_replace(COALESCE(p."transactionClassification", p."dossierData"->>'TransactionName', ''), '[-_\\s/]+', '', 'g')) LIKE '%prelease%'
        OR LOWER(regexp_replace(COALESCE(p."transactionClassification", p."dossierData"->>'TransactionName', ''), '[-_\\s/]+', '', 'g')) LIKE '%prerent%'
      ) AS is_preleased,
      COALESCE(img.url, '${DEFAULT_IMG}') AS image,
      imgs.urls AS all_images
    FROM "Property" p
    LEFT JOIN "Project" proj ON p."projectId" = proj.id
    LEFT JOIN "Location" loc ON p."locationId" = loc.id
    LEFT JOIN "PropertyType" pt ON p."propertyTypeId" = pt.id
    LEFT JOIN LATERAL (
      SELECT url FROM "PropertyImage" WHERE "propertyId" = p.id ORDER BY "sortOrder" ASC LIMIT 1
    ) img ON true
    LEFT JOIN LATERAL (
      SELECT array_agg(url ORDER BY "sortOrder" ASC) AS urls FROM "PropertyImage" WHERE "propertyId" = p.id
    ) imgs ON true
    WHERE ${whereSql}
    ORDER BY p."isFeatured" DESC, p."createdAt" DESC
    LIMIT ${Math.max(1, Math.min(limit, 500))};
    `,
    params
  );
}
