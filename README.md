<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=SpillBill&fontSize=65&fontColor=ffffff&animation=fadeIn&desc=Order%20to%20Invoice%20System%20untuk%20UMKM&descSize=18&descAlignY=68" width="100%" alt="SpillBill Banner"/>

<a href="https://github.com/LazzianT/SpillBill">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=22&pause=1000&color=3FCF8E&center=true&vCenter=true&width=550&lines=Order+%E2%86%92+Invoice+%E2%86%92+Paid+%F0%9F%9A%80;Kelola+Pelanggan+%2B+Pesanan+%2B+Tagihan;Otomatisasi+Faktur+dalam+Satu+Klik+%E2%9A%A1;Fast.+Secure.+Automated." alt="Typing Animation"/>
</a>

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

<!-- Badge dinamis — update otomatis dari GitHub API -->
![Stars](https://img.shields.io/github/stars/LazzianT/SpillBill?style=flat&logo=github&color=3FCF8E&label=stars)
![Forks](https://img.shields.io/github/forks/LazzianT/SpillBill?style=flat&logo=github&color=58A6FF&label=forks)
![Issues](https://img.shields.io/github/issues/LazzianT/SpillBill?style=flat&logo=github&color=F78166&label=issues)
![Last Commit](https://img.shields.io/github/last-commit/LazzianT/SpillBill/main?style=flat&logo=git&color=A371F7&label=last%20commit)
![Total Commits](https://img.shields.io/github/commit-activity/t/LazzianT/SpillBill?style=flat&logo=git&color=3FB950&label=commits)
![Contributors](https://img.shields.io/github/contributors/LazzianT/SpillBill?style=flat&logo=github&color=DB61A2&label=contributors)
![Repo Size](https://img.shields.io/github/repo-size/LazzianT/SpillBill?style=flat&logo=github&color=8B949E&label=size)

**SpillBill** adalah aplikasi web *Order-to-Invoice* yang membantu UMKM mengelola seluruh alur transaksi — mulai dari pencatatan pelanggan, pemesanan (Sales Order), penerbitan faktur otomatis, hingga pelacakan pembayaran dan pelunasan — semuanya secara digital, cepat, dan rapi.

> 📌 **Status:** Repositori ini saat ini berisi *dokumentasi* (README + SRS). Fitur, role, dan non-functional requirements di bawah adalah **target yang direncanakan** — kode aplikasi belum di-push dan akan menyusul di milestone berikutnya.

</div>

---

## ✨ Fitur Utama

| | Fitur | Deskripsi |
|:---:|---|---|
| 👥 | **Customer Management** | Tambah, ubah, dan lihat detail data pelanggan dengan aman |
| 📝 | **Sales Order Management** | Form pesanan dinamis — tambah/hapus baris item (Nama, Qty, Harga) |
| 🧮 | **Auto Kalkulasi** | Subtotal per item & Grand Total dihitung instan di sisi client (< 100ms) |
| 🧾 | **One-Click Invoice** | Konversi Sales Order → Invoice dengan nomor unik `INV-2026-001` |
| 🖨️ | **Print / Download PDF** | Cetak faktur berformat profesional (Print-Friendly) |
| 💵 | **Payment Tracking** | Catat pembayaran parsial / pelunasan lengkap dengan bukti bayar |
| 📊 | **Dashboard Statistik** | Total omzet, total piutang, dan jumlah invoice *Overdue* |

---

## 🔄 Alur Kerja Sistem

```mermaid
flowchart LR
    subgraph ENTRY["📥 Input"]
        A["👥 Data Pelanggan"] --> B["📝 Sales Order<br/>Item, Qty, Harga"]
    end
    subgraph CORE["⚙️ Proses"]
        B --> C["⚡ Generate Invoice<br/>Satu Klik"]
        C --> D["🧾 INV-2026-001<br/>+ Tanggal Jatuh Tempo"]
    end
    subgraph OUT["📤 Output"]
        D --> E["🖨️ Print / PDF"]
        D --> F["💵 Pembayaran"]
        F --> G{"Lunas?"}
        G -- "Ya" --> H["✅ PAID"]
        G -- "Belum" --> F
    end

    style ENTRY fill:#0d1117,stroke:#3FCF8E,color:#c9d1d9
    style CORE fill:#0d1117,stroke:#58A6FF,color:#c9d1d9
    style OUT fill:#0d1117,stroke:#F78166,color:#c9d1d9
```

> ⚠️ **Business Rules:** Sales Order tidak dapat diedit/dihapus setelah status *Invoiced* — Invoice tidak dapat diedit/dihapus setelah status *Paid*.

---

## 👤 Role Pengguna

| Role | Tanggung Jawab |
|---|---|
| 📈 **Admin Marketing** | Mengelola data pelanggan & memproses pesanan (Sales Order) |
| 🧾 **Admin Accounting** | Menerbitkan tagihan & mencatat penerimaan pembayaran |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React + Vite + TypeScript |
| **Backend** | Express.js (Node.js 22+) |
| **Database** | Supabase (PostgreSQL) |
| **Hosting** | Vercel |
| **Arsitektur** | Dual Repo (FrontEnd + BackEnd) • Role-Based Access Control |

<details>
<summary><b>🔐 Keamanan & Non-Functional Requirements</b></summary>
<br/>

| ID | Requirement |
|---|---|
| NFR-PERF-01 | Waktu muat halaman < 2 detik |
| NFR-PERF-02 | Kalkulasi subtotal instan (< 100ms) di sisi client |
| NFR-SEC-01 | API Key & Database String disembunyikan via `.env` |
| NFR-SEC-02 | Pencegahan SQL Injection dengan *parameterized queries* |
| NFR-SEC-03 | Role-Based Access Control (RBAC) |
| 🛡️ Safety | Data yang dihapus tidak hilang — masuk ke tabel *history* |

</details>

<details>
<summary><b>📋 Functional Requirements Lengkap</b></summary>
<br/>

**👥 Customer Management**
- `FR-CUST-01` — Admin dapat menambah, mengubah, dan melihat detail data pelanggan
- `FR-CUST-02` — Hapus pelanggan hanya jika belum memiliki riwayat transaksi

**📝 Sales Order Management**
- `FR-ORD-01` — Membuat Sales Order baru dengan pelanggan terdaftar
- `FR-ORD-02` — Penambahan/penghapusan baris item secara dinamis
- `FR-ORD-03` — Kalkulasi otomatis Subtotal & Grand Total

**🧾 Automated Invoice Generation**
- `FR-INV-01` — Konversi Sales Order → Invoice satu klik
- `FR-INV-02` — Nomor Invoice unik + tanggal jatuh tempo
- `FR-INV-03` — Tombol "Cetak / Download PDF" layout faktur resmi

**💵 Payment Tracking & Reporting**
- `FR-PAY-01` — Riwayat pembayaran (Jumlah, Tanggal, Metode, Bukti Bayar)
- `FR-PAY-02` — Status otomatis menjadi *Paid* saat lunas
- `FR-DASH-01` — Statistik omzet, piutang, dan invoice *Overdue*

</details>

---

## 🚀 Memulai

```bash
# 1️⃣ Clone repository (frontend & backend — dual repo)
git clone https://github.com/LazzianT/spillbill-frontend.git
git clone https://github.com/LazzianT/spillbill-backend.git

# 2️⃣ Jalankan — 🔜 menyusul
# Kode aplikasi belum di-push ke repo mana pun. Saat sudah tersedia:
npm install          # Node.js 22+
cp .env.example .env # isi Supabase URL & API Key
npm run dev
```

---

## 👥 Tim Pengembang

<div align="center">

| NPM | Nama | Peran |
|:---:|:---:|:---:|
| **202343501595** | **Syanaia Lulailika** | 🧑‍💻 Developer Module Payment |
| **202343501604** | **Lazzian Al Falah** | 🧑‍💻 Developer Module Invoicing |
| **202343501690** | **Muhammad Izra Ilham** | 🧑‍💻 Developer Module Sales Order |

</div>

---

## 📚 Referensi

- IEEE 29148 — Systems and Software Engineering Requirements
- Sommerville — *Software Engineering*
- Pressman — *Software Engineering: A Practitioner's Approach*
- Template SRS — Karl Wiegers

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=110&section=footer" width="100%" alt="Footer"/>

**SpillBill** — Dibuat dengan ❤️ oleh Tim SpillBill

*⭐ Star repo ini jika bermanfaat!*

</div>
