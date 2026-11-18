# Sales Order detail drawer

- Tujuan: Drawer tidak menutupi navigasi; klik di luar drawer menutupnya.
- Perubahan: Bungkus detail dengan backdrop selebar area konten, mulai setelah sidebar; drawer tetap fixed di kanan. Klik backdrop atau tombol × menutup, klik drawer tidak. Tidak ubah isi detail.
- Pendekatan: Backdrop area konten, sesuai pilihan pengguna. Alternatif drawer di alur konten ditolak karena menyempitkan tabel.
- Batasan: Tanpa dependency; hormati reduced motion; pertahankan drawer responsif.
- Verifikasi: Build/check frontend; cek klik backdrop, klik drawer, tombol tutup, dan posisi sidebar.
