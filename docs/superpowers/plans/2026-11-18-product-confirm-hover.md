# Konfirmasi Nonaktifkan Produk dan Hover Halus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Konfirmasi aksi nonaktifkan produk dengan modal smooth; haluskan hover kartu produk.

**Architecture:** Gunakan state lokal `ProductPage` untuk produk yang menunggu konfirmasi. Reuse backdrop/modal dan `closeModalAfterTransition`; transisi hover CSS tanpa dependency.

**Tech Stack:** React, TypeScript, CSS.

**Spec:** `docs/superpowers/specs/2026-11-18-product-confirm-hover-design.md`

## Global Constraints

- Tanpa library animasi baru.
- Modal tidak memanggil API sebelum konfirmasi.
- Hormati `prefers-reduced-motion`.
- Pertahankan posisi offset kartu saat hover.

## Review Focus

- Batal/tekan Escape: modal tertutup, API tidak terpanggil.
- Konfirmasi: API dipanggil sekali, tombol nonaktif sementara request berjalan.
- Hover tiap posisi grid: transform tidak meloncat atau mengubah layout.
- Reduced motion: matikan transisi baru.
- API gagal: modal menutup atau tetap terbuka secara konsisten, error tetap terlihat.

---

### Task 1: Modal konfirmasi nonaktifkan

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:** `ProductPage` memakai callback `onSetActive(product, active)` yang sudah tersedia. Tambahkan state `productToDeactivate: Product | null`; hanya jalankan callback setelah konfirmasi.

- [ ] Perbarui aksi Nonaktifkan untuk menyimpan produk target dan membuka dialog; aksi Aktifkan tetap langsung.
- [ ] Buat dialog konfirmasi dengan tombol Batal dan Nonaktifkan; Escape/backdrop membatalkan memakai pola modal yang ada.
- [ ] Konfirmasi memanggil `changeStatus(product, false)` sekali; cegah klik ganda ketika request berjalan.
- [ ] Gunakan animasi modal yang ada, tanpa animasi baru berulang; cek reduced motion.
- [ ] Verifikasi dengan build dan cek frontend; inspeksi alur batal, Escape, submit, dan kegagalan API.

### Task 2: Hover kartu produk

**Files:**
- Modify: `frontend/src/styles.css`

- [ ] Tambahkan `transform` ke transition kartu beserta easing/durasi singkat; atur transform hover per posisi kartu agar offset awal tetap terjaga.
- [ ] Tambahkan transform hover untuk keyboard focus bila kartu memuat aksi fokus, atau pastikan tombol tetap memiliki focus ring.
- [ ] Verifikasi `npm run build` dan `npm run check` dari `frontend`; reduced-motion override tetap mematikan transisi.
