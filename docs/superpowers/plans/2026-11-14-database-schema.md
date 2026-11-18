# SpillBill SQLite Database Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membuat schema SQLite persisten untuk user, pelanggan, produk, sales order, invoice, pembayaran, dan audit log SpillBill.

**Architecture:** Satu file `database/schema.sql` berisi DDL, indexes, views, triggers, dan seed demo. Database memakai UUID/text ID, foreign key aktif, CHECK constraints, soft archive, serta trigger untuk invariant transaksi. `database/schema.test.py` memakai Python stdlib `sqlite3` untuk menguji schema tanpa dependency baru.

**Tech Stack:** SQLite 3, SQL, Python stdlib `sqlite3` untuk self-check.

**Spec:** `docs/superpowers/specs/2026-11-14-database-schema-design.md`

## Global Constraints

- Database target: SQLite pada VPS Ubuntu kecil.
- Nominal Rupiah disimpan sebagai `INTEGER`, tidak boleh negatif.
- Tanggal memakai `YYYY-MM-DD`; timestamp memakai UTC ISO.
- Status hanya memakai nilai enum yang ditentukan schema.
- SO/item terkunci setelah invoice dibuat.
- Invoice terkunci setelah pembayaran `SUCCESS` pertama.
- Status SO hanya `DRAFT -> INVOICED` atau `DRAFT -> CANCELLED`.
- SO/invoice tanpa item ditolak.
- Email pelanggan boleh kosong atau duplikat.
- Arsip memakai timestamp; transaksi tidak hard-delete.
- Retensi: invoice/payment 7 tahun, audit log 24 bulan, user/customer 24 bulan setelah tidak aktif.
- Tidak menambah dependency frontend/backend pada tahap schema.

## Review Focus

- Foreign key ke customer/product/invoice/order harus menolak ID yang tidak ada; diuji pada Task 1.
- Status dan nominal invalid harus ditolak; diuji pada Task 1.
- SO tanpa item dan invoice tanpa item harus ditolak; diuji pada Task 2.
- Pembayaran aktif melebihi saldo invoice harus ditolak; pembayaran VOID tidak boleh diedit/dihapus; diuji pada Task 2.
- Seed demo harus menghasilkan ringkasan invoice/payment yang sama dengan data frontend; diuji pada Task 3.

---

### Task 1: Core relational tables and constraints

**Files:**
- Create: `database/schema.sql`
- Create: `database/schema.test.py`

**Interfaces:**
- Produces tables: `users`, `customers`, `products`, `sales_orders`, `sales_order_items`, `invoices`, `payments`, `activity_logs`.
- Produces helper functions in test: `connect_database()`, `apply_schema(connection)`, `expect_integrity_error(...)`.

- [ ] **Step 1: Write the failing schema checks**

Add tests that create an in-memory database from `database/schema.sql` and assert:

- all eight tables exist;
- foreign keys are enabled;
- negative product price, zero quantity, invalid role, invalid SO status, invalid invoice/payment status are rejected;
- duplicate order number and duplicate invoice number are rejected;
- duplicate invoice for one sales order is rejected;
- missing customer/product/invoice foreign keys are rejected.

- [ ] **Step 2: Run the checks before implementation**

Run:

```powershell
python database/schema.test.py
```

Expected: FAIL because `database/schema.sql` is missing.

- [ ] **Step 3: Implement the core DDL**

In `database/schema.sql`:

- Start with `PRAGMA foreign_keys = ON;`.
- Use `TEXT` UUID-style IDs as primary keys.
- Add `created_at`, `updated_at`, and relevant `retention_expires_at` columns.
- Use `archived_at` on customers, products, sales orders, and invoices.
- Use `CHECK` constraints for enums, dates, positive quantities, and non-negative money.
- Store `sales_order_items.line_total` as a generated integer column from `quantity * unit_price`.
- Keep product name and price snapshots on order items.
- Use `ON DELETE RESTRICT` for transaction relationships.
- Do not add hard-delete application helpers.

- [ ] **Step 4: Run the checks**

Run:

```powershell
python database/schema.test.py
```

Expected: core table and constraint checks PASS; view/trigger/seed checks may remain pending until later tasks.

- [ ] **Step 5: Commit the core schema**

```powershell
git add database/schema.sql database/schema.test.py
git commit -m "feat: add SpillBill SQLite core schema"
```

### Task 2: Transaction views and invariant triggers

**Files:**
- Modify: `database/schema.sql`
- Modify: `database/schema.test.py`

**Interfaces:**
- Produces view `sales_order_summary` with order total and invoice/payment summary.
- Produces view `invoice_summary` with `total`, `paid`, `remaining`, and derived status.
- Produces triggers enforcing lifecycle and payment invariants.

- [ ] **Step 1: Add failing invariant tests**

Add tests asserting:

- an empty SO cannot receive an invoice;
- an invoice cannot be created from a cancelled SO;
- SO/item update or delete after invoice creation fails;
- only `DRAFT -> INVOICED` and `DRAFT -> CANCELLED` status transitions succeed;
- an invoice business-field update after first `SUCCESS` payment fails;
- a second active payment that exceeds invoice total fails;
- a VOID payment cannot be updated or deleted;
- `VOID -> SUCCESS` fails;
- a valid `SUCCESS -> VOID` transition succeeds;
- deleting an invoice or transaction row through the schema fails when referenced.

- [ ] **Step 2: Run the invariant tests before implementation**

Run:

```powershell
python database/schema.test.py
```

Expected: FAIL for missing views/triggers or unenforced invariants.

- [ ] **Step 3: Implement views and triggers**

In `database/schema.sql`:

- Build `sales_order_summary` from item snapshots.
- Build `invoice_summary` from order items and only `payments.status = 'SUCCESS'`.
- Derive invoice status as `PAID`, `PARTIALLY_PAID`, `OVERDUE`, or `UNPAID`.
- Reject invoice creation when the SO has no items or is not `DRAFT`.
- Freeze SO and item business data once an invoice exists.
- Freeze invoice business data after the first successful payment; allow only system-maintained timestamps where needed.
- Reject payment inserts that would exceed invoice total.
- Permit only `SUCCESS -> VOID`; reject all other payment status transitions.
- Reject updates/deletes for VOID payments.
- Use `RAISE(ABORT, ...)` with stable error text for test matching.

- [ ] **Step 4: Run the invariant tests**

Run:

```powershell
python database/schema.test.py
```

Expected: all core and invariant checks PASS.

- [ ] **Step 5: Commit transaction protections**

```powershell
git add database/schema.sql database/schema.test.py
git commit -m "feat: enforce SpillBill transaction invariants"
```

### Task 3: Demo seed, indexes, retention metadata, and final verification

**Files:**
- Modify: `database/schema.sql`
- Modify: `database/schema.test.py`

**Interfaces:**
- `schema.sql` is executable on a fresh SQLite database and inserts demo rows matching current frontend domains.
- Tests verify summary totals, statuses, indexes, retention dates, and idempotent fresh execution expectations.

- [ ] **Step 1: Add failing seed and summary assertions**

Assert the seeded database contains:

- 2 users with roles `MARKETING` and `ACCOUNTING`;
- 5 customers and 4 products;
- 7 sales orders and their item rows;
- 6 invoices;
- 5 payments, including one VOID payment;
- activity rows covering create, update, archive/delete, record payment, and void payment;
- invoice summary totals/statuses matching the frontend demo: `INV-2026-001` partially paid, `INV-2026-002` paid, `INV-2026-003` overdue, `INV-2026-004` unpaid, `INV-2026-005` overdue, `INV-2026-006` partially paid;
- no seed payment exceeds its invoice;
- retention dates exist on personal-data and audit tables;
- expected lookup indexes exist.

- [ ] **Step 2: Run the seed checks before implementation**

Run:

```powershell
python database/schema.test.py
```

Expected: FAIL because seed/index/retention assertions are not complete.

- [ ] **Step 3: Add indexes and deterministic demo seed**

In `database/schema.sql`:

- Add indexes for customer name/email, product name/active, SO number/customer/status/date, item order/product, invoice number/SO/due date, payment number/invoice/status/date, and activity timestamp/actor/entity.
- Use deterministic IDs matching the current demo identifiers where useful, while keeping IDs text-based.
- Insert product snapshots into SO items so historical totals remain stable.
- Set retention dates according to the approved defaults.
- Hash demo passwords with fixed test-only bcrypt/Argon2id-compatible placeholder hashes; never insert plaintext passwords.
- Keep seed data free of real personal data.

- [ ] **Step 4: Run final verification**

Run:

```powershell
python database/schema.test.py
python -c "import sqlite3; c=sqlite3.connect(':memory:'); c.executescript(open('database/schema.sql', encoding='utf-8').read()); print(c.execute('select count(*) from invoice_summary').fetchone()[0])"
git diff --check
```

Expected: test script PASS, invoice count `6`, and no whitespace errors.

- [ ] **Step 5: Commit final schema**

```powershell
git add database/schema.sql database/schema.test.py
git commit -m "feat: add SpillBill SQLite seed and verification"
```

## Self-review

- Core tables, foreign keys, constraints, views, triggers, indexes, seed, retention metadata, and tests map to the approved spec.
- Frontend/API integration remains intentionally outside this schema task.
- No new dependency is required.
- The schema makes invalid enum values, negative money, dangling references, duplicate invoice-per-SO, overpayment, mutation of frozen transactions, and VOID payment mutation impossible through the database connection.
