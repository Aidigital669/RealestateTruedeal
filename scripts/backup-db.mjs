import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function backup() {
  await pool.query('CREATE TABLE IF NOT EXISTS "Property_backup_pre_phase4" AS SELECT * FROM "Property";');
  const count = await pool.query('SELECT count(*) as count FROM "Property_backup_pre_phase4";');
  console.log('Database backup created successfully. Rows in backup:', count.rows[0].count);
  await pool.end();
}

backup();
