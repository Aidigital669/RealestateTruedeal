const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Property' 
    ORDER BY ordinal_position
  `);
  console.log('Property columns:', cols.rows.map(r => r.column_name));

  const locs = await pool.query('SELECT DISTINCT name FROM "Location" LIMIT 50');
  console.log('Location names:', locs.rows.map(r => r.name));

  await pool.end();
}

run().catch(console.error);
