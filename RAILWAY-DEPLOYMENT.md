# 🚂 Railway Deployment Guide

## ⚠️ PENTING: SQLite Database Issue

**Railway menggunakan ephemeral filesystem** - artinya database SQLite Anda akan **HILANG setiap kali redeploy!**

### Solusi Ada 2 Pilihan:

#### **OPSI A: Gunakan Railway PostgreSQL (RECOMMENDED)**
1. Add PostgreSQL di Railway dashboard
2. Migrate code dari SQLite ke PostgreSQL
3. Data aman permanent

#### **OPSI B: Gunakan Railway Volume**
1. Attach persistent volume di Railway
2. Mount ke `/data` directory
3. Update database path ke `/data/db.sqlite`

---

## 📋 Step-by-Step Deployment

### 1. Setup Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project (jika sudah ada)
railway link

# Atau create new project
railway init
```

### 2. Set Environment Variables

Di Railway Dashboard, set variables berikut:

```env
NODE_ENV=production
JWT_SECRET=your-very-long-random-secret-key-change-this
PORT=3000
```

### 3. Deploy

```bash
# Deploy dari GitHub (automatic)
# Atau deploy manual:
railway up
```

### 4. Check Logs

```bash
railway logs
```

---

## 🔧 Troubleshooting

### Build Failed: "Cannot find module 'sqlite3'"

**Penyebab:** Native build gagal

**Solusi:**
- File `.npmrc` sudah dibuat untuk download prebuilt binaries
- Pastikan `nixpacks.toml` ada di root directory

### Database Error: "SQLITE_CANTOPEN"

**Penyebab:** Database file tidak bisa dibuat/diakses

**Solusi:**
```javascript
// Update database path di src/database/database.js
const dbPath = process.env.DATABASE_PATH ||
               path.join(__dirname, '..', 'database', 'db.sqlite');
```

### App Crashes After Deploy

**Cek logs:**
```bash
railway logs --tail 100
```

**Common issues:**
- Missing JWT_SECRET
- Database migration failed
- Port already in use

---

## 📊 Recommended Setup (PostgreSQL)

### Install pg package:
```bash
npm install pg
```

### Update database connection:
```javascript
// src/database/db-config.js
const db = process.env.DATABASE_URL
  ? require('./postgres-connection')  // PostgreSQL for production
  : require('./sqlite-connection');   // SQLite for development
```

---

## 🌐 Access Your App

Setelah deploy berhasil, Railway akan berikan URL:
```
https://your-app-name.up.railway.app
```

---

## 💡 Tips

1. **Use PostgreSQL** untuk production (gratis di Railway)
2. **Enable auto-deploy** dari GitHub untuk continuous deployment
3. **Monitor logs** regularly untuk catch errors early
4. **Set up health check** endpoint untuk monitoring

---

## 🆘 Need Help?

- Railway Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/atha0604/e-ijazah-app/issues
