import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function check() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Property' ORDER BY ordinal_position;");
  console.log('Columns in Property table:');
  res.rows.forEach(r => console.log(' - ' + r.column_name + ' (' + r.data_type + ')'));
  await pool.end();
}
check();
