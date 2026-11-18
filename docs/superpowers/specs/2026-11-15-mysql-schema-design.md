# SpillBill MySQL Schema Design

## Intent

Membuat DDL MySQL 8.4 berdasarkan `class-diagram-spillbill.drawio` untuk menyimpan user, customer, product, sales order, invoice, payment, dan history.

## Approach

Dipilih schema relational normalized dengan 9 tabel:

- `users`
- `customers`
- `products`
- `sales_orders`
- `sales_order_items`
- `invoice_headers`
- `invoice_details`
- `payments`
- `histories`

SQL raw menjadi source of truth. Semua tabel memakai InnoDB, UUID `CHAR(36)`, foreign key, index, dan constraint.

Alternatif JSON untuk item ditolak karena relasi, laporan, dan validasi billing lebih sulit. ORM ditunda agar DDL mudah dipahami dan langsung bisa dijalankan lewat MySQL client.

## Goals

- Mencerminkan class diagram dan multiplicity utamanya.
- Satu customer memiliki nol atau banyak sales order.
- Satu sales order memiliki minimal satu item.
- Satu sales order memiliki maksimal satu invoice (keputusan bisnis; override terhadap diagram `0..*`).
- Satu invoice memiliki minimal satu detail dan nol atau banyak payment.
- Satu payment terkait tepat satu invoice.
- Satu user memiliki nol atau banyak history.
- Menyimpan nominal sebagai `DECIMAL(15,2)`.
- Menjaga status dan relasi dengan foreign key/check/trigger.
- Mendukung soft archive tanpa hard delete transaksi.

## Domain mapping

- `User.id`, `Customer.id`, dan entity ID lain: `CHAR(36)` UUID.
- `Customer.contactInfo`: `TEXT` karena class diagram mendefinisikannya sebagai satu nilai; API dapat memformat email/telepon di level aplikasi bila diperlukan.
- `SalesOrder.customer`: `customer_id` FK.
- `SalesOrderItem.product`: `product_id` FK.
- `InvoiceHeader.salesOrder`: `sales_order_id` FK `UNIQUE`.
- `InvoiceDetail.salesOrderItem`: `sales_order_item_id` FK.
- `InvoiceDetail.product`: `product_id` FK untuk snapshot relasi.
- `Payment.invoice`: `invoice_id` FK.
- `History.actor`: `actor_user_id` FK.

## Business rules

- Sales order status: `DRAFT`, `INVOICED`, `CANCELLED`.
- Invoice status: `UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`.
- Payment method: `BANK_TRANSFER`, `EWALLET`, `CASH`, `OTHER`.
- Payment status: `SUCCESS`, `VOID`.
- Sales order hanya boleh berpindah `DRAFT -> INVOICED` atau `DRAFT -> CANCELLED`.
- Sales order dan item tidak boleh diubah setelah invoice dibuat.
- Invoice business fields tidak boleh diubah setelah payment `SUCCESS` pertama.
- Invoice tanpa detail ditolak saat dibuat melalui stored procedure/API transaction.
- Payment aktif tidak boleh membuat total pembayaran sukses melebihi total invoice.
- Payment hanya boleh berubah `SUCCESS -> VOID`; payment `VOID` tidak boleh diedit atau dihapus.
- Invoice lunas tidak boleh diarsipkan.
- Penghapusan transaksi memakai archive timestamp; FK memakai `RESTRICT`.

## Privacy and retention

- Password hanya disimpan sebagai Argon2id/bcrypt hash.
- `password_hash` tidak boleh keluar dari projection API.
- Customer hanya menyimpan contact info yang dibutuhkan aplikasi.
- Personal data memiliki `retention_expires_at`.
- Invoice/payment retention: 7 tahun.
- History retention: 24 bulan.
- Tidak ada secret atau password di SQL seed.

## Deliverable

File `database/schema.sql` berisi:

1. database session settings;
2. 9 `CREATE TABLE` statements;
3. indexes dan foreign keys;
4. views untuk invoice total, paid, remaining, dan status;
5. triggers untuk invariant yang dapat ditegakkan database;
6. tanpa seed password plaintext.

Seed demo dibuat terpisah bila dibutuhkan, agar DDL aman dijalankan pada database `twizzi` yang sudah berisi data.
