import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query('SELECT NOW() as now, count(*) as count FROM "Property";');
    console.log('Database connected successfully:', res.rows);
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await pool.end();
  }
}

main();
