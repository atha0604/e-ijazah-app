# 📥 PANDUAN LENGKAP INSTALASI VIA CMD

## Aplikasi Nilai E-Ijazah - Tahun Pelajaran 2025/2026

---

## 📂 STRUKTUR FOLDER

```
instalasi-cmd/
├── scripts/                          # Script instalasi
│   ├── 1-DOWNLOAD-OTOMATIS.bat      # Download tanpa Git
│   ├── 2-GIT-CLONE.bat              # Download dengan Git
│   ├── 3-UPDATE-APLIKASI.bat        # Update ke versi terbaru
│   ├── 4-CEK-SISTEM.bat             # Cek system requirements
│   └── 5-INSTALL-ONE-LINER.bat      # Install semuanya sekaligus
├── panduan/                          # Dokumentasi
│   ├── PANDUAN-LENGKAP.md           # File ini
│   ├── TROUBLESHOOTING.md           # Solusi masalah umum
│   └── FAQ.md                       # Pertanyaan umum
└── README.md                         # Panduan singkat
```

---

## 🎯 PILIH METODE INSTALASI

### **Metode 1: CEK SISTEM DULU (RECOMMENDED)** ⭐

**Untuk: Semua Sekolah**

1. **Double-click:** `4-CEK-SISTEM.bat`
2. Lihat hasil pengecekan
3. Install yang kurang (Node.js, dll)
4. Lanjut ke metode instalasi

**Keuntungan:**
- Tahu requirement apa yang kurang
- Cegah error saat instalasi

---

### **Metode 2: ONE-LINER (PALING MUDAH)** ⚡

**Untuk: Operator yang tidak mau ribet**

1. **Double-click:** `5-INSTALL-ONE-LINER.bat`
2. Tunggu sampai selesai (5-10 menit)
3. Selesai!

**Keuntungan:**
- ✅ Semua otomatis
- ✅ Cek sistem → Download → Install → Siap
- ✅ Paling cepat

**Kekurangan:**
- ❌ Kalau error di tengah jalan, harus ulang dari awal

---

### **Metode 3: DOWNLOAD OTOMATIS (TANPA GIT)** 📦

**Untuk: Sekolah yang tidak install Git**

1. **Double-click:** `1-DOWNLOAD-OTOMATIS.bat`
2. Tunggu download selesai
3. Buka folder `C:\E-Ijazah\e-ijazah-app-brave-black\`
4. Jalankan `INSTALL-SEKOLAH.bat`

**Keuntungan:**
- ✅ Tidak perlu install Git
- ✅ Download via PowerShell (built-in Windows)

**Kekurangan:**
- ❌ Update manual (download ulang)

---

### **Metode 4: GIT CLONE (PROFESSIONAL)** 🔧

**Untuk: IT Staff / Operator yang paham Git**

1. **Install Git** dari: https://git-scm.com/
2. **Double-click:** `2-GIT-CLONE.bat`
3. Tunggu clone selesai
4. Jalankan installer

**Keuntungan:**
- ✅ Update mudah dengan `3-UPDATE-APLIKASI.bat`
- ✅ Dapat update terbaru otomatis
- ✅ Tracking version

**Kekurangan:**
- ❌ Harus install Git dulu

---

## 📋 SYSTEM REQUIREMENTS

### **Minimum:**
- Windows 7 / 8 / 10 / 11 (64-bit)
- RAM: 4GB
- Storage: 2GB free space
- Internet connection (untuk download)

### **Software yang HARUS Diinstall:**

**1. Node.js** (WAJIB!)
- Download: https://nodejs.org/
- Pilih versi **LTS** (Long Term Support)
- Ukuran: ~30MB
- Install: Next → Next → Finish
- **RESTART KOMPUTER** setelah install

**2. Git** (Optional - untuk auto-update)
- Download: https://git-scm.com/
- Ukuran: ~50MB
- Install dengan default settings

---

## 🚀 LANGKAH INSTALASI DETAIL

### **TAHAP 1: Persiapan**

1. **Pastikan Node.js terinstall:**
   - Buka CMD
   - Ketik: `node --version`
   - Jika muncul versi (misal v20.11.0), berarti OK
   - Jika error, install dari https://nodejs.org/

2. **Pastikan ada koneksi internet:**
   - Minimal 10 Mbps
   - Untuk download ~100MB

3. **Pastikan ada free space:**
   - Minimal 2GB di drive C:\

---

### **TAHAP 2: Download & Install**

#### **Cara A - One-Liner (Termudah):**

1. Buka folder `instalasi-cmd/scripts/`
2. Double-click: `5-INSTALL-ONE-LINER.bat`
3. Tekan Y untuk konfirmasi
4. Tunggu 5-10 menit
5. Selesai!

#### **Cara B - Step-by-Step:**

**Step 1: Cek Sistem**
```
Double-click: 4-CEK-SISTEM.bat
```
- Lihat apa yang kurang
- Install yang kurang

**Step 2: Download Aplikasi**

*Pilihan A (Tanpa Git):*
```
Double-click: 1-DOWNLOAD-OTOMATIS.bat
```

*Pilihan B (Dengan Git):*
```
Double-click: 2-GIT-CLONE.bat
```

**Step 3: Install Dependencies**
- Buka folder hasil download
- Jalankan `INSTALL-SEKOLAH.bat`
- Tunggu sampai selesai

**Step 4: Jalankan Aplikasi**
- Double-click: `JALANKAN-APLIKASI.bat`
- Browser akan terbuka otomatis
- Login dengan kode sekolah

---

### **TAHAP 3: Verifikasi**

Setelah instalasi, cek:

1. **Aplikasi bisa dibuka?**
   - Browser terbuka ke http://localhost:3000
   - Halaman login muncul

2. **Bisa login?**
   - Masukkan kode sekolah
   - Pilih kurikulum
   - Dashboard muncul

3. **Fitur berfungsi?**
   - Input nilai
   - Export PDF
   - Semua menu bisa dibuka

Jika semua OK, **instalasi berhasil!** ✅

---

## 🔄 UPDATE APLIKASI

### **Jika Install dengan Git (Metode 4):**

**Cara Otomatis:**
1. Double-click: `3-UPDATE-APLIKASI.bat`
2. Tunggu selesai
3. Selesai!

**Cara Manual:**
```bash
cd C:\E-Ijazah\e-ijazah-app
git pull origin brave-black
npm install
```

---

### **Jika Install Tanpa Git (Metode 3):**

**Cara 1 - Download Ulang:**
1. Backup data: `src/database/db.sqlite`
2. Download versi baru
3. Copy database lama ke folder baru
4. Jalankan

**Cara 2 - Install Git:**
1. Install Git: https://git-scm.com/
2. Gunakan `3-UPDATE-APLIKASI.bat`

---

## 💾 BACKUP DATA

**PENTING!** Backup data secara rutin!

### **Cara 1: Via Aplikasi**
1. Login sebagai Admin
2. Menu "Backup & Restore"
3. Klik "Create Backup"
4. File tersimpan di folder `backup/`

### **Cara 2: Manual**
Copy file berikut:
```
C:\E-Ijazah\e-ijazah-app\src\database\db.sqlite
```

Simpan di tempat aman (USB, Google Drive, dll)

---

## ❓ TROUBLESHOOTING

Lihat file: `TROUBLESHOOTING.md`

**Masalah umum:**
- "Node.js belum terinstall"
- "npm install gagal"
- "Port 3000 already in use"
- "Database error"
- dll.

---

## 📞 BANTUAN

**Support Channel:**

- 📱 WhatsApp: [Nomor Support]
- 📧 Email: [Email Support]
- 🌐 GitHub: https://github.com/atha0604/e-ijazah-app/issues

**Jam Support:**
- Senin - Jumat: 08:00 - 16:00
- Weekend: Emergency only

---

## 📊 FLOWCHART INSTALASI

```
START
  ↓
Cek Sistem (4-CEK-SISTEM.bat)
  ↓
Node.js installed?
  ├─ NO → Install Node.js → Restart
  └─ YES ↓
       Download Aplikasi
         ├─ Git Clone (2-GIT-CLONE.bat)
         └─ Download Otomatis (1-DOWNLOAD-OTOMATIS.bat)
              ↓
       Install Dependencies (INSTALL-SEKOLAH.bat)
              ↓
       Jalankan (JALANKAN-APLIKASI.bat)
              ↓
       Browser terbuka → Login
              ↓
         SELESAI ✅
```

---

## 🎓 TIPS & BEST PRACTICES

1. **Selalu backup data sebelum update**
2. **Gunakan Git untuk update otomatis**
3. **Jangan tutup CMD saat aplikasi running**
4. **Restart komputer jika ada masalah**
5. **Catat kode sekolah Anda**

---

## 📝 CHANGELOG

**v2.6.0** (13 Des 2025)
- ✅ Added Kurikulum Merdeka support
- ✅ Improved installer scripts
- ✅ Added system checker
- ✅ Added one-liner installer
- ✅ Better error handling

---

**Selamat menggunakan Aplikasi E-Ijazah! 🎉**
