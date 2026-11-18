# Edit Sales Order: Live Totals

- Intent: saat mengedit SO Draft, tampilkan subtotal per item dan total akhir yang langsung berubah saat produk atau quantity berubah.
- Behavior: subtotal = quantity × harga katalog produk terpilih; total = jumlah subtotal. Harga katalog read-only dan tetap menjadi sumber harga saat disimpan. Hanya Draft yang dapat diedit.
- Approaches: (1) Hitung di UI dari katalog yang sudah dimuat — dipilih, ringan dan langsung; backend tetap menghitung harga saat simpan. (2) Minta API menghitung tiap perubahan — round-trip tidak perlu dan lebih lambat. Harga manual tidak diminta, jadi tidak ditambahkan.
- Scope: form create/edit Sales Order dan styling terkait; pertahankan validasi dan aturan backend yang ada.
- Check: satu self-check kecil untuk perhitungan subtotal/total; jalankan frontend build/check serta backend tests.
