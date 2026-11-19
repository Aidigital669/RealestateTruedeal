require('dotenv').config({path:'.env.local'});
const {Pool} = require('pg');
const pool = new Pool({connectionString:process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});

async function check() {
  const r = await pool.query(`
    SELECT id, title, slug, "videoUrl", description
    FROM "Property" 
    WHERE title ILIKE '%Nana Peth%' OR slug ILIKE '%nana-peth%' OR id = 3193 OR id = 207;
  `);
  console.log('Nana Peth rows:', r.rows);
  await pool.end();
}
check();
