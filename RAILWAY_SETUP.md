# Railway Setup Guide - E-Ijazah App

## 🚨 Kenapa Data Import Tidak Tampil di Railway?

### Masalah:
- Import sekolah menunjukkan "berhasil" tetapi data tidak muncul (0 item)
- Data hilang setelah deploy atau restart container
- SQLite database tidak persisten di Railway

### Penyebab:
Railway menggunakan **ephemeral filesystem** (temporary storage):
- ❌ File `db.sqlite` akan **direset setiap deploy**
- ❌ Database **kosong lagi** setelah container restart
- ❌ Tidak ada persistent storage untuk SQLite

### Solusi:
**Gunakan PostgreSQL Database di Railway** ✅

PostgreSQL di Railway memiliki:
- ✅ Persistent storage (data tidak hilang)
- ✅ Better performance untuk production
- ✅ Automatic backups
- ✅ Free tier tersedia (500MB storage)

---

## 📋 Step-by-Step Setup PostgreSQL di Railway

### Step 1: Login ke Railway Dashboard

1. Buka https://railway.app/
2. Login dengan akun GitHub Anda
3. Pilih project: **bountiful-warmth** (E-Ijazah App)

### Step 2: Tambah PostgreSQL Database

1. Di Dashboard Project, klik tombol **"+ New"**
2. Pilih **"Database"**
3. Pilih **"Add PostgreSQL"**
4. Railway akan otomatis:
   - Create PostgreSQL instance
   - Generate DATABASE_URL environment variable
   - Link ke project Anda

**Screenshot yang akan Anda lihat:**
```
┌─────────────────────────────────┐
│  + New                          │
├─────────────────────────────────┤
│  > Empty Service                │
│  > Database                     │
│    ├─ PostgreSQL  ← PILIH INI  │
│    ├─ MySQL                     │
│    ├─ MongoDB                   │
│    └─ Redis                     │
│  > Template                     │
└─────────────────────────────────┘
```

### Step 3: Verify PostgreSQL Connection

Setelah PostgreSQL ter-create:

1. Klik pada **PostgreSQL service** yang baru dibuat
2. Di tab **"Variables"**, Anda akan melihat:
   - `DATABASE_URL` (otomatis ter-generate)
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`

**✅ Jika sudah ada `DATABASE_URL`, berarti PostgreSQL sudah siap!**

### Step 4: Redeploy Aplikasi

Aplikasi sudah diupdate untuk otomatis detect PostgreSQL:

1. Kembali ke service **web** (aplikasi E-Ijazah)
2. Klik tab **"Deployments"**
3. Klik tombol **"Redeploy"** pada deployment terbaru

**Atau push kode baru ke GitHub** (deployment otomatis):
```bash
git add .
git commit -m "Setup PostgreSQL for Railway"
git push origin main
```

Railway akan otomatis:
- ✅ Detect `DATABASE_URL` environment variable
- ✅ Initialize PostgreSQL schema
- ✅ Migrate from SQLite to PostgreSQL mode
- ✅ Run aplikasi dengan PostgreSQL

---

## 🔍 Verify Setup Berhasil

### Check Deployment Logs

Di Railway Dashboard:
1. Klik service **web** (aplikasi)
2. Klik tab **"Deployments"**
3. Klik deployment terbaru
4. Lihat **logs**, cari baris ini:

```
✅ PostgreSQL detected - initializing PostgreSQL schema...
📦 Using POSTGRES database
✅ Table "sekolah" created
✅ Table "siswa" created
✅ Table "nilai" created
...
🎉 PostgreSQL schema initialization completed successfully!
```

### Test Import Sekolah

1. Buka aplikasi: https://web-ijazah-aplikasi-nilai-eijazah.up.railway.app/
2. Login sebagai **Admin**
3. Pergi ke **Database Sekolah**
4. Klik **"Import Excel"**
5. Upload file Excel sekolah

**Expected Result:**
- ✅ Notifikasi: "Import sekolah berhasil!"
- ✅ Data **langsung muncul** di tabel
- ✅ Refresh halaman → data **tetap ada** (tidak hilang)

---

## 🛠️ Troubleshooting

### Problem: DATABASE_URL tidak muncul

**Solution:**
1. Pastikan PostgreSQL service sudah ter-create
2. Check di tab **"Variables"** pada web service
3. Jika tidak ada, tambahkan secara manual:
   ```
   Name: DATABASE_URL
   Value: postgresql://username:password@host:5432/database
   ```
   (Copy dari PostgreSQL service → Variables → DATABASE_URL)

### Problem: Migration error saat deploy

**Solution:**
```bash
# Manual run migration
railway run npm run migrate:postgres
```

### Problem: Data masih tidak muncul

**Check:**
1. Pastikan `DATABASE_URL` sudah ada di environment variables
2. Check logs untuk error messages
3. Pastikan deployment berhasil (status: Active)
4. Clear browser cache dan refresh

---

## 📊 Database Comparison

| Feature | SQLite (Local) | PostgreSQL (Railway) |
|---------|---------------|----------------------|
| Persistent Storage | ✅ Yes | ✅ Yes |
| Production Ready | ❌ No (for cloud) | ✅ Yes |
| Auto Backups | ❌ Manual | ✅ Automatic |
| Concurrent Users | ⚠️ Limited | ✅ Unlimited |
| Cloud Deployment | ❌ Not recommended | ✅ Recommended |
| Performance | ⚠️ File-based | ✅ Optimized |

---

## 🎯 Summary

1. **PostgreSQL sudah disetup di kode** ✅
2. **Tinggal tambah PostgreSQL service di Railway dashboard** 📝
3. **Redeploy aplikasi** 🚀
4. **Data akan persisten dan tidak hilang lagi!** 🎉

### Next Steps:

1. [ ] Tambah PostgreSQL database di Railway dashboard
2. [ ] Verify `DATABASE_URL` environment variable
3. [ ] Redeploy aplikasi
4. [ ] Test import sekolah
5. [ ] Verify data persisten setelah refresh

---

## 📞 Need Help?

Jika masih ada masalah:
1. Screenshot error logs dari Railway
2. Check Railway deployment status
3. Verify PostgreSQL service is running (Active status)

**Railway Free Tier Limits:**
- PostgreSQL: 500 MB storage
- 5 GB bandwidth/month
- Shared CPU
- Cukup untuk testing dan small-scale production!

---

**Generated with Claude Code** 🤖
