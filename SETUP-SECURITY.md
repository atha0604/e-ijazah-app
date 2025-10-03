# ⚡ Quick Security Setup Guide

## Setup Aplikasi E-Ijazah dengan Konfigurasi Aman

---

## 🚀 3 Langkah Setup (5 Menit)

### 1️⃣ Generate JWT Secret

```bash
node generate-jwt-secret.js
```

**Output:**
```
================================================================================
JWT SECRET GENERATOR - Aplikasi Nilai E-Ijazah
================================================================================

✅ Secure JWT Secret generated successfully!

Your JWT_SECRET:
--------------------------------------------------------------------------------
a1b2c3d4e5f6... (128 characters)
--------------------------------------------------------------------------------

📝 Creating .env file from .env.example...
✅ .env file created successfully!
```

### 2️⃣ Konfigurasi Production Domain

Edit `.env` dan tambahkan domain production:

```bash
# .env
JWT_SECRET=<sudah_di_generate_otomatis>

# PENTING: Tambahkan domain production Anda!
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

NODE_ENV=production
```

### 3️⃣ Install & Run

```bash
npm install
npm start
```

**Server akan validate security config saat startup:**

✅ **Jika OK:**
```
Server backend berjalan di http://localhost:3000
```

❌ **Jika Ada Masalah:**
```
================================================================================
CRITICAL SECURITY ERROR: JWT_SECRET is not configured!
Please set a secure JWT_SECRET in your .env file.
Generate one using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
================================================================================
```

---

## 🔍 Troubleshooting

### Problem: Server tidak mau start

**Solusi 1: JWT_SECRET belum di-set**
```bash
node generate-jwt-secret.js
```

**Solusi 2: .env file tidak ada**
```bash
cp .env.example .env
node generate-jwt-secret.js --force
```

### Problem: CORS Error di browser

**Gejala:**
```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:3001'
has been blocked by CORS policy
```

**Solusi:**
Edit `.env` dan tambahkan origin yang di-block:
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

Restart server.

### Problem: JWT Token Invalid setelah restart

**Penyebab:** JWT_SECRET berubah

**Solusi:**
- Users harus login ulang
- Ini NORMAL behavior untuk security
- Gunakan JWT_SECRET yang sama untuk avoid logout paksa

---

## 📋 Checklist Deployment

### Local Development ✅
```bash
# .env
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Staging ✅
```bash
# .env
NODE_ENV=production
CORS_ORIGINS=https://staging.yourdomain.com
```

### Production ✅
```bash
# .env
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 🔐 File yang TIDAK BOLEH di-commit

```bash
# ❌ JANGAN COMMIT INI:
.env
*.sqlite
*.sqlite3
*.db
src/database/db.sqlite
src/database/db.json

# ✅ YANG BOLEH DI-COMMIT:
.env.example
generate-jwt-secret.js
SECURITY.md
```

---

## 💡 Tips Pro

### Generate JWT Secret Manual (jika perlu)

**Method 1: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Method 2: OpenSSL**
```bash
openssl rand -hex 64
```

**Method 3: Online (use with caution)**
```
https://www.random.org/strings/
- Length: 128
- Characters: Digits + Upper + Lower
```

### Multiple Environments

Buat file terpisah untuk setiap environment:

```bash
.env.development
.env.staging
.env.production
```

Load dengan:
```bash
# package.json
"scripts": {
  "dev": "NODE_ENV=development node server.js",
  "staging": "NODE_ENV=staging node server.js",
  "start": "NODE_ENV=production node server.js"
}
```

### Rotate JWT Secret

**Kapan?** Setiap 3-6 bulan atau jika ada security breach

**Cara:**
```bash
# Backup old .env
cp .env .env.backup

# Generate new secret
node generate-jwt-secret.js --force

# Restart server
npm start

# All users akan logout otomatis (expected behavior)
```

---

## 🆘 Need Help?

1. **Baca dokumentasi lengkap:** [SECURITY.md](./SECURITY.md)
2. **Check logs:** `console.log` messages saat server startup
3. **Verify setup:**
   - JWT_SECRET: minimal 64 characters
   - CORS_ORIGINS: domain production Anda
   - NODE_ENV: production

---

**Setup time: ~5 menit** ⚡
**Security level: 🔒🔒🔒🔒🔒** (5/5)