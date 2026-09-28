# Jest Test Suite Audit

**Audit date:** 2026-07-26  
**Scope:** Existing `frontend/` and `backend/` Jest configuration, setup files, source-adjacent tests, mocks, fixtures, and baseline coverage.  
**Change rule observed:** No application or test code was modified during this audit.

## 1. Executive summary

The repository has two working Jest suites, but coverage is concentrated in a small number of files:

- Frontend: **2 suites / 6 tests**, covering the login page and money utilities.
- Backend: **3 suites / 15 tests**, covering selected auth route behavior, model definitions, and page-size clamping.
- There are **no frontend tests** for authentication context, protected routing, employee pages, dashboard behavior, API helpers, loading/error states, or the new debounce/cancellation paths.
- There are **no backend tests** for the authentication middleware, auth service database/fallback paths, employee controller/service behavior, analytics services, or most validation/error branches.
- There is no MongoDB/Mongoose code or `mongodb-memory-server`; the backend uses PostgreSQL with Sequelize. A MongoDB test strategy is therefore not applicable.
- There is no safe isolated database test harness. The current backend route tests mock the auth service and never establish a database connection.
- The normal test commands pass, but backend coverage report generation fails on Windows because Istanbul creates a path containing a colon/encoded Windows drive segment from the repository path with spaces.

## 2. Jest execution and installed tooling

### Frontend

- Script: `npm --prefix frontend test` → `jest --runInBand`.
- Installed Jest: **30.5.2**.
- Installed `babel-jest`: **30.5.2**.
- Installed `jest-environment-jsdom`: **30.5.2**.
- React Testing Library: **@testing-library/react 16.3.3**.
- DOM assertions: **@testing-library/jest-dom 6.9.1**.
- Runtime test libraries: React 19, React Router 7, MUI, Axios, Recharts, and MUI X Data Grid are already installed.
- TypeScript is configured separately with `tsc -b`; `allowJs` is false and JSX uses the automatic runtime.

### Backend

- Script: `npm --prefix backend test` → `jest --runInBand`.
- Installed Jest: **29.7.0**.
- Installed `ts-jest`: **29.4.13**.
- Installed Supertest: **7.3.0**.
- Runtime database: Sequelize 6 with PostgreSQL (`pg`), not MongoDB.
- The package includes a `test:integration` script, but there are currently no integration test files matching that pattern.

### Coverage commands

- `npm --prefix frontend test -- --coverage` passes and writes a frontend report.
- `npm --prefix backend test -- --coverage` executes all tests successfully, but report writing fails with an Istanbul error involving `file:/H:\MERN\HR%20Management\...` and the Windows path. The test process itself reports 3 passing suites and 15 passing tests; coverage command reliability still needs correction.

## 3. Configuration and setup audit

### Frontend Jest configuration

`frontend/jest.config.cjs`:

- Uses `jsdom` as the test environment.
- Transforms `.ts`, `.tsx`, `.js`, and `.jsx` through `babel-jest`.
- Loads `src/setupTests.ts` after the environment is installed.
- Maps CSS imports to `identity-obj-proxy`.
- Does not define `collectCoverageFrom`, coverage thresholds, custom reporters, testMatch, or module aliases for application code.
- Does not configure an API mock, router helper, AuthContext helper, or shared render utility.

`frontend/babel.config.cjs` uses:

- `@babel/preset-env` targeting the current Node version.
- `@babel/preset-react` with the automatic runtime.
- `@babel/preset-typescript`.

`frontend/src/setupTests.ts` imports `jest-dom` and polyfills `TextEncoder`/`TextDecoder`; it does not clean up local storage, reset mocks, configure match media, or install a reusable API/router harness.

### Backend Jest configuration

`backend/jest.config.cjs`:

- Uses the `ts-jest/presets/default-esm` preset.
- Uses the Node test environment.
- Treats `.ts` as ESM and maps relative `.js` import suffixes back to TypeScript files.
- Ignores ts-jest diagnostic code 151002, which is generally the ESM import-resolution diagnostic.
- Has no test database setup/teardown, coverage reporter workaround, global setup, or coverage thresholds.

`backend/tsconfig.json` is strict, NodeNext, and includes both `src/**/*.ts` and `scripts/**/*.ts`.

## 4. Current test inventory

### Frontend tests

| File                                     | What it currently tests                                                    | Quality observations                                                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/pages/LoginPage.test.tsx`  | Rejected login shows an error; typed credentials call `login`              | Uses RTL, accessible labels/buttons, and `MemoryRouter`; mocks only `useAuth`; no navigation assertion, loading/disabled state, reset behavior, or provider-level coverage |
| `frontend/src/utils/formatMoney.test.ts` | Exact major/minor conversion, invalid/unsafe input, large-value formatting | Good precision-focused unit coverage; invalid-format and fallback branches remain uncovered                                                                                |

### Backend tests

| File                                                   | What it currently tests                                                                                                         | Quality observations                                                                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/__tests__/auth.routes.unit.test.ts`       | Login validation, oversized body, wrong password, valid token, disabled registration, unauthenticated employee/analytics access | Uses Supertest and a service module mock; does not exercise the real auth service, valid-token authorization, registration success/duplicate behavior, or database errors |
| `backend/src/__tests__/employees.service.unit.test.ts` | Page-size clamping                                                                                                              | Only exercises one pure helper; no list, detail, filtering, serialization, salary append, or not-found behavior                                                           |
| `backend/src/__tests__/models.unit.test.ts`            | Sequelize table/attribute/index/association contracts                                                                           | Good schema regression coverage; does not execute database constraints or queries                                                                                         |

### Utilities, fixtures, and mocks

- No shared test utility directory was found.
- No fixture directory, `__mocks__` directory, custom Jest setup file for the backend, or integration test directory was found.
- The only explicit mock is the `jest.mock` of `frontend/src/components/AuthContext` in `LoginPage.test.tsx` and the `jest.mock` of `backend/src/services/auth.service.js` in the auth route test.
- There are no external email, SMS, AWS, payment, storage, or third-party authentication adapters to mock.
- The backend tests close the Sequelize singleton in `afterAll`; this is safe under the current single-suite serial run but should be managed carefully when more suites import the singleton.

## 5. Database testing audit

This application is not a Mongoose application:

- No `mongoose`, `mongodb`, or `mongodb-memory-server` dependency exists.
- The database is PostgreSQL accessed through Sequelize and `pg`.
- No test-specific `DATABASE_URL`, `TEST_DATABASE_URL`, transaction helper, fixture loader, or cleanup convention exists.
- The current route tests mock the service layer, so they do not read or write the database.
- The current model tests instantiate model metadata but do not authenticate, synchronize, or query PostgreSQL.

### Safe strategy before integration tests

Do not point tests at the normal `DATABASE_URL` or production credentials. A future integration suite should:

1. Require an explicit `TEST_DATABASE_URL` and fail clearly when it is absent.
2. Refuse to run if the URL points to a known non-test database unless an explicit safety flag is provided.
3. Use a dedicated schema/database and transaction rollback or explicit teardown.
4. Seed deterministic fixtures and clean them after each suite.
5. Keep ordinary unit tests database-free and fast.

MongoDB memory-server is not appropriate for this repository and should not be added.

## 6. Baseline coverage

### Frontend baseline

Command: `npm --prefix frontend test -- --coverage`

- Tests: **2 passed, 6 total**.
- Overall statements: **91.48%**.
- Overall branches: **74.07%**.
- Overall functions: **91.66%**.
- Overall lines: **91.30%**.
- `LoginPage.tsx`: 100% statements/branches/functions/lines.
- `formatMoney.ts`: 87.87% statements, 72% branches, 87.5% functions/lines.
- Uncovered format-money lines: 6, 26, and 57–62.

The high overall percentage is misleading because Jest only reports files imported by the two tests. Unimported application files are absent from the denominator. A meaningful frontend baseline needs `collectCoverageFrom` and tests for the actual application surfaces.

### Backend baseline

Command: `npm --prefix backend test -- --coverage`

- Tests: **3 passed, 15 total**.
- Overall statements: **59.85%**.
- Overall branches: **34.09%**.
- Overall functions: **28.57%**.
- Overall lines: **65.54%**.
- Models/routes are mostly covered by metadata/import tests.
- Services are the largest critical gap: employee service is approximately 25% statements and analytics service approximately 30% statements.
- Controllers, auth middleware, error middleware, auth configuration, and database bootstrap have substantial uncovered branches.
- Coverage report writing fails on the current Windows path, so the command is not a reliable verification command even though Jest tests pass.

## 7. Broken, flaky, and risky test behavior

1. **Coverage report path failure:** backend Istanbul tries to create a report path from an encoded absolute Windows path containing a colon. Fix the reporter/output configuration or use a path-safe reporter before relying on backend coverage in CI.
2. **Slow cold transforms:** frontend and backend Jest runs take substantially longer than the tiny test bodies because of Babel/ts-jest transforms and large dependency graphs. No arbitrary sleeps are currently used; profile before changing configuration.
3. **Implicit singleton lifecycle:** backend tests import the Sequelize singleton and close it in `afterAll`. More suites must avoid closing the shared connection prematurely.
4. **Environment mutation:** auth route tests mutate process environment variables and restore only `ALLOW_INITIAL_REGISTRATION`; future tests should snapshot and restore every variable they change.
5. **Insufficient isolation visibility:** no explicit database transaction or fixture cleanup exists because no database tests exist yet. Any new integration test must establish isolation before running.

## 8. Prioritized coverage plan

### Frontend — highest value first

1. `AuthContext`: successful login persistence, logout, initial local-storage token, and provider updates.
2. `ProtectedRoute` and `App`: unauthenticated redirect and authenticated route rendering without loading the heavy page graph unnecessarily.
3. `api/client`: request payloads, parameter omission, bearer token injection, 401 cleanup/redirect, and AbortSignal forwarding.
4. `EmployeesListPage`: loading, API data rendering, error/retry, debounced search, filter changes, and server pagination.
5. `EmployeeDetailPage`: loading, API error, salary form validation, successful revision, and revision failure.
6. `DashboardPage`: independent loading, parallel initial requests, filter behavior, chart data, and error/retry states.
7. `useDebouncedValue`: delayed update and timer cleanup.
8. Remaining `formatMoney` invalid-input and fallback branches.

### Backend — highest value first

1. Auth middleware: missing, malformed, invalid, expired, and valid HS256 tokens.
2. Auth service: database-user login, environment fallback, empty-table behavior, registration duplicate/closed behavior, and serialization.
3. Employee controller/service: validation, page size, search/filter query construction, current-salary serialization, not found, and salary append validation.
4. Analytics controller/service: allowlisted parameters, replacements, numeric BIGINT serialization, and database error propagation.
5. Error middleware: 404, validation/not-found errors, body-parser 413, and generic 500.
6. Model/query contracts: current index and serialization behavior, without a real database unless `TEST_DATABASE_URL` is explicitly configured.

## 9. Audit conclusion

The existing Jest installations are healthy and should remain in place. The highest-value improvement is not a framework migration or a wholesale rewrite; it is adding focused user-facing React tests and isolated backend service/controller tests while making coverage output reliable. Database integration tests should remain disabled until a dedicated test PostgreSQL strategy is explicitly configured. No production behavior or database schema should be changed as part of the test expansion.
