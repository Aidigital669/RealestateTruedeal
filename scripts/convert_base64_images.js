const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const TARGET_DIR = path.join(process.cwd(), 'public', 'uploads', 'properties');
const ANV_TARGET_DIR = path.resolve('d:/AiDigitals_Projects/AnvReality/public/uploads/properties');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}
if (fs.existsSync(path.resolve('d:/AiDigitals_Projects/AnvReality')) && !fs.existsSync(ANV_TARGET_DIR)) {
  fs.mkdirSync(ANV_TARGET_DIR, { recursive: true });
}

async function convertBase64Images() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT pi.id, pi."propertyId", pi.url, pi."sortOrder", p.title
      FROM "PropertyImage" pi
      JOIN "Property" p ON p.id = pi."propertyId"
      WHERE pi.url LIKE 'data:image/%'
      ORDER BY pi."propertyId", pi."sortOrder";
    `);

    console.log(`Found ${res.rows.length} base64 images to convert.`);

    for (const row of res.rows) {
      const match = row.url.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!match) {
        console.warn(`Row ${row.id} does not match expected data URL pattern, skipping.`);
        continue;
      }

      let ext = match[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      if (ext === 'svg+xml') ext = 'svg';

      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `prop_${row.propertyId}_img_${row.id}.${ext}`;
      const filePath = path.join(TARGET_DIR, filename);

      fs.writeFileSync(filePath, buffer);
      console.log(`Saved: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB) for Property ${row.propertyId} [${row.title}]`);

      if (fs.existsSync(path.resolve('d:/AiDigitals_Projects/AnvReality'))) {
        try {
          fs.writeFileSync(path.join(ANV_TARGET_DIR, filename), buffer);
          console.log(`Also synced to AnvReality: ${filename}`);
        } catch (e) {
          console.warn(`Failed sync to AnvReality:`, e.message);
        }
      }

      const relativeUrl = `/uploads/properties/${filename}`;
      await client.query(
        `UPDATE "PropertyImage" SET url = $1 WHERE id = $2;`,
        [relativeUrl, row.id]
      );
      console.log(`Updated PropertyImage ${row.id} -> ${relativeUrl}`);
    }

    console.log('Finished converting all base64 images successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

convertBase64Images().catch(console.error);
