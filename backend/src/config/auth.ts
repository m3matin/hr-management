import type { SignOptions } from "jsonwebtoken";

const LOCAL_ADMIN_EMAIL = "hr.admin@acme.com";
const LOCAL_ADMIN_PASSWORD = "ChangeMe123!";
const LOCAL_JWT_SECRET =
  "local-development-only-jwt-secret-change-before-production";

function getRequiredProductionValue(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is required in production.`);
  }

  return fallback;
}

export function getAdminEmail(): string {
  return getRequiredProductionValue("HR_ADMIN_EMAIL", LOCAL_ADMIN_EMAIL);
}

export function getAdminPassword(): string {
  return getRequiredProductionValue("HR_ADMIN_PASSWORD", LOCAL_ADMIN_PASSWORD);
}

export function getJwtSecret(): string {
  return getRequiredProductionValue("JWT_SECRET", LOCAL_JWT_SECRET);
}

export function getJwtExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.JWT_EXPIRES_IN || "8h") as SignOptions["expiresIn"];
}
