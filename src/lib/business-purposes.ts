import { query, queryOne } from './db';
import { BusinessPurpose, INITIAL_BUSINESS_PURPOSES } from './business-purposes-constants';

export type { BusinessPurpose };
export { INITIAL_BUSINESS_PURPOSES };

let tablesInitialized = false;

export async function ensureBusinessPurposesTables(): Promise<void> {
  if (tablesInitialized) return;
  try {
    // 1. Create BusinessPurpose table
    await query(`
      CREATE TABLE IF NOT EXISTS "BusinessPurpose" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Create PropertyBusinessPurpose join table
    await query(`
      CREATE TABLE IF NOT EXISTS "PropertyBusinessPurpose" (
        "propertyId" INTEGER NOT NULL REFERENCES "Property"(id) ON DELETE CASCADE,
        "businessPurposeId" INTEGER NOT NULL REFERENCES "BusinessPurpose"(id) ON DELETE CASCADE,
        PRIMARY KEY ("propertyId", "businessPurposeId")
      );
    `);

    // 3. Create Indexes
    await query(`
      CREATE INDEX IF NOT EXISTS "PropertyBusinessPurpose_businessPurposeId_idx" 
      ON "PropertyBusinessPurpose"("businessPurposeId");
    `).catch(() => {});

    await query(`
      CREATE INDEX IF NOT EXISTS "PropertyBusinessPurpose_propertyId_idx" 
      ON "PropertyBusinessPurpose"("propertyId");
    `).catch(() => {});

    // 4. Seed 21 purposes idempotently
    for (const item of INITIAL_BUSINESS_PURPOSES) {
      await query(`
        INSERT INTO "BusinessPurpose" (name, slug, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE 
        SET name = EXCLUDED.name, "updatedAt" = NOW();
      `, [item.name, item.slug]).catch(() => {});
    }

    // 5. Create compatibility views for lowercase snake_case queries if needed
    await query(`
      CREATE OR REPLACE VIEW business_purposes AS 
      SELECT id, name, slug, "isActive" as is_active, "createdAt" as created_at, "updatedAt" as updated_at 
      FROM "BusinessPurpose";
    `).catch(() => {});

    await query(`
      CREATE OR REPLACE VIEW property_business_purposes AS 
      SELECT "propertyId" as property_id, "businessPurposeId" as business_purpose_id 
      FROM "PropertyBusinessPurpose";
    `).catch(() => {});

    tablesInitialized = true;
  } catch (err) {
    console.warn('Failed to auto-ensure BusinessPurpose tables:', err);
  }
}

export async function getAllBusinessPurposes(): Promise<BusinessPurpose[]> {
  await ensureBusinessPurposesTables();
  try {
    const rows = await query<BusinessPurpose>(`
      SELECT id, name, slug, "isActive"
      FROM "BusinessPurpose"
      WHERE "isActive" = true
      ORDER BY id ASC;
    `);
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn('DB business purposes fetch fallback:', err);
  }

  // Fallback to static list with 1-based indexing if DB query fails
  return INITIAL_BUSINESS_PURPOSES.map((item, idx) => ({
    id: idx + 1,
    name: item.name,
    slug: item.slug,
    isActive: true
  }));
}

export async function getPurposesForProperties(propertyIds: (number | string)[]): Promise<Record<string, BusinessPurpose[]>> {
  if (!propertyIds || propertyIds.length === 0) return {};
  await ensureBusinessPurposesTables();

  const numIds = propertyIds.map((id) => Number(id)).filter((id) => !isNaN(id));
  if (numIds.length === 0) return {};

  const map: Record<string, BusinessPurpose[]> = {};
  propertyIds.forEach((id) => {
    map[String(id)] = [];
  });

  try {
    const rows = await query(`
      SELECT pbp."propertyId", bp.id, bp.name, bp.slug
      FROM "PropertyBusinessPurpose" pbp
      JOIN "BusinessPurpose" bp ON pbp."businessPurposeId" = bp.id
      WHERE pbp."propertyId" = ANY($1::int[]) AND bp."isActive" = true
      ORDER BY bp.id ASC;
    `, [numIds]);

    for (const r of rows) {
      const pid = String(r.propertyId);
      if (!map[pid]) map[pid] = [];
      map[pid].push({
        id: r.id,
        name: r.name,
        slug: r.slug
      });
    }
  } catch (err) {
    console.warn('Failed to fetch purposes for properties:', err);
  }

  return map;
}

export async function setPropertyBusinessPurposes(
  propertyId: number | string,
  purposeIdsOrSlugs: (number | string)[]
): Promise<void> {
  const numPropId = Number(propertyId);
  if (isNaN(numPropId)) return;
  await ensureBusinessPurposesTables();

  try {
    // 1. Delete existing assignments
    await query(`DELETE FROM "PropertyBusinessPurpose" WHERE "propertyId" = $1;`, [numPropId]);

    if (!purposeIdsOrSlugs || purposeIdsOrSlugs.length === 0) return;

    // 2. Resolve purpose IDs (support numeric ID or string slug)
    const validIds: number[] = [];
    for (const item of purposeIdsOrSlugs) {
      if (typeof item === 'number' || /^\d+$/.test(String(item))) {
        validIds.push(Number(item));
      } else if (typeof item === 'string' && item.trim()) {
        const str = item.trim();
        const slug = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let found = await queryOne(
          `SELECT id FROM "BusinessPurpose" WHERE slug = $1 OR LOWER(name) = LOWER($2) LIMIT 1;`,
          [slug, str]
        );
        if (!found?.id && str.length >= 2) {
          found = await queryOne(
            `INSERT INTO "BusinessPurpose" (name, slug, "isActive", "createdAt", "updatedAt")
             VALUES ($1, $2, true, NOW(), NOW())
             ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
             RETURNING id;`,
            [str, slug || `bp-${Date.now()}`]
          );
        }
        if (found?.id) validIds.push(found.id);
      }
    }

    const uniqueIds = Array.from(new Set(validIds));
    for (const pid of uniqueIds) {
      await query(`
        INSERT INTO "PropertyBusinessPurpose" ("propertyId", "businessPurposeId")
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING;
      `, [numPropId, pid]);
    }
  } catch (err) {
    console.error(`Failed to set business purposes for property ${propertyId}:`, err);
    throw err;
  }
}
