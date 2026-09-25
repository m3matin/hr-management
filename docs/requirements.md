# Salary Management MVP - Requirements

## Goal

Enable an ACME HR Manager to find employees, inspect compensation, record salary changes, and understand current pay by department and currency through a web application instead of spreadsheets.

## Scope

The MVP delivers a React dashboard, employee directory, employee detail view, append-only salary history, and a salary-revision form. The Express API provides a health check, JWT login, paginated and filterable employees, employee details, salary-revision creation, current-pay grouping, and payroll trend analytics.

PostgreSQL is the system of record. Sequelize owns model definitions, associations, parameterized service queries, and non-destructive schema synchronization. The application targets AWS RDS for PostgreSQL, but any PostgreSQL database can be used for local development.

## Data model

- `employees` stores identity, country, department, role, gender, hire date, employment status, and currency.
- `salary_history` stores append-only revisions in integer minor currency units.
- A salary history row belongs to an employee and is removed by the database's `ON DELETE CASCADE` constraint when its employee is removed.
- Current salary is the revision with the greatest effective date, with creation time as the tie-breaker.
- Employee and salary codes are unique. Employee/country/department, employee/status, and employee/effective-date indexes support the main access paths.

## Key rules

- Salary values are positive integers of minor currency units to avoid floating-point errors.
- A salary revision requires a positive amount and an ISO effective date; its currency is inherited from the employee.
- Revision history is append-only. Updating an earlier salary is represented by a new row.
- Aggregations always group by currency. Salaries are never summed or averaged across currency boundaries.
- Search input is bound into parameterized Sequelize/PostgreSQL queries. The only interpolated analytics identifiers come from a fixed server-side allowlist.

## Database operations

- `npm run db:sync` creates or updates missing tables, constraints, and indexes without dropping data.
- `npm run db:seed` synchronizes the schema and inserts a deterministic dummy dataset in one transaction.
- Seeding truncates application tables by default so repeated runs produce the same identifiers and records. Set `SEED_TRUNCATE=false` to append without clearing existing data.
- Seed size, batch size, Faker seed, reference date, and truncation behavior are configured with `SEED_*` environment variables.

## Deliberately deferred

Database-versioned migration files, AWS RDS provisioning, role-based access control, audit-user identity, Excel import/export, payroll tax and benefit calculations, currency conversion, approval workflows, and deployment automation remain outside this increment.
