# 🎓 APLIKASI NILAI E-IJAZAH
## Aplikasi Pengelolaan Nilai Sekolah Dasar

**Tahun Pelajaran 2025/2026**

---

## 📥 CARA INSTALL (3 LANGKAH)

### **LANGKAH 1: Install Node.js** (Sekali saja)

1. Download Node.js: **https://nodejs.org/**
2. Pilih versi **LTS** (yang disarankan)
3. Double-click installer
4. Klik **Next > Next > Next > Install**
5. Tunggu sampai selesai
6. **Restart komputer**

### **LANGKAH 2: Download Aplikasi**

**Opsi A - Download ZIP (Mudah):**
1. Buka: https://github.com/atha0604/e-ijazah-app
2. Klik tombol hijau **"Code"**
3. Klik **"Download ZIP"**
4. Simpan di Desktop
5. Klik kanan ZIP → **"Extract All"**
6. Extract ke: `C:\E-Ijazah\`

**Opsi B - Git Clone (Untuk yang paham Git):**
```bash
cd C:\
git clone https://github.com/atha0604/e-ijazah-app
```

### **LANGKAH 3: Jalankan Installer**

1. Buka folder `C:\E-Ijazah\e-ijazah-app\`
2. **Double-click:** `INSTALL-SEKOLAH.bat`
3. Tunggu 1-2 menit (install dependencies)
4. Ikuti instruksi di layar
5. Done!

---

## ▶️ CARA MENJALANKAN APLIKASI

1. **Double-click:** `JALANKAN-APLIKASI.bat`
2. Browser akan terbuka otomatis
3. Halaman login akan muncul
4. Login dengan **Kode Akses Sekolah** Anda

**PENTING:**
- ❌ **JANGAN TUTUP** window CMD hitam saat aplikasi berjalan!
- ✅ Untuk menutup: Tutup browser dulu, baru tutup CMD

---

## 🔐 LOGIN

**Admin Dinas:**
- Kode: `admin`
- Kurikulum: (pilih salah satu)

**Sekolah:**
- Kode: (Kode akses sekolah Anda)
- Kurikulum: Merdeka / K13

---

## ✨ FITUR APLIKASI

- ✅ Input nilai siswa (K13 & Kurikulum Merdeka)
- ✅ Generate e-Ijazah otomatis (PDF)
- ✅ Export ke Excel
- ✅ Import data dari Excel
- ✅ Dashboard analytics
- ✅ Backup & restore data
- ✅ Multi-user support
- ✅ Offline ready (no internet needed!)

---

## ❓ TROUBLESHOOTING

### **"Node.js belum terinstall"**
→ Install Node.js dari https://nodejs.org/, lalu restart komputer

### **"npm install gagal"**
→ Pastikan internet connect, lalu coba lagi

### **"Port 3000 already in use"**
→ Tutup aplikasi lain yang mungkin pakai port 3000, atau restart komputer

### **Browser tidak terbuka otomatis**
→ Buka manual: http://localhost:3000

### **Data hilang/error**
→ Check folder `backup/` untuk restore data

---

## 📞 BANTUAN

**Butuh Bantuan?**

- 📱 WhatsApp: [Nomor Support]
- 📧 Email: [Email Support]
- 🌐 GitHub Issues: https://github.com/atha0604/e-ijazah-app/issues

**Jam Support:**
- Senin - Jumat: 08:00 - 16:00
- Weekend: Emergency only

---

## 🔄 UPDATE APLIKASI

Jika ada update baru:

**Via Git:**
```bash
cd C:\E-Ijazah\e-ijazah-app
git pull
npm install
```

**Via Download:**
1. Download ZIP terbaru
2. Extract ke folder baru
3. Copy folder `src/database/` dari instalasi lama
4. Run `INSTALL-SEKOLAH.bat`

---

## 💾 BACKUP DATA

**PENTING:** Backup data Anda secara rutin!

**Cara Backup:**
1. Buka aplikasi → Login sebagai Admin
2. Menu **"Backup & Restore"**
3. Klik **"Create Backup"**
4. File backup tersimpan di folder `backup/`

**atau**

Copy manual file:
```
src/database/db.sqlite
```

---

## 📋 SYSTEM REQUIREMENTS

**Minimum:**
- Windows 7 / 8 / 10 / 11
- RAM: 4GB
- Storage: 2GB free
- Node.js v18+

**Recommended:**
- Windows 10/11
- RAM: 8GB
- Storage: 5GB free
- SSD

---

## 📜 LICENSE

© 2025 Dinas Pendidikan - Aplikasi Nilai E-Ijazah

Untuk penggunaan internal sekolah dasar.

---

## 🎯 CHANGELOG

**v2.6.0** (13 Des 2025)
- ✅ Added Kurikulum Merdeka support
- ✅ Improved e-Ijazah PDF generation
- ✅ Added real-time collaboration
- ✅ Performance improvements
- ✅ Bug fixes

---

**Developed with ❤️ for Indonesian Education**

**Selamat menggunakan! 🎉**
