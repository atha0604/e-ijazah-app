# 📦 PANDUAN DISTRIBUSI APLIKASI E-IJAZAH
## Untuk 256 Sekolah Dasar

---

## 🎯 METODE DISTRIBUSI

### **OPSI 1: GitHub Download (RECOMMENDED)** ⭐

**Untuk Operator Sekolah:**

1. **Download ZIP:**
   - Buka: https://github.com/atha0604/e-ijazah-app
   - Click tombol hijau **"Code"**
   - Click **"Download ZIP"**
   - Simpan ke Desktop

2. **Extract ZIP:**
   - Klik kanan file ZIP
   - Pilih **"Extract All..."**
   - Extract ke: `C:\E-Ijazah\`

3. **Install:**
   - Buka folder `C:\E-Ijazah\e-ijazah-app\`
   - **Double-click:** `INSTALL-SEKOLAH.bat`
   - Tunggu sampai selesai (1-2 menit)

4. **Jalankan:**
   - **Double-click:** `JALANKAN-APLIKASI.bat`
   - Browser akan terbuka otomatis!

---

### **OPSI 2: Git Clone (Untuk IT Staff)**

```bash
# Buka Command Prompt
cd C:\
git clone https://github.com/atha0604/e-ijazah-app
cd e-ijazah-app
npm install
npm start
```

---

### **OPSI 3: USB Flash Drive (Offline)**

**Untuk Anda (Admin Dinas):**

1. **Prepare USB (32GB recommended):**
   ```
   USB/
   ├── e-ijazah-app/          (full source code)
   ├── node-installer/
   │   └── node-v20.x.x-x64.msi
   ├── PANDUAN-INSTALL.pdf
   └── README.txt
   ```

2. **Copy full project ke USB:**
   - Copy folder project lengkap
   - Copy Node.js installer
   - Copy panduan

3. **Distribusi:**
   - Kunjungi sekolah / kirim via kurir
   - Operator sekolah copy dari USB ke laptop
   - Run installer

---

## 📋 REQUIREMENTS (HARUS DIPENUHI SEKOLAH)

### **Laptop/PC Minimum:**
- ✅ Windows 7 / 8 / 10 / 11
- ✅ RAM: 4GB minimum (8GB recommended)
- ✅ Storage: 2GB free space
- ✅ Internet: Hanya untuk download (tidak perlu saat pakai)

### **Software yang Harus Diinstall:**

**1. Node.js** (WAJIB!)
- Download: https://nodejs.org/
- Pilih versi **LTS** (Long Term Support)
- Install dengan **Next > Next > Finish**
- Cek sukses: Buka CMD, ketik `node --version`

**2. Git** (Optional - kalau mau auto-update)
- Download: https://git-scm.com/
- Install dengan default settings

---

## 🚀 LANGKAH DISTRIBUSI MASS (256 SEKOLAH)

### **FASE 1: PERSIAPAN (Anda)**

**Week 1: Prepare Materials**

1. ✅ Push final code ke GitHub
2. ✅ Test installer di 2-3 laptop berbeda
3. ✅ Buat video tutorial (5 menit)
4. ✅ Prepare support materials:
   - PDF Panduan
   - Video tutorial
   - FAQ document
   - Contact person

**Week 2: Pilot Test**

1. ✅ Distribusi ke 5 sekolah pilot
2. ✅ Monitoring & collect feedback
3. ✅ Fix issues yang ditemukan
4. ✅ Update dokumentasi

---

### **FASE 2: DISTRIBUSI MASSAL**

**Metode Recommended:**

**1. WhatsApp Broadcast (FASTEST!)** ⚡

Kirim pesan ke grup operator sekolah:

```
🎓 APLIKASI NILAI E-IJAZAH 2025/2026

📥 Download:
https://github.com/atha0604/e-ijazah-app

📹 Video Tutorial:
[Link Google Drive/YouTube]

📄 Panduan PDF:
[Link Google Drive]

⚙️ CARA INSTALL:
1. Install Node.js: https://nodejs.org/
2. Download ZIP dari link di atas
3. Extract ke C:\E-Ijazah\
4. Jalankan INSTALL-SEKOLAH.bat
5. Double-click JALANKAN-APLIKASI.bat

❓ Bantuan: 0812-XXXX-XXXX (WhatsApp)

Deadline install: [Tanggal]
```

**2. Google Drive** (Backup)

Upload ke Google Drive:
- Source code ZIP
- Node.js installer
- Video tutorial
- PDF panduan

Share link via email sekolah.

**3. Offline (USB)**

Untuk sekolah remote/internet lemah:
- Siapkan 10-15 USB flash drive
- Copy semua materials
- Distribusi bergiliran per kecamatan

---

### **FASE 3: SUPPORT & MONITORING**

**Week 3-4: Support Instalasi**

1. **WhatsApp Support Group:**
   - Buat grup khusus operator
   - Fast response untuk troubleshooting
   - Share tips & solutions

2. **Remote Support:**
   - TeamViewer / AnyDesk
   - Untuk kasus khusus

3. **Monitoring Dashboard:**
   ```
   Sekolah Installed: XXX / 256
   Issues Reported: XX
   Resolution Rate: XX%
   ```

---

## 📞 TROUBLESHOOTING GUIDE

### **Problem 1: "Node.js belum terinstall"**

**Solution:**
1. Download Node.js: https://nodejs.org/
2. Install dengan default settings
3. Restart CMD
4. Jalankan INSTALL-SEKOLAH.bat lagi

---

### **Problem 2: "npm install gagal"**

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Install ulang
npm install
```

---

### **Problem 3: "Port 3000 already in use"**

**Solution:**
```bash
# Ganti port di file .env
PORT=3001

# Atau kill process
taskkill /F /IM node.exe
```

---

### **Problem 4: "Database error"**

**Solution:**
1. Tutup aplikasi
2. Hapus file `src/database/db.sqlite`
3. Jalankan ulang - database akan dibuat otomatis

---

## 📊 TEMPLATE MONITORING

### **Excel Tracking Sheet:**

| No | Nama Sekolah | Kecamatan | Operator | No HP | Status | Tanggal Install | Kode Akses | Notes |
|----|-------------|-----------|----------|-------|--------|----------------|------------|-------|
| 1  | SD N 1      | Kec A     | Pak Budi | 0812  | ✅     | 13/12/2025     | SDNA001    | OK    |
| 2  | SD N 2      | Kec A     | Bu Ani   | 0813  | ⏳     | -              | SDNA002    | -     |

**Legend:**
- ✅ Installed & Running
- ⏳ In Progress
- ❌ Issue/Blocked
- ⚠️ Need Support

---

## 🎯 SUCCESS METRICS

**Target:**
- ✅ 100% sekolah installed dalam 1 bulan
- ✅ <5% issue rate
- ✅ <24 jam response time untuk support

**Track:**
- Install completion rate
- User satisfaction
- Issue resolution time
- Active usage

---

## 💡 TIPS DISTRIBUSI

1. **Prioritize by Kecamatan:**
   - Deploy per kecamatan
   - Finish satu kecamatan sebelum next

2. **Peer Support:**
   - Assign 1 "champion" per kecamatan
   - Champion helps nearby schools

3. **Office Hours:**
   - Set support hours: 08:00-16:00
   - Weekend: Emergency only

4. **Documentation:**
   - Record all issues & solutions
   - Update FAQ regularly

---

## 📦 CHECKLIST DISTRIBUSI

### **Sebelum Distribusi:**
- [ ] Code tested & stable
- [ ] GitHub updated
- [ ] Video tutorial ready
- [ ] PDF panduan ready
- [ ] Support system ready
- [ ] Tracking sheet prepared

### **Saat Distribusi:**
- [ ] Send broadcast message
- [ ] Upload to Google Drive
- [ ] Monitor install progress
- [ ] Respond to questions
- [ ] Update tracking sheet

### **After Distribusi:**
- [ ] Verify all schools installed
- [ ] Collect feedback
- [ ] Plan training session
- [ ] Prepare update mechanism

---

## 🆘 SUPPORT CONTACT

**Admin Dinas:**
- Nama: [Nama Anda]
- HP/WA: [Nomor Anda]
- Email: [Email Anda]

**Technical Support:**
- GitHub Issues: https://github.com/atha0604/e-ijazah-app/issues
- Email: support@example.com

---

## 📅 TIMELINE DISTRIBUSI

| Week | Activity | Target |
|------|----------|--------|
| 1 | Preparation & Pilot | 5 schools |
| 2 | Mass Distribution Start | 50 schools |
| 3 | Continued Distribution | 100 schools |
| 4 | Final Push & Support | 256 schools (100%) |

---

**GOOD LUCK! 🚀**

Distribusi 256 sekolah memang challenging, tapi dengan preparation yang baik, pasti bisa! 💪
