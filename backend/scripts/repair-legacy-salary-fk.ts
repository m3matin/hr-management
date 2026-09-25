import "dotenv/config";
import { QueryTypes } from "sequelize";
import { sequelize } from "../src/database/sequelize.js";

async function main() {
  const rows = await sequelize.query<{ column_name: string }>(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'salary_history'
        AND column_name = 'salary_history_employee_id_fkey'`,
    { type: QueryTypes.SELECT },
  );

  if (rows.length === 0) {
    console.log("Legacy salary foreign-key column is not present.");
    return;
  }

  await sequelize.query(
    'ALTER TABLE "salary_history" DROP COLUMN IF EXISTS "salary_history_employee_id_fkey" CASCADE',
  );
  console.log("Removed legacy salary foreign-key column.");
}

main()
  .catch((error: unknown) => {
    console.error("Legacy salary foreign-key repair failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
