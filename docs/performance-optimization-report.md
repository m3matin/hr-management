# Performance Optimization Report

**Implementation date:** 2026-09-25  
**Related audit:** [`docs/performance-audit.md`](./performance-audit.md)

## 1. Performance Audit Summary

| Area                      |                           Issues audited |           Fixed | Remaining                             |
| ------------------------- | ---------------------------------------: | --------------: | ------------------------------------- |
| React/rendering           |                                        7 |               7 | 0 high-confidence normal-path issues  |
| API/network               |                                        5 |               3 | 2 deployment/data-freshness decisions |
| MongoDB                   | 0 (not used; PostgreSQL is the database) |               0 | 0                                     |
| PostgreSQL/database       |                                        5 |               2 | 3 plan/migration decisions            |
| Node.js/Express           |                                        4 |               1 | 3 deployment/security follow-ups      |
| Caching                   |                                        2 | 0 intentionally | 2 sensitive-data policy decisions     |
| Bundle/loading            |                                        2 |               2 | 1 isolated Data Grid chunk warning    |
| Memory/resource lifecycle |                                        1 |               1 | 0 identified leaks                    |

The implementation intentionally favors measurable, reversible improvements. It does not add a shared cache for sensitive employee/payroll data, change API response shapes, or introduce a new query/caching architecture without database evidence.

## 2. Before/after optimizations

### Frontend route and component loading

**BEFORE:** `App.tsx` statically imported every page and the authenticated layout. The baseline build emitted one 1,505.08 kB minified JavaScript chunk (458.43 kB gzip), so login users downloaded Data Grid, Recharts, and authenticated-page code.

**AFTER:** Routes use `React.lazy` and `Suspense`. `EmployeeDataGrid` is a typed lazy boundary so the Data Grid implementation loads separately from the employee page.

**WHY:** The initial entry no longer parses authenticated-only page code. The Data Grid remains available when the employee route needs it, but is not part of the initial route payload.

**RISK:** Low. Route paths, UI behavior, and API contracts are unchanged; only loading boundaries and fallback UI were added.

**IMPACT:** The final initial entry chunk is 409.42 kB minified / 136.10 kB gzip, approximately 72.8% smaller raw and 70.3% smaller gzip than the baseline single chunk. The Data Grid is isolated in a 506.87 kB / 153.52 kB gzip chunk and the employee page is 4.41 kB / 2.07 kB gzip.

### Employee search debounce

**BEFORE:** Every search keystroke changed the request state and immediately called `GET /api/employees`.

**AFTER:** The input remains controlled and responsive, while a reusable `useDebouncedValue` hook commits the search term after 400 ms. Each effect owns an `AbortController` and cancels superseded requests.

**WHY:** A phrase typed at normal speed now creates one settled search request rather than one request per intermediate character. Cancellation prevents abandoned work and stale responses.

**RISK:** Low. The user still sees the typed value immediately, and server-side search/pagination behavior is unchanged.

**IMPACT:** Fewer list transactions, count queries, salary-history lookups, browser connections, and stale-result renders during search.

### Dashboard request separation and country debounce

**BEFORE:** Changing group or country filters invoked both `GET /api/analytics/pay-by-group` and the independent `GET /api/analytics/payroll-trend`; country changes also occurred on every keystroke.

**AFTER:** The trend request runs once per dashboard mount or explicit retry. Only the pay-group request depends on group/country filters, and country commits after the same 400 ms debounce. Both requests are cancellable.

**WHY:** The trend result cannot change when grouping or country changes, so repeating it is unnecessary. Debouncing avoids intermediate two-character requests.

**RISK:** Low. Dashboard filters, retry behavior, chart data, and endpoint parameters are preserved.

**IMPACT:** A filter interaction now avoids one redundant analytics query and avoids intermediate trend requests; cancellation reduces work during rapid changes.

### Request cancellation and stale-response protection

**BEFORE:** Employee list, dashboard, and detail effects had no `AbortSignal`. Older requests could continue and resolve after newer state.

**AFTER:** Axios GET helpers accept an internal optional `RequestOptions.signal`. Each effect creates a controller, aborts it during cleanup, ignores cancellation errors, and avoids clearing loading state for an aborted request. The employee detail retry path remains usable.

**WHY:** Aborted work no longer consumes network/server/database capacity, and late responses cannot overwrite newer filters or employee IDs.

**RISK:** Low/Medium because cancellation changes request lifecycle but not endpoint contracts or successful-response behavior.

**IMPACT:** Lower contention during rapid navigation/filtering and deterministic state updates.

### React reconciliation reductions

**BEFORE:** Data Grid columns and fallback rows were recreated on every employee-page render. Dashboard chart datasets were rebuilt during unrelated renders.

**AFTER:** Columns and the empty-row fallback are stable, employee count/group chart data are memoized, and trend chart points are normalized once per trend response. The dashboard tick formatter is module-stable.

**WHY:** The page sizes are bounded, so this is intentionally a modest optimization rather than indiscriminate memoization.

**RISK:** Low.

**IMPACT:** Fewer unnecessary Data Grid/Recharts identity changes during loading, error, and menu-state renders.

### API body-size protection

**BEFORE:** `express.json()` accepted an unbounded request body.

**AFTER:** JSON parsing is limited to 32 KB, and the error middleware maps body-parser overflow to HTTP 413.

**WHY:** Login, registration, and salary-update payloads are small; oversized requests should not consume parser memory or reach business logic.

**RISK:** Low. Legitimate application requests are unchanged; only abusive/accidental oversized bodies receive an explicit 413 response.

**IMPACT:** Bounded parser resource use and a clear failure response.

### PostgreSQL access-path indexes

**BEFORE:** The employee model had country/department and status indexes but no default name-order index. Salary history indexed employee/effective date but omitted the creation-time tie-breaker used by current-salary queries.

**AFTER:** Added model indexes:

- `employees_name_order_idx` on `(last_name, first_name, id)` for the default employee-list ordering.
- `salary_history_employee_effective_created_idx` on `(employee_id, effective_date, created_at)` for deterministic current-salary selection and analytics ordering.

The existing salary index remains for backward compatibility with existing databases. `sequelize.sync()` can create the new indexes without dropping data.

**WHY:** These fields exactly match the primary ordering predicates. The salary index avoids extra tie-breaker work when effective dates are equal.

**RISK:** Low/Medium. Indexes add storage and a small amount of write amplification, especially on salary inserts. The benefit must be confirmed with `EXPLAIN (ANALYZE, BUFFERS)` against representative data.

**IMPACT:** Expected lower sort/tie-break work for list, current-salary, and analytics queries. No live database plan was available in this run, so no measured database improvement is claimed.

## 3. Files changed

Application and test files changed for this optimization:

- `backend/src/__tests__/auth.routes.unit.test.ts`
- `backend/src/__tests__/models.unit.test.ts`
- `backend/src/app.ts`
- `backend/src/middleware/error.ts`
- `backend/src/models/employee.model.ts`
- `backend/src/models/salary-history.model.ts`
- `frontend/src/App.tsx`
- `frontend/src/api/client.ts`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/EmployeeDetailPage.tsx`
- `frontend/src/pages/EmployeesListPage.tsx`

Files added:

- `docs/performance-audit.md`
- `docs/performance-optimization-report.md`
- `frontend/src/components/EmployeeDataGrid.tsx`
- `frontend/src/hooks/useDebouncedValue.ts`

No application files were deleted.

Pre-existing worktree changes preserved and not attributed to this optimization:

- `backend/src/services/analytics.service.ts`
- `docs/new/project-overview.md` and its directory state

## 4. API endpoints and components optimized

| Endpoint/component                     | Change                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `GET /api/employees`                   | 400 ms search debounce, cancellation, stable grid definitions, new model ordering index |
| `GET /api/employees/:id`               | Request cancellation and stale-response protection                                      |
| `GET /api/analytics/pay-by-group`      | Debounced country input, cancellation, independent from trend refresh                   |
| `GET /api/analytics/payroll-trend`     | Loaded once per mount/retry rather than on every filter change; cancellation            |
| `POST /api/auth/login` and `/register` | 32 KB JSON limit and explicit 413 handling                                              |
| `App` routes                           | Lazy route modules and Suspense fallback                                                |
| `EmployeesListPage`                    | Lazy Data Grid boundary, debounce, cancellation, memoized columns                       |
| `DashboardPage`                        | Independent loading, debounce, cancellation, memoized chart data                        |
| `EmployeeDetailPage`                   | Cancellation-safe loading                                                               |

## 5. Debouncing, throttling, caching, and lazy loading

- **Debouncing added:** 400 ms reusable debounce for employee search and dashboard country input.
- **Throttling added:** None. No continuous scroll, resize, mouse, or keyboard event handler was present that justified throttling.
- **Caching added:** None for employee, salary, or analytics responses. Those payloads are sensitive and can become stale; explicit request cancellation and redundant-request removal were safer improvements.
- **Lazy loading added:** All route modules plus the Data Grid implementation wrapper.
- **Request deduplication added:** None at the shared cache layer. The dashboard avoids the known redundant trend request by separating its effects.

## 6. Verification performed

| Check                             | Result                                                  |
| --------------------------------- | ------------------------------------------------------- |
| `npm --prefix backend run build`  | Pass                                                    |
| `npm --prefix backend test`       | Pass — 3 suites, 15 tests                               |
| `npm --prefix frontend run build` | Pass — 2,046 modules; final bundle split measured above |
| `npm --prefix frontend test`      | Pass — 2 suites, 6 tests                                |
| `git diff --check`                | Pass                                                    |

The frontend build still emits a warning for the isolated 506.87 kB Data Grid chunk. This is now a route-specific cost rather than part of the initial entry chunk; no warning was suppressed.

## 7. Remaining performance issues and next steps

1. Run `EXPLAIN (ANALYZE, BUFFERS)` for employee search, list ordering, current-salary selection, and both analytics queries against a representative PostgreSQL database. Keep the new indexes only if plans and write costs justify them.
2. Run `npm --prefix backend run db:sync` in a controlled environment to create the new indexes on an existing database. The command was not run here because it changes a live schema.
3. If substring search becomes a measured bottleneck, evaluate a versioned `pg_trgm` migration rather than adding unverified indexes.
4. Confirm reverse-proxy compression before adding an application compression dependency.
5. Add targeted auth rate limiting and proxy-aware forwarded-IP handling as a separate security/deployment change.
6. Consider cursor/keyset pagination only with an explicit API/UI contract decision; it is not included here.
7. Consider a short-lived, carefully scoped server-side analytics cache or rollup only after freshness and authorization rules are defined.
8. Profile the remaining Data Grid chunk if employee-route load time becomes a priority; replacing Data Grid is not justified without measurements.
9. Profile warm Jest/Vite runs before changing test infrastructure; observed test times vary substantially with cold transforms and machine load.
