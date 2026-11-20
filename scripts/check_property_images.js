const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    const p6138 = await client.query(`SELECT id, "sortOrder", url FROM "PropertyImage" WHERE "propertyId" = 6138 ORDER BY "sortOrder" ASC;`);
    console.log('Property 6138 Images in DB:');
    console.log(p6138.rows);

    const p4229 = await client.query(`SELECT id, "sortOrder", url FROM "PropertyImage" WHERE "propertyId" = 4229 ORDER BY "sortOrder" ASC;`);
    console.log('Property 4229 Images in DB:');
    console.log(p4229.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
