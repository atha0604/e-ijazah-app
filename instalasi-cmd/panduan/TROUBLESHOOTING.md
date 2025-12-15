# 🔧 TROUBLESHOOTING - SOLUSI MASALAH UMUM

## Aplikasi Nilai E-Ijazah

---

## 📋 DAFTAR ISI

1. [Masalah Instalasi](#masalah-instalasi)
2. [Masalah Download](#masalah-download)
3. [Masalah Dependencies](#masalah-dependencies)
4. [Masalah Running](#masalah-running)
5. [Masalah Database](#masalah-database)
6. [Masalah Update](#masalah-update)
7. [Masalah Umum](#masalah-umum)

---

## 1. MASALAH INSTALASI

### ❌ **"Node.js belum terinstall"**

**Penyebab:**
- Node.js belum diinstall
- Node.js terinstall tapi CMD belum di-restart

**Solusi:**

```bash
# Cara 1: Install Node.js
1. Download: https://nodejs.org/
2. Install versi LTS (Long Term Support)
3. Restart komputer
4. Buka CMD baru
5. Test: node --version
```

```bash
# Cara 2: Cek Path Environment
1. Buka System Properties
2. Environment Variables
3. Cek ada C:\Program Files\nodejs\ di PATH
4. Jika tidak ada, tambahkan manual
```

---

### ❌ **"npm tidak dikenal"**

**Solusi:**
```bash
# NPM harusnya ter-install otomatis dengan Node.js

# Test:
npm --version

# Jika error, reinstall Node.js:
1. Uninstall Node.js dari Control Panel
2. Download ulang dari nodejs.org
3. Install lagi
4. Restart komputer
```

---

### ❌ **"INSTALL-SEKOLAH.bat gagal"**

**Solusi:**
```bash
# Jalankan manual step-by-step:

# 1. Buka CMD as Administrator
# 2. Navigate ke folder aplikasi
cd C:\E-Ijazah\e-ijazah-app-brave-black

# 3. Install dependencies
npm install

# 4. Test run
npm start
```

---

## 2. MASALAH DOWNLOAD

### ❌ **"Download gagal - timeout"**

**Penyebab:**
- Koneksi internet lambat
- GitHub sedang down
- Firewall/Antivirus block

**Solusi:**

```bash
# Cara 1: Coba lagi
1. Tunggu beberapa menit
2. Jalankan ulang script download

# Cara 2: Download manual
1. Buka: https://github.com/atha0604/e-ijazah-app
2. Klik "Code" → "Download ZIP"
3. Extract manual
4. Jalankan INSTALL-SEKOLAH.bat

# Cara 3: Nonaktifkan Antivirus sementara
1. Disable antivirus
2. Download lagi
3. Enable antivirus kembali
```

---

### ❌ **"Git tidak dikenal"**

**Solusi:**
```bash
# Opsi 1: Install Git
1. Download: https://git-scm.com/
2. Install dengan default settings
3. Restart CMD
4. Test: git --version

# Opsi 2: Pakai download tanpa Git
Gunakan: 1-DOWNLOAD-OTOMATIS.bat
(Tidak perlu Git)
```

---

### ❌ **"PowerShell script execution disabled"**

**Solusi:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Lalu coba lagi download script
```

---

## 3. MASALAH DEPENDENCIES

### ❌ **"npm install gagal"**

**Penyebab:**
- Internet terputus
- npm cache corrupt
- Permission denied

**Solusi:**

```bash
# Solusi 1: Clear cache
npm cache clean --force
npm install

# Solusi 2: Delete node_modules
rmdir /s /q node_modules
del package-lock.json
npm install

# Solusi 3: Run as Administrator
# Klik kanan CMD → Run as Administrator
cd C:\E-Ijazah\e-ijazah-app-brave-black
npm install
```

---

### ❌ **"npm ERR! code EACCES"**

**Solusi:**
```bash
# Windows: Run CMD as Administrator

# Atau ubah npm prefix:
npm config set prefix "%APPDATA%\npm"
```

---

### ❌ **"node-gyp rebuild failed"**

**Solusi:**
```bash
# Install Build Tools
npm install --global windows-build-tools

# Atau skip optional dependencies:
npm install --no-optional
```

---

## 4. MASALAH RUNNING

### ❌ **"Port 3000 already in use"**

**Penyebab:**
- Aplikasi lain pakai port 3000
- Aplikasi masih running di background

**Solusi:**

```bash
# Cara 1: Kill process di port 3000
npx kill-port 3000

# Cara 2: Manual kill
tasklist | findstr node
taskkill /F /PID [PID_NUMBER]

# Cara 3: Ganti port
# Edit file .env
PORT=3001

# Lalu run lagi
npm start
```

---

### ❌ **"Browser tidak terbuka otomatis"**

**Solusi:**
```bash
# Buka manual di browser:
http://localhost:3000

# Atau cek port di file .env
# Lalu buka: http://localhost:[PORT]
```

---

### ❌ **"Cannot GET /"**

**Penyebab:**
- Server belum ready
- Route error

**Solusi:**
```bash
# 1. Tunggu beberapa detik
# 2. Refresh browser (F5)
# 3. Cek console CMD untuk error
# 4. Restart aplikasi
```

---

## 5. MASALAH DATABASE

### ❌ **"Database error - SQLITE_CANTOPEN"**

**Solusi:**
```bash
# 1. Pastikan folder ada
mkdir src\database

# 2. Beri permission
# Klik kanan folder → Properties → Security
# Full Control untuk user Anda

# 3. Restart aplikasi
# Database akan dibuat otomatis
```

---

### ❌ **"Database is locked"**

**Solusi:**
```bash
# 1. Tutup semua instance aplikasi

# 2. Delete lock file
del src\database\db.sqlite-journal

# 3. Restart aplikasi
```

---

### ❌ **"Data hilang setelah update"**

**Solusi:**
```bash
# Restore dari backup:

# Cara 1: Via aplikasi
# Login → Backup & Restore → Restore

# Cara 2: Manual
# Copy file backup ke:
copy backup\[tanggal]\db.sqlite src\database\db.sqlite

# Restart aplikasi
```

---

## 6. MASALAH UPDATE

### ❌ **"git pull failed - local changes"**

**Solusi:**
```bash
cd C:\E-Ijazah\e-ijazah-app

# Backup changes
git stash

# Pull update
git pull origin brave-black

# Apply changes kembali
git stash pop
```

---

### ❌ **"Update berhasil tapi fitur baru tidak muncul"**

**Solusi:**
```bash
# Hard refresh browser:
Ctrl + Shift + R

# Atau clear browser cache:
Ctrl + Shift + Delete

# Atau reinstall dependencies:
npm install
```

---

## 7. MASALAH UMUM

### ❌ **"Aplikasi lambat"**

**Solusi:**
```bash
# 1. Restart aplikasi
# 2. Restart komputer
# 3. Cek RAM (minimal 4GB)
# 4. Close aplikasi lain yang berat
# 5. Scan malware/virus
```

---

### ❌ **"Login gagal - kode sekolah salah"**

**Solusi:**
```bash
# 1. Pastikan kode sekolah benar
# 2. Cek CAPS LOCK (case sensitive)
# 3. Hubungi admin dinas untuk kode yang benar
```

---

### ❌ **"File tidak bisa di-export"**

**Solusi:**
```bash
# 1. Cek folder export ada
mkdir exports

# 2. Beri permission write
# 3. Cek free space di hard disk
# 4. Disable antivirus sementara
```

---

### ❌ **"Print/PDF tidak berfungsi"**

**Solusi:**
```bash
# 1. Update browser ke versi terbaru
# 2. Enable pop-up di browser
# 3. Install PDF reader (Adobe, Foxit, dll)
# 4. Cek printer driver
```

---

## 🆘 SOLUSI UNIVERSAL (Last Resort)

Jika semua solusi di atas gagal:

### **REINSTALL BERSIH:**

```bash
# 1. Backup database
copy src\database\db.sqlite C:\backup\db.sqlite

# 2. Hapus folder aplikasi
rmdir /s /q C:\E-Ijazah\e-ijazah-app-brave-black

# 3. Reinstall Node.js
# Uninstall → Download baru → Install

# 4. Restart komputer

# 5. Install aplikasi dari awal
# Jalankan: 5-INSTALL-ONE-LINER.bat

# 6. Restore database
copy C:\backup\db.sqlite src\database\db.sqlite
```

---

## 📞 MASIH BUTUH BANTUAN?

Jika semua cara sudah dicoba dan masih error:

**Siapkan informasi berikut:**

1. **Screenshot error**
2. **OS Version** (Win 7/8/10/11)
3. **Node.js version** (`node --version`)
4. **Error message lengkap**
5. **Langkah yang sudah dicoba**

**Kirim ke:**
- 📱 WhatsApp: [Nomor Support]
- 📧 Email: [Email Support]
- 🌐 GitHub Issues: https://github.com/atha0604/e-ijazah-app/issues

---

## 🔍 DIAGNOSTIC TOOLS

### **Cek Sistem Lengkap:**

```bash
# Jalankan:
4-CEK-SISTEM.bat

# Akan otomatis cek:
- Windows version
- Node.js
- NPM
- Git
- Internet connection
- Free disk space
```

### **Manual Diagnostic:**

```bash
# Cek Node.js
node --version
npm --version

# Cek Git
git --version

# Cek Network
ping github.com

# Cek Port
netstat -ano | findstr :3000

# Cek Process
tasklist | findstr node
```

---

## 📊 ERROR CODES

| Code | Meaning | Solution |
|------|---------|----------|
| ENOENT | File not found | Cek path file |
| EACCES | Permission denied | Run as Admin |
| EADDRINUSE | Port already used | Kill process atau ganti port |
| ETIMEDOUT | Connection timeout | Cek internet |
| ECONNREFUSED | Connection refused | Cek firewall |

---

**Semoga berhasil! 🎉**
