# Arsip Sales Order

- Intent: izinkan penghapusan SO yang belum menjadi invoice dari tabel tanpa menghapus jejak transaksi.
- UX: tombol Hapus hanya pada Draft; minta konfirmasi; sukses arsipkan dan muat ulang daftar. Invoiced/Canceled tidak bisa diarsipkan lewat aksi ini.
- Backend: `DELETE /sales-orders/:id` mengarsipkan hanya SO berstatus DRAFT yang belum punya invoice; transaksi dan history `ARCHIVE` atomik; ID tidak valid 400, SO tak dapat diarsipkan 409. Tanpa hard-delete.
- Approaches: arsipkan, dipilih agar jejak/audit aman; hard-delete ditolak karena menghilangkan data dan berisiko melanggar relasi transaksi.
- Scope: frontend Sales Order, route dan repository backend, self-check backend yang sesuai pola repo. Tidak mengubah pembatalan Draft atau aksi lain.
