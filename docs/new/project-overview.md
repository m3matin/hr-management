# HR Management Project Overview

This document summarizes the backend and frontend created for the ACME salary-management MVP.

## Features

- Employee directory with search, country, department, and status filters.
- Server-side pagination and employee detail pages.
- Append-only salary revision history.
- Dashboard with current-pay groups and twelve-month payroll trends.
- Currency-separated analytics; values are never converted across currencies.
- JWT authentication and one-time database-backed HR user bootstrap.
- Deterministic 10,000-employee seed data.

## Stack

### Backend

Node.js, TypeScript, Express, Sequelize, PostgreSQL, JWT, bcryptjs, Joi, Faker, Jest, and Supertest.

### Frontend

React, TypeScript, Vite, Material UI, MUI X Data Grid, Recharts, Axios, React Router, Jest, and Testing Library.

The frontend uses only `.ts` and `.tsx` source files. Legacy `.jsx` files were removed so they could not shadow the TypeScript pages.

## Project Layout

```text
backend/
  scripts/
    check-db.ts
    generate-token.ts
    repair-legacy-salary-fk.ts
    seed.ts
    seed-10000.ts
    sync-db.ts
  src/
    config/auth.ts
    controllers/
    database/
    middleware/
    models/
    routes/
    services/
    __tests__/
frontend/
  src/
    api/client.ts
    components/
    pages/
    utils/
    App.tsx
    main.tsx
    types.ts
docs/new/project-overview.md
```

## Setup

Create `backend/.env` from `backend/.env.example`:

```sh
copy backend\.env.example backend\.env
```

Set at least:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
PORT=4000
NODE_ENV=development
JWT_SECRET=replace-with-a-long-random-secret
```

The frontend defaults to `http://localhost:4000` for API calls. Override it with `VITE_API_URL` in `frontend/.env` when needed.

## Run

Use two terminals.

Backend:

```sh
npm --prefix backend run dev
```

Frontend:

```sh
npm --prefix frontend run dev
```

The API listens on `http://localhost:4000`; Vite normally serves the frontend on `http://localhost:5173`.

## Database and Seed Commands

Check the connection without changing data:

```sh
npm --prefix backend run db:check
```

Create missing tables, constraints, and indexes without dropping data:

```sh
npm --prefix backend run db:sync
```

Run the configurable seed:

```sh
npm --prefix backend run db:seed
```

Seed exactly 10,000 employees according to `SEED_TRUNCATE`:

```sh
npm --prefix backend run seed:10k
```

Append 10,000 employees and salary rows without deleting existing employee/salary data:

```sh
npm --prefix backend run seed:10k:append
```

The fixed seed synchronizes first, writes in batches, creates an initial salary plus zero to three revisions per employee, writes both tables in one transaction, and preserves the `users` table.

Seed settings:

```env
SEED_EMPLOYEE_COUNT=10000
SEED_BATCH_SIZE=500
SEED_RANDOM_SEED=20260924
SEED_REFERENCE_DATE=2026-09-24
SEED_TRUNCATE=true
```

`seed:10k:append` forces `SEED_TRUNCATE=false`. `seed:10k` honors the `.env` value.

## PostgreSQL SSL

For a trusted local PostgreSQL server with a self-signed certificate:

```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

This keeps TLS encryption while allowing the local certificate. For production or AWS RDS, enable certificate verification, use a trusted CA, and use a secure `verify-full` configuration.

## Authentication

There is no permanently open public signup system. Create the first database user once:

1. Set `ALLOW_INITIAL_REGISTRATION=true` in `backend/.env`.
2. Run `npm --prefix backend run db:sync`.
3. Restart the backend.
4. Send `POST /api/auth/register` from Postman.
5. Set `ALLOW_INITIAL_REGISTRATION=false` and restart the backend.

Example:

```http
POST http://localhost:4000/api/auth/register
Content-Type: application/json
```

```json
{
  "email": "hr.admin@acme.com",
  "password": "Choose-a-strong-password"
}
```

The password must contain at least 12 characters. The first successful request returns `201`; later requests return `409`.

Login with `POST /api/auth/login` using the same email/password shape, then send the returned JWT as:

```http
Authorization: Bearer <token>
```

For local Postman testing:

```sh
npm --prefix backend run auth:token
```

This command does not create a user. The environment-configured administrator is a fallback only while the `users` table is empty; after bootstrap, login uses database credentials.

## API

| Method  | Path                           | Purpose                        |
| ------- | ------------------------------ | ------------------------------ |
| `GET`   | `/api/health`                  | Health check                   |
| `POST`  | `/api/auth/login`              | Issue JWT                      |
| `POST`  | `/api/auth/register`           | One-time first-user bootstrap  |
| `GET`   | `/api/employees`               | Paginated/filterable employees |
| `GET`   | `/api/employees/:id`           | Employee and salary history    |
| `PATCH` | `/api/employees/:id/salary`    | Append salary revision         |
| `GET`   | `/api/analytics/pay-by-group`  | Current-pay analytics          |
| `GET`   | `/api/analytics/payroll-trend` | Twelve-month trend             |

Employee filters: `page`, `pageSize`, `search`, `country`, `department`, and `status`.

Salary revision body:

```json
{
  "amountMinor": 7500000,
  "effectiveDate": "2026-09-25",
  "reason": "RAISE"
}
```

Allowed reasons: `INITIAL`, `RAISE`, `ADJUSTMENT`, `PROMOTION`. Salary history is append-only. Amounts cross the API as decimal strings because PostgreSQL `BIGINT` values can exceed JavaScript's safe-integer range.

## Frontend Routes

- `/login` — HR login
- `/employees` — employee directory
- `/employees/:id` — employee details and salary form
- `/dashboard` — compensation dashboard
- `/` — redirects to `/employees`

## Data Model

- `employees` stores identity, country, department, role, gender, hire date, status, and currency.
- `salary_history` stores integer minor-unit revisions, currency, effective date, reason, and creation time.
- `users` stores the one-time HR administrator account and bcrypt password hash.
- Salary rows belong to employees with `ON DELETE CASCADE`.
- Current salary is the latest effective revision, with creation time as tie-breaker.

## Legacy Schema Repair

Older databases may contain an accidental `salary_history_employee_id_fkey` column from an earlier association definition. If the seed reports a not-null error for that column, run:

```sh
npm --prefix backend run db:repair
npm --prefix backend run db:sync
npm --prefix backend run seed:10k
```

The repair removes only the known legacy column. The corrected model recreates the intended `employee_id` foreign key.

## Build and Tests

Backend:

```sh
npm --prefix backend run build
npm --prefix backend test
```

Frontend:

```sh
npm --prefix frontend run build
npm --prefix frontend test
```

The frontend may show a non-blocking bundle-size warning because the UI and chart dependencies are large.

## Troubleshooting

### `npm error enoent`

From the project root use:

```sh
npm --prefix backend run seed:10k
```

From `backend` use:

```sh
npm run seed:10k
```

### Self-signed certificate error

Use the local SSL settings above, then run:

```sh
npm --prefix backend run db:check
```

### Seed foreign-key error

Run `db:repair`, `db:sync`, and the seed again as shown above.

### Analytics `rows.map is not a function`

Restart the backend after code changes. The analytics service uses the direct array result returned by Sequelize `QueryTypes.SELECT`.
