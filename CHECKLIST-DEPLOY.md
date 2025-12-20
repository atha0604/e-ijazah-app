# ✅ Checklist Deploy E-Ijazah ke Render

Print atau buka checklist ini saat deploy untuk memastikan tidak ada yang terlewat.

---

## 📦 PRE-DEPLOYMENT

### Local Setup
- [ ] Backup database SQLite: `cp src/database/db.sqlite src/database/db.sqlite.backup`
- [ ] Check .env tidak ter-commit: `git status` (pastikan .env tidak muncul)
- [ ] Test aplikasi lokal running: `npm start`
- [ ] All changes committed: `git status` (should be clean)
- [ ] Push to GitHub: `git push origin main`

---

## 🌐 RENDER ACCOUNT SETUP

### Step 1: Accounts
- [ ] Punya akun GitHub (https://github.com)
- [ ] Login/daftar Render (https://render.com)
- [ ] Connect Render dengan GitHub
- [ ] Authorize Render untuk access repository

---

## 🗄️ DATABASE SETUP

### Step 2: PostgreSQL Database
- [ ] New + → PostgreSQL
- [ ] Name: `e-ijazah-db`
- [ ] Database: `e_ijazah`
- [ ] User: `e_ijazah_user`
- [ ] Region: `Singapore`
- [ ] Plan: `Free`
- [ ] Create Database
- [ ] **TUNGGU** status = "Available" (hijau)
- [ ] **COPY** Internal Database URL ke notepad
  ```
  Format: postgresql://user:pass@host.oregon-postgres.render.com/dbname
  ```

---

## 🚀 WEB SERVICE DEPLOYMENT

### Step 3: Web Service
- [ ] New + → Web Service
- [ ] Build and deploy from Git repository
- [ ] Connect repository: `e-ijazah-app`
- [ ] Name: `e-ijazah-app`
- [ ] Region: `Singapore` (sama dengan database!)
- [ ] Branch: `main`
- [ ] Environment: `Node`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Plan: `Free`

### Step 4: Environment Variables
Tambahkan 3 variables ini:

- [ ] **Variable 1:**
  ```
  Key: NODE_ENV
  Value: production
  ```

- [ ] **Variable 2:**
  ```
  Key: DATABASE_URL
  Value: [PASTE dari Step 2 - Internal URL]
  ```

- [ ] **Variable 3:**
  ```
  Key: JWT_SECRET
  Value: [Generate dengan: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
  ```

### Step 5: Advanced Settings
- [ ] Auto-Deploy: `Yes`
- [ ] Health Check Path: `/api`

### Step 6: Deploy
- [ ] Klik "Create Web Service"
- [ ] **TUNGGU** 3-5 menit
- [ ] Monitor Logs untuk error
- [ ] Status = "Live" (hijau)
- [ ] **COPY** URL aplikasi (format: https://e-ijazah-app.onrender.com)

---

## 📊 DATABASE SCHEMA SETUP

### Step 7: Create Tables
- [ ] Buka file lokal: `src/migrations/postgresql-schema.sql`
- [ ] Copy SEMUA isinya (Ctrl+A, Ctrl+C)

**Option A: Via Render Shell**
- [ ] Buka service e-ijazah-db di Render
- [ ] Klik tab "Shell" atau "Access"
- [ ] Paste SQL dan Execute

**Option B: Via DBeaver**
- [ ] Install DBeaver dari https://dbeaver.io
- [ ] New Connection → PostgreSQL
- [ ] Paste External Database URL
- [ ] Test Connection → Connect
- [ ] New SQL Editor → Paste SQL → Execute (Ctrl+Enter)

### Step 8: Verify Tables
- [ ] Run query: `\dt` atau `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
- [ ] Harus ada 10 tables:
  - [ ] users
  - [ ] sekolah
  - [ ] siswa
  - [ ] nilai
  - [ ] settings
  - [ ] skl_photos
  - [ ] mulok_names
  - [ ] notifications
  - [ ] notification_reads
  - [ ] audit_logs

---

## 📤 DATA MIGRATION (Opsional - Jika ada data di SQLite)

### Step 9: Migrate Data
- [ ] Update `.env` lokal dengan **External Database URL** dari Render
  ```
  DATABASE_URL=postgresql://...  (External URL)
  ```
- [ ] Run migration: `npm run migrate`
- [ ] Verify output: "Migration completed successfully"
- [ ] Check jumlah rows di PostgreSQL match dengan SQLite

---

## 🧪 TESTING

### Step 10: Test Aplikasi Live
- [ ] Buka URL Render: `https://e-ijazah-app.onrender.com`
- [ ] Page load (mungkin lambat pertama kali - cold start)
- [ ] Redirect ke `/E-ijazah.html`
- [ ] Test login admin:
  - [ ] Kode: `admin`
  - [ ] Kurikulum: pilih salah satu
  - [ ] Klik Login
- [ ] Dashboard admin muncul
- [ ] No error di browser console (F12)

### Step 11: Test CRUD
- [ ] Import data sekolah (jika ada Excel)
- [ ] Tambah siswa manual
- [ ] Edit data siswa
- [ ] Lihat daftar siswa
- [ ] Test search/filter
- [ ] Test export PDF (jika ada fitur)

### Step 12: Test Real-time Features
- [ ] Buka 2 browser windows (admin + sekolah)
- [ ] Test notifikasi broadcast
- [ ] Test real-time updates (jika aktif)

---

## 🔒 SECURITY CHECK

### Step 13: Security Verification
- [ ] .env tidak ter-commit di GitHub
  ```bash
  git log --all -- .env  # Should return nothing
  ```
- [ ] DATABASE_URL tidak visible di logs Render
- [ ] JWT_SECRET random dan strong (min 64 characters)
- [ ] No sensitive data di error messages
- [ ] CORS origin updated (optional - ubah dari `*` ke domain spesifik)

---

## 📊 POST-DEPLOYMENT

### Step 14: Monitoring Setup
- [ ] Bookmark Render Dashboard
- [ ] Bookmark Logs page
- [ ] Bookmark Database dashboard
- [ ] Setup email notifications (Settings → Notifications)
- [ ] Test restart service: Manual Deploy → Deploy

### Step 15: Documentation
- [ ] Save DATABASE_URL (encrypted/safe place)
- [ ] Save JWT_SECRET (encrypted/safe place)
- [ ] Save admin login credentials
- [ ] Document URL aplikasi
- [ ] Share URL dengan tim/sekolah

### Step 16: Backup Strategy
- [ ] Verify Render auto-backup enabled (7 days retention di free tier)
- [ ] Setup manual backup schedule (opsional):
  ```bash
  pg_dump DATABASE_URL > backup-$(date +%Y%m%d).sql
  ```
- [ ] Keep SQLite backup lokal selama 2 minggu
- [ ] Test restore dari backup (opsional tapi recommended)

---

## 🎯 OPTIONAL ENHANCEMENTS

### Performance
- [ ] Setup custom domain (Render Settings → Custom Domains)
- [ ] Enable HTTPS (auto di Render)
- [ ] Setup CDN untuk static files (opsional)

### Monitoring
- [ ] Setup uptime monitoring (uptimerobot.com - gratis)
- [ ] Setup error tracking (sentry.io - free tier)
- [ ] Configure alerting untuk downtime

### Scaling
- [ ] Evaluate need untuk paid plan:
  - [ ] WebSocket issues? → Upgrade to Starter ($7/month)
  - [ ] Slow cold starts? → Upgrade to Starter
  - [ ] Database > 90 days? → Keep PostgreSQL ($7/month)

---

## ❌ TROUBLESHOOTING CHECKLIST

Jika ada masalah, check ini satu-per-satu:

### Aplikasi Tidak Load
- [ ] Status service = "Live" di Render?
- [ ] Check Logs untuk error
- [ ] Environment variables set correct?
- [ ] Database status = "Available"?
- [ ] PORT env variable correct atau auto-set?

### Login Gagal
- [ ] JWT_SECRET di-set?
- [ ] Database has 'users' table?
- [ ] Check Logs untuk error
- [ ] Browser console errors? (F12)

### Database Connection Error
- [ ] DATABASE_URL format correct?
- [ ] Using Internal URL (bukan External)?
- [ ] Database status = "Available"?
- [ ] Tables sudah dibuat?
- [ ] Test connection via DBeaver

### Data Tidak Muncul
- [ ] Migration script selesai tanpa error?
- [ ] Verify data di PostgreSQL:
  ```sql
  SELECT COUNT(*) FROM sekolah;
  SELECT COUNT(*) FROM siswa;
  ```
- [ ] Check foreign key constraints
- [ ] Check application logs

---

## 🎉 COMPLETION

### Final Checks
- [ ] Aplikasi accessible via public URL
- [ ] Login working
- [ ] Data showing correctly
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Security checklist completed
- [ ] Documentation saved
- [ ] Team/users notified

---

## 📝 DEPLOYMENT INFO

**Deployment Date:** _______________
**Deployed By:** _______________
**URL:** https://_______________
**Database:** PostgreSQL @ Render
**Status:** ☐ Development  ☐ Staging  ☑ Production

**Notes:**
_________________________________________
_________________________________________
_________________________________________

---

**🎊 CONGRATULATIONS! Your E-Ijazah app is now LIVE!**

Print tanggal: _______________
Checklist completed by: _______________
