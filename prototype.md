# Prototype Spec — SpillBill (untuk Google Stitch)

Dokumen ini adalah **instruksi pembuatan prototype UI**. Semua layar, menu, status, dan aturan bisnis mengikuti `prd.md` (§7 Business Rules, §14 Traceability). Prompt di bawah ditulis dalam bahasa Inggris karena Stitch paling akurat dengan instruksi Inggris; teks yang tampil di UI tetap Bahasa Indonesia.

---

## 0. Cara pakai di Stitch

1. Buat project baru, mode **Web app / Desktop**.
2. Paste **Prompt 0 (Global)** → generate shell aplikasi (sidebar + topbar + dashboard awal).
3. Lanjutkan dengan **Prompt 1..13** satu per satu, di percakapan yang sama, agar token desain konsisten. Awali setiap prompt dengan `Keep the existing design system, layout, and typography.`
4. Setelah tiap generate, cek daftar di §6 (QA sinkronisasi).
5. Ekspor frame: Login, Dashboard (2 varian role), masing-masing layar list, builder, dan detail/print.

---

## 1. Design System (wajib, jangan menambah warna lain)

```
--surface      #FFFFFF   /* primary: page background, cards, tables */
--navy-900     #0B1F3A   /* secondary: sidebar, headings, primary chart, dark buttons */
--navy-600     #3B5273   /* body text secondary */
--navy-300     #9AAABF   /* icons muted, disabled text */
--navy-100     #E3EAF3   /* borders, dividers, table header, hover */
--navy-50      #F4F7FB   /* app background behind cards, input background */
--lime-500     #C6F24D   /* accent: primary CTA, KPI highlight, active nav, success */
--lime-100     #EEFBCB   /* accent tint for badges/illustration fill only */
```

Aturan keras:
- Maksimum 3 warna: putih, navy, lime. `navy-50..600` hanya tint/shade navy. `lime-100` hanya tint lime.
- Lime tidak pernah jadi warna teks di atas putih. Teks di atas lime selalu `--navy-900`.
- Tidak ada merah/kuning/hijau tambahan. Status dibedakan lewat **teks + ikon + pola** (outline chip navy untuk netral, solid lime untuk sukses/aktif).
- Radius: kartu 16 px, input/button 10 px, chip 999 px. Border 1 px `--navy-100`. Shadow: `0 1px 2px rgba(11,31,58,.06), 0 8px 24px rgba(11,31,58,.06)`.
- Spacing scale 4/8/12/16/24/32/48/64. Konten max-width 1440 px, padding 32 px.
- Tipografi: Inter (fallback Geist). Body 14 px/1.5, label 12 px uppercase tracking .04em, H1 32 px/600, H2 20 px/600, KPI 40 px/600. Angka pakai `tabular-nums`, rata kanan di tabel.
- Grid: sidebar 248 px fixed, topbar 64 px, content 12-column, gutter 24 px.
- Ikon: outline 1.5 px, rounded, warna navy (bukan warna keempat).
- Ilustrasi: line-art 2 warna (garis `--navy-900` 20% opacity + aksen `--lime-500`), dipakai di login, empty state, dan kartu hero dashboard.

### 1.1 Navigasi global

```
Sidebar (navy-900 background, lime active indicator)
├─ Dashboard            /dashboard
├─ Pelanggan            /customers            [Marketing; Accounting read-only]
├─ Produk               /products             [Marketing]
├─ Sales Order          /sales-orders         [Marketing]
├─ Invoice              /invoices             [Accounting]
├─ Pembayaran           /payments             [Accounting]
└─ Riwayat Aktivitas    /history              [semua]
Footer sidebar: kartu bantuan kecil + tombol Logout
Topbar: breadcrumb / search global / notifikasi overdue (badge angka) / avatar + role badge
```
Role: Marketing melihat Dashboard, Pelanggan, Produk, Sales Order, Riwayat. Accounting melihat Dashboard, Pelanggan (read-only), Invoice, Pembayaran, Riwayat. Menu di luar role tidak dirender.

### 1.2 Komponen bersama
- `StatusChip`: outline navy untuk `DRAFT`/`UNPAID`, solid lime untuk `PAID`, navy solid untuk `INVOICED`/`PARTIALLY_PAID`, dashed navy untuk `OVERDUE`/`VOID`/`CANCELLED`.
- `KpiCard`: label uppercase, angka 40 px tabular, delta kecil, sparkline 60×24.
- `DataTable`: header navy-50, sticky header, row hover navy-50, kolom aksi di kanan, checkbox bulk opsional (tampil, tetap disabled kecuali aksi massal valid).
- `EmptyState`: ilustrasi line-art + 1 kalimat + CTA lime.
- `ConfirmDialog` untuk semua hapus (BR-11): menyebut bahwa data masuk arsip.
- `LockedNotice`: strip navy-50 + ikon gembok + teks alasan (dipakai BR-04, BR-08).
- Toast sukses: lime-100 background, ikon centang navy.

---

## 2. Data contoh (pakai konsisten di semua layar)

| Entitas | Nilai |
|---|---|
| User | `admin.marketing` / `admin.accounting` |
| Pelanggan | CV Sinar Jaya (admin@sinarjaya.id), PT Rasa Nusantara, Koperasi Maju Bersama, Toko Kopi Aroma, CV Bumi Digital |
| Produk | Pembuatan Website Rp1.500.000 · Maintenance Bulanan Rp250.000 · Desain Logo Rp750.000 · Setup Server Rp2.000.000 |
| SO | SO-2026-001 s.d. SO-2026-012 (DRAFT/INVOICED/CANCELLED) |
| Invoice | INV-2026-001 (PARTIALLY_PAID, jatuh tempo 02 Nov 2026), INV-2026-002 (PAID), INV-2026-003 (OVERDUE 24 Okt 2026), INV-2026-004 (UNPAID) |
| Invoice total | INV-2026-001 = Rp2.000.000, dibayar Rp1.000.000 + Rp500.000 → sisa Rp500.000 |
| Pembayaran | PAY-001 Rp1.000.000 BANK_TRANSFER, PAY-002 Rp500.000 EWALLET |
| Riwayat | "Pesanan dibuat", "Invoice diterbitkan", "Pembayaran dicatat" |
| Mata uang | `Rp1.500.000` (titik ribuan, tanpa desimal) |
| Tanggal | `26 Okt 2026` |

---

## 3. Prompt 0 — Global shell (paste pertama)

```text
Design a modern 2026 SaaS web application called "SpillBill", an order-to-invoice tool for small businesses. Desktop-first, 1440px wide, light theme, clean and professional, data-dense but calm.

Color system: only three colors. White #FFFFFF for surfaces. Navy #0B1F3A for sidebar, headings, primary chart and dark buttons. Lime #C6F24D for primary CTA, active navigation, KPI highlights and success states. Supporting tints: #F4F7FB, #E3EAF3, #9AAABF, #3B5273 (all tinted navy) and #EEFBCB (tint of lime). No other colors; status must be communicated with text labels and icons, never color alone.

Typography: Inter. Body 14px, section titles 20px semibold, page title 32px semibold, KPI numbers 40px semibold with tabular numerals. Generous spacing on an 8px scale, 24px gutters.

Layout: fixed left sidebar 248px in navy with logo "SpillBill" (wordmark with a lime dot), navigation items Dashboard, Pelanggan, Produk, Sales Order, Invoice, Pembayaran, Riwayat Aktivitas; active item has a lime left indicator and lime icon. Sidebar footer shows a small help card and "Logout". Top bar 64px tall: breadcrumb, global search field, notification bell with a small overdue badge, avatar with role label "Accounting". Content area on #F4F7FB with white rounded 16px cards, 1px #E3EAF3 borders and soft shadows.

Build the Dashboard marketing screen as the initial frame: page title "Dashboard", subtitle "Ringkasan penjualan dan piutang", date range selector chip; four KPI cards (Total Omzet Rp184.500.000, Total Piutang Rp42.300.000, Invoice Overdue 3, Sales Order Bulan Ini 12) each with a mini sparkline; a large line/area chart "Tren Omzet 6 Bulan" using navy line with a soft lime area fill; a donut chart "Komposisi Status Invoice" in navy shades with one lime segment for Paid; a horizontal bar chart "Aging Piutang" (0-7, 8-30, >30 hari); a right column list "Aktivitas Terbaru" with icon, description, timestamp; and a footer row "Sales Order Belum Ditagih" as three compact rows with a lime "Buat Invoice" text button. Include a tasteful line-art illustration (navy outline + lime accent) in the header area of the first KPI card. Rounded corners 16px, high information density, no gradients, no glassmorphism.
```

---

## 4. Prompt per layar

### Prompt 1 — Login
```text
Keep the existing design system, layout, and typography.
Create the Login screen. Split layout 55/45: left panel navy #0B1F3A with a large two-tone line-art illustration of documents, invoices and coins (navy outlines at 20% opacity plus lime accents), product wordmark "SpillBill", and a short value line "Order → Invoice → Paid dalam satu alur". Right panel white, centered card max 420px: title "Masuk ke SpillBill", subtitle "Kelola pesanan dan tagihan usaha Anda", email/username field, password field with show/hide icon, "Ingat saya" checkbox, full-width lime button with navy text "Masuk", muted helper text "Hubungi admin jika belum memiliki akun". Above the fields, show a subtle role hint row with two disabled-looking tags "Marketing" and "Accounting".
States to show as variants: (a) default, (b) field-level validation error "Wajib diisi" with navy text and outline, (c) form-level banner "Username atau password salah. Coba lagi." in navy-50 with a warning icon and 1px navy border. No red or orange anywhere. Keyboard focus ring in lime. Footer micro text "© 2026 SpillBill".
```

### Prompt 2 — Dashboard variants
```text
Keep the existing design system.
Add two dashboard variants of the same frame.
Variant A "Dashboard – Marketing": KPI cards Sales Order Bulan Ini 12, Pelanggan Baru 4, SO Belum Ditagih 5, Nilai SO Belum Ditagih Rp6.750.000; main chart "Tren Sales Order 6 Bulan"; secondary chart "Status Sales Order" as donut with DRAFT, INVOICED, CANCELLED; list "Sales Order Terbaru" table with number, customer, total, status chip and a lime text action "Buat Invoice" that is enabled only for DRAFT rows and appears disabled with tooltip "SO sudah ditagih" for INVOICED rows.
Variant B "Dashboard – Accounting": KPI cards Total Piutang Rp42.300.000, Invoice Overdue 3, Pembayaran Bulan Ini Rp18.200.000, Rata-rata Umur Piutang 11 hari; chart "Tren Omzet vs Piutang" two-series navy line with lime area for paid; chart "Aging Piutang" bars; donut "Komposisi Status Invoice" UNPAID / PARTIALLY_PAID / PAID / OVERDUE using navy shades plus lime for PAID; table "Invoice Jatuh Tempo Terdekat" with invoice number, customer, due date, outstanding amount, status chip and "Catat Pembayaran" lime text button. Add a slim "Pengingat" card listing 2 overdue invoices with dashed navy border. Keep density high, align all numbers right with tabular figures.
```

### Prompt 3 — Pelanggan (Marketing)
```text
Keep the existing design system.
Create "Pelanggan" list screen as the main state: page title with subtitle, top-right lime button "+ Tambah Pelanggan". Toolbar row: search input "Cari nama, email, atau telepon", filter chip "Semua pelanggan", and a compact view toggle. Table columns: Pelanggan (avatar initials + name + email), Telepon, Jumlah SO, Total Tagihan, Sisa Piutang, Status transaksi, Aksi (kebab menu: Lihat detail, Ubah, Hapus). Show 6 rows with the sample customers, right-aligned currency. Rows with zero transactions show an enabled Hapus action; a row with transactions shows Hapus disabled with tooltip "Pelanggan sudah memiliki transaksi". Pagination footer "Menampilkan 1–6 dari 24".
Also show, in the same frame, two overlay states as separate artboards: (1) detail panel sliding from the right 420px with customer header, contact list, three mini stats (Jumlah SO, Total Tagihan, Sisa Piutang), and a timeline "Aktivitas Pelanggan"; (2) modal "Tambah Pelanggan" 520px with fields Nama (required), Email, Telepon, Alamat, Catatan, footer buttons Batal and lime Simpan, plus inline error state "Nama wajib diisi".
```

### Prompt 4 — Produk
```text
Keep the existing design system.
Create "Produk" screen: page title "Produk" with subtitle "Master data item yang dapat dipesan". Top-right lime button "+ Tambah Produk", search field. Table columns: Nama produk, Harga satuan, Status (Aktif / Nonaktif chip), Dipakai di, Aksi (Ubah, Nonaktifkan). Use the four sample products with prices in rupiah. Show a modal "Tambah Produk" with fields Nama, Harga satuan (prefix Rp, numeric), toggle "Aktif", helper text "Produk nonaktif tidak muncul saat membuat Sales Order", and footer Batal / lime Simpan (disabled until name and price are valid).
```

### Prompt 5 — Sales Order list
```text
Keep the existing design system.
Create "Sales Order" list screen: title, subtitle "Pesanan pelanggan sebelum menjadi tagihan", top-right lime button "+ Buat Sales Order". Toolbar: search "Cari nomor SO atau pelanggan", status filter tabs (Semua, Draft, Invoiced, Cancelled) with counts, date range chip. Table columns: Nomor SO, Tanggal, Pelanggan, Item, Total, Sisa qty belum ditagih, Status chip, Aksi. Show 7 rows including SO-2026-001 (INVOICED, locked), SO-2026-002 (DRAFT, with lime text action "Buat Invoice"), SO-2026-003 (DRAFT), SO-2026-004 (CANCELLED). For INVOICED rows show a small lock icon next to the number and mark Edit/Hapus as disabled in the kebab menu with tooltip "Sales Order sudah ditagih". Right-align all currency. Add a summary strip above the table: three small inline stats (Total draft, Total invoiced, Total cancelled).
```

### Prompt 6 — Sales Order builder (form)
```text
Keep the existing design system.
Create the "Buat Sales Order" form screen (also used for edit). Two-column layout: main column white card "Detail Pesanan" and right column sticky card "Ringkasan".
Main card fields: Nomor SO read-only "SO-2026-013" with lock icon, Tanggal pesanan date picker, Pelanggan searchable select showing "CV Sinar Jaya · admin@sinarjaya.id" with helper "Belum ada pelanggan? Tambah pelanggan" link.
Dynamic items table: columns Produk (searchable select), Qty (stepper), Harga satuan (currency input prefilled from product), Subtotal (read-only, right aligned), remove icon. Show two filled rows plus one empty row with dashed navy border labeled "+ Tambah item". Show an inline validation state on one row: Qty 0 highlighted with navy outline and helper "Qty harus lebih dari 0", and the row subtotal shows "—".
Right sticky card: label "Grand Total" with large number Rp2.000.000, breakdown rows Subtotal, Diskon (disabled, "Belum tersedia"), Total, small note "Total dihitung otomatis, tanpa pajak", then lime primary button "Simpan Sales Order" (disabled state shown when the form is invalid) and secondary "Batal". Under it, a muted info card "Nomor SO tidak dapat diubah setelah disimpan".
Also show a variant with a warning banner at the top of the main card: "Produk tidak ditemukan atau sudah nonaktif. Periksa kembali item pesanan." in navy-50 with icon.
```

### Prompt 7 — Sales Order detail
```text
Keep the existing design system.
Create "Detail Sales Order" screen for SO-2026-001. Header: back link "Sales Order", number SO-2026-001 with status chip INVOICED and a lock icon, right actions: lime button "Buat Invoice" shown disabled with tooltip "SO sudah memiliki invoice", secondary "Cetak" and kebab menu with disabled Edit/Hapus and helper text.
Left: card "Informasi Pesanan" with two-column meta grid (Pelanggan CV Sinar Jaya, Tanggal 26 Okt 2026, Dibuat oleh admin.marketing, Total Rp2.000.000) and card "Item Pesanan" table: Produk, Qty, Harga, Subtotal, Sisa qty belum ditagih. Two rows: Pembuatan Website 1 × Rp1.500.000 and Maintenance Bulanan 2 × Rp250.000 with sisa 0.
Right: card "Tagihan Terkait" listing INV-2026-001 with PARTIALLY_PAID chip, total Rp2.000.000, sisa Rp500.000 and a link "Lihat invoice"; card "Riwayat" with 3 timeline entries (SO dibuat, Invoice diterbitkan, Pembayaran dicatat) with timestamps.
Add a subtle lime-100 strip under the header: "Sales Order ini terkunci karena sudah ditagih. Perubahan hanya dapat dilakukan melalui invoice terkait." in navy text.
```

### Prompt 8 — Invoice list
```text
Keep the existing design system.
Create "Invoice" list screen: title "Invoice", subtitle "Tagihan yang diterbitkan dari Sales Order", top-right lime button "+ Buat Invoice". Toolbar: search, status tabs (Semua, Unpaid, Partially paid, Paid, Overdue) with counts, date range, and a "Export" secondary button. Table columns: Nomor Invoice, Pelanggan, Tanggal, Jatuh Tempo, Total, Dibayar, Sisa, Status chip, Aksi. Show 6 rows including INV-2026-001 (PARTIALLY_PAID, due 02 Nov 2026), INV-2026-002 (PAID with lock icon, Edit/Hapus disabled in kebab), INV-2026-003 (OVERDUE with dashed chip and a small clock icon; overdue days "+3 hari" in navy, not red, with label "Terlambat"), INV-2026-004 (UNPAID). Right-align currency columns and use tabular numerals. Add a summary strip: Total ditagih, Total diterima, Total piutang, Total overdue.
```

### Prompt 9 — Invoice builder from Sales Order
```text
Keep the existing design system.
Create "Buat Invoice" screen. Left column: step 1 card "Pilih Sales Order" with a searchable list of DRAFT sales orders (SO-2026-002 CV Sinar Jaya, SO-2026-003 PT Rasa Nusantara) each showing number, customer, total and a "Pilih" text button; the selected one is highlighted with a 2px lime border and a lime check icon. Sales orders already invoiced are not listed; add a muted note "SO yang sudah ditagih tidak dapat dipilih".
Step 2 card "Detail Tagihan" appears below: Nomor Invoice read-only INV-2026-005, Tanggal invoice 27 Okt 2026, Jatuh tempo 03 Nov 2026 with helper "Default 7 hari", Catatan (textarea).
Step 3 card "Item yang Ditagih": table with Produk, Qty di SO, Sisa qty, Qty ditagih (stepper with max equal to remaining qty), Harga, Subtotal. Show one row capped at max with helper "Maksimal 2 (sisa dari SO)". Add a disabled row state with helper "Qty tidak boleh melebihi sisa pesanan" and the lime Simpan button disabled.
Right sticky card "Ringkasan Invoice": Subtotal, Total tagihan (large), Sisa setelah invoice ini, buttons lime "Terbitkan Invoice" and secondary "Batal", plus a muted list "Setelah terbit: nomor invoice final, SO berubah menjadi INVOICED, invoice dapat dicetak."
```

### Prompt 10 — Invoice detail + print
```text
Keep the existing design system.
Create two artboards.
(1) "Detail Invoice" INV-2026-001 for CV Sinar Jaya: header with number, PARTIALLY_PAID chip, right actions lime "Catat Pembayaran", secondary "Cetak / Unduh PDF", kebab with Edit enabled and Hapus disabled (state shown for a PAID variant is not needed here). Left column: card "Informasi Invoice" meta grid (Pelanggan, Sales Order link SO-2026-001, Tanggal 26 Okt 2026, Jatuh tempo 02 Nov 2026, Metode pembayaran BANK_TRANSFER), card "Item Tagihan" table (Produk, Qty, Harga, Subtotal), card "Pembayaran" table (tanggal, metode, referensi, jumlah, status chip SUCCESS, aksi Void) with rows PAY-001 Rp1.000.000 and PAY-002 Rp500.000. Right column: payment summary card with Total tagihan Rp2.000.000, Dibayar Rp1.500.000, Sisa Rp500.000 emphasized at 32px, a lime progress bar at 75% labeled "75% tertagih", and a muted note "Status berubah otomatis menjadi Paid saat sisa Rp0".
(2) "Cetak Invoice": print-friendly A4 sheet on white with navy header band containing wordmark and "INVOICE" label, invoice number and dates top-right, customer block, item table with navy header row, totals block right aligned, payment status stamp using navy outline + lime fill label "PARTIALLY PAID", bank account block, terms text, and footer "Dokumen dibuat oleh SpillBill". Keep it monochrome navy plus lime, no shadows, print-safe margins.
```

### Prompt 11 — Pembayaran list
```text
Keep the existing design system.
Create "Pembayaran" list screen: title, subtitle "Penerimaan pembayaran atas invoice", top-right lime button "+ Catat Pembayaran". Toolbar: search, method filter, date range. Table columns: ID, Tanggal, Invoice, Pelanggan, Metode (with small icon BANK_TRANSFER / EWALLET / CASH), Jumlah, Status chip, Aksi (Lihat, Void disabled for VOID). Show 5 rows. Add a top summary strip: Total diterima bulan ini Rp18.200.000, Jumlah transaksi 9, Rata-rata pembayaran Rp2.022.222.
Also show a modal "Catat Pembayaran" 560px in the same frame: Invoice searchable select "INV-2026-001 · CV Sinar Jaya · Sisa Rp500.000", Jumlah (prefix Rp) with helper "Maksimal Rp500.000" and an error state "Melebihi sisa tagihan" plus inline text showing remaining amount, Tanggal, Metode segmented control (Transfer Bank / E-Wallet / Tunai / Lainnya), Referensi, upload area "Unggah bukti bayar (opsional)" with dashed border and PDF/JPG hint, footer Batal / lime Simpan Pembayaran (disabled while invalid).
```

### Prompt 12 — Riwayat Aktivitas
```text
Keep the existing design system.
Create "Riwayat Aktivitas" screen: title, subtitle "Jejak audit semua perubahan data", toolbar with search, filter Aktor, filter Aksi (CREATE / UPDATE / DELETE / RECORD_PAYMENT / VOID_PAYMENT), filter Entitas, and date range. Main table columns: Waktu (26 Okt 2026 · 11:00), Aktor (avatar initials + admin.accounting), Aksi (chip), Entitas (SalesOrder · SO-2026-001), Deskripsi ("Pembayaran dicatat untuk INV-2026-001"). Show 8 rows including "SO dibuat", "Invoice diterbitkan", "Pembayaran dicatat", "Pembayaran dibatalkan", "Data pelanggan diarsipkan". Add a right-side info card explaining that delete actions are archived, not removed, with a small line-art shield illustration. Table is read-only: no action column.
```

### Prompt 13 — Responsif & states
```text
Keep the existing design system.
Produce responsive variants for 1280px and 1024px widths: sidebar collapses to a 72px icon rail with tooltips, KPI cards become 2×2, tables allow horizontal scroll with sticky first column, and the invoice builder summary moves below the main column.
Also produce a shared states sheet: loading skeleton for table rows and KPI cards, empty state for each list (ilustrasi line-art + one sentence + lime CTA), error state banner for failed load, disabled-action tooltip style, and the confirmation dialog used for every delete: title "Arsipkan data?", body explaining data is moved to history and can be restored, buttons Batal and navy solid "Ya, arsipkan".
```

---

## 5. Aturan sinkronisasi (cek setelah generate)

1. Semua menu di §1.1 ada; menu di luar role tidak dirender.
2. Chip status konsisten: `DRAFT`, `INVOICED`, `CANCELLED`, `UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `SUCCESS`, `VOID`.
3. SO `INVOICED` → tombol Edit/Hapus disabled + alasan terlihat (BR-04).
4. Invoice `PAID` → Edit/Hapus disabled + badge lock (BR-08).
5. Invoice builder membatasi qty ke sisa SO dan menampilkan max (BR-06).
6. Form pembayaran menampilkan sisa tagihan dan menolak nominal berlebih (BR-09).
7. Tidak ada warna keempat, termasuk untuk overdue/error (BR: palet §1).
8. Angka uang rata kanan, format `Rp1.500.000`, tanggal `26 Okt 2026`.
9. Setiap layar list punya state: loading, empty, error, dan hasil terfilter kosong.
10. Setiap aksi hapus memakai dialog arsip, bukan "Delete permanently" (BR-11).

---

## 6. Checklist QA prototype

- [ ] 13 prompt layar (termasuk 2 varian dashboard) + 1 artboard cetak invoice tersedia.
- [ ] Alur `Dashboard → Sales Order → Buat Invoice → Detail Invoice → Catat Pembayaran → PAID` dapat diklik tanpa jalan buntu.
- [ ] RBAC terlihat: login sebagai Accounting tidak menampilkan menu Produk/Sales Order.
- [ ] Semua aturan BR-01..BR-14 terverifikasi di §5.
- [ ] Kontras teks navy di atas lime ≥ 4,5:1; teks navy-300 hanya untuk placeholder/disabled.
- [ ] Grid, radius, border, dan shadow identik antar layar.
- [ ] Semua teks UI Bahasa Indonesia, konsisten istilah (Sales Order, Invoice, Pembayaran, Pelanggan, Produk).
