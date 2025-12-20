# 📘 Panduan Migrasi Database: SQLite ke PostgreSQL

Dokumen ini menjelaskan cara migrasi aplikasi E-Ijazah dari SQLite (development) ke PostgreSQL (production).

---

## 🎯 Ringkasan

Aplikasi E-Ijazah sekarang **mendukung dual database**:
- **SQLite** → Untuk development/testing lokal
- **PostgreSQL** → Untuk production/web hosting

Sistem akan **otomatis memilih** database berdasarkan environment variable `DATABASE_URL`:
- ✅ `DATABASE_URL` kosong → Pakai SQLite
- ✅ `DATABASE_URL` terisi → Pakai PostgreSQL

---

## 📋 Prasyarat

### Untuk Development (SQLite)
- ✅ Node.js >= 18.0.0
- ✅ npm >= 9.0.0
- ✅ Tidak perlu setup database (SQLite otomatis)

### Untuk Production (PostgreSQL)
- ✅ Node.js >= 18.0.0
- ✅ PostgreSQL database (bisa dari hosting provider)
- ✅ Connection string PostgreSQL

---

## 🚀 Cara Setup PostgreSQL

### Opsi 1: Railway (Recommended - Gratis)

1. **Buat akun di Railway.app**
   ```
   https://railway.app
   ```

2. **Create New Project → Add PostgreSQL**
   - Railway akan otomatis provision database PostgreSQL
   - Dapatkan connection string dari tab "Connect"

3. **Copy Connection String**
   ```
   Format: postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```

4. **Paste ke .env file**
   ```bash
   DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```

### Opsi 2: Supabase (Gratis dengan fitur tambahan)

1. **Buat akun di Supabase**
   ```
   https://supabase.com
   ```

2. **Create New Project**
   - Pilih region terdekat (Singapore untuk Indonesia)
   - Set database password

3. **Dapatkan Connection String**
   - Go to Settings → Database
   - Copy "Connection String" (pilih mode "Session")
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

4. **Update .env file**
   ```bash
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

### Opsi 3: Vercel Postgres

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Link project**
   ```bash
   vercel link
   ```

3. **Add Postgres**
   ```bash
   vercel postgres create
   ```

4. **Pull environment variables**
   ```bash
   vercel env pull .env
   ```

---

## 📦 Langkah Migrasi

### Step 1: Backup Database SQLite (PENTING!)

```bash
# Backup database saat ini
cp src/database/db.sqlite src/database/db.sqlite.backup
```

### Step 2: Setup PostgreSQL Database

Pilih salah satu provider di atas dan dapatkan `DATABASE_URL`.

### Step 3: Update .env File

```bash
# .env file
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_secret_key_here
PORT=3000
```

### Step 4: Create Schema di PostgreSQL

Jalankan file SQL untuk create tables:

**Cara 1: Via psql Command Line**
```bash
psql "postgresql://user:password@host:5432/database" < src/migrations/postgresql-schema.sql
```

**Cara 2: Via Hosting Provider Dashboard**
- Railway: Go to PostgreSQL → Query → Paste isi file `postgresql-schema.sql` → Execute
- Supabase: Go to SQL Editor → New query → Paste SQL → Run

**Cara 3: Via DBeaver/pgAdmin**
- Connect ke PostgreSQL database
- Open SQL editor
- Paste isi file `postgresql-schema.sql`
- Execute

### Step 5: Migrate Data dari SQLite ke PostgreSQL

```bash
# Ensure DATABASE_URL is set in .env first
node src/migrations/migrate-to-postgres.js
```

Output yang diharapkan:
```
🚀 Starting migration from SQLite to PostgreSQL...
✅ PostgreSQL connection successful

📊 Migrating table: sekolah
  Found 256 rows
  ✅ Migrated 256 rows

📊 Migrating table: siswa
  Found 15432 rows
  ✅ Migrated 15432 rows

...

🎉 Migration completed successfully!
📈 Total rows migrated: 25000
```

### Step 6: Testing

```bash
# Test aplikasi dengan PostgreSQL
npm start
```

Aplikasi akan otomatis detect PostgreSQL dan menggunakannya.

Cek log saat startup:
```
🐘 Using PostgreSQL (Supabase) database
✅ Connected to Supabase PostgreSQL
Server backend berjalan di http://localhost:3000
```

### Step 7: Verify Data

1. Login ke aplikasi
2. Cek apakah data sekolah muncul
3. Cek apakah data siswa muncul
4. Test CRUD operations (Create, Read, Update, Delete)

---

## 🔄 Rollback ke SQLite

Jika ada masalah dengan PostgreSQL:

1. **Comment atau hapus DATABASE_URL dari .env**
   ```bash
   # DATABASE_URL=postgresql://...
   ```

2. **Restart aplikasi**
   ```bash
   npm start
   ```

3. **Restore backup jika perlu**
   ```bash
   cp src/database/db.sqlite.backup src/database/db.sqlite
   ```

Aplikasi akan otomatis kembali menggunakan SQLite.

---

## 🛠️ Troubleshooting

### Error: "DATABASE_URL not set in production"

**Solusi:**
- Pastikan .env file ada dan berisi DATABASE_URL
- Restart aplikasi setelah update .env

### Error: "Connection timeout"

**Solusi:**
- Cek apakah PostgreSQL server running
- Cek firewall/network settings
- Verifikasi connection string benar (username, password, host, port)

### Error: "relation does not exist"

**Solusi:**
- Jalankan postgresql-schema.sql terlebih dahulu
- Pastikan semua tables sudah dibuat di PostgreSQL

### Error: "SSL connection required"

**Solusi:**
- Tambahkan `?sslmode=require` di akhir DATABASE_URL
- Atau update connection string:
  ```
  DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
  ```

### Data tidak muncul setelah migrasi

**Solusi:**
1. Cek apakah migration script selesai tanpa error
2. Verify data di PostgreSQL:
   ```sql
   SELECT COUNT(*) FROM sekolah;
   SELECT COUNT(*) FROM siswa;
   ```
3. Cek log aplikasi untuk error

---

## 📊 Performance Tips

### 1. Enable Connection Pooling (Sudah aktif)

File `src/database/supabase-db.js` sudah menggunakan connection pooling:
```javascript
max: 20, // Maximum 20 connections
idleTimeoutMillis: 30000,
connectionTimeoutMillis: 2000
```

### 2. Add Indexes (Sudah ada)

Schema PostgreSQL sudah include indexes untuk performa optimal.

### 3. Regular Maintenance

Untuk production, jalankan vacuum secara berkala:
```sql
VACUUM ANALYZE;
```

### 4. Monitor Queries

Gunakan tools seperti:
- pgAdmin
- DBeaver
- Supabase Dashboard (untuk monitoring real-time)

---

## 🔐 Security Best Practices

### 1. Jangan Commit DATABASE_URL

File `.gitignore` sudah include `.env`, pastikan tidak di-commit:
```bash
git status  # .env seharusnya tidak muncul
```

### 2. Gunakan Environment Variables di Hosting

Untuk Railway/Vercel/Heroku, set DATABASE_URL via dashboard, bukan hardcode.

### 3. Rotate Credentials

Ganti password database secara berkala (3-6 bulan sekali).

### 4. Enable SSL

Pastikan connection string menggunakan SSL untuk production.

---

## 📞 Bantuan

Jika menemui masalah:

1. **Cek log aplikasi** untuk error messages
2. **Verify connection string** benar
3. **Test connection** ke PostgreSQL via tool seperti DBeaver
4. **Rollback ke SQLite** jika urgent

---

## ✅ Checklist Migrasi

- [ ] Backup database SQLite
- [ ] Setup PostgreSQL di hosting provider
- [ ] Dapatkan DATABASE_URL
- [ ] Update .env file
- [ ] Run postgresql-schema.sql
- [ ] Run migrate-to-postgres.js
- [ ] Test aplikasi
- [ ] Verify data
- [ ] Test CRUD operations
- [ ] Monitor error logs
- [ ] Keep SQLite backup selama 1-2 minggu

---

**Status:** ✅ Migrasi selesai!

Aplikasi E-Ijazah sekarang siap di-deploy ke production dengan PostgreSQL! 🚀
