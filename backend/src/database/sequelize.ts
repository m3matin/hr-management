import "dotenv/config";
import { Sequelize } from "sequelize";

const configuredDatabaseUrl = process.env.DATABASE_URL;
const configuredRejectUnauthorized =
  process.env.DB_SSL_REJECT_UNAUTHORIZED?.toLowerCase();
const rejectUnauthorized =
  configuredRejectUnauthorized === "true" ||
  (configuredRejectUnauthorized !== "false" &&
    process.env.NODE_ENV === "production");
const sslEnabled =
  process.env.DB_SSL === "true" ||
  !rejectUnauthorized ||
  configuredDatabaseUrl?.includes("sslmode=require") === true;

/**
 * pg treats sslmode=require as certificate verification even when Sequelize
 * receives rejectUnauthorized=false. Remove only that libpq URL setting when
 * the application has explicitly opted into a trusted local/self-signed cert.
 */
function normalizeDatabaseUrl(url: string | undefined): string | undefined {
  if (!url || rejectUnauthorized) {
    return url;
  }

  const parsed = new URL(url);
  if (
    !parsed.searchParams.has("sslmode") &&
    !parsed.searchParams.has("uselibpqcompat")
  ) {
    return url;
  }

  parsed.searchParams.delete("sslmode");
  parsed.searchParams.delete("uselibpqcompat");
  return parsed.toString();
}

export const sequelize = new Sequelize(
  normalizeDatabaseUrl(configuredDatabaseUrl) ??
    "postgresql://unused:unused@127.0.0.1:1/unused_for_imports",
  {
    dialect: "postgres",
    dialectOptions: sslEnabled
      ? {
          ssl: {
            rejectUnauthorized,
          },
        }
      : {},
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: 0,
      acquire: 30_000,
      idle: 10_000,
    },
    define: {
      freezeTableName: true,
    },
  },
);

export function assertDatabaseConfigured(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required before connecting to PostgreSQL.",
    );
  }
}
