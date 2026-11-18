# Desain: Konfirmasi Nonaktifkan Produk dan Hover Halus

- **Tujuan:** Mencegah produk dinonaktifkan tanpa sengaja dan membuat kartu katalog terasa responsif.
- **Cakupan:** Klik **Nonaktifkan** membuka modal konfirmasi bergaya SpillBill; konfirmasi memanggil aksi status yang sudah ada. Hover kartu memakai transisi halus, mempertahankan offset kartu, dan menghormati `prefers-reduced-motion`.
- **Bukan cakupan:** Perubahan endpoint/database, library animasi baru, animasi dekoratif berulang.
- **Pendekatan dipilih:** Modal SpillBill dengan transisi masuk/keluar yang sudah tersedia, plus CSS transition pada transform kartu. Ini konsisten dengan modal lain dan meminimalkan kode.
- **Alternatif ditolak:** `window.confirm` tidak mendukung transisi yang diminta; hover-only tidak cukup melindungi aksi.
- **Anti-goal:** Modal tidak mengubah status sebelum konfirmasi; hover tidak menyebabkan pergeseran layout atau kehilangan offset grid.
- **Pengecekan:** Build/check frontend; uji modal batal dan konfirmasi, hover, serta reduced motion.
