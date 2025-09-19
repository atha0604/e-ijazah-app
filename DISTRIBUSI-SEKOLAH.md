# 🏫 Panduan Distribusi Aplikasi Nilai E-Ijazah untuk Sekolah

## 📦 File Distribusi yang Tersedia

### 1. **Aplikasi-Nilai-E-Ijazah-v2.6.0-Portable.zip** ⭐ RECOMMENDED
- **Ukuran:** ~50MB (setelah di-zip)
- **Type:** Portable Application
- **Kebutuhan:** Node.js harus ter-install di komputer target
- **Kelebihan:**
  - ✅ Mudah didistribusi (1 file ZIP)
  - ✅ Tidak perlu installer
  - ✅ Bisa dijalankan dari folder manapun
  - ✅ Database portable (ikut dalam folder)

### 2. **aplikasi-nilai-e-ijazah-portable/** (Folder)
- **Type:** Uncompressed application folder
- **Untuk:** Distribusi langsung via flash drive atau shared folder

## 🚀 Instruksi untuk Sekolah

### **Langkah 1: Persiapan Komputer**
1. **Install Node.js** (jika belum ada)
   - Download dari: https://nodejs.org/
   - Pilih versi **LTS (Long Term Support)**
   - Install dengan setting default
   - Restart komputer setelah install

2. **Cek Installation Node.js**
   - Buka Command Prompt (cmd)
   - Ketik: `node --version`
   - Harus muncul versi Node.js (contoh: v18.17.0)

### **Langkah 2: Install Aplikasi**

#### **Metode A: Menggunakan ZIP File (Recommended)**
1. Download file `Aplikasi-Nilai-E-Ijazah-v2.6.0-Portable.zip`
2. Extract/Unzip ke folder pilihan (contoh: `C:\\Aplikasi-E-Ijazah\\`)
3. Buka folder hasil extract
4. Double-click file `start-aplikasi.bat`
5. Tunggu sampai muncul pesan "Server berjalan di http://localhost:3000"
6. Buka browser dan kunjungi: http://localhost:3000

#### **Metode B: Menggunakan Folder**
1. Copy folder `aplikasi-nilai-e-ijazah-portable` ke komputer
2. Buka folder tersebut
3. Double-click `start-aplikasi.bat`
4. Ikuti langkah 5-6 dari Metode A

### **Langkah 3: Penggunaan**
1. **Login** menggunakan kode aplikasi yang diberikan
2. **Import Data** siswa menggunakan template Excel
3. **Input Nilai** untuk setiap mata pelajaran
4. **Generate E-Ijazah** dan export data

## 🔧 Troubleshooting

### **Port Sudah Digunakan**
Jika muncul error "port 3000 already in use":
1. Buka file `.env` di folder aplikasi
2. Ubah `PORT=3000` menjadi `PORT=3001`
3. Restart aplikasi
4. Akses via http://localhost:3001

### **Error Module Not Found**
1. Buka Command Prompt di folder aplikasi
2. Jalankan: `npm install`
3. Tunggu sampai selesai
4. Coba jalankan aplikasi lagi

### **Aplikasi Tidak Bisa Dibuka**
1. Pastikan Node.js ter-install dengan benar
2. Cek antivirus - mungkin memblokir aplikasi
3. Run Command Prompt as Administrator
4. Navigate ke folder aplikasi
5. Jalankan: `node server.js`

### **Database Error**
1. Pastikan folder aplikasi memiliki write permission
2. Cek file `src/database/db.sqlite` ada dan tidak corrupt
3. Jika perlu, hapus file database dan restart aplikasi

## 💾 Backup Data

### **Lokasi Data**
- Database: `src/database/db.sqlite`
- File uploads: `public/uploads/` (jika ada)
- Settings: `.env` file

### **Cara Backup**
1. Copy seluruh folder aplikasi ke tempat aman
2. Atau minimal backup file `src/database/db.sqlite`

### **Restore Data**
1. Copy file backup `db.sqlite` ke `src/database/`
2. Restart aplikasi

## 🌐 Akses Multi-User (Optional)

Untuk akses dari komputer lain dalam jaringan:
1. Edit file `.env`
2. Tambah baris: `HOST=0.0.0.0`
3. Restart aplikasi
4. Komputer lain akses via: http://[IP-SERVER]:3000

**Catatan:** Pastikan firewall Windows mengizinkan koneksi ke port 3000

## 📞 Support

**Developer:** Prasetya Lukmana
**Versi:** 2.6.0
**Build Date:** 17 September 2025

### **Untuk Bantuan Teknis:**
1. Kirim screenshot error yang muncul
2. Sertakan informasi:
   - Versi Windows
   - Versi Node.js (`node --version`)
   - Langkah yang sudah dicoba

---

## 🎯 Keunggulan Aplikasi

- ✅ **100% Offline** - Tidak perlu koneksi internet
- ✅ **Portable** - Bisa dipindah-pindah komputer
- ✅ **Secure** - Data tersimpan lokal di sekolah
- ✅ **User-Friendly** - Interface yang mudah digunakan
- ✅ **Multi-Platform** - Berjalan di Windows, Mac, Linux
- ✅ **Lightweight** - Tidak memakan banyak resource

**Selamat menggunakan Aplikasi Nilai E-Ijazah! 🎓**