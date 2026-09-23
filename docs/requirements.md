# Salary Management MVP — Requirements

## Goal

Enable an ACME HR Manager to find employees, inspect compensation, record salary changes, and understand current pay by department and currency through a web application instead of spreadsheets.

## Scope

The first increment delivers a React dashboard, employee directory, employee detail panel, salary-history view, and salary-revision form. The Express API supplies a health check, dashboard analytics, paginated/filterable employees, employee detail, salary history, and salary-revision creation. The application currently uses a five-record in-memory repository so UI and API behaviour can be built and tested without waiting for database provisioning.

The production data store is AWS RDS for PostgreSQL. The backend follows MVC: route modules map HTTP endpoints; controllers own request/response concerns; services hold salary/query logic; models encapsulate persistence. `DATABASE_URL` is configured for the RDS connection, and a PostgreSQL pool factory is in place. The next increment replaces the temporary model with parameterised PostgreSQL queries, migrations, and integration tests.

## Key rules

Salary is an integer number of minor currency units in the API to avoid floating-point errors. A salary revision requires a positive amount, a three-letter currency code, and an ISO date. Revision history is append-only; the latest revision is current salary. Aggregations preserve currency boundaries—salaries are never summed across currencies.

## Deliberately deferred

AWS RDS provisioning, migrations, authentication, role-based access control, audit-user identity, 10,000-employee seed data, Excel import/export, payroll tax/benefit calculations, currency conversion, approvals, and deployment/video. These are important but separate concerns; deferring them lets the initial component/API contract be reviewed before making database and infrastructure decisions permanent.
