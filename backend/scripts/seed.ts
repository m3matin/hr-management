import "dotenv/config";
import { faker } from "@faker-js/faker";
import { EmployeeStatus, Gender, SalaryReason } from "../src/enums.js";
import { sequelize } from "../src/database/sequelize.js";
import { disconnectDatabase, syncDatabase } from "../src/database/bootstrap.js";
import { Employee, SalaryHistory } from "../src/models/index.js";

const countries = [
  { code: "US", currency: "USD", min: 5_500_000, max: 18_000_000 },
  { code: "IN", currency: "INR", min: 600_000, max: 4_200_000 },
  { code: "GB", currency: "GBP", min: 3_500_000, max: 11_000_000 },
  { code: "DE", currency: "EUR", min: 4_000_000, max: 12_000_000 },
  { code: "CA", currency: "CAD", min: 5_000_000, max: 14_000_000 },
  { code: "AU", currency: "AUD", min: 5_500_000, max: 15_000_000 },
  { code: "SG", currency: "SGD", min: 4_500_000, max: 13_000_000 },
  { code: "JP", currency: "JPY", min: 4_000_000, max: 13_000_000 },
] as const;

const roles = {
  Engineering: [
    "Software Engineer",
    "Senior Software Engineer",
    "Engineering Manager",
    "Director of Engineering",
  ],
  People: ["HR Specialist", "HR Business Partner", "People Manager"],
  Sales: [
    "Sales Representative",
    "Account Executive",
    "Sales Manager",
    "Sales Director",
  ],
  Finance: ["Financial Analyst", "Finance Manager", "Finance Director"],
  Product: ["Product Manager", "Senior Product Manager", "Product Director"],
  Operations: ["Operations Analyst", "Operations Manager"],
} as const;

type Department = keyof typeof roles;

interface SeedEmployee {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  department: string;
  roleTitle: string;
  gender: Gender;
  hireDate: string;
  status: EmployeeStatus;
  currency: string;
  baseSalaryMinor: number;
  salaryChanges: Array<{
    amountMinor: number;
    effectiveDate: string;
    reason: SalaryReason;
  }>;
}

function readPositiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = Number(raw ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function readReferenceDate(): Date {
  const value = process.env.SEED_REFERENCE_DATE ?? "2026-09-24";
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date < new Date("2024-01-01")) {
    throw new Error(
      "SEED_REFERENCE_DATE must be a valid date on or after 2024-01-01.",
    );
  }
  return date;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function generateEmployees(count: number, referenceDate: Date): SeedEmployee[] {
  return Array.from({ length: count }, (_, index) => {
    const location = faker.helpers.arrayElement(countries);
    const department = faker.helpers.arrayElement(
      Object.keys(roles) as Department[],
    );
    const roleTitle = faker.helpers.arrayElement(roles[department]);
    const hireDate = faker.date.between({
      from: "2016-01-01",
      to: "2024-01-01",
    });
    let amountMinor = faker.number.int({
      min: location.min,
      max: location.max,
    });
    const baseSalaryMinor = amountMinor;
    const salaryChanges: SeedEmployee["salaryChanges"] = [];

    for (
      let changeIndex = 0;
      changeIndex < faker.number.int({ min: 0, max: 3 });
      changeIndex += 1
    ) {
      amountMinor = Math.round(
        amountMinor * faker.number.float({ min: 1.03, max: 1.15 }),
      );
      salaryChanges.push({
        amountMinor,
        effectiveDate: toDateOnly(
          faker.date.between({ from: hireDate, to: referenceDate }),
        ),
        reason: faker.helpers.arrayElement([
          SalaryReason.RAISE,
          SalaryReason.ADJUSTMENT,
          SalaryReason.PROMOTION,
        ]),
      });
    }

    return {
      employeeCode: `EMP-${String(index + 1).padStart(6, "0")}`,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: `employee.${index + 1}@acme.test`,
      country: location.code,
      department,
      roleTitle,
      gender: faker.helpers.arrayElement(Object.values(Gender)),
      hireDate: toDateOnly(hireDate),
      status:
        faker.number.int({ min: 1, max: 100 }) <= 95
          ? EmployeeStatus.ACTIVE
          : EmployeeStatus.TERMINATED,
      currency: location.currency,
      baseSalaryMinor,
      salaryChanges,
    };
  });
}

async function main(): Promise<void> {
  const employeeCount = readPositiveInteger("SEED_EMPLOYEE_COUNT", 10_000);
  const batchSize = readPositiveInteger("SEED_BATCH_SIZE", 500);
  const randomSeed = readPositiveInteger("SEED_RANDOM_SEED", 20_260_924);
  const referenceDate = readReferenceDate();
  const shouldTruncate = process.env.SEED_TRUNCATE !== "false";

  faker.seed(randomSeed);
  const employees = generateEmployees(employeeCount, referenceDate);

  await syncDatabase();
  console.log(
    `Seeding ${employeeCount.toLocaleString("en-US")} employees ` +
      `(seed=${randomSeed}, batchSize=${batchSize}, truncate=${shouldTruncate}).`,
  );

  await sequelize.transaction(async (transaction) => {
    if (shouldTruncate) {
      await SalaryHistory.truncate({ cascade: true, transaction });
      await Employee.truncate({ cascade: true, transaction });
    }

    for (let offset = 0; offset < employees.length; offset += batchSize) {
      const batch = employees.slice(offset, offset + batchSize);
      const records = batch.map(
        ({
          baseSalaryMinor: _baseSalaryMinor,
          salaryChanges: _salaryChanges,
          ...employee
        }) => employee,
      );
      const createdEmployees = await Employee.bulkCreate(records, {
        transaction,
      });
      const salaryRecords = createdEmployees.flatMap((employee, index) => {
        const source = batch[index];
        return [
          {
            employeeId: employee.id,
            amountMinor: BigInt(source.baseSalaryMinor),
            currency: source.currency,
            effectiveDate: source.hireDate,
            reason: SalaryReason.INITIAL,
          },
          ...source.salaryChanges.map((change) => ({
            employeeId: employee.id,
            amountMinor: BigInt(change.amountMinor),
            currency: source.currency,
            effectiveDate: change.effectiveDate,
            reason: change.reason,
          })),
        ];
      });

      await SalaryHistory.bulkCreate(salaryRecords, { transaction });
      console.log(
        `Seeded ${Math.min(
          offset + batch.length,
          employees.length,
        ).toLocaleString(
          "en-US",
        )} / ${employeeCount.toLocaleString("en-US")} employees.`,
      );
    }
  });

  console.log("Database seed completed.");
}

void main()
  .catch((error: unknown) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
