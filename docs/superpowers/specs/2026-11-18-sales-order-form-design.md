# Sales Order form controls

- Tujuan: Dropdown Sales Order selaras tema, mudah dipakai; tombol minus menghapus baris item. Transisi hanya pada kontrol dalam form, bukan seluruh aplikasi.
- Pendekatan: Ganti select native di form Buat Sales Order dengan dropdown custom berbasis button/listbox, mendukung keyboard (Arrow keys, Enter/Space, Escape, type-to-select), klik luar, focus-visible, dan reduced motion. Gunakan pada pilihan pelanggan dan produk.
- Item: Tombol hapus per baris, minimal satu baris dipertahankan; tambah/hapus baris memakai transisi singkat tanpa mengganggu nilai atau total baris lain.
- Transisi: Gunakan CSS/React yang sudah ada, tanpa dependency; status membuka/menutup modal tetap memakai animasi saat ini. Tidak mengubah backend atau form Edit yang read-only.
- Alternatif: Tetap native lebih sederhana namun menu sistem tidak bisa ditransisikan konsisten; dipilih custom karena pengguna menginginkan tampilan bertema dan transisi.
- Verifikasi: Assertion teruji untuk pemilihan/penghapusan baris jika dapat dipisahkan; build/check; browser flow untuk keyboard, klik luar, tambah/hapus, dan reduced motion bila login tersedia.
