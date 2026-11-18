# Database CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fixture-based pages and mock login with authenticated, role-enforced MySQL CRUD across SpillBill.

**Architecture:** Native Node HTTP API uses parameterized SQL, bcrypt hash verification, short-lived signed bearer tokens, server-side user/role lookup, and transactions for related writes. React consumes a typed API client and keeps bearer token in `sessionStorage`; implementation ships in independently tested dependency stages.

**Tech Stack:** Node.js 22, native HTTP/crypto, existing mysql2, React, TypeScript, MySQL 8.4, node:test.

**Spec:** `docs/superpowers/specs/2026-11-18-database-crud-design.md`

## Global Constraints

- Token lifetime: 8 hours; production allowed origins are supplied through backend configuration.
- Payment write retries require an idempotency key; a repeated key must not create a second payment.
- No fake-data fallback; API errors remain visible as errors.
- Validate request bodies, IDs, enums, dates, and amounts at trust boundaries; use parameterized SQL and transactions for multi-table writes.
- Re-check active user and role server-side; never trust frontend identity/role.
- Respect schema archive/void semantics, histories, views, and triggers.
- Add `bcryptjs` to verify the existing bcrypt seed hashes; Node `crypto` does not implement bcrypt.

## Review Focus

- Inactive user, invalid signature, expired token, wrong role → deny protected request (Task 1 tests).
- Malformed body, unknown enum, invalid date, negative amount → 400 without DB mutation (Tasks 2–5 tests).
- Duplicate payment retry key → same result, one payment/history event (Task 5 test).
- Trigger/FK/transaction failure → rollback all related writes (Tasks 3–5 tests).
- API/network failure → visible error, never fixture data (Task 2 and Task 6 tests).

---

## File Map

- Modify `backend/src/config.js`: required token secret, lifetime/origin config.
- Create `backend/src/auth.js`: password verification, token signing/verification, auth header parsing.
- Create `backend/src/repositories.js`: parameterized domain queries and transactions, grouped by existing DB entities.
- Modify `backend/src/app.js`: login route, bearer auth, role guards, REST routes, JSON errors.
- Modify `backend/src/server.js`: inject pool, auth config, idempotency storage provider if required.
- Modify `backend/test/*.test.js`; create focused auth/repository/API tests with fake pool injection; add optional DB integration test instructions.
- Create `frontend/src/lib/api.ts`: typed fetch client, token handling, error representation.
- Modify `frontend/src/lib/dashboard.ts`: data types/filter helpers only; remove fixture exports once all pages are wired.
- Modify `frontend/src/App.tsx`: login session, load/error states, data refresh, CRUD callbacks and page wiring.
- Modify `frontend/src/styles.css`: only error/loading affordances if current states lack them.

## Task 1: Backend auth foundation

**Interfaces:** `createApp({ corsOrigin, checkDatabase, pool, tokenSecret, tokenLifetimeSeconds })`; `POST /auth/login` accepts `{ username, password }`, returns `{ token, expiresAt, user: { id, username, role } }`; protected requests use `Authorization: Bearer <token>`.

- [ ] Add node tests: valid seeded bcrypt hash login yields signed token; wrong password/inactive user denied; malformed/missing/expired/tampered token denied; role comes from active DB user.
- [ ] Run `npm test` in `backend`; observe failing auth cases.
- [ ] Configure required `AUTH_TOKEN_SECRET` and 8-hour lifetime; fail startup on absent/weak secret.
- [ ] Implement auth with `node:crypto` HMAC and constant-time signature comparison; determine bcrypt verification availability from current environment. If unavailable, stop before dependency addition and report exact blocker.
- [ ] Implement `POST /auth/login`, token verification, active-user recheck, and role guard helper.
- [ ] Run `npm test` in `backend`; all auth and existing health tests pass.
- [ ] Add setup docs for secret and configured CORS origin.

## Task 2: API client and customer/product CRUD

**Interfaces:** `apiRequest<T>(path, { token, method?, body?, idempotencyKey? }) -> Promise<T>`; `GET/POST/PATCH` customer and product endpoints return UI-compatible records; archive endpoints use `archived_at`.

- [ ] Add API client tests for auth header, JSON serialization, non-2xx error parsing, and no fixture fallback.
- [ ] Add backend tests for role permissions, customer/product list/create/update/archive, validation, and parameterized query invocation.
- [ ] Implement customer and product repositories/routes with history writes; use active/non-archived filters and transaction per multi-write.
- [ ] Wire login, session restore, customer/product reads and mutations in React; show loading, error, retry, and empty states.
- [ ] Verify `npm test` backend, `npm run check` frontend, `npm run build` frontend.
- [ ] Browser/API verify both roles and unauthorized direct calls.

## Task 3: Sales orders

**Interfaces:** `GET /sales-orders`, `POST /sales-orders`, `PATCH /sales-orders/:id`; request includes customer ID, order date, item product IDs and positive quantities; cancel uses permitted status transition.

- [ ] Add tests for list mapping, validation, atomic order + items + history creation, edit draft, cancel draft, and lock after invoicing.
- [ ] Implement using `sales_order_summary`; generate UUID and unique order number server-side; transaction handles order/items/history.
- [ ] Replace hard-coded selectors and sales-order fixtures in page; refresh related data after success.
- [ ] Run backend/frontend checks and browser verify rollback on invalid item and preserved role limits.

## Task 4: Invoices and payments

**Interfaces:** `GET /invoices`, `POST /invoices` from eligible SO, `PATCH /invoices/:id` only fields permitted by schema; `GET /payments`, `POST /payments` with `Idempotency-Key`, `POST /payments/:id/void`.

- [ ] Add tests for eligible SO invoice creation, detail snapshots, due date validation, payment amount/method/date/reference validation, duplicate idempotency key, void transition, and transaction rollback.
- [ ] Implement using `invoice_summary`; write invoice header/details/history atomically; rely on DB triggers to transition order/status.
- [ ] Implement durable idempotency without schema change: require a UUID key, derive unique `payment_number` as `PAY-` plus a stable SHA-256 digest of user ID and key, then on duplicate load the existing payment; return it only if normalized request payload matches, otherwise return 409. Unique DB constraint protects concurrent retries and restarts.
- [ ] Implement payment write and void semantics with history in transaction; respect `payments` no-delete trigger and overpayment trigger.
- [ ] Wire invoice/payment lists, selectors, creation/edit/void/archive actions to API; remove fixture-backed totals.
- [ ] Run tests/build and DB-backed integration verification including duplicate retry after server restart.

## Task 5: Dashboard and activity

**Interfaces:** `GET /dashboard` returns role-authorized KPI, chart series, recent activity; `GET /histories` returns filtered audit records.

- [ ] Add query tests for date-boundary aggregates, no-data results, role authorization, stable ordering, and history filters.
- [ ] Implement aggregates from sales orders, invoice summary, payments, customers, and histories; parameterize date filters.
- [ ] Wire Dashboard and Riwayat Aktivitas; remove remaining fixture exports/imports from `App.tsx` and `dashboard.ts`.
- [ ] Verify every route displays live API data, API failure does not display mock data, and each role cannot access prohibited APIs.
- [ ] Run full `npm test` in backend, `npm run check` and `npm run build` in frontend; browser smoke test all pages and logout/reload behavior.

## Task 6: Final security and integration gate

- [ ] Run dependency audit for existing packages; no new dependency without approved blocker.
- [ ] Verify production CORS exact allowlist, secret configuration, token expiry, logout, role matrix, SQL parameterization, request bounds, and payment replay protection.
- [ ] Run complete test/build/browser/DB checks and document commands/results plus known limitations.
