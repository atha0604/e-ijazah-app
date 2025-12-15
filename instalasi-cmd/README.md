# 📥 INSTALASI VIA CMD - APLIKASI E-IJAZAH

## Quick Start Guide

---

## 🚀 INSTALASI CEPAT (5 Menit)

### **Cara Termudah:**

1. **Install Node.js** (sekali saja):
   - Download: **https://nodejs.org/**
   - Pilih versi LTS → Install → Restart komputer

2. **Jalankan installer:**
   ```
   Double-click: scripts/5-INSTALL-ONE-LINER.bat
   ```

3. **Tunggu 5-10 menit**

4. **Selesai!** 🎉

---

## 📂 STRUKTUR FOLDER

```
instalasi-cmd/
├── scripts/                          # 🔧 Script instalasi
│   ├── 1-DOWNLOAD-OTOMATIS.bat      # Download tanpa Git
│   ├── 2-GIT-CLONE.bat              # Download dengan Git
│   ├── 3-UPDATE-APLIKASI.bat        # Update ke versi terbaru
│   ├── 4-CEK-SISTEM.bat             # Cek system requirements
│   └── 5-INSTALL-ONE-LINER.bat      # ⭐ Install lengkap (RECOMMENDED)
│
├── panduan/                          # 📚 Dokumentasi
│   ├── PANDUAN-LENGKAP.md           # Panduan detail
│   ├── TROUBLESHOOTING.md           # Solusi masalah
│   └── FAQ.md                       # Pertanyaan umum
│
└── README.md                         # 👈 File ini
```

---

## 🎯 PILIH METODE INSTALASI

| Metode | Untuk Siapa | Kecepatan | Update |
|--------|-------------|-----------|--------|
| **5-INSTALL-ONE-LINER.bat** | Semua orang | ⚡⚡⚡ Tercepat | Manual |
| **4-CEK-SISTEM.bat** + Install | Yang hati-hati | ⚡⚡ Sedang | Tergantung |
| **2-GIT-CLONE.bat** | IT Staff | ⚡⚡ Sedang | ✅ Otomatis |
| **1-DOWNLOAD-OTOMATIS.bat** | Tanpa Git | ⚡ Lambat | Manual |

### **Recommended untuk Sekolah:**
👉 **5-INSTALL-ONE-LINER.bat** (Paling mudah!)

---

## 📋 REQUIREMENTS

### **Yang HARUS Ada:**
- ✅ Windows 7/8/10/11 (64-bit)
- ✅ RAM: 4GB minimum
- ✅ Storage: 2GB free
- ✅ **Node.js** (https://nodejs.org/)
- ✅ Internet (untuk download)

### **Yang TIDAK Perlu:**
- ❌ Database server (sudah built-in)
- ❌ Web server (sudah built-in)
- ❌ Git (optional)

---

## 🔧 CARA PAKAI SCRIPT

### **1️⃣ CEK SISTEM** (Recommended untuk cek dulu)

```
Double-click: scripts/4-CEK-SISTEM.bat
```

**Output:**
- ✅ Node.js: Installed
- ✅ NPM: Installed
- ✅ Internet: Connected
- ⚠️ Git: Not installed (optional)

---

### **2️⃣ INSTALL APLIKASI**

#### **Cara A - One-Liner (Termudah)** ⭐

```
Double-click: scripts/5-INSTALL-ONE-LINER.bat
```

Tunggu 5-10 menit → Selesai!

---

#### **Cara B - Download + Install Manual**

**Step 1: Download**

*Pilihan 1 - Tanpa Git:*
```
Double-click: scripts/1-DOWNLOAD-OTOMATIS.bat
```

*Pilihan 2 - Dengan Git:*
```
Double-click: scripts/2-GIT-CLONE.bat
```

**Step 2: Install**
```
1. Buka folder: C:\E-Ijazah\e-ijazah-app\
2. Double-click: INSTALL-SEKOLAH.bat
3. Tunggu sampai selesai
```

---

### **3️⃣ JALANKAN APLIKASI**

```
Double-click: JALANKAN-APLIKASI.bat
```

Browser akan terbuka otomatis ke:
```
http://localhost:3000
```

---

## 🔄 UPDATE APLIKASI

**Jika install dengan Git:**
```
Double-click: scripts/3-UPDATE-APLIKASI.bat
```

**Jika install tanpa Git:**
1. Download versi baru
2. Backup database
3. Extract versi baru
4. Copy database lama

**Lihat:** `panduan/PANDUAN-LENGKAP.md` untuk detail

---

## ❓ TROUBLESHOOTING

**Masalah Umum:**

| Problem | Solution |
|---------|----------|
| "Node.js belum terinstall" | Install dari nodejs.org |
| "npm install gagal" | `npm cache clean --force` |
| "Port 3000 already in use" | `npx kill-port 3000` |
| "Database error" | Restart aplikasi |

**Lihat:** `panduan/TROUBLESHOOTING.md` untuk solusi lengkap

---

## 📚 DOKUMENTASI

- **Panduan Lengkap:** `panduan/PANDUAN-LENGKAP.md`
- **Troubleshooting:** `panduan/TROUBLESHOOTING.md`
- **FAQ:** `panduan/FAQ.md`

---

## 💾 BACKUP DATA

**PENTING!** Selalu backup data!

**Cara Manual:**
```
Copy file:
C:\E-Ijazah\e-ijazah-app\src\database\db.sqlite

Simpan di:
- USB Flash Drive
- Google Drive
- External HDD
```

**Cara Via Aplikasi:**
```
Login → Menu "Backup & Restore" → Create Backup
```

---

## 📞 BANTUAN

**Butuh Bantuan?**

- 📱 WhatsApp: [Nomor Support]
- 📧 Email: [Email Support]
- 🌐 GitHub: https://github.com/atha0604/e-ijazah-app/issues

**Jam Support:**
- Senin - Jumat: 08:00 - 16:00

---

## 🎓 QUICK TIPS

### ✅ **Saat Install:**
- Pastikan internet stabil
- Disable antivirus sementara
- Run as Administrator jika error

### ✅ **Saat Pakai:**
- Jangan tutup CMD window!
- Backup data rutin
- Update aplikasi teratur

### ✅ **Saat Troubleshoot:**
- Cek `4-CEK-SISTEM.bat` dulu
- Screenshot error
- Restart komputer

---

## 🔗 QUICK LINKS

- **Download Node.js:** https://nodejs.org/
- **Download Git:** https://git-scm.com/
- **GitHub Repo:** https://github.com/atha0604/e-ijazah-app
- **Video Tutorial:** [Link YouTube]

---

## 📊 FLOWCHART SINGKAT

```
Install Node.js
      ↓
Run: 5-INSTALL-ONE-LINER.bat
      ↓
Tunggu 5-10 menit
      ↓
Double-click: JALANKAN-APLIKASI.bat
      ↓
Browser terbuka → Login
      ↓
SELESAI! ✅
```

---

## 🎯 NEXT STEPS

Setelah instalasi:

1. ✅ Login dengan kode sekolah
2. ✅ Import data siswa (Excel)
3. ✅ Input nilai
4. ✅ Generate e-Ijazah
5. ✅ Backup data!

---

**Selamat menggunakan Aplikasi E-Ijazah! 🎉**

**Developed with ❤️ for Indonesian Education**

---

**Version:** 2.6.0
**Last Updated:** 15 Desember 2025
