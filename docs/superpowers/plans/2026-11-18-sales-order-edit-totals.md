# Sales Order Edit Totals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tampilkan subtotal tiap item dan total SO yang langsung terhitung saat produk/qty berubah.

**Architecture:** Hitung dari `productList` yang sudah dimuat di `SalesOrderPage`; subtotal hanya tampilan, server tetap sumber harga saat menyimpan. Tambah self-check kecil untuk kalkulasi.

**Tech Stack:** React, TypeScript, Node.js strip-types self-check.

**Spec:** `docs/superpowers/specs/2026-11-18-sales-order-edit-totals-design.md`

## Global Constraints
- Harga satuan read-only dan berasal dari katalog.
- Hanya SO Draft yang dapat diedit.
- Server tetap menghitung harga yang disimpan.
- Tanpa dependency baru atau endpoint baru.

## Review Focus
- Produk belum dipilih: subtotal nol; tidak ada crash.
- Kuantitas nol/invalid saat input: tampilan total tidak menjadi NaN.
- Ganti produk atau quantity: subtotal dan total langsung diperbarui.

---

### Task 1: Live item and order totals

**Files:**
- Create: `frontend/src/lib/sales-order-totals.ts`
- Create: `frontend/src/lib/sales-order-totals.test.ts`
- Modify: `frontend/src/App.tsx`

**Interfaces:** `calculateSalesOrderTotals(items: { productId: string; quantity: number }[], products: Product[]): { subtotals: number[]; total: number }`.

- [ ] Tambah self-check: harga katalog × qty per item, total penjumlahan; produk tak ditemukan/qty invalid menghasilkan subtotal nol.
- [ ] Jalankan test baru, pastikan gagal karena helper belum ada.
- [ ] Implementasikan helper kalkulasi minimal.
- [ ] Integrasikan pada form create/edit: tiap baris menampilkan harga satuan dan subtotal, footer menampilkan total akhir dengan `formatRupiah`.
- [ ] Jalankan `node --experimental-strip-types src/lib/sales-order-totals.test.ts`, `npm run build`, `npm run check`; backend regression `npm test`.
