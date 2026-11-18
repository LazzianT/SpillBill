# SpillBill API

Backend minimum untuk development lokal dengan MySQL di VPS.

## Setup lokal

```powershell
Copy-Item .env.example .env
npm install
```

Isi `backend/.env`. `AUTH_TOKEN_SECRET` harus minimal 32 karakter acak; buat dengan:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

`CORS_ORIGIN` berisi origin frontend yang diizinkan, pisahkan beberapa origin dengan koma. Jangan commit file `.env`.

Buka SSH tunnel ke MySQL VPS:

```powershell
ssh -N -L 13306:127.0.0.1:3306 user@43.173.53.28
```

Jalankan API:

```powershell
npm run dev
```

Health check:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/health/db
```

## Docker VPS

Container API memakai `DB_HOST=mysql` dan `DB_PORT=3306` pada network Docker internal. Jangan expose port MySQL ke internet.
