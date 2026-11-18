# SpillBill Database Schema Design

## Intent

Memindahkan data utama SpillBill dari React local state ke SQLite di VPS Ubuntu kecil. Schema memakai relasi normal agar pelanggan, produk, sales order, invoice, pembayaran, dan audit log konsisten serta siap dipakai API Node.js.

## Goals

- Menyimpan data transaksi secara persisten.
- Menjaga relasi dengan foreign key dan constraint SQLite.
- Mencegah invoice lunas diedit/diarsipkan.
- Mencegah pembayaran VOID diedit atau dihapus.
- Mencegah total pembayaran aktif melebihi total invoice.
- Menyediakan audit log untuk perubahan penting.
- Menyimpan nominal sebagai integer Rupiah, bukan floating point.
- Menyimpan ID sebagai UUID/text opaque, bukan ID berurutan publik.

## Non-goals

- Implementasi API Node.js.
- Migrasi data local state otomatis.
- Multi-tenant atau multi-cabang.
- Inventory/stok.
- Pajak, diskon, cicilan, refund, dan attachment.
- Payment gateway.

## Approach

### Normalized relational schema (dipilih)

Tabel terpisah dengan foreign key, CHECK constraint, index, view ringkasan, dan trigger untuk invariant transaksi.

Alternatif JSON item atau satu tabel transaksi ditolak karena membuat validasi relasi, laporan, dan aturan invoice/pembayaran lebih rapuh.

## Tables

### `users`

- `id` UUID/text primary key.
- `username` unique untuk login.
- `password_hash` hanya hash Argon2id/bcrypt.
- `role` dibatasi `MARKETING` atau `ACCOUNTING`.
- `display_name`, `is_active`, timestamps.
- `retention_expires_at` untuk lifecycle data akun.

### `customers`

- `id` UUID/text primary key.
- `name` wajib.
- `email` dan `phone` opsional.
- `archived_at` untuk arsip, bukan hard delete.
- timestamps dan `retention_expires_at`.

### `products`

- `id` UUID/text primary key.
- `name` wajib.
- `price` integer Rupiah >= 0.
- `active` untuk pilihan produk baru.
- `archived_at` untuk arsip.
- timestamps.

### `sales_orders`

- `id` UUID/text primary key.
- `number` unique, misalnya `SO-2026-001`.
- `customer_id` foreign key ke `customers`.
- `order_date` ISO date.
- `status`: `DRAFT`, `INVOICED`, `CANCELLED`.
- timestamps dan `archived_at`.
- Total dihitung dari item melalui view, bukan disalin ke beberapa tempat.

### `sales_order_items`

- `id` UUID/text primary key.
- `sales_order_id` foreign key.
- `product_id` foreign key.
- `description` snapshot nama jasa/produk saat transaksi.
- `quantity` integer > 0.
- `unit_price` integer Rupiah >= 0, snapshot harga saat order.
- `line_total` generated dari `quantity * unit_price`.
- `UNIQUE(sales_order_id, product_id)` untuk mencegah item produk ganda dalam satu order.

### `invoices`

- `id` UUID/text primary key.
- `number` unique, misalnya `INV-2026-001`.
- `sales_order_id` unique foreign key; satu SO maksimal satu invoice.
- `issue_date`, `due_date` ISO date.
- `archived_at` hanya untuk invoice belum lunas.
- timestamps.
- Status, total, paid, dan remaining dihitung melalui view; status `OVERDUE` berasal dari due date dan saldo.

### `payments`

- `id` UUID/text primary key.
- `number` unique, misalnya `PAY-001`.
- `invoice_id` foreign key.
- `paid_at` ISO datetime.
- `method`: `BANK_TRANSFER`, `EWALLET`, `CASH`, `OTHER`.
- `amount` integer Rupiah > 0.
- `status`: `SUCCESS` atau `VOID`.
- `reference` opsional.
- `voided_at`, timestamps.
- Trigger menolak pembayaran aktif yang membuat total pembayaran melebihi invoice.
- Trigger menolak perubahan/penghapusan payment berstatus `VOID`.

### `activity_logs`

- `id` UUID/text primary key.
- `actor_user_id` nullable foreign key ke `users` untuk aksi sistem.
- `action`: `CREATE`, `UPDATE`, `DELETE`, `RECORD_PAYMENT`, `VOID_PAYMENT`.
- `entity_type`, `entity_id`, `description`.
- `metadata_json` opsional untuk metadata teknis non-rahasia.
- `created_at`, `retention_expires_at`.
- Tidak menyimpan password, token, request body penuh, atau data pembayaran sensitif.

## Views

### `invoice_summary`

Menghasilkan:

- invoice number dan customer.
- total dari item SO.
- paid dari payment `SUCCESS`.
- remaining = total - paid.
- status:
  - `PAID` jika remaining = 0.
  - `PARTIALLY_PAID` jika paid > 0 dan remaining > 0.
  - `OVERDUE` jika belum lunas dan tanggal jatuh tempo lewat.
  - `UNPAID` selain itu.

### `sales_order_summary`

Menghasilkan total SO dari `sales_order_items` serta remaining berdasarkan invoice/payment jika tersedia.

## Invariants enforced by database

- Foreign key selalu aktif.
- Nominal tidak boleh negatif.
- Quantity harus lebih besar dari nol.
- Enum status/method dibatasi CHECK constraint.
- Satu SO tidak boleh memiliki lebih dari satu invoice.
- Pembayaran SUCCESS tidak boleh melewati total invoice.
- Invoice dengan saldo nol tidak boleh di-update atau diarsipkan.
- Payment VOID tidak boleh di-update atau dihapus.
- Transisi payment hanya `SUCCESS -> VOID`; tidak ada `VOID -> SUCCESS`.
- Arsip memakai timestamp; hard delete transaksi tidak tersedia melalui schema API.

## Privacy and retention

- Data pelanggan hanya nama, email, dan telepon yang dibutuhkan aplikasi.
- Password disimpan sebagai hash; plaintext tidak pernah masuk database.
- Endpoint/API nanti tidak boleh mengembalikan password hash.
- `retention_expires_at` tersedia pada tabel yang memuat data personal/audit.
- Pembayaran dan invoice dipertahankan sesuai kebutuhan pajak/operasional; penghapusan dilakukan melalui kebijakan retention, bukan tombol hard delete.

## Indexes

- `customers(name)`, `customers(email)`.
- `products(name, active)`.
- `sales_orders(number, customer_id, status, order_date)`.
- `sales_order_items(sales_order_id, product_id)`.
- `invoices(number, sales_order_id, due_date)`.
- `payments(number, invoice_id, status, paid_at)`.
- `activity_logs(created_at, actor_user_id, entity_type, entity_id)`.

## Delivery artifact

Tahap berikutnya membuat `database/schema.sql` berisi PRAGMA, CREATE TABLE, indexes, views, triggers, dan seed data demo yang setara dengan data frontend saat ini. Implementasi API dan migrasi frontend dilakukan setelah schema disetujui.
