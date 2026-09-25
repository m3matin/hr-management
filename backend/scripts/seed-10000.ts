// This wrapper forces the employee count while preserving the normal seed
// engine, batching, deterministic Faker seed, and salary-history generation.
process.env.SEED_EMPLOYEE_COUNT = "10000";

if (process.argv.includes("--append")) {
  process.env.SEED_TRUNCATE = "false";
}

await import("./seed.js");
