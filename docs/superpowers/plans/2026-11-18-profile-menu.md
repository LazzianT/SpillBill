# Profile Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hilangkan penggantian role dari menu profil; tampilkan info akun read-only dan aksi Keluar.

**Architecture:** Ubah popover profil yang ada di `App.tsx`; gunakan alur logout sidebar yang sudah ada. Tidak perlu dependency atau abstraksi baru.

**Tech Stack:** React, TypeScript, Node assert self-check.

**Spec:** `docs/superpowers/specs/2026-11-18-profile-menu-design.md`

## Global Constraints

- Menu hanya menampilkan info akun read-only dan Keluar.
- Tidak mengubah pemilihan role saat login atau data profil backend.

## Review Focus

- Kedua role aktif: nama akun dan label role tetap sesuai role sesi.
- Keluar dari menu profil menghapus token dan role sesi, lalu menuju login.
- Popover tetap dapat ditutup dengan Escape dan tidak menyisakan menu terbuka.

---

### Task 1: Ganti opsi role pada popover profil

**Files:**
- Modify: `frontend/src/App.tsx`

**Interfaces:** Pertahankan tombol profil, `roleLabel`, `profileOpen`, `navigate`, dan state sesi yang ada. Kontrol Keluar memakai perilaku logout sidebar yang ada.

- [ ] Periksa tombol profil dan handler logout sidebar saat ini; catat cleanup sesi dan navigasi yang harus sama.
- [ ] Ganti daftar role dalam `.profile-popover` dengan nama akun, role aktif, serta tombol Keluar.
- [ ] Samakan aksi Keluar dengan sidebar: hapus `spillbill-token` dan `spillbill-role`, kosongkan token, set autentikasi false, navigasi ke `/` dengan replace; tutup popover.
- [ ] Pastikan opsi role tidak lagi muncul di popover; role switch pada layar login tidak berubah.
- [ ] Jalankan `npm run build` dan `npm run check` dari `frontend`.
