# ❓ FAQ - PERTANYAAN YANG SERING DITANYAKAN

## Aplikasi Nilai E-Ijazah

---

## 📋 KATEGORI

1. [Instalasi](#instalasi)
2. [Penggunaan](#penggunaan)
3. [Update](#update)
4. [Backup & Data](#backup--data)
5. [Teknis](#teknis)
6. [Troubleshooting](#troubleshooting)

---

## INSTALASI

### ❓ **Berapa lama proses instalasi?**

**Jawab:**
- Download: 2-5 menit (tergantung internet)
- Install dependencies: 3-5 menit
- Total: **5-10 menit**

---

### ❓ **Harus install apa saja?**

**Jawab:**

**WAJIB:**
- Node.js (dari https://nodejs.org/)
- 2GB free space

**OPTIONAL:**
- Git (untuk auto-update)

**TIDAK PERLU:**
- ❌ Database server (sudah built-in SQLite)
- ❌ Web server (sudah built-in)
- ❌ PHP/Apache/MySQL

---

### ❓ **Harus online atau bisa offline?**

**Jawab:**
- **Install:** Perlu internet (untuk download)
- **Update:** Perlu internet
- **Pakai sehari-hari:** **OFFLINE BISA!** ✅

Sekali install, aplikasi bisa jalan tanpa internet!

---

### ❓ **Install di laptop atau server?**

**Jawab:**
Bisa keduanya!

**Laptop (Standalone):**
- Install di 1 laptop
- Data tersimpan lokal
- Cocok untuk: Sekolah kecil

**Server (Multi-user):**
- Install di 1 server/PC
- Akses dari laptop lain via network
- Cocok untuk: Sekolah besar

---

### ❓ **Bisa di Mac/Linux?**

**Jawab:**
**YA!** Tapi script `.bat` hanya untuk Windows.

**Mac/Linux:**
```bash
# Manual install:
git clone https://github.com/atha0604/e-ijazah-app
cd e-ijazah-app
npm install
npm start
```

---

## PENGGUNAAN

### ❓ **Bagaimana cara login pertama kali?**

**Jawab:**

**Admin Dinas:**
- Kode: `admin`
- Kurikulum: (pilih salah satu)

**Sekolah:**
- Kode: [Kode dari Dinas]
- Kurikulum: K13 / Merdeka

---

### ❓ **Lupa kode sekolah, bagaimana?**

**Jawab:**
1. Hubungi Admin Dinas
2. Atau cek email/WhatsApp saat distribusi awal
3. Atau lihat di dokumen distribusi

**Admin tidak bisa reset kode!** Kode fixed saat setup.

---

### ❓ **Berapa user yang bisa login bersamaan?**

**Jawab:**

**Standalone (1 laptop):**
- 1 user

**Server mode:**
- Unlimited! (Tergantung spec server)
- Recommended: 5-10 user concurrent

---

### ❓ **Data siswa harus input manual?**

**Jawab:**
**TIDAK!** Bisa import Excel!

**Cara import:**
1. Login → Menu Import
2. Download template Excel
3. Isi data di Excel
4. Upload file
5. Selesai!

---

### ❓ **Format e-Ijazah bisa dicustom?**

**Jawab:**
Ya, bisa!

**Yang bisa dicustom:**
- Logo sekolah
- Tanda tangan
- Template layout (via admin)

**Contact support untuk customize lanjutan**

---

## UPDATE

### ❓ **Seberapa sering harus update?**

**Jawab:**
- **Wajib:** Saat ada security update
- **Recommended:** Setiap ada fitur baru
- **Minimal:** 1x per semester

Cek update: https://github.com/atha0604/e-ijazah-app/releases

---

### ❓ **Cara update aplikasi?**

**Jawab:**

**Jika install dengan Git:**
```bash
# Double-click:
3-UPDATE-APLIKASI.bat
```

**Jika install tanpa Git:**
1. Download versi baru
2. Backup database
3. Extract versi baru
4. Copy database ke folder baru

---

### ❓ **Update akan hapus data?**

**Jawab:**
**TIDAK!** Data aman.

Tapi tetap **BACKUP DULU** sebelum update!

Script update otomatis backup database.

---

## BACKUP & DATA

### ❓ **Bagaimana cara backup data?**

**Jawab:**

**Cara 1 - Via Aplikasi:**
1. Login as Admin
2. Menu "Backup & Restore"
3. Klik "Create Backup"

**Cara 2 - Manual:**
Copy file:
```
src/database/db.sqlite
```

---

### ❓ **Seberapa sering harus backup?**

**Jawab:**

**Recommended:**
- Harian: Jika input data banyak
- Mingguan: Normal usage
- Bulanan: Minimal

**Auto backup:**
- Sebelum update (otomatis by script)

---

### ❓ **Backup disimpan dimana?**

**Jawab:**

**Default:**
```
folder-aplikasi/backup/
```

**Recommended juga:**
- 💾 USB Flash Drive
- ☁️ Google Drive / Cloud
- 💿 External Hard Disk

**JANGAN** cuma di 1 tempat!

---

### ❓ **Bisa restore data lama?**

**Jawab:**
**YA!**

**Via Aplikasi:**
1. Menu "Backup & Restore"
2. Pilih file backup
3. Klik "Restore"

**Manual:**
1. Stop aplikasi
2. Copy file backup ke `src/database/db.sqlite`
3. Start aplikasi

---

### ❓ **Data bisa di-migrate ke sekolah lain?**

**Jawab:**
**TIDAK RECOMMENDED!**

Setiap sekolah punya kode & data sendiri.

**Kecuali:**
- Sekolah merger
- Export data untuk arsip

Contact support untuk migration.

---

## TEKNIS

### ❓ **Aplikasi pakai database apa?**

**Jawab:**
**SQLite** (embedded database)

**Keuntungan:**
- ✅ Tidak perlu install database server
- ✅ File-based (mudah backup)
- ✅ Cepat
- ✅ Reliable

---

### ❓ **Bisa ganti ke MySQL/PostgreSQL?**

**Jawab:**
**BISA**, tapi tidak recommended untuk sekolah.

SQLite sudah cukup untuk:
- Ratusan siswa
- Puluhan user

**MySQL/PostgreSQL** hanya untuk:
- Deployment cloud
- Multi-sekolah dalam 1 sistem

---

### ❓ **Aplikasi pakai port berapa?**

**Jawab:**
**Default: 3000**

**Ganti port:**
Edit file `.env`:
```
PORT=3001
```

---

### ❓ **Bisa akses dari laptop lain?**

**Jawab:**
**YA!**

**Setup:**

1. **Di laptop server:**
   - Jalankan aplikasi
   - Cek IP: `ipconfig`
   - Misal: `192.168.1.100`

2. **Di laptop lain (network sama):**
   - Buka browser
   - Ketik: `http://192.168.1.100:3000`

3. **Setting firewall:**
   - Allow port 3000

---

### ❓ **Aman dari hack/virus?**

**Jawab:**

**Security features:**
- ✅ Password encryption (bcrypt)
- ✅ JWT authentication
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ CORS enabled

**Best practices:**
- 🔒 Gunakan password kuat
- 🔒 Jangan share kode sekolah
- 🔒 Update aplikasi teratur
- 🔒 Backup data rutin

---

## TROUBLESHOOTING

### ❓ **"Node.js belum terinstall" - kenapa?**

**Jawab:**
Karena memang belum install 😊

**Solusi:**
1. Download: https://nodejs.org/
2. Install versi LTS
3. Restart komputer
4. Coba lagi

---

### ❓ **"Port 3000 already in use" - apa artinya?**

**Jawab:**
Ada aplikasi lain pakai port 3000.

**Solusi:**
```bash
# Kill process:
npx kill-port 3000

# Atau ganti port di .env:
PORT=3001
```

---

### ❓ **Browser tidak terbuka otomatis?**

**Jawab:**
**Normal!** Kadang antivirus block.

**Solusi:**
Buka manual:
```
http://localhost:3000
```

---

### ❓ **Aplikasi tiba-tiba crash?**

**Jawab:**

**Penyebab:**
- RAM penuh
- Database corrupt
- Bug

**Solusi:**
1. Restart aplikasi
2. Restart komputer
3. Cek log error di CMD
4. Report ke support

---

### ❓ **Data tiba-tiba hilang?**

**Jawab:**

**Kemungkinan:**
- Database corrupt
- Salah folder instalasi
- Disk penuh

**Solusi:**
1. Cek folder `backup/`
2. Restore backup terakhir
3. Jika tidak ada backup, contact support

**PENTING:** Selalu backup rutin!

---

## 💡 TIPS & TRICKS

### ✅ **Mempercepat instalasi:**
- Download saat internet cepat (pagi/malam)
- Disable antivirus sementara
- Gunakan kabel LAN (bukan WiFi)

### ✅ **Mempercepat aplikasi:**
- Tutup aplikasi lain
- Minimal RAM 4GB
- Gunakan SSD

### ✅ **Mencegah data hilang:**
- Backup rutin!
- Simpan di 2+ tempat
- Test restore sesekali

### ✅ **Memudahkan support:**
- Screenshot error
- Catat langkah yang sudah dicoba
- Siapkan info sistem

---

## 📞 BELUM TERJAWAB?

Hubungi support:

- 📱 WhatsApp: [Nomor Support]
- 📧 Email: [Email Support]
- 🌐 GitHub: https://github.com/atha0604/e-ijazah-app/issues

---

**Semoga membantu! 🎉**
