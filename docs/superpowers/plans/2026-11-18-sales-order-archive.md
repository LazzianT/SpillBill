# Sales Order Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan aksi Hapus untuk SO Draft yang mengarsipkannya, bukan menghapus permanen.

**Architecture:** Tambah `DELETE /sales-orders/:id` dan repository archive atomik, ditolak untuk status selain DRAFT serta jika SO memiliki invoice. UI tampilkan aksi hanya pada Draft dengan konfirmasi dan muat ulang data.

**Tech Stack:** Node.js, MySQL, React, TypeScript, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-18-sales-order-archive-design.md`

## Global Constraints

- Hanya SO berstatus DRAFT dan belum punya invoice dapat diarsipkan.
- Arsip memakai `archived_at`; record dan history dipertahankan.
- History aksi `ARCHIVE` dibuat dalam transaksi yang sama.
- ID tidak valid menghasilkan 400; SO yang tak dapat diarsipkan menghasilkan 409.
- Invoiced/Canceled tidak ditawari aksi Hapus.

## Review Focus

- Status berubah setelah lock: update bersyarat harus menolak dan rollback.
- SO punya invoice yang diarsipkan: tetap tak boleh mengarsipkan SO.
- Kegagalan insert history: arsip SO harus rollback.
- Pengguna accounting tidak boleh memanggil DELETE; route tetap mengikuti writer Marketing.
- Daftar hasil filter/pagination harus valid setelah SO diarsipkan dan data dimuat ulang.

---

### Task 1: Endpoint repository archive

**Files:**
- Modify: `backend/src/repositories.js`
- Modify: `backend/src/app.js`
- Test: `backend/test/repositories.test.js`
- Test: `backend/test/app.test.js`

**Interfaces:** Tambah `salesOrderRepository.archive(pool, actor, id)` dan dukung `DELETE /sales-orders/:id` dengan respons `{ archived: true }`.

- [ ] Tulis test repository: Draft tanpa invoice diarsipkan, history ARCHIVE dibuat, transaksi commit.
- [ ] Tulis test penolakan ID invalid (400), SO tak tersedia/berinvoice (409), serta rollback jika history gagal.
- [ ] Jalankan test terkait dan pastikan gagal karena fungsi/route belum tersedia.
- [ ] Implementasi archive dengan validasi UUID, transaksi, lock row Draft tanpa invoice, update archived_at bersyarat, insert history ARCHIVE; rollback pada kegagalan.
- [ ] Tambah route DELETE; pastikan role Marketing diizinkan dan Accounting ditolak.
- [ ] Jalankan `npm test` dari `backend`; pastikan lulus.

### Task 2: Tombol hapus dan konfirmasi

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:** `SalesOrderPage` menerima callback arsip, mengirim order Draft terpilih; pemanggil melakukan DELETE lalu `loadData()`.

- [ ] Buat konfirmasi UI eksplisit untuk SO terpilih; batal tidak memanggil backend.
- [ ] Tambahkan tombol Hapus hanya untuk DRAFT; status INVOICED/CANCELLED tidak menampilkan tombol.
- [ ] Konfirmasi menjalankan `DELETE /sales-orders/:id`, menutup dialog dan reload; tampilkan error bila gagal.
- [ ] Verifikasi frontend dengan `npm run build`, `npm run check`; cek role, modal konfirmasi, sukses/error, dan pagination setelah reload.
