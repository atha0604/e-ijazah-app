# 🚀 Panduan Deploy ke Render.com - LENGKAP & MUDAH

Panduan ini akan membantu Anda deploy aplikasi E-Ijazah ke **Render.com** dari NOL sampai LIVE dalam **15-20 menit**!

---

## 📋 Yang Anda Butuhkan

✅ Akun GitHub (gratis)
✅ Akun Render.com (gratis)
✅ Repository aplikasi sudah di push ke GitHub
✅ 15-20 menit waktu

---

## 🎯 STEP 1: Persiapan Repository GitHub

### 1.1 Check Apakah .env Sudah di-ignore

```bash
# Di terminal, jalankan:
git status

# Pastikan .env TIDAK muncul di list
# Jika muncul, berarti belum di-ignore (BAHAYA!)
```

**Jika .env muncul di git status:**
```bash
# Hapus dari tracking Git
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### 1.2 Commit & Push Semua Perubahan

```bash
# Check perubahan
git status

# Add semua file (kecuali .env)
git add .

# Commit
git commit -m "Setup for Render deployment with PostgreSQL"

# Push ke GitHub
git push origin main
```

**PENTING:** Pastikan push ke branch `main` atau `master` (sesuai repo Anda)

---

## 🎯 STEP 2: Buat Akun Render & Setup PostgreSQL

### 2.1 Daftar di Render.com

1. Buka https://render.com
2. Klik **"Get Started"** atau **"Sign Up"**
3. **Sign up with GitHub** (recommended - lebih mudah)
4. Authorize Render untuk akses repository Anda

### 2.2 Buat PostgreSQL Database DULU

**PENTING: Database harus dibuat SEBELUM web service!**

1. Di dashboard Render, klik **"New +"** → **"PostgreSQL"**

2. Isi form:
   ```
   Name: e-ijazah-db
   Database: e_ijazah
   User: e_ijazah_user
   Region: Singapore (paling dekat untuk Indonesia)
   Plan: Free
   ```

3. Klik **"Create Database"**

4. **TUNGGU 2-3 MENIT** sampai status jadi **"Available"** (hijau)

5. **COPY CONNECTION STRING:**
   - Scroll ke bawah, cari section **"Connections"**
   - Copy **"Internal Database URL"** (yang panjang, bukan External)
   - Format: `postgresql://e_ijazah_user:xxx@xxx.oregon-postgres.render.com/e_ijazah`
   - **SIMPAN DI NOTEPAD** - kita akan pakai nanti

---

## 🎯 STEP 3: Deploy Web Application

### 3.1 Create Web Service

1. Kembali ke Render Dashboard
2. Klik **"New +"** → **"Web Service"**

### 3.2 Connect Repository

1. Pilih **"Build and deploy from a Git repository"**
2. Klik **"Next"**
3. Cari repository **"e-ijazah-app"** (atau nama repo Anda)
4. Klik **"Connect"**

### 3.3 Configure Service

Isi form dengan **PERSIS** seperti ini:

```
Name: e-ijazah-app
Region: Singapore (sama dengan database)
Branch: main (atau master, sesuai repo Anda)
Root Directory: (kosongkan)
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### 3.4 Setup Environment Variables

**INI BAGIAN PALING PENTING!**

Scroll ke bawah ke section **"Environment Variables"**, klik **"Add Environment Variable"** dan tambahkan **3 variabel** ini:

**Variable 1:**
```
Key: NODE_ENV
Value: production
```

**Variable 2:**
```
Key: DATABASE_URL
Value: [PASTE CONNECTION STRING DARI STEP 2.5]
```
Contoh: `postgresql://e_ijazah_user:longpassword@dpg-xxx.oregon-postgres.render.com/e_ijazah`

**Variable 3:**
```
Key: JWT_SECRET
Value: [GENERATE RANDOM STRING PANJANG]
```

**Cara generate JWT_SECRET:**
```bash
# Di terminal lokal, jalankan salah satu:

# Option 1: Menggunakan Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Copy dari .env lokal Anda (yang sudah ada)
cat .env | grep JWT_SECRET
```

### 3.5 Advanced Settings (OPSIONAL tapi Recommended)

Klik **"Advanced"** dan setting:

```
Auto-Deploy: Yes (agar auto deploy setiap kali push ke GitHub)
Health Check Path: /api
```

### 3.6 Deploy!

1. Klik **"Create Web Service"**
2. **TUNGGU 3-5 MENIT** - Render akan:
   - Clone repository
   - Install dependencies (`npm install`)
   - Start server (`npm start`)

3. Lihat **Logs** real-time di dashboard

---

## 🎯 STEP 4: Setup Database Schema

**SETELAH** web service running (status **"Live"**), kita perlu create tables di PostgreSQL.

### 4.1 Connect ke PostgreSQL Database

**Option A: Via Render Dashboard (Recommended)**

1. Buka service **e-ijazah-db** di Render
2. Klik tab **"Shell"** atau **"Access"**
3. Klik **"Connect"** untuk buka psql shell

**Option B: Via DBeaver / pgAdmin**

1. Install DBeaver (gratis): https://dbeaver.io/download/
2. Create New Connection → PostgreSQL
3. Paste connection string dari Step 2.5
4. Test Connection → OK → Connect

### 4.2 Run Migration SQL

1. **Buka file lokal:** `src/migrations/postgresql-schema.sql`
2. **Copy SEMUA isinya** (Ctrl+A, Ctrl+C)
3. **Paste ke SQL editor** (Render Shell atau DBeaver)
4. **Execute / Run**

**Via Render Shell:**
```sql
-- Paste semua isi postgresql-schema.sql di sini
-- Lalu tekan Enter
```

**Via DBeaver:**
- New SQL Editor → Paste → Execute (Ctrl+Enter)

5. **Verify tables dibuat:**
```sql
-- Check tables
\dt
-- atau
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Harus muncul 10 tables:
- users
- sekolah
- siswa
- nilai
- settings
- skl_photos
- mulok_names
- notifications
- notification_reads
- audit_logs

---

## 🎯 STEP 5: Migrate Data dari SQLite ke PostgreSQL

**HANYA JIKA Anda punya data di SQLite yang ingin dipindahkan.**

### 5.1 Setup DATABASE_URL Lokal

Update file `.env` lokal Anda:

```bash
# .env
DATABASE_URL=postgresql://e_ijazah_user:xxx@xxx.oregon-postgres.render.com/e_ijazah
JWT_SECRET=your_jwt_secret
```

**IMPORTANT:** Gunakan **External Database URL** (bukan Internal) untuk migrasi dari lokal.

Cara dapatkan External URL:
1. Buka e-ijazah-db di Render
2. Section "Connections"
3. Copy **"External Database URL"**

### 5.2 Run Migration Script

```bash
# Di terminal lokal
npm run migrate
```

Akan muncul:
```
🚀 Starting migration from SQLite to PostgreSQL...
✅ PostgreSQL connection successful

📊 Migrating table: sekolah
  Found 256 rows
  ✅ Migrated 256 rows
...
🎉 Migration completed successfully!
```

---

## 🎯 STEP 6: Test Aplikasi

### 6.1 Buka URL Render

1. Di Render Dashboard, lihat URL aplikasi Anda
   - Format: `https://e-ijazah-app.onrender.com`
2. Copy URL tersebut
3. Buka di browser

### 6.2 Test Login

1. Aplikasi akan redirect ke `/E-ijazah.html`
2. Test login dengan kode admin:
   - Kode Aplikasi: `admin`
   - Kurikulum: pilih salah satu
3. Klik Login

**Jika berhasil:**
✅ Redirect ke dashboard admin
✅ Tidak ada error di console

**Jika gagal:**
❌ Check logs di Render Dashboard → Logs tab

### 6.3 Test CRUD Operations

1. Login sebagai admin
2. Test import data sekolah
3. Test tambah siswa
4. Test lihat data

---

## 🎯 STEP 7: Setup Custom Domain (OPSIONAL)

Jika ingin pakai domain sendiri (bukan onrender.com):

1. Buka service **e-ijazah-app** di Render
2. Tab **"Settings"** → scroll ke **"Custom Domains"**
3. Klik **"Add Custom Domain"**
4. Masukkan domain Anda (contoh: `e-ijazah.sekolah.com`)
5. Render akan berikan CNAME record
6. Tambahkan CNAME record di DNS provider Anda (Cloudflare, Namecheap, dll)
7. Tunggu DNS propagation (5-30 menit)

---

## 🛠️ Troubleshooting

### ❌ Error: "Application failed to respond"

**Penyebab:** Server crash atau PORT salah

**Solusi:**
1. Check logs di Render Dashboard
2. Pastikan `PORT` environment variable = `10000` (Render default)
3. Atau hapus PORT env variable (biarkan Render auto-set)

### ❌ Error: "Cannot connect to database"

**Penyebab:** DATABASE_URL salah atau database belum ready

**Solusi:**
1. Verify DATABASE_URL di Environment Variables
2. Pastikan database status = "Available" (hijau)
3. Test connection via DBeaver
4. Gunakan **Internal Database URL** (bukan External)

### ❌ Error: "relation does not exist"

**Penyebab:** Tables belum dibuat di PostgreSQL

**Solusi:**
1. Run `postgresql-schema.sql` di database (Step 4.2)
2. Verify dengan `\dt` di psql

### ❌ Error: "Unauthorized" atau Login Gagal

**Penyebab:** JWT_SECRET tidak sama atau tidak di-set

**Solusi:**
1. Check JWT_SECRET di Render Environment Variables
2. Pastikan sama dengan yang di .env lokal (jika migrasi data)
3. Atau generate baru dan test login dari awal

### ❌ WebSocket/Socket.IO Tidak Jalan

**Penyebab:** Render free tier tidak support WebSocket dengan baik

**Solusi:**
1. Upgrade ke Render **Starter plan** ($7/month) untuk WebSocket support
2. Atau disable WebSocket features sementara
3. Atau deploy ke Railway (support WebSocket di free tier)

### ❌ Aplikasi Sleep/Lambat di Free Tier

**Penyebab:** Render free tier sleep setelah 15 menit idle

**Solusi:**
1. Tunggu 30-60 detik saat pertama akses (cold start)
2. Upgrade ke Starter plan untuk always-on
3. Atau setup cron job untuk keep-alive (ping setiap 10 menit)

---

## 📊 Monitoring & Logs

### Cara Lihat Logs

1. Buka service di Render Dashboard
2. Tab **"Logs"**
3. Real-time logs akan muncul

### Cara Lihat Metrics

1. Tab **"Metrics"**
2. Lihat CPU, Memory, Network usage

### Cara Restart Service

1. Tab **"Manual Deploy"**
2. Klik **"Clear build cache & deploy"**

---

## 🔒 Security Checklist

Setelah deploy, pastikan:

- ✅ `.env` tidak ter-commit ke Git
- ✅ DATABASE_URL tidak visible di logs
- ✅ JWT_SECRET strong dan random
- ✅ CORS origin di-set ke domain spesifik (bukan `*`)
- ✅ Rate limiting aktif untuk login endpoint
- ✅ Database backup otomatis (Render free tier backup 7 hari)

---

## 🎉 SELESAI!

Aplikasi E-Ijazah Anda sekarang **LIVE di internet**! 🚀

**URL Anda:**
```
https://e-ijazah-app.onrender.com
```

**Next Steps:**
1. Share URL dengan sekolah-sekolah
2. Monitor logs untuk error
3. Setup custom domain (opsional)
4. Upgrade ke paid plan jika perlu (untuk better performance)

---

## 💰 Biaya

**Render Free Tier:**
- Web Service: Gratis (dengan sleep setelah 15 min idle)
- PostgreSQL: Gratis untuk 90 hari, lalu $7/month
- Bandwidth: 100GB/month gratis

**Jika Butuh Always-On:**
- Web Service Starter: $7/month
- PostgreSQL: $7/month
- **Total: $14/month**

Masih lebih murah dari 1 juta/tahun! 😊

---

## 📞 Butuh Bantuan?

Jika ada error atau stuck:
1. Check logs di Render Dashboard → Logs
2. Verify DATABASE_URL correct
3. Test database connection via DBeaver
4. Check semua environment variables

**Happy Deploying! 🎊**
