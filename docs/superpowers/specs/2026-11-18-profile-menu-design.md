# Menu profil

- Intent: cegah ganti role dari profil; menu hanya menampilkan info akun read-only dan Keluar.
- Scope: ganti opsi role di popover yang ada; logout memakai alur sesi/logout saat ini. Tidak mengubah pemilihan role saat login atau data profil backend.
- Approaches: (1) menu ringkas dengan identitas + Keluar, dipilih karena paling kecil dan sesuai menu sekarang; (2) modal profil terpisah, biaya UI ekstra tanpa kebutuhan tambahan.
- Acceptance: menu tak punya kontrol ubah role; nama/role aktif terlihat; Keluar membersihkan sesi dan menuju login.