# Sequence Black-Box and White-Box Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock-only flow coverage with executable backend, database, API, frontend, and browser tests covering every sequence-diagram branch and approved lifecycle rule.

**Architecture:** Keep the native Node HTTP server, raw `mysql2` SQL, and React/Vite frontend. Add small backend domain modules for validation, authorization, sessions, repositories, and transactional services; expose one REST contract; migrate the frontend from demo arrays to API-backed state. Tests remain black-box at HTTP/browser boundaries and white-box only for pure rules and SQL invariants.

**Tech Stack:** Node.js 22 native test runner, `mysql2`, MySQL 8.4, React, TypeScript, Vite, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-15-sequence-blackbox-whitebox-test-design.md`

## Global Constraints

- API uses REST JSON and `{ error: string, details?: object }` errors.
- Status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 missing, 409 lifecycle/conflict, 500 unexpected.
- Authentication uses HTTP-only cookie sessions; logout invalidates; expiry is tested.
- Sales maps to `MARKETING`; Finance maps to `ACCOUNTING`.
- Deletes archive records; dependent records are never accidentally hard-deleted.
- Lifecycle: SO `DRAFT -> INVOICED`; invoice `UNPAID -> PARTIALLY_PAID -> PAID`; payment `SUCCESS -> VOID`.
- Paid invoices, invoiced SOs, and VOID payments are immutable.
- No stock decrement/reservation; validate product existence and active status only.
- Payment mutations use transactions and row locks; successful payments cannot exceed invoice total.
- Invoice details must match SO product, quantity, unit price, and snapshot.
- Every mutation writes actor, action, entity type, entity ID, timestamp, and description to `histories`.
- Test data is isolated, deterministic, disposable, and secret-free.
- No new framework or ORM.

## Review Focus

- Malformed JSON, missing content type, oversized/unknown fields return the contract without crashing: Task 3 API harness tests.
- Repeated requests and duplicate business numbers do not create duplicates: Task 4 CRUD conflict tests.
- Session cookies cannot be forged, reused after logout, or used after expiry: Task 3 authentication tests.
- Decimal money and quantity boundaries do not float-round into overpayment: Task 5 invoice/payment tests.
- Partial multi-table failure leaves no rows/status/audit residue: Task 5 transaction rollback tests.

---

### Task 1: Domain Rules and Test Fixtures

**Files:**
- Create: `backend/src/domain/validation.js`
- Create: `backend/src/domain/authorization.js`
- Create: `backend/src/domain/lifecycle.js`
- Create: `backend/test/domain.test.js`
- Create: `backend/test/fixtures.js`
- Modify: `backend/package.json` only if a test script is needed for a focused test command.

**Interfaces:**
- Produces `validateLoginInput`, `validateCustomerInput`, `validateProductInput`, `validateSalesOrderInput`, `validateInvoiceInput`, `validatePaymentInput`.
- Produces `canAccess(role, resource, action)`, `assertTransition(entity, from, to)`, `moneyToCents(value)`.
- Fixture helpers produce unique deterministic IDs/numbers and cleanup SQL callbacks.

- [ ] **Step 1: Write failing tests** for empty/null inputs, zero/negative/fractional quantities, zero/negative payments, exact remaining, overpayment, role/action matrix, and every approved lifecycle transition.
- [ ] **Step 2: Run `node --test test/domain.test.js` from `backend`; verify RED** because the modules do not exist.
- [ ] **Step 3: Implement the smallest pure validators, permission matrix, transition guards, and cent-safe money conversion.** Return structured validation details; do not access MySQL.
- [ ] **Step 4: Run the focused test; verify PASS.**
- [ ] **Step 5: Run existing backend tests; verify no regression.**

### Task 2: MySQL Integration Harness and Invariant Tests

**Files:**
- Create: `backend/test/mysql-fixtures.js`
- Create: `backend/test/schema.test.js`
- Modify: `database/schema.sql` only when a failing invariant proves the schema contradicts the approved rules.
- Modify: `backend/src/database.js` if pool/transaction helpers are required.

**Interfaces:**
- Produces `createTestDatabase()`, `withTransaction(pool, callback)`, and fixture insert/cleanup helpers.
- Test schema loading consumes `DB_*` environment variables; no credentials are committed.

- [ ] **Step 1: Write failing integration tests** for FK/CHECK constraints, one invoice per SO, invoice snapshot preservation, SO/invoice/payment locks, archive behavior, audit rows, and rollback residue.
- [ ] **Step 2: Run the integration suite against the configured disposable schema; record RED failures** for missing helpers, broken schema behavior, or unavailable routes/services.
- [ ] **Step 3: Implement only transaction/pool helpers and schema corrections required by the tests.** Keep raw SQL; use `SELECT ... FOR UPDATE` for payment mutation paths.
- [ ] **Step 4: Run `node --test test/schema.test.js`; verify PASS on a clean schema.**
- [ ] **Step 5: Run the existing database tests and schema load check.**

### Task 3: HTTP Contract, Sessions, Authentication, and Authorization

**Files:**
- Create: `backend/src/http.js`
- Create: `backend/src/session-store.js`
- Create: `backend/src/auth-service.js`
- Create: `backend/test/auth.test.js`
- Create: `backend/test/http-contract.test.js`
- Modify: `backend/src/app.js`
- Modify: `backend/src/server.js`
- Modify: `backend/src/database.js` if user/session queries need shared helpers.

**Interfaces:**
- `createApp({ pool, corsOrigin, sessionStore, sessionTtlMs })`.
- Routes: `POST /auth/login`, `POST /auth/logout`, `GET /auth/session`.
- Protected requests read `spillbill_session` HTTP-only cookie and expose `request.user` internally.
- JSON response helpers enforce `{ error, details? }` on failures.

- [ ] **Step 1: Write failing API tests** for valid Sales/Finance login, wrong credentials, inactive user, empty fields, protected access, role denial, logout, session expiry, malformed JSON, and CORS/preflight.
- [ ] **Step 2: Run `node --test test/auth.test.js test/http-contract.test.js`; verify RED** with current 404-only app.
- [ ] **Step 3: Implement cookie sessions, password verification compatible with seeded hashes, auth routes, route guards, request parsing, and centralized error responses.**
- [ ] **Step 4: Run focused tests; verify PASS.**
- [ ] **Step 5: Run all backend tests; verify PASS.**

### Task 4: Master Data and Audit CRUD

**Files:**
- Create: `backend/src/repositories/customers.js`
- Create: `backend/src/repositories/products.js`
- Create: `backend/src/repositories/histories.js`
- Create: `backend/src/services/master-data.js`
- Create: `backend/test/master-data-api.test.js`
- Modify: `backend/src/app.js`

**Interfaces:**
- Routes: `GET/POST/PATCH/DELETE /customers`, `GET/POST/PATCH/DELETE /products`, `GET /histories`.
- Mutations accept JSON objects and return persisted records; DELETE archives using `archived_at`.
- Service writes audit rows with the authenticated actor.

- [ ] **Step 1: Write failing HTTP tests** for list/detail/create/update/archive, missing fields, duplicate/invalid values, dependent customer archive behavior, inactive product behavior, role matrix, confirmation-independent API semantics, and audit records.
- [ ] **Step 2: Run `node --test test/master-data-api.test.js`; verify RED.**
- [ ] **Step 3: Implement repositories, service validation, SQL queries, audit writes, and routes.**
- [ ] **Step 4: Run focused tests; verify PASS.**
- [ ] **Step 5: Run schema and all backend tests.**

### Task 5: Sales Orders, Invoices, Payments, and Transactional Lifecycle

**Files:**
- Create: `backend/src/repositories/sales-orders.js`
- Create: `backend/src/repositories/invoices.js`
- Create: `backend/src/repositories/payments.js`
- Create: `backend/src/services/sales-orders.js`
- Create: `backend/src/services/invoices.js`
- Create: `backend/src/services/payments.js`
- Create: `backend/test/lifecycle-api.test.js`
- Create: `backend/test/concurrency.test.js`
- Modify: `backend/src/app.js`
- Modify: `backend/src/domain/lifecycle.js` only if tests expose a missing rule.

**Interfaces:**
- Routes: `GET/POST/PATCH/DELETE /sales-orders`, `GET/POST/PATCH/DELETE /invoices`, `GET/POST/PATCH/DELETE /payments`.
- Invoice creation accepts SO ID, invoice number/date/due date, and derives details from SO rows.
- Payment creation and void are transactional; DELETE payment maps to void, never SQL DELETE.
- List/detail responses include totals, remaining balance, statuses, and printable projection data.

- [ ] **Step 1: Write failing API/integration tests** for all SO, invoice, payment matrix rows; assert no partial writes, audit rows, status transitions, immutable states, snapshot values, and exact error codes.
- [ ] **Step 2: Run `node --test test/lifecycle-api.test.js`; verify RED.**
- [ ] **Step 3: Implement repositories and services with transaction boundaries and `FOR UPDATE` locking.** Reuse Task 1 rules and Task 2 helpers; avoid duplicate business logic in routes.
- [ ] **Step 4: Run lifecycle tests; verify PASS.**
- [ ] **Step 5: Write and run concurrent payment attempts using two connections; verify at most one valid result can consume the remaining balance.**
- [ ] **Step 6: Run all backend and MySQL tests.**

### Task 6: Frontend API Adapter and Persistent State

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/api.test.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/lib/dashboard.ts`
- Modify: `frontend/src/main.tsx` only if session bootstrap requires it.

**Interfaces:**
- `apiRequest<T>(path, options?)` sends JSON, credentials, and maps API errors.
- Typed methods cover auth, customers, products, sales orders, invoices, payments, and histories.
- App state loads from API after session bootstrap; mutations invalidate/reload the affected list.

- [ ] **Step 1: Write failing adapter tests** for JSON success, cookie credentials, API error mapping, network failure, and response shape mapping.
- [ ] **Step 2: Run `npm run check` from `frontend`; verify RED for missing adapter behavior/types.**
- [ ] **Step 3: Implement the minimal typed API adapter and replace mock mutation paths with API calls.** Preserve existing visual structure and pure filters where useful.
- [ ] **Step 4: Run frontend type/check/build commands; verify PASS.**
- [ ] **Step 5: Confirm reload reads persisted records rather than demo arrays.**

### Task 7: Playwright End-to-End Sequence Coverage

**Files:**
- Create: `frontend/test/sequence.spec.ts`
- Create: `frontend/playwright.config.ts` if no existing config exists.
- Modify: `frontend/package.json` with the smallest Playwright test script/dependency setup allowed by existing tooling.
- Modify: `frontend/src/App.tsx` only for accessibility/testability defects exposed by browser tests.

**Interfaces:**
- Browser tests start backend/frontend using documented commands and use seeded credentials from environment variables only.
- Tests use visible labels/roles, not implementation selectors.

- [ ] **Step 1: Write Playwright tests** for LG-01..09, CU-01..09, IN-01..09, SO-01..10, PY-01..13; include cancel/confirmation branches, role navigation, print preview, reload persistence, console errors, and failed requests.
- [ ] **Step 2: Run the browser suite before implementation completion; verify expected RED** for API-backed flows.
- [ ] **Step 3: Fix only UI/API integration and accessibility defects required for the tests; no visual rewrite.**
- [ ] **Step 4: Run Playwright with clean fixtures; verify PASS and zero unexpected console/network errors.**
- [ ] **Step 5: Run existing frontend checks and production build.**

### Task 8: Traceability, Coverage, and Release Gate

**Files:**
- Create: `docs/superpowers/reports/2026-11-15-sequence-test-traceability.md`
- Create: `backend/test/coverage-report.js` only if native coverage output needs normalization.
- Modify: `README.md` or project command docs only if startup/test commands are undocumented.

**Interfaces:**
- Report maps every SD test ID to test file/name, command, result, and evidence.
- Verification commands remain reproducible without committed secrets.

- [ ] **Step 1: Run backend tests with branch coverage and frontend checks/build.**
- [ ] **Step 2: Run MySQL integration tests on a clean schema and browser tests against clean fixtures.**
- [ ] **Step 3: Record every matrix row as PASS, BLOCKED, or DEFECT with exact evidence; unresolved critical/high defects block completion.**
- [ ] **Step 4: Verify no credentials, seed mutations, temporary artifacts, or unrelated changes are committed.**
- [ ] **Step 5: Run the complete regression command set and save the final traceability report.**

## Self-Review

- Spec coverage: Tasks 1-2 cover white-box rules/database; Tasks 3-5 cover API/auth/lifecycle; Task 6 covers frontend persistence; Task 7 covers every sequence branch; Task 8 covers exit evidence.
- Type consistency: adapter methods consume route contracts from Tasks 3-5; frontend uses the same domain names; fixture/session helpers are shared only through explicit interfaces.
- YAGNI: no ORM, state library, visual rewrite, stock subsystem, load test, or production auth hardening beyond the approved behavior.
- Main risk: the schema's trigger semantics may conflict with service-level archive/void behavior; Task 2 must expose this before API implementation.
