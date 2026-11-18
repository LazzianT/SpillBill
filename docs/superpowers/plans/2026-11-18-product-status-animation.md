# Animasi Status Produk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aktifkan/nonaktifkan produk lewat API, tampilkan perubahan status dengan transisi CSS singkat.

**Architecture:** Backend memutasi `products.active` dalam transaksi dan mencatat history. Frontend memanggil API lalu memuat ulang data; perubahan status/kartu memakai CSS transition.

**Tech Stack:** Node.js, MySQL, React, TypeScript, CSS.

**Spec:** `docs/superpowers/specs/2026-11-18-product-status-animation-design.md`

## Global Constraints

- Tanpa dependency baru.
- Hormati `prefers-reduced-motion`.
- Pertahankan warna status SpillBill dan tampilkan error API.
- Produk nonaktif tidak tersedia saat membuat Sales Order.

## Review Focus

- Aktivasi produk sudah aktif: jangan tulis perubahan palsu; jawab 404/konflik.
- Nonaktivasi produk tak dikenal/diarsipkan: gagal tanpa history.
- Error API: UI tidak boleh menyamarkan kegagalan sebagai perubahan sukses.
- Reduced motion aktif: hilangkan transisi.
- Klik cepat berulang: cegah mutasi duplikat dari kontrol yang sama.

---

### Task 1: API perubahan status produk

**Files:**
- Modify: `backend/src/repositories.js`
- Modify: `backend/src/app.js`
- Test: `backend/test/repositories.test.js`
- Test: `backend/test/app.test.js`

**Interfaces:**
- Produces: `productRepository.setActive(pool, actor, id, active)`; routes `POST /products/:id/activate` dan `POST /products/:id/deactivate`.

- [ ] Tambahkan tes untuk aktivasi/nonaktivasi yang memeriksa SQL status, history, transaksi, serta status tak valid/tidak berubah.
- [ ] Jalankan tes; pastikan gagal sebelum implementasi.
- [ ] Implementasikan `setActive`; validasi ID, abaikan status sama/khususnya kembalikan 404, simpan hanya transisi nyata dan tulis history dalam transaksi. Wire kedua route dengan role Marketing yang sudah ada.
- [ ] Jalankan `node --test test/repositories.test.js test/app.test.js`; semua lulus.

### Task 2: Aksi UI dan animasi

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:** Gunakan dua route Task 1. Pertahankan `loadData()` sebagai sumber status canonical.

- [ ] Tambah aksi Nonaktifkan untuk produk aktif; aktifkan aksi Aktifkan yang sudah ada. Nonaktifkan tombol selama request, tampilkan error API.
- [ ] Beri class berdasarkan state `active`; gunakan transition opacity/warna status dan kartu singkat. Tambahkan aturan `prefers-reduced-motion: reduce`.
- [ ] Jalankan `npm run build` dan `npm run check` di `frontend`; verifikasi alur aksi secara browser bila sesi tersedia.
