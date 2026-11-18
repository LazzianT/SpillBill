# Database-backed CRUD Design

## Intent
Replace hard-coded UI records and mock login with actual MySQL-backed data across all existing pages. Secure writes and reads with backend-authenticated, role-authorized API requests.

## Goals
- Authenticate users against `users` and verify existing bcrypt password hashes.
- Issue short-lived signed bearer tokens; frontend stores them in `sessionStorage`, refresh preserves route and role, logout clears token.
- Serve live data for Dashboard, Pelanggan, Produk, Sales Order, Invoice, Pembayaran, Riwayat Aktivitas.
- Persist create/update/archive/payment actions; retain current UI role restrictions and enforce them on API.
- Record writes in `histories`; derive invoice/payment status from existing schema/views and respect triggers.
- Implement in reviewable stages, test each stage before proceeding.

## Non-goals
- No new dependency unless existing Node runtime cannot provide a safe password/token primitive; bcrypt verification must match seeded hashes.
- No fake-data fallback, new business capabilities, or schema redesign unless implementation exposes a necessary blocker.
- No permanent deletion where schema requires archive/void semantics.

## Constraints
- Existing stack: React + TypeScript, Node.js 22, native HTTP, `mysql2/promise`, MySQL 8.4.
- Roles: `MARKETING` (Sales) and `ACCOUNTING` (Finance).
- Allowed reads: pages available to each role. Writes: Marketing manages customers, products, sales orders; Accounting creates invoices and payments, can update/void payments subject to DB rules. Cross-role restrictions remain enforced server-side.
- Validate request body, identifiers, enums, dates, and amounts at API boundary; use parameterized queries and transactions for multi-table writes.
- Do not trust role/user identity from frontend or token claims without signature and expiration verification. Re-check active user/role for protected operations.
- Token signing secret is required in backend environment; missing/weak secret must fail startup. Token expires after 8 hours; production CORS origins come from explicit backend configuration.
- Payment submissions require a UUID idempotency key; duplicate retries cannot create duplicate payment/history records. Reuse the DB unique payment number with a stable key-derived value; reject same key with a different payload.

## Approaches
1. Implement all endpoints and screens in one change: fastest apparent completion, high debugging and regression risk.
2. Stage by dependencies: auth/API foundation; customers/products; sales orders; invoices/payments; dashboard/activity and final removal of remaining mocks. Recommended and selected by user for smaller testable increments.
3. Read-only API first: lowers first milestone, but leaves the explicitly requested persistence unsolved and creates temporary split-brain UI.

## Delivery stages
1. Auth foundation: password verification, signed short-lived token, authenticated identity/role, logout/session restore, CORS/error validation, tests.
2. Customers/products: live lists and detail data; create/update/archive writes plus histories; client API wiring and loading/error/empty states.
3. Sales orders: live list/summary/details; create/update/cancel workflows, atomic item writes, data-backed selectors.
4. Invoices/payments: live summaries/details, invoice issue from eligible SO, payment recording and void semantics, corresponding histories.
5. Dashboard/activity: DB-derived KPIs, charts, recent activity; remove fixture-backed page data/imports, verify every page and role.

Each stage must pass backend tests, frontend build, and focused browser/DB verification before advancing. Provide setup instructions for secret and ensure seed users can authenticate.

## Builder decisions
- Keep the current UI and route contracts; adapt API DTOs to current view models.
- Use existing DB views for aggregate totals/status where correct; use explicit queries for page lists and charts.
- Sequence implementation by dependencies; retain live data and error states rather than fallback fixtures.
- Migration/schema change only if required for safe, correct behavior; document before applying.
