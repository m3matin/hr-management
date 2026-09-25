import { assertDatabaseConfigured, sequelize } from "./sequelize.js";
import "../models/index.js";

export interface DatabaseConnectionOptions {
  sync?: boolean;
}

export async function connectDatabase(
  options: DatabaseConnectionOptions = {},
): Promise<void> {
  assertDatabaseConfigured();
  await sequelize.authenticate();

  const shouldSync =
    options.sync === true || process.env.DB_SYNC_ON_START === "true";
  if (shouldSync) {
    await sequelize.sync();
  }
}

export async function disconnectDatabase(): Promise<void> {
  await sequelize.close();
}

export async function syncDatabase(): Promise<void> {
  assertDatabaseConfigured();
  await sequelize.authenticate();
  await sequelize.sync();
}
