# SpillBill Sequence-Diagram Black-Box and White-Box Test Design

## Intent

Create executable tests derived from `sequence-diagram-spillbill.drawio`. Cover every sequence flow, every `alt` branch, domain rule, persistence boundary, and visible UI result. Tests become the acceptance gate for replacing frontend demo state with MySQL-backed behavior.

## Current State

- Backend: native Node HTTP server; only `/health` and `/health/db` routes exist.
- Database: MySQL schema and local seed exist.
- Frontend: React UI uses local demo arrays and local component state; CRUD does not persist to API.
- Existing checks: backend health/config tests; frontend domain assertions; browser smoke coverage.
- Therefore the new API/persistence tests are expected to fail initially. That RED result is intentional.

## Goals

- Black-box API tests for observable HTTP behavior and lifecycle rules.
- Black-box Playwright tests for user-visible sequence flows and alternate branches.
- White-box unit tests for validation, role permissions, state transitions, totals, filtering, and action availability.
- White-box database integration tests for FK, CHECK, trigger, invoice/payment lifecycle, soft-delete, and audit invariants.
- Trace every test to a diagram sequence and branch.

## Non-goals

- Load/stress testing.
- Visual pixel regression.
- Production authentication hardening beyond behavior required by the login sequence.
- Testing MySQL internals not used by SpillBill.
- Replacing the sequence diagram.

## Constraints

- Node native test runner for backend; no new framework unless existing tooling cannot express the test.
- Raw SQL + `mysql2`; no ORM.
- Playwright MCP for live browser tests where available; otherwise local Playwright runner.
- Tests use isolated records/database fixtures. Never mutate user seed data permanently.
- Credentials remain in `.env`; no secrets in tests or committed fixtures.

## Approaches

### A. Test-first executable suite - selected

Write failing API, browser, unit, and database tests from the diagram; implement the smallest behavior until green. Best fit because the current backend CRUD is absent and frontend persistence is still mock-based.

### B. Existing-behavior smoke tests

Only test current mock UI and health endpoints. Fast, but cannot prove the diagram's controller/entity flows or MySQL persistence.

### C. Documentation-only matrix

Produce a test-case catalogue without automation. Useful as a checklist, but gives no regression gate.

## Test Layers

### Black-box API

Use HTTP requests against a running app. Assert status, JSON contract, authorization result, persisted state, audit record, and lifecycle error. No internal function calls.

Planned resource groups:

- `POST /auth/login`
- `GET/POST/PATCH/DELETE /customers`
- `GET/POST/PATCH/DELETE /products`
- `GET/POST/PATCH/DELETE /sales-orders`
- `GET/POST/PATCH/DELETE /invoices`
- `GET/POST/PATCH/DELETE /payments`
- `GET /histories`

Exact route names remain a builder call if implementation has not yet established them; tests must use one consistent REST contract once selected.

### Black-box browser

Playwright tests real user-visible behavior:

- Login Sales and Finance.
- Required-field and invalid-credential errors.
- Role-based navigation.
- List/detail/form/modal behavior.
- Save success/error, cancel, confirmation yes/no.
- Print preview.
- Reload persistence.
- Console errors and failed API requests.

### White-box application

Test exported pure functions and small domain services directly. Cover decision branches, boundary values, invalid states, and state transition guards. Avoid asserting React implementation details.

### White-box database

Run against an isolated MySQL database loaded from `database/schema.sql`. Assert constraints/triggers through SQL operations, not by trusting application validation.

## Sequence Traceability Matrix

### SD-01 Login

| ID | Branch/behavior | Black-box | White-box |
|---|---|---|---|
| LG-01 | Login page/form appears | Browser | - |
| LG-02 | Valid Sales credentials load Marketing session/dashboard | API + browser | credential/role mapping |
| LG-03 | Valid Finance credentials load Accounting session/dashboard | API + browser | credential/role mapping |
| LG-04 | Empty username rejected | Browser + API | input validation |
| LG-05 | Empty password rejected | Browser + API | input validation |
| LG-06 | Unknown user/wrong password rejected; no session | Browser + API | credential branch |
| LG-07 | Inactive user rejected | API | active-state branch |
| LG-08 | Protected route without session rejected | API + browser | authorization guard |
| LG-09 | Logout clears session and protected access | Browser + API | session transition |

### SD-02 Manage Customers

| ID | Branch/behavior | Black-box | White-box |
|---|---|---|---|
| CU-01 | Open customer page and list records | API + browser | query mapping |
| CU-02 | Add customer with complete data succeeds | API + browser | validation |
| CU-03 | Edit customer with complete data succeeds | API + browser | update mapping |
| CU-04 | Missing required customer data rejected; no row written | API + browser | completeness branch |
| CU-05 | Detail action returns correct customer | API + browser | detail mapping |
| CU-06 | Delete confirmation = yes archives/removes according to policy | API + browser | delete transition |
| CU-07 | Delete confirmation = no preserves row | Browser | no-op branch |
| CU-08 | Duplicate/invalid customer data rejected | API | DB/application constraint |
| CU-09 | Customer with dependent SO cannot violate FK/audit rules | API + DB | referential behavior |

### SD-03 Create Invoice from Sales Order

| ID | Branch/behavior | Black-box | White-box |
|---|---|---|---|
| IN-01 | Open invoice list | API + browser | query mapping |
| IN-02 | Draft SO selected and invoice input/edit displayed | API + browser | eligibility rule |
| IN-03 | Matching invoice data succeeds | API + browser | total/snapshot validation |
| IN-04 | Mismatched/invalid invoice data rejected; no partial write | API + browser | consistency branch |
| IN-05 | Print invoice loads correct data and preview | API + browser | printable projection |
| IN-06 | Delete invoice confirmation = yes archives/removes safely | API + browser | lifecycle guard |
| IN-07 | Paid invoice cannot be edited/deleted | API + browser | immutable-after-payment rule |
| IN-08 | One SO cannot receive a second invoice | API + DB | uniqueness/trigger |
| IN-09 | Invoice details preserve product snapshot | API + DB | snapshot invariant |

### SD-04 Create Sales Order

| ID | Branch/behavior | Black-box | White-box |
|---|---|---|---|
| SO-01 | Open SO list | API + browser | query/filter mapping |
| SO-02 | Complete customer/product data creates SO | API + browser | validation + total |
| SO-03 | Missing customer rejected with warning; no row written | API + browser | lookup branch |
| SO-04 | Missing/inactive product or invalid stock rejected with warning | API + browser | product/stock branch |
| SO-05 | Cancel input/edit returns list without mutation | Browser | no-op branch |
| SO-06 | Edit draft SO succeeds | API + browser | editable-state branch |
| SO-07 | Invoiced SO cannot be edited | API + browser | locked-state branch |
| SO-08 | Delete confirmation = yes archives/removes draft SO | API + browser | delete transition |
| SO-09 | Delete confirmation = no preserves SO | Browser | no-op branch |
| SO-10 | SO item quantity boundary: zero/negative/fractional invalid | API + white-box | boundary validation |

### SD-05 Record Payment

| ID | Branch/behavior | Black-box | White-box |
|---|---|---|---|
| PY-01 | Open payment history | API + browser | query mapping |
| PY-02 | Valid payment form input shown | Browser | form validation |
| PY-03 | Amount within remaining invoice balance succeeds | API + browser | amount rule |
| PY-04 | Successful payment updates invoice status and remaining balance | API + DB | state transition |
| PY-05 | Valid nominal but persistence failure returns error and rolls back | API + DB fault injection | transaction behavior |
| PY-06 | Amount over remaining balance rejected with warning | API + browser | boundary rule |
| PY-07 | Amount equal to remaining balance marks invoice PAID | API + DB | exact-boundary rule |
| PY-08 | Zero/negative amount rejected | API + white-box | boundary validation |
| PY-09 | Cancel input/edit preserves payment data | Browser | no-op branch |
| PY-10 | Delete/void confirmation updates invoice balance/status safely | API + browser + DB | void transition |
| PY-11 | VOID payment cannot be edited or deleted again | API + browser | immutable void rule |
| PY-12 | Payment cannot be recorded against paid/locked invoice | API + DB | lock rule |
| PY-13 | Payment total cannot exceed invoice total under concurrent attempts | DB integration | transaction/locking invariant |

## White-Box Coverage Targets

- 100% branch coverage for validation and lifecycle guards.
- 100% decision-table rows for role/action/status combinations.
- 100% state transitions: draft → invoiced; unpaid → partially paid → paid; success → void.
- Boundary values: empty, null, zero, negative, exact remaining, remaining + 0.01, duplicate IDs/numbers.
- Existing frontend pure-function assertions retained and expanded.

## Database Invariants

- Required columns reject NULL/empty invalid values.
- Foreign keys preserve customer, product, SO, invoice, payment relationships.
- One invoice per SO.
- Invoice detail snapshots remain unchanged after product edits.
- Successful payments never exceed invoice total.
- Paid invoice locks invoice and related editable data permanently.
- VOID payment is immutable.
- Deletes use archive/soft-delete semantics where defined.
- Mutations create history rows with actor, action, entity, timestamp, and description.
- Failed multi-step operations leave no partial rows or status changes.

## Test Data

Use isolated deterministic IDs per test run. Seed reference records: active/inactive product, customer, draft SO, invoiced SO, unpaid invoice, partially paid invoice, paid invoice, SUCCESS payment, VOID payment. Generate unique business numbers to avoid collisions. Never use production data.

## Execution Order

1. Existing baseline checks.
2. White-box validation/state tests.
3. Database constraint/trigger tests.
4. API black-box tests.
5. Browser black-box flows.
6. Full regression and coverage report.

## Entry Criteria

- Diagram and approved domain rules available.
- MySQL test database reachable.
- Frontend/backend start commands documented.
- Test fixtures isolated.

## Exit Criteria

- Every matrix row executed and passing.
- No open critical/high defects.
- API and browser suites have zero unexpected console/network errors.
- White-box critical branch coverage meets target.
- Database invariants verified on clean schema.
- Traceability report records pass/fail evidence.

## Approved Decisions

- API: REST JSON.
- Error contract: `{ error: string, details?: object }`; use 400 for validation, 401 for unauthenticated, 403 for forbidden, 404 for missing resources, 409 for lifecycle/conflict violations, and 500 for unexpected failures.
- Authentication: HTTP-only cookie session; logout invalidates the session. Session expiry is a required security test.
- Roles: Sales maps to `MARKETING`; Finance maps to `ACCOUNTING`. API authorization must enforce the same route permissions as the UI.
- Delete behavior: archive/soft-delete. Historical rows remain queryable where policy permits; dependent records are never hard-deleted accidentally.
- Sales Order lifecycle: `DRAFT -> INVOICED`; invoiced orders are immutable. Cancel/archive remains available only where no invoice exists.
- Invoice lifecycle: `UNPAID -> PARTIALLY_PAID -> PAID`; paid invoices are permanently locked.
- Payment lifecycle: `SUCCESS -> VOID`; VOID payments are immutable. Voiding recalculates invoice paid/remaining/status and may reopen an invoice when balance remains.
- Stock: no stock decrement/reservation in this iteration because `products` has no quantity field. Product existence and active status are validated.
- Concurrency: payment and invoice mutations use transactions with row locks; concurrent successful payments cannot exceed invoice total.
- Invoice matching: invoice details must derive from the selected SO; product snapshot, quantity, and unit price must match the SO at creation. Invoice number/date/due date/note may differ within validation rules.
- Audit: every mutation records actor, action, entity type, entity ID, timestamp, and description in `histories`.
- Test DB: isolated disposable schema per integration run, deterministic fixtures, cleanup in `finally`; no user seed mutation.

## Explicit Gap

The diagram contains controller/entity operations not yet represented by backend routes. The first implementation pass therefore writes tests that fail for missing routes/persistence. No production behavior should be added before observing those RED failures.
