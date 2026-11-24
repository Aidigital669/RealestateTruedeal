import pg from 'pg';
import { prisma } from './prisma';

// Reusable PostgreSQL connection pool for high-performance direct SQL queries
const globalForPg = globalThis as unknown as {
  pgPool: pg.Pool | undefined;
};

export function getPool(): pg.Pool {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
  }
  return globalForPg.pgPool;
}

export const pool = new Proxy({} as pg.Pool, {
  get(_, prop) {
    const p = getPool();
    const val = (p as any)[prop];
    return typeof val === 'function' ? val.bind(p) : val;
  }
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getPool();
  const res = await p.query(text, params);
  return res.rows;
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export { prisma };
