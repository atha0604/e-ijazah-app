# 🎓 APLIKASI NILAI E-IJAZAH 2025/2026

## Panduan Instalasi Untuk Sekolah

---

## 🚀 INSTALASI SUPER MUDAH (1 Perintah!)

### **Cara Termudah - One Command Install:**

1. **Tekan:** `Windows + R`
2. **Ketik:** `cmd`
3. **Tekan:** `Enter`
4. **Copy-paste perintah ini:**

```cmd
powershell -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/atha0604/e-ijazah-app/brave-black/Install-EIjazah.ps1' -OutFile '$env:TEMP\Install-EIjazah.ps1'; & '$env:TEMP\Install-EIjazah.ps1'"
```

5. **Tekan Enter** dan tunggu 10-15 menit
6. **Selesai!** ✅

---

## 📦 Apa yang Akan Terjadi?

Installer otomatis akan:

- ✅ **Cek Node.js** - Kalau belum ada, download & install otomatis
- ✅ **Download aplikasi** dari GitHub
- ✅ **Install dependencies** (semua library yang dibutuhkan)
- ✅ **Buat shortcut di Desktop** bernama "E-Ijazah App"
- ✅ **Siap digunakan!**

**Tidak perlu install apa-apa secara manual!**

---

## 💻 Cara Menjalankan Aplikasi

Setelah instalasi selesai, ada 2 cara:

### **Cara 1: Lewat Shortcut (Paling Mudah)** ⭐

Double-click shortcut **"E-Ijazah App"** di Desktop

### **Cara 2: Lewat File Langsung**

1. Buka folder: `C:\E-Ijazah\e-ijazah-app\`
2. Double-click: `JALANKAN-APLIKASI.bat`

**Browser akan terbuka otomatis ke:** `http://localhost:3000`

---

## 🔑 Login

**Untuk Sekolah:**
- **Kode Sekolah:** (Akan dikirim oleh Dinas Pendidikan)
- **Kurikulum:** Pilih K13 atau Merdeka

**Untuk Admin Dinas:**
- **Kode:** `admin`
- **Kurikulum:** (pilih salah satu)

---

## ⚠️ PENTING!

### **Saat Aplikasi Berjalan:**

1. ❌ **JANGAN TUTUP** window CMD hitam yang muncul
2. ✅ Window CMD harus tetap buka selama pakai aplikasi
3. ✅ Untuk menutup aplikasi:
   - Tutup browser dulu
   - Baru tutup window CMD

### **Backup Data:**

- 📥 **Menu Backup** ada di aplikasi (Login as Admin)
- 💾 Backup rutin setiap minggu
- 📁 File backup tersimpan di folder `backup/`

---

## 📋 System Requirements

### **Minimum:**
- Windows 7 / 8 / 10 / 11 (64-bit)
- RAM: 4GB
- Storage: 2GB free
- Internet: Hanya untuk install (setelah itu bisa offline!)

### **Yang Akan Otomatis Terinstall:**
- Node.js (otomatis download & install)
- Aplikasi E-Ijazah
- Dependencies

### **Yang TIDAK Perlu Install:**
- ❌ Database server (sudah built-in)
- ❌ Web server (sudah built-in)
- ❌ PHP/MySQL/Apache

---

## ❓ Troubleshooting

### **"PowerShell error"**

Run CMD **as Administrator**:
1. Klik kanan icon CMD
2. Pilih "Run as Administrator"
3. Jalankan perintah lagi

---

### **"Download gagal"**

**Coba:**
1. Cek koneksi internet
2. Disable antivirus sementara
3. Download manual:
   - Buka: https://github.com/atha0604/e-ijazah-app
   - Klik "Code" → "Download ZIP"
   - Extract dan jalankan `INSTALLER-OTOMATIS-LENGKAP.bat`

---

### **"Aplikasi tidak mau buka"**

**Solusi:**
```cmd
# Buka CMD, ketik:
cd C:\E-Ijazah\e-ijazah-app
npm start
```

Jika masih error, restart komputer.

---

### **"Port 3000 already in use"**

**Solusi:**
```cmd
# Buka CMD, ketik:
npx kill-port 3000
```

Atau restart komputer.

---

## 🔄 Update Aplikasi

Jika ada versi baru:

**Cara Otomatis:**
1. Buka CMD
2. Ketik:
```cmd
cd C:\E-Ijazah\e-ijazah-app
git pull
npm install
```

**Cara Manual:**
1. Backup database: `src\database\db.sqlite`
2. Download versi baru
3. Extract
4. Copy database lama ke folder baru

---

## 📞 Bantuan & Support

### **Kontak Support:**

- 📱 **WhatsApp:** 0812-XXXX-XXXX
- 📧 **Email:** support@example.com
- 🌐 **GitHub Issues:** https://github.com/atha0604/e-ijazah-app/issues

### **Jam Support:**
- **Senin - Jumat:** 08:00 - 16:00
- **Weekend:** Emergency only

---

## ✨ Fitur Aplikasi

- ✅ Input nilai K13 & Kurikulum Merdeka
- ✅ Generate e-Ijazah otomatis (PDF)
- ✅ Export data ke Excel
- ✅ Import data dari Excel
- ✅ Dashboard analytics
- ✅ Backup & restore data
- ✅ Multi-user support
- ✅ **OFFLINE READY** - Bisa jalan tanpa internet!

---

## 📊 Checklist Instalasi

Setelah instalasi, cek:

- [ ] Shortcut "E-Ijazah App" ada di Desktop
- [ ] Aplikasi bisa dibuka (browser terbuka)
- [ ] Halaman login muncul
- [ ] Bisa login dengan kode sekolah
- [ ] Dashboard muncul dengan benar

Jika semua ✅ → **Instalasi berhasil!**

---

## 🎯 Tips Penggunaan

1. **Backup data rutin** - Setiap minggu
2. **Jangan share kode sekolah** - Rahasia!
3. **Update aplikasi** - Saat ada notifikasi
4. **Hubungi support** - Jika ada masalah
5. **Tutup aplikasi dengan benar** - Browser dulu, baru CMD

---

## 📝 Changelog

**Version 2.6.0** (15 Des 2025)
- ✅ One-command installer
- ✅ Auto Node.js download & install
- ✅ Desktop shortcut otomatis
- ✅ Kurikulum Merdeka support
- ✅ Improved stability

---

## 📄 Lisensi

© 2025 Dinas Pendidikan - Aplikasi Nilai E-Ijazah

Untuk penggunaan internal Sekolah Dasar se-Indonesia.

---

**Developed with ❤️ for Indonesian Education**

**Selamat menggunakan! 🎉**

---

## 🔗 Quick Links

- **Node.js:** https://nodejs.org/
- **GitHub Repo:** https://github.com/atha0604/e-ijazah-app
- **Download ZIP:** https://github.com/atha0604/e-ijazah-app/archive/refs/heads/brave-black.zip

---

_Untuk panduan lebih lengkap, lihat folder `instalasi-cmd/panduan/`_
