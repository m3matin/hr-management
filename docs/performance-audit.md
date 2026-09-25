# Performance Audit — HR Management Application

**Audit date:** 2026-09-25  
**Scope:** Existing frontend and backend source, configuration, tests, scripts, and documentation  
**Constraint:** No application code was changed while completing this audit. The only repository state observed before implementation was the existing worktree change in `backend/src/services/analytics.service.ts` and the existing documentation addition; those changes are not attributed to this audit.

## 1. Architecture and scope reviewed

The application is a React 19 + Vite frontend backed by an Express 4 + Sequelize 6 + PostgreSQL API. The frontend uses Material UI, MUI X Data Grid, Recharts, Axios, and React Router. The backend uses MVC-style routes/controllers/services, JWT bearer authentication, Joi validation, and PostgreSQL analytics queries.

The audit covered:

- Every source file under `backend/src` and `backend/scripts`.
- Every source file under `frontend/src`.
- Package manifests, TypeScript, Vite, Jest, Babel, and environment examples.
- Backend and frontend tests.
- Architecture, requirements, AI usage, and project overview documentation.
- Current production-build output and the existing Sequelize model/index definitions.
- Repository status to avoid overwriting unrelated work.

There is no MongoDB/Mongoose code in this repository. The equivalent database review therefore covers PostgreSQL models, indexes, queries, pagination, and analytics SQL rather than MongoDB documents or aggregations.

## 2. Baseline verification

The following baseline commands were run before implementation:

| Check                             | Result | Measurement                                            |
| --------------------------------- | -----: | ------------------------------------------------------ |
| `npm --prefix backend run build`  |   Pass | TypeScript check completed successfully                |
| `npm --prefix backend test`       |   Pass | 3 suites, 14 tests; 42.228 s                           |
| `npm --prefix frontend run build` |   Pass | 2,043 modules; 1m 15s                                  |
| Frontend production bundle        |   Pass | 1,505.08 kB minified / 458.43 kB gzip, single JS chunk |
| `npm --prefix frontend test`      |   Pass | 2 suites, 6 tests; 51.834 s                            |

The Vite build emitted a non-blocking warning that the single JavaScript chunk is larger than 500 kB. This is the clearest measurable baseline performance issue.

## 3. Findings

Each finding includes the requested problem, location, explanation, expected impact, recommendation, risk, and priority.

### F-01 — All routes and heavy libraries load in the initial browser bundle

1. **Problem:** `App.tsx` statically imports every page. The initial route therefore downloads the employee Data Grid, Recharts, dashboard code, employee detail code, and login code together.
2. **File/location:** `frontend/src/App.tsx:1-7`; baseline Vite output (`dist/assets/index-*.js`).
3. **Why inefficient:** The production build transformed 2,043 modules into one 1,505.08 kB minified chunk (458.43 kB gzip). A user opening the login page pays the parsing and download cost for authenticated-only features.
4. **Expected impact:** Route-level code splitting should materially reduce the initial chunk and improve time to interactive on the login route and on slower connections. The exact reduction must be measured after implementation.
5. **Recommended solution:** Lazily load `LoginPage`, `Layout`, `EmployeesListPage`, `EmployeeDetailPage`, and `DashboardPage` with `React.lazy` and a small `Suspense` fallback. Keep route paths and element behavior unchanged. Avoid changing UI or API contracts.
6. **Risk level:** Low.
7. **Priority:** High.

### F-02 — Employee search sends one request per keystroke

1. **Problem:** Updating the search field changes `filters` immediately, which changes the `load` callback and triggers a new employee-list request on every character typed.
2. **File/location:** `frontend/src/pages/EmployeesListPage.tsx:14-18, 25-49, 114-118`.
3. **Why inefficient:** A short search term can create many identical-ish database round trips, transaction starts, count queries, and salary-history lookups. The server correctly receives the current input, but the UI does not need to query on every intermediate value.
4. **Expected impact:** A 350–500 ms debounce should reduce search traffic substantially while preserving the visible search behavior and server-side filtering.
5. **Recommended solution:** Keep an immediate input value for responsive typing, commit the search value to request state after a short debounce, and reset the page only when the committed filter changes. Cancel superseded requests where possible.
6. **Risk level:** Low.
7. **Priority:** High.

### F-03 — Dashboard country filtering refetches the independent trend endpoint

1. **Problem:** The dashboard loads both pay-group data and payroll trend data whenever `groupBy` or `country` changes. The trend query does not depend on either filter.
2. **File/location:** `frontend/src/pages/DashboardPage.tsx:42-61, 138-145`.
3. **Why inefficient:** Every country keystroke currently causes two API calls, including a repeated twelve-period analytics query that cannot change with the selected grouping or country.
4. **Expected impact:** Separating trend loading from filtered pay-group loading removes one unnecessary request per filter interaction and reduces database work and chart flicker.
5. **Recommended solution:** Load the trend once per dashboard mount (and on explicit retry), while refetching only pay-group data when `groupBy` or committed `country` changes. Do not add a shared cache for sensitive payroll data.
6. **Risk level:** Low.
7. **Priority:** High.

### F-04 — Dashboard country input also triggers requests on every keystroke

1. **Problem:** The country text field updates `country` state immediately, and `load` depends on it.
2. **File/location:** `frontend/src/pages/DashboardPage.tsx:35-40, 59-61, 138-145`.
3. **Why inefficient:** Even though the field is limited to two characters, changing the request state before the user finishes entering/clearing a country causes avoidable analytics work.
4. **Expected impact:** Debouncing or committing the two-character filter will eliminate short-lived requests and improve interaction smoothness.
5. **Recommended solution:** Use a small debounce for the country filter, or commit on blur/Enter while keeping the input controlled. The same cancellation strategy as F-02 should protect against stale responses.
6. **Risk level:** Low.
7. **Priority:** Medium.

### F-05 — In-flight API requests are not cancelled and stale responses can win races

1. **Problem:** The employee list, dashboard, and employee detail effects call async loaders without an `AbortSignal` or request-generation guard. A slower old request can resolve after a newer filter/page request and overwrite newer state.
2. **File/location:** `frontend/src/api/client.ts:19-67`; `frontend/src/pages/EmployeesListPage.tsx:25-45`; `frontend/src/pages/DashboardPage.tsx:42-61`; `frontend/src/pages/EmployeeDetailPage.tsx:57-72`.
3. **Why inefficient:** Superseded requests continue consuming browser connections, server work, and database pool capacity. They can also cause incorrect UI state and unnecessary rerenders.
4. **Expected impact:** Request cancellation reduces network/server work during rapid navigation and filtering and makes state updates deterministic.
5. **Recommended solution:** Add an optional `AbortSignal` to GET API helpers and pass Axios `signal` values from effects. Treat cancellation as a non-error, and clean up controllers in the effect cleanup function. Preserve the existing public API response shapes.
6. **Risk level:** Medium.
7. **Priority:** High.

### F-06 — Employee Data Grid column definitions and row defaults are recreated on renders

1. **Problem:** The `columns` array, value getters, render-cell function, and the fallback `[]` row array are recreated whenever the page renders.
2. **File/location:** `frontend/src/pages/EmployeesListPage.tsx:52-95, 182-184`.
3. **Why inefficient:** The page has a server-paginated maximum of 100 rows, so this is not the dominant bottleneck, but unstable column definitions can cause avoidable DataGrid work and make unrelated filter/loading renders more expensive.
4. **Expected impact:** Stable definitions can reduce column processing and callback churn, with a small but low-risk improvement on filter and loading transitions.
5. **Recommended solution:** Memoize the columns and use a stable empty-row constant. Do not add `React.memo` to the page or memoize every JSX node; the measured benefit is expected to be modest.
6. **Risk level:** Low.
7. **Priority:** Low.

### F-07 — Dashboard chart datasets are rebuilt during unrelated renders

1. **Problem:** `groupData` is rebuilt on every render, and each trend currency maps its points to a new array inside JSX.
2. **File/location:** `frontend/src/pages/DashboardPage.tsx:67-86, 262-275`.
3. **Why inefficient:** Loading, error, and menu/state transitions can recreate chart data even when the source arrays have not changed. Recharts then receives new data identities.
4. **Expected impact:** Memoization can reduce chart reconciliation work and avoid unnecessary animation/data processing, although the data set is small in the current MVP.
5. **Recommended solution:** Memoize `groupData` and normalized trend datasets from `groups` and `trend`; keep the existing `currencies` and `trendByCurrency` memoization.
6. **Risk level:** Low.
7. **Priority:** Low.

### F-08 — Employee search uses leading-wildcard ILIKE without a supporting search index

1. **Problem:** The employee service searches with `%term%` against four columns using `ILIKE`.
2. **File/location:** `backend/src/services/employees.service.ts:47-72`; `backend/src/models/employee.model.ts:64-91`.
3. **Why inefficient:** Ordinary B-tree indexes on `country`, `department`, and `status` do not accelerate a leading-wildcard search. At larger employee counts, the query can scan many rows and perform repeated case-insensitive comparisons.
4. **Expected impact:** A PostgreSQL trigram GIN/GiST strategy can make substring search responsive on large datasets, but the benefit depends on the real data distribution and should be measured with `EXPLAIN (ANALYZE, BUFFERS)`.
5. **Recommended solution:** Before adding an index, inspect production query plans and extension availability. If the workload confirms the issue, add a versioned migration that enables `pg_trgm` and creates targeted GIN indexes (likely on a normalized search expression or individual text columns). Do not add indexes blindly through startup `sync()`.
6. **Risk level:** Medium.
7. **Priority:** High for large datasets; Low/Medium for the current 10,000-row MVP.

### F-09 — Employee listing uses offset pagination and has no supporting default-order index

1. **Problem:** The list uses `OFFSET` and orders by `lastName`, `firstName`, and `id`. The model declares no index matching that ordering or a general department-only access path.
2. **File/location:** `backend/src/services/employees.service.ts:121-135`; `backend/src/models/employee.model.ts:89-105`.
3. **Why inefficient:** Deep pages cause PostgreSQL to produce and discard preceding rows. A filter on `department` alone cannot efficiently use the existing `(country, department)` index when `country` is absent. The default sort may require a sort of the candidate set.
4. **Expected impact:** A suitable composite index can reduce sorting and improve common filtered pages. Keyset pagination would improve deep navigation but would require an API/UI contract change and is intentionally deferred.
5. **Recommended solution:** Add a carefully measured index such as `(last_name, first_name, id)` for default ordering and, if query plans justify it, a department-leading index. Keep offset pagination for compatibility; evaluate cursor pagination as a separately approved API evolution.
6. **Risk level:** Medium.
7. **Priority:** Medium.

### F-10 — Current-salary index omits the creation-time tie-breaker

1. **Problem:** Both current-sality selection paths order by `effective_date DESC, created_at DESC`, while the declared index is only `(employee_id, effective_date)`.
2. **File/location:** `backend/src/models/salary-history.model.ts:57-65`; `backend/src/services/employees.service.ts:36-45, 153-160`; `backend/src/services/analytics.service.ts:44-65, 91-108`.
3. **Why inefficient:** Rows sharing an effective date may require extra index work or sorting to resolve the deterministic tie-breaker. The analytics queries also use the same ordering shape.
4. **Expected impact:** Extending the composite index to include `created_at` can make current-salary lookups and the `DISTINCT ON`/lateral queries more efficient, especially with revisions sharing dates.
5. **Recommended solution:** Define `(employee_id, effective_date, created_at)` as the replacement/expanded index and verify the query plan. The write cost is one additional indexed column and a small storage increase; no existing index fully covers the tie-breaker.
6. **Risk level:** Low/Medium.
7. **Priority:** Medium.

### F-11 — Analytics endpoints can repeat expensive full-history queries

1. **Problem:** Both analytics endpoints run uncached SQL over salary history, and the dashboard currently invokes both on every filter change.
2. **File/location:** `backend/src/services/analytics.service.ts:35-129`; `frontend/src/pages/DashboardPage.tsx:42-57`.
3. **Why inefficient:** The payroll trend performs a lateral current-salary lookup for active employees across twelve periods, and pay-group aggregation selects a current row for all employees. Repeated user interaction can repeat those scans.
4. **Expected impact:** Eliminating redundant frontend requests is immediate and low risk. A server-side cache could reduce repeat work but would introduce freshness and sensitive payroll-data concerns, so it is not an automatic fix.
5. **Recommended solution:** First implement request separation/cancellation. Measure endpoint latency and database plans. Consider a short, per-process, authenticated-request result cache or materialized rollups only after defining freshness and invalidation rules; do not cache employee/payroll data in a shared client-side cache.
6. **Risk level:** Medium/High.
7. **Priority:** Medium.

### F-12 — No explicit HTTP response compression

1. **Problem:** The Express app does not install or configure response compression.
2. **File/location:** `backend/src/app.ts:1-11`; `backend/package.json:21-30`.
3. **Why inefficient:** JSON employee and analytics responses are compressible, especially lists and chart data, but are sent without an application-level compression layer unless the deployment proxy provides one.
4. **Expected impact:** Compression can reduce transferred bytes and network time, with a small CPU cost. The actual benefit depends on the reverse proxy and response size.
5. **Recommended solution:** Confirm whether the production ingress already compresses responses. If not, evaluate the maintained `compression` middleware with conservative thresholds and test health/auth/error responses. Do not add it solely based on speculation.
6. **Risk level:** Low/Medium.
7. **Priority:** Medium.

### F-13 — Environment-admin fallback hashes the configured password on every login

1. **Problem:** When the database user table is empty, `authenticateAdmin` calls `bcrypt.hash(getAdminPassword(), 10)` and immediately compares against that new hash.
2. **File/location:** `backend/src/services/auth.service.ts:56-77`.
3. **Why inefficient:** Each fallback login performs an unnecessary password-hash operation in addition to the comparison. The fallback is local/bootstrap behavior, but repeated failed or test logins can consume CPU.
4. **Expected impact:** Caching the derived hash or using a constant-time comparison strategy for the configured development value can reduce repeated CPU work without changing the fallback contract.
5. **Recommended solution:** Lazily cache one hash promise per process, invalidate only if the process configuration changes, and retain the same bcrypt cost and fallback semantics. Do not cache user passwords or database password hashes in a shared cache.
6. **Risk level:** Low/Medium.
7. **Priority:** Low/Medium.

### F-14 — Sensitive GET responses have no explicit freshness/cache policy

1. **Problem:** The frontend has no request cache, stale-time policy, or deduplication layer. Conversely, adding a generic cache to payroll and employee data would risk exposing stale or cross-user data.
2. **File/location:** `frontend/src/api/client.ts:1-67`; all page loaders.
3. **Why inefficient:** Navigation and retries can repeat identical sensitive requests, but indiscriminate caching would be unsafe.
4. **Expected impact:** A safe in-flight request deduplication strategy could reduce duplicate concurrent work, while a short-lived cache would mainly help static reference data. The current API has no static reference endpoint.
5. **Recommended solution:** Do not introduce TanStack Query or a shared payroll cache solely for this MVP. Use cancellation and explicit request lifecycle first. Consider client-side caching only for non-sensitive, immutable/reference data after such an endpoint exists; keep employee and compensation responses uncached.
6. **Risk level:** Medium.
7. **Priority:** Medium.

### F-15 — No request body size cap or rate limiting on public auth routes

1. **Problem:** `express.json()` has no explicit size limit, and `/api/auth/login` and `/api/auth/register` have no visible rate limiter.
2. **File/location:** `backend/src/app.ts:4-6`; `backend/src/routes/auth.routes.ts:1-7`.
3. **Why inefficient:** Oversized bodies and repeated bcrypt operations can consume memory/CPU and connection capacity. This is primarily a resilience/security concern rather than a normal-path performance defect.
4. **Expected impact:** A modest JSON limit and auth rate limiting reduce abuse-driven resource consumption. A global limiter could interfere with legitimate clients and is not proposed without deployment requirements.
5. **Recommended solution:** Set a conservative JSON body limit after confirming the largest legitimate request, and add a targeted, configurable auth rate limiter at the edge or route layer. Test proxy/forwarded-IP behavior before relying on IP-based limits.
6. **Risk level:** Medium.
7. **Priority:** Medium.

### F-16 — Employee list performs a separate current-salary include query

1. **Problem:** The list query uses `separate: true` with `limit: 1` to fetch the current salary for the page. Sequelize will issue a second query for the page's employee IDs.
2. **File/location:** `backend/src/services/employees.service.ts:36-45, 121-135`.
3. **Why inefficient:** It is not an N+1 pattern—the separate include is bounded by the page size—but it still adds a query and association overhead to every list request.
4. **Expected impact:** A lateral join/raw query could reduce round trips, but the current two-query approach is clearer and safe. The benefit is not yet proven for 25–100 rows.
5. **Recommended solution:** Measure query count/latency first. Only replace it with a carefully tested lateral query or database view if the savings justify the SQL complexity and preserve current-salary ordering.
6. **Risk level:** Medium.
7. **Priority:** Low/Medium.

### F-17 — Dashboard chart conversion uses JavaScript numbers for BIGINT-backed strings

1. **Problem:** Dashboard chart values use `Number(...) / 100` for visualization, while the API intentionally exposes BIGINT values as strings to avoid precision loss.
2. **File/location:** `frontend/src/pages/DashboardPage.tsx:80-85, 270-275`.
3. **Why inefficient:** This is primarily a correctness limitation, not a CPU bottleneck. The current seed values are within chart precision, but future large values could be rounded.
4. **Expected impact:** Replacing chart values with a different representation would improve correctness but may be a larger charting/API change.
5. **Recommended solution:** Keep the current chart representation for the MVP and document the limitation. If requirements demand exact large-value charts, use a chart-compatible decimal/BigInt strategy and test it before changing contracts.
6. **Risk level:** Medium.
7. **Priority:** Low.

### F-18 — Development/test startup and Jest execution are comparatively slow

1. **Problem:** The baseline takes approximately 42 seconds for backend tests and 52 seconds for frontend tests; Vite production rendering takes about 75 seconds on this machine.
2. **File/location:** Jest/Vite configuration in `backend/jest.config.cjs`, `frontend/jest.config.cjs`, and `frontend/vite.config.ts`.
3. **Why inefficient:** The application runtime is not necessarily slow; the measurements include ESM/TypeScript transforms, MUI/Recharts module processing, and cold filesystem/tooling overhead.
4. **Expected impact:** A Jest transform/cache or dependency optimization could improve developer feedback, but changing test infrastructure has no production runtime impact and should not be conflated with application performance.
5. **Recommended solution:** Profile a warm second run before changing configuration. Keep test isolation and coverage intact; do not optimize by skipping tests or disabling type checks.
6. **Risk level:** Low.
7. **Priority:** Low.

## 4. Areas with no material issue found

- The employee table already uses server-side pagination and limits `pageSize` to 100. It does not load thousands of employees into browser state.
- MUI Data Grid is appropriate for the bounded page size; additional virtualization is not currently justified.
- Dashboard analytics requests are already issued with `Promise.all`, avoiding a frontend waterfall.
- No recurring polling, intervals, scroll handlers, resize handlers, or global event listeners were found, so there is no identified timer/listener leak.
- The existing `StrictMode` behavior is development-only and is not a production leak.
- Employee list responses are already limited to the requested page and current salary; removing fields would risk breaking the documented API contract and was not recommended.
- Authentication already restricts algorithms to HS256 and does not expose password hashes in API responses.
- `sequelize` has a bounded connection pool, and database queries bind user-provided search/country values.
- MongoDB/Mongoose-specific issues and indexes do not apply because this application uses PostgreSQL.

## 5. Prioritized implementation plan

### Batch 1 — Low-risk, measurable frontend improvements

1. Add route-level lazy loading and a minimal Suspense fallback.
2. Add a reusable debounce hook for employee search and dashboard country input.
3. Add AbortSignal support to GET API helpers and effect cleanup.
4. Avoid refetching the independent payroll trend when only dashboard filters change.
5. Stabilize Data Grid columns and memoize chart datasets only where the source arrays are unchanged.

### Batch 2 — Low/medium-risk query improvements

1. Add/verify the salary-history tie-breaker index and a measured employee ordering/filter index.
2. Use `EXPLAIN (ANALYZE, BUFFERS)` against a representative database before adding trigram indexes or changing pagination.
3. Cache the local fallback admin hash only if tests and configuration semantics remain unchanged.

### Batch 3 — Optional, deployment-dependent improvements

1. Add compression only if the reverse proxy does not already provide it.
2. Add targeted auth rate limiting and a conservative JSON body limit after deployment/security review.
3. Consider keyset pagination, server-side analytics materialization, or a carefully scoped request cache as separate architecture/API decisions.

## 6. Measurement plan

Before and after each batch, record:

- Production JS chunk sizes (raw and gzip) and initial-route chunk composition.
- Number of employee-list requests while typing a fixed search phrase.
- Number of dashboard requests for a fixed sequence of filter changes.
- Backend endpoint latency and PostgreSQL query count/plan for list, pay-group, and trend requests.
- Backend and frontend test/build exit codes.
- API response shape snapshots and existing unit tests.

No database indexes should be claimed as beneficial without a query plan and representative data. No cache should be claimed as safe without an explicit freshness and sensitivity decision.

## 7. Audit conclusion

The highest-confidence, lowest-risk improvements are route-level code splitting, debounced filter requests, cancellation of stale requests, and removal of redundant dashboard trend requests. The largest measurable current issue is the 1.5 MB single initial JavaScript bundle. Database index tuning is potentially high impact but must be plan-driven, especially for leading-wildcard search and deep pagination. The repository currently passes its baseline build and test checks, so implementation should proceed in small reversible batches with API and UI behavior preserved.
