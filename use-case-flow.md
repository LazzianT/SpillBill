# Use Case Flow — SpillBill

Alur use case berdasarkan README & SRS. Diagram dalam Mermaid — bisa dirender di GitHub.

## Aktor

| Aktor | Tanggung Jawab | Modul |
|---|---|---|
| **Admin Marketing** | Kelola pelanggan & Sales Order | Sales Order (Izra) |
| **Admin Accounting** | Terbitkan invoice & catat pembayaran | Invoicing (Lazzian) + Payment (Syanaia) |
| **Sistem** | Kalkulasi, validasi status, statistik | — |

---

## UC-01 — Kelola Data Pelanggan

**Aktor:** Admin Marketing
**Dasar:** FR-CUST-01, FR-CUST-02

```mermaid
flowchart LR
    A([Admin Marketing]) --> B[Tambah / Ubah / Lihat Pelanggan]
    B --> C{Sudah ada\nriwayat transaksi?}
    C -- "Ya" --> D[🚫 Hapus ditolak]
    C -- "Belum" --> E[OK — hapus diizinkan]
    B --> F[Data tersimpan aman]
```

---

## UC-02 — Buat Sales Order

**Aktor:** Admin Marketing
**Dasar:** FR-ORD-01, FR-ORD-02, FR-ORD-03

```mermaid
flowchart LR
    A([Admin Marketing]) --> B[Pilih Pelanggan terdaftar]
    B --> C[Tambah/Hapus baris item\nNama, Qty, Harga]
    C --> D{Semua baris valid?}
    D -- "Tidak" --> C
    D -- "Ya" --> E[Auto hitung Subtotal & Grand Total]
    E --> F[Sales Order tersimpan]
    F --> G{Status Invoiced?}
    G -- "Ya" --> H[🔒 Terkunci — tak bisa edit/hapus]
    G -- "Belum" --> I[Bisa edit/hapus]
```

---

## UC-03 — Generate Invoice (One-Click)

**Aktor:** Admin Accounting
**Dasar:** FR-INV-01, FR-INV-02

```mermaid
flowchart LR
    A([Admin Accounting]) --> B[Buka Sales Order\nstatus siap invoice]
    B --> C[Klik Generate Invoice]
    C --> D[Sistem buat nomor unik\nINV-2026-001]
    D --> E[Sistem set tanggal jatuh tempo]
    E --> F[Invoice terbit + SO jadi Invoiced 🔒]
    F --> G{Invoice Paid?}
    G -- "Ya" --> H[🔒 Terkunci — tak bisa edit/hapus]
    G -- "Belum" --> I[Bisa edit/hapus]
```

---

## UC-04 — Cetak / Download Invoice

**Aktor:** Admin Accounting
**Dasar:** FR-INV-03

```mermaid
flowchart LR
    A([Admin Accounting]) --> B[Buka Invoice]
    B --> C[Klik Cetak / Download PDF]
    C --> D[Layout faktur resmi\nPrint-Friendly]
```

---

## UC-05 — Catat Pembayaran

**Aktor:** Admin Accounting
**Dasar:** FR-PAY-01, FR-PAY-02

```mermaid
flowchart LR
    A([Admin Accounting]) --> B[Catat Pembayaran\nJumlah, Tanggal, Metode, Bukti]
    B --> C{Total dibayar ≥ invoice?}
    C -- "Belum" --> D[Status = Partial / Outstanding]
    D --> B
    C -- "Lunas" --> E[Sistem set status PAID ✅]
    E --> F[Invoice terkunci 🔒]
```

---

## UC-06 — Lihat Dashboard Statistik

**Aktor:** Admin Marketing & Admin Accounting
**Dasar:** FR-DASH-01

```mermaid
flowchart LR
    A([Admin Marketing / Accounting]) --> B[Buka Dashboard]
    B --> C[📊 Total Omzet]
    B --> D[💰 Total Piutang]
    B --> E[⏰ Invoice Overdue]
```

---

## Ringkasan Bisnis Rules

1. **Sales Order** tak dapat diedit/dihapus setelah status **Invoiced**.
2. **Invoice** tak dapat diedit/dihapus setelah status **Paid**.
3. Pelanggan hanya bisa dihapus jika **belum punya riwayat transaksi**.
4. Data yang dihapus → masuk tabel *history* (bukan hard-delete permanent).

---

## Relasi Modul ↔ Developer

| Use Case | Modul | Developer |
|---|---|---|
| UC-01, UC-02 | Sales Order | Izra |
| UC-03, UC-04 | Invoicing | Lazzian |
| UC-05, UC-06 | Payment | Syanaia |