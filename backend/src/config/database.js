import pg from 'pg';

let pool;
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured. Add your AWS RDS connection string to backend/.env.');
  if (!pool) pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  return pool;
}
