# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Admin Marketing mengelola pelanggan, produk, dan Sales Order. Admin Accounting mengelola invoice dan pembayaran. Keduanya memakai dashboard sesuai role.

## Product Purpose

SpillBill membantu UMKM menjalankan alur Pelanggan -> Sales Order -> Invoice -> Pembayaran -> Lunas dalam satu aplikasi web, tanpa rekap manual. Keberhasilan utama: invoice dapat dibuat dari Sales Order dengan cepat, piutang terlihat, transaksi terkunci pada status yang tepat, dan perubahan tercatat di riwayat.

## Positioning

Order-to-Invoice untuk UMKM dengan pemisahan kerja Marketing dan Accounting, kalkulasi transaksi, penerbitan invoice, serta pelacakan pembayaran dalam satu alur.

## Operating Context

Pengguna bekerja dari browser desktop maupun layar responsif. Dashboard dipakai untuk memindai ringkasan penjualan atau keuangan lalu mengambil tindakan pada Sales Order, invoice, dan pembayaran.

## Capabilities and Constraints

- Frontend menggunakan React, Vite, TypeScript, dan Tailwind.
- Backend dipisahkan pada folder/repo backend dan belum menjadi scope redesign ini.
- Role Marketing dan Accounting membatasi menu serta aksi.
- Data demo dan copy dari `prd.md` serta `prototype.md` dipertahankan.
- Palet UI dibatasi putih, navy, dan lime beserta tint satu hue yang sudah ditentukan.
- Status transaksi selalu memiliki label teks, bukan warna saja.
- Soft delete dan riwayat aktivitas adalah aturan produk; tidak ada hard delete.
- Desktop dan mobile sama-sama menjadi target desain.

## Brand Commitments

Nama SpillBill. Arah visual dari `prd.md`, `prototype.md`, dan `image.png`: SaaS 2026 yang bersih, ringan, fleksibel, tenang, tegas secara tipografi, dengan whitespace lapang, grid rapi, dan aksen lime selektif.

## Evidence on Hand

- `prd.md`
- `prototype.md`
- `image.png`
- Existing frontend under `frontend/`
- Demo values explicitly defined in `prototype.md`

No testimonials, customer logos, or production metrics are available; do not fabricate them.

## Product Principles

1. Tugas order-to-invoice harus mudah dipindai.
2. Data keuangan harus jelas, konsisten, dan mudah dibandingkan.
3. Role membatasi akses tanpa membingungkan pengguna.
4. Status transaksi harus terlihat melalui teks dan konteks.
5. UI harus tetap usable pada desktop dan mobile.

## Accessibility & Inclusion

Interactive controls must be keyboard reachable with visible focus states. Layout must avoid horizontal overflow on mobile. Text and status communication must remain readable with WCAG AA contrast intent.
