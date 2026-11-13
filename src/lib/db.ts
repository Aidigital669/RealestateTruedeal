import pg from 'pg';
import { prisma } from './prisma';

// Reusable PostgreSQL connection pool for high-performance direct SQL queries
const globalForPg = globalThis as unknown as {
  pgPool: pg.Pool | undefined;
};

export const pool =
  globalForPg.pgPool ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

globalForPg.pgPool = pool;

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows;
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export { prisma };
