import { disconnectDatabase, syncDatabase } from "../src/database/bootstrap.js";

async function main(): Promise<void> {
  try {
    await syncDatabase();
    console.log("Database schema synchronized.");
  } finally {
    await disconnectDatabase();
  }
}

void main().catch((error: unknown) => {
  console.error("Database synchronization failed", error);
  process.exitCode = 1;
});
