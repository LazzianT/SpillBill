# Desain: Pagination Pelanggan

- **Tujuan:** tombol pagination pada tabel Pelanggan benar-benar mengganti halaman data.
- **Pendekatan:** client-side pagination atas hasil pencarian/filter pelanggan yang sudah dimuat dari API. Pertahankan ukuran halaman yang tampak di UI bila ada; tombol Previous/Next dan nomor halaman harus berfungsi. Reset halaman ke 1 saat pencarian/filter berubah, serta batasi halaman aktif saat daftar mengecil.
- **Alternatif:** server-side pagination butuh perubahan endpoint dan kontrak API; tidak perlu untuk perbaikan ini. Menghapus pagination mengurangi kemampuan yang sudah ditampilkan UI.
- **Batasan:** tanpa fixture/fallback; CRUD dan role tidak berubah. Hitungan dan baris harus merujuk daftar terfilter, state kosong tidak menampilkan data palsu.
- **Pilihan:** client-side, paling kecil dan sesuai pola API saat ini yang memuat seluruh daftar.
