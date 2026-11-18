# Desain: Animasi Status Produk

- **Tujuan:** Beri umpan balik jelas saat produk diaktifkan atau dinonaktifkan.
- **Perilaku:** Tambahkan aksi Nonaktifkan untuk produk aktif; simpan perubahan status melalui API/DB; refresh data. Status dan kartu bertransisi singkat saat nilai berubah. Hormati `prefers-reduced-motion`; pertahankan warna/status SpillBill.
- **Batasan:** Tanpa dependency dan tanpa animasi berulang. Error API tetap terlihat.
- **Pendekatan:** Transisi CSS pada status/kartu; dipilih karena cukup untuk menegaskan perubahan tanpa menambah kompleksitas. Animasi JavaScript tidak diperlukan.
- **Pengecekan:** Tambah tes backend untuk perubahan status dan riwayat; jalankan tes serta build/check frontend.
