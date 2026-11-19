const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const r = await pool.query('SELECT id, description, "videoUrl" FROM "Property" WHERE description ILIKE \'%H : W : D%\' OR description ILIKE \'%🚗%\' OR id = 4229');
  console.log(`Found ${r.rows.length} rows to inspect.`);

  for (const row of r.rows) {
    let d = row.description || '';
    const original = d;

    // Clean repetitive H : W : D:
    d = d.replace(/(?:#\s*)?(?:H\s*:\s*W\s*:\s*D\s*[:\-]\s*)+/gi, '# H : W : D: ');

    // Clean repetitive car/scooter emojis
    d = d.replace(/(?:🚗\s*){2,}/g, '🚗 ');
    d = d.replace(/(?:🛵\s*){2,}/g, '🛵 ');

    if (d !== original) {
      await pool.query('UPDATE "Property" SET description = $1 WHERE id = $2', [d, row.id]);
      console.log(`Successfully cleaned description for property ID ${row.id}`);
    }
  }

  // Check Property 4229 specifically
  const p4229 = await pool.query('SELECT id, title, slug, "videoUrl", description FROM "Property" WHERE id = 4229');
  console.log('Property 4229 status:', {
    id: p4229.rows[0]?.id,
    videoUrl: p4229.rows[0]?.videoUrl,
    description: p4229.rows[0]?.description
  });

  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
