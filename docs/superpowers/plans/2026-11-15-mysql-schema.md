# SpillBill MySQL Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membuat DDL MySQL 8.4 yang merepresentasikan class diagram SpillBill dengan relasi, constraint, index, view, dan proteksi transaksi.

**Architecture:** Satu file `database/schema.sql` menjadi DDL yang dapat dijalankan pada database `twizzi`. Schema memakai 9 tabel normalized, InnoDB, UUID `CHAR(36)`, foreign key, `CHECK`, generated columns, views, dan triggers. Tidak ada seed data atau password plaintext pada tahap ini.

**Tech Stack:** MySQL 8.4, raw SQL, InnoDB.

**Spec:** `docs/superpowers/specs/2026-11-15-mysql-schema-design.md`

## Global Constraints

- Database target: MySQL 8.4.
- Tabel memakai `ENGINE=InnoDB`.
- ID memakai UUID `CHAR(36)`.
- Nominal memakai `DECIMAL(15,2)`.
- Quantity memakai `DECIMAL(15,2)` dengan nilai minimal lebih besar dari nol.
- `order_date` dan `invoice_date` memakai `DATE`.
- `payment_date` dan `occurred_at` memakai `DATETIME` UTC.
- Satu sales order maksimal memiliki satu invoice.
- Satu item sales order maksimal muncul satu kali dalam satu invoice.
- Invoice detail menyimpan snapshot `product_name` dan `unit_price`.
- Invoice tetap terkunci setelah pernah menerima payment `SUCCESS`, walaupun payment kemudian `VOID`.
- User yang dihapus dapat dianonymize; actor history nullable.
- Password hanya hash Argon2id/bcrypt; tidak ada plaintext password.
- Transaksi memakai archive timestamp; hard delete transaksi tidak disediakan.

## Review Focus

- DDL bisa dijalankan ulang pada database kosong tanpa syntax error; diuji pada Task 1.
- Foreign key dan delete behavior menolak data orphan; diuji pada Task 1.
- Unique one-invoice-per-SO dan one-detail-per-item-per-invoice benar-benar enforced; diuji pada Task 1.
- Views menghitung total, paid, remaining, dan status secara konsisten setelah payment void; diuji pada Task 2.
- Trigger menolak overpayment dan perubahan transaksi yang sudah terkunci; diuji pada Task 2.

---

### Task 1: Create normalized MySQL tables

**Files:**
- Create: `database/schema.sql`
- Create: `database/schema.test.sql`

**Interfaces:**
- Produces tables: `users`, `customers`, `products`, `sales_orders`, `sales_order_items`, `invoice_headers`, `invoice_details`, `payments`, `histories`.
- Produces constraints and indexes required by Task 2 views/triggers.

- [ ] **Step 1: Write the failing SQL verification script**

Create `database/schema.test.sql` that:

- selects the active MySQL version;
- checks the nine expected tables from `information_schema.tables`;
- checks each table uses `InnoDB`;
- checks expected foreign keys from `information_schema.key_column_usage`;
- attempts invalid inserts for negative money, zero quantity, invalid enum values, missing foreign keys, duplicate order number, duplicate invoice number, duplicate invoice per sales order, and duplicate invoice detail per order item;
- treats each rejected statement as a pass and any accepted invalid statement as a failure.

Use a test database separate from `twizzi` when running the script. Do not drop or mutate the user's existing database.

- [ ] **Step 2: Run the verification before implementation**

Run against a disposable MySQL test database:

```powershell
mysql -h 127.0.0.1 -P 3306 -u root -p < database/schema.test.sql
```

Expected: FAIL because `database/schema.sql` and tables do not exist.

- [ ] **Step 3: Implement base DDL**

Create `database/schema.sql` with:

- `SET NAMES utf8mb4` and UTC session setup;
- `CREATE TABLE` statements in dependency order;
- `CHAR(36)` primary keys;
- `created_at`, `updated_at`, `archived_at` where relevant;
- `retention_expires_at` for users, customers, histories, invoices, and payments;
- `created_by_user_id` on `sales_orders`;
- `customer_id` on `sales_orders`;
- `product_id`, product snapshot name, quantity, and unit price on `sales_order_items`;
- `sales_order_id UNIQUE` on `invoice_headers`;
- invoice date, due date, status, and lock timestamp on `invoice_headers`;
- invoice detail snapshot fields plus `UNIQUE(invoice_id, sales_order_item_id)`;
- payment invoice FK, number, date, amount, method, status, reference, and void timestamp;
- nullable `actor_user_id` on `histories` with `ON DELETE SET NULL`;
- `CHECK` constraints for numeric values and enum-like columns;
- `ON DELETE RESTRICT` for transactional relationships.

- [ ] **Step 4: Run the base verification**

Run the disposable database verification again.

Expected: table, engine, foreign key, type, and uniqueness checks PASS; view/trigger checks remain pending.

- [ ] **Step 5: Commit base DDL**

```powershell
git add database/schema.sql database/schema.test.sql
git commit -m "feat: add SpillBill MySQL relational schema"
```

### Task 2: Add views and transaction protections

**Files:**
- Modify: `database/schema.sql`
- Modify: `database/schema.test.sql`

**Interfaces:**
- Produces view `sales_order_summary`.
- Produces view `invoice_summary`.
- Produces triggers for SO lifecycle, invoice lifecycle, and payment lifecycle.

- [ ] **Step 1: Add failing view and trigger checks**

Extend `database/schema.test.sql` to verify:

- `sales_order_summary` returns order total from item rows;
- `invoice_summary` returns invoice total, successful paid amount, remaining amount, and derived status;
- an invoice cannot be created for a cancelled SO;
- a sales order with no items cannot be invoiced;
- SO/item business updates fail after invoice creation;
- invoice business updates fail after the first successful payment;
- overpayment fails;
- `SUCCESS -> VOID` succeeds;
- `VOID -> SUCCESS` fails;
- VOID payment update/delete fails;
- invoice archive fails when the invoice is paid;
- SO status transition accepts only `DRAFT -> INVOICED` or `DRAFT -> CANCELLED`.

- [ ] **Step 2: Run the new checks before implementation**

Run the disposable database verification.

Expected: FAIL because views and triggers are missing.

- [ ] **Step 3: Implement views**

Add:

- `sales_order_summary` aggregating `sales_order_items.line_total`.
- `invoice_summary` joining invoice headers, details, and successful payments.
- Derived status rules: `PAID` when remaining is zero, `PARTIALLY_PAID` when paid is positive, `OVERDUE` when due date has passed with remaining balance, otherwise `UNPAID`.
- Use explicit column lists; no `SELECT *`.

- [ ] **Step 4: Implement triggers**

Add MySQL triggers using `SIGNAL SQLSTATE '45000'` with stable messages:

- reject invoice creation from cancelled/empty SO;
- reject SO status transitions outside the approved lifecycle;
- reject SO/item mutation after invoice creation;
- set SO status to `INVOICED` when invoice is created;
- reject invoice business mutation after `first_successful_payment_at` is set;
- reject successful payment that exceeds invoice total;
- reject payment transitions other than `SUCCESS -> VOID`;
- reject any update/delete of a VOID payment;
- set `first_successful_payment_at` on first successful payment;
- prevent archiving a paid invoice.

- [ ] **Step 5: Run all SQL verification**

Run:

```powershell
mysql -h 127.0.0.1 -P 3306 -u root -p < database/schema.test.sql
```

Expected: all table, view, constraint, and trigger checks PASS.

- [ ] **Step 6: Commit protections**

```powershell
git add database/schema.sql database/schema.test.sql
git commit -m "feat: enforce SpillBill invoice and payment rules"
```

### Task 3: Validate against the local `twizzi` connection

**Files:**
- Modify: `backend/README.md`
- Create: `database/README.md`

**Interfaces:**
- Documents safe execution against local MySQL and disposable test database.
- Does not include or print password values.

- [ ] **Step 1: Document execution commands**

Add commands for:

```powershell
mysql -h 127.0.0.1 -P 3306 -u root -p twizzi < database/schema.sql
```

Also document the safer first run against a separate test database and the required backup before applying DDL to a non-empty database.

- [ ] **Step 2: Run final checks**

Run:

```powershell
npm test --prefix backend
npm run check --prefix frontend
git diff --check
```

Then run the SQL verification against the disposable database. Do not claim the live `twizzi` schema was changed unless the user explicitly requests execution.

- [ ] **Step 3: Commit documentation**

```powershell
git add backend/README.md database/README.md
git commit -m "docs: document SpillBill MySQL schema setup"
```

## Self-review

- Class diagram classes map to all nine tables.
- Diagram's `SalesOrder -> InvoiceHeader 0..*` is intentionally overridden by the approved business rule: one invoice per sales order.
- The plan does not include seed data, API CRUD, frontend migration, or executing DDL on live `twizzi` without explicit request.
- SQL uses parameterized API queries later; schema itself contains no dynamic SQL or secrets.
