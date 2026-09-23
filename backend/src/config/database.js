import pg from 'pg';

let pool;

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured. Add your AWS RDS connection string to backend/.env.');
  }

  if (!pool) {
    const connectionUrl = new URL(process.env.DATABASE_URL);
    // `pg` lets sslmode in a URL override the explicit ssl option. Remove it so
    // this application owns the TLS policy consistently.
    connectionUrl.searchParams.delete('sslmode');
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
    pool = new pg.Pool({
      connectionString: connectionUrl.toString(),
      ssl: { rejectUnauthorized },
    });
  }

  return pool;
}
