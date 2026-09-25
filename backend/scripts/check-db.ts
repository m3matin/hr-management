import "dotenv/config";
import {
  assertDatabaseConfigured,
  sequelize,
} from "../src/database/sequelize.js";
import "../src/models/index.js";

async function main() {
  assertDatabaseConfigured();
  await sequelize.authenticate();
  console.log("PostgreSQL connection successful.");
}

main()
  .catch((error: unknown) => {
    console.error(
      "PostgreSQL connection failed:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
