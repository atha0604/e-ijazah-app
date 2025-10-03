# 📘 PANDUAN INSTALASI - APLIKASI NILAI E-IJAZAH
## Untuk Admin Sekolah

---

## 📦 PERSYARATAN SISTEM

### Minimum:
- ✅ Windows 7 / 8 / 10 / 11
- ✅ RAM: 2 GB
- ✅ Processor: Intel Core 2 Duo atau setara
- ✅ Storage: 500 MB ruang kosong
- ✅ Browser: Chrome / Edge / Firefox (untuk tampilan web)

### Recommended:
- ✅ Windows 10 / 11
- ✅ RAM: 4 GB
- ✅ Processor: Intel Core i3 atau lebih tinggi
- ✅ Storage: 1 GB ruang kosong
- ✅ Koneksi internet (untuk sinkronisasi data)

---

## 📥 INSTALASI

### Step 1: Download Aplikasi

Download file: **aplikasi-nilai-e-ijazah-final-v2.7.0.zip**
- Dari link yang diberikan oleh Dinas Pendidikan
- Atau dari GitHub releases

### Step 2: Extract File

1. Klik kanan pada file ZIP
2. Pilih "Extract All..." atau "Extract Here"
3. Pilih folder tujuan (misal: `C:\Aplikasi E-Ijazah`)
4. Klik "Extract"

### Step 3: Jalankan Aplikasi

1. Buka folder hasil extract
2. **Double-click** pada file: `JALANKAN-APLIKASI.bat`
3. Pilih mode aplikasi:
   - **[1] AUTO** - Recommended (otomatis deteksi online/offline)
   - **[2] OFFLINE** - Mode offline saja
   - **[3] ONLINE** - Mode online saja
   - **[4] HELP** - Lihat bantuan

### Step 4: Akses Aplikasi

Setelah aplikasi berjalan:
1. Browser otomatis terbuka
2. Atau buka manual: `http://localhost:3000`
3. Login dengan akun yang sudah didaftarkan

---

## 🔐 LOGIN PERTAMA KALI

### Default Admin:
- **Username**: (sesuai data sekolah)
- **Password**: (akan diberikan oleh Dinas)

### Ubah Password:
1. Login dengan password default
2. Klik menu "Profil"
3. Pilih "Ubah Password"
4. Masukkan password baru
5. Simpan

---

## 🔄 SINKRONISASI DATA KE DINAS

### Setup Awal Sinkronisasi:

1. **Login ke aplikasi**

2. **Buka Panel Sinkronisasi**
   - Lihat di bagian bawah dashboard
   - Ada panel "🔄 Sinkronisasi Data"

3. **Klik ⚙️ Pengaturan**

4. **Masukkan URL Server Dinas**
   ```
   https://dinas-server-xxxxxxx.up.railway.app
   ```
   *(URL akan diberikan oleh Dinas Pendidikan)*

5. **Klik 🔌 Test Koneksi**
   - Pastikan muncul pesan "✅ Koneksi berhasil!"
   - Jika gagal, cek:
     - Koneksi internet
     - URL server sudah benar
     - Firewall tidak memblokir

6. **Aktifkan Sinkronisasi Otomatis** (Optional)
   - Centang "Aktifkan sinkronisasi otomatis"
   - Pilih interval:
     - Setiap 1 jam (Recommended)
     - Setiap 2 jam
     - Setiap 6 jam
     - Setiap 12 jam
     - Setiap 24 jam

7. **Klik 💾 Simpan**

### Cara Sinkronisasi Manual:

1. Pastikan ada koneksi internet
2. Klik tombol **"🔄 Sinkronisasi Sekarang"**
3. Tunggu proses selesai (biasanya < 1 menit)
4. Lihat notifikasi:
   - ✅ **Berhasil**: "X data tersinkronisasi"
   - ❌ **Gagal**: Lihat pesan error

### Lihat Riwayat Sinkronisasi:

1. Klik tombol **"📊 Riwayat"**
2. Lihat log sinkronisasi:
   - Waktu sinkronisasi
   - Jumlah data tersinkron
   - Status (sukses/gagal)
   - Error message (jika ada)

---

## 💾 INPUT DATA NILAI

### 1. Input Manual:

1. **Login ke aplikasi**
2. **Pilih menu "Data Siswa"**
3. **Klik "Tambah Siswa"**
4. **Isi form:**
   - NISN
   - Nama Lengkap
   - Tempat/Tanggal Lahir
   - Jenis Kelamin
   - dll.
5. **Simpan**

### 2. Import dari Excel:

1. **Siapkan file Excel** dengan format:
   ```
   | NISN | Nama | Tempat Lahir | Tanggal Lahir | Jenis Kelamin | ... |
   ```

2. **Pilih menu "Import Data"**

3. **Upload file Excel**

4. **Mapping kolom** (jika perlu)

5. **Klik "Import"**

6. **Lihat hasil**:
   - Berhasil: X data
   - Gagal: Y data (dengan alasan)

### 3. Input Nilai:

1. **Pilih menu "Input Nilai"**
2. **Pilih siswa** dari daftar
3. **Pilih mata pelajaran**
4. **Masukkan nilai:**
   - Pengetahuan
   - Keterampilan
   - Sikap
5. **Simpan**

### 4. Cetak Ijazah/Rapor:

1. **Pilih menu "Cetak Dokumen"**
2. **Pilih jenis:**
   - Ijazah
   - Rapor
   - SKHU
3. **Pilih siswa**
4. **Preview PDF**
5. **Download atau Print**

---

## 🔧 TROUBLESHOOTING

### Aplikasi tidak bisa dibuka

**Solusi:**
1. Cek apakah `E-Ijazah-Aplikasi.exe` ada di folder
2. Klik kanan → "Run as Administrator"
3. Disable antivirus sementara (beberapa antivirus salah deteksi)
4. Cek Windows Defender → Allow aplikasi

### Browser tidak otomatis terbuka

**Solusi:**
1. Buka browser manual
2. Ketik: `http://localhost:3000`
3. Tekan Enter

### Port 3000 sudah dipakai

**Solusi:**
1. Aplikasi otomatis coba port lain (3001, 3002, dst)
2. Atau tutup aplikasi lain yang pakai port 3000
3. Restart aplikasi

### Tidak bisa login

**Solusi:**
1. Cek username dan password
2. Clear cache browser (Ctrl+Shift+Del)
3. Coba browser lain
4. Reset password via Dinas Pendidikan

### Sinkronisasi gagal

**Solusi:**
1. **Cek koneksi internet**
   - Buka browser → google.com
   - Pastikan bisa akses internet

2. **Test koneksi ke server**
   - Settings → Test Koneksi
   - Lihat error message

3. **Cek URL server**
   - Pastikan URL benar
   - Tidak ada spasi di awal/akhir
   - Format: `https://...`

4. **Cek firewall**
   - Windows Firewall → Allow aplikasi
   - Antivirus → Whitelist aplikasi

5. **Cek dengan Dinas**
   - Server mungkin sedang maintenance
   - Hubungi admin dinas

### Data hilang / tidak muncul

**Solusi:**
1. **Refresh halaman** (F5)
2. **Clear cache browser**
3. **Cek database**:
   - Folder aplikasi → `src/database/db.sqlite`
   - File harus ada dan > 0 KB
4. **Restore backup**:
   - Jika ada backup, restore dari backup

### Excel import error

**Solusi:**
1. **Cek format Excel**:
   - File .xlsx atau .xls
   - Header kolom sesuai
   - Tidak ada merge cells
   - Data tidak ada yang kosong

2. **Cek data**:
   - NISN harus angka 10 digit
   - Tanggal format: DD/MM/YYYY
   - Tidak ada karakter aneh

3. **Download template**:
   - Menu Import → Download Template
   - Isi sesuai template

---

## 💡 TIPS BEST PRACTICES

### 1. Backup Data Rutin
- Export data ke Excel setiap minggu
- Simpan file Excel di folder lain (bukan folder aplikasi)
- Atau copy file `src/database/db.sqlite` ke backup folder

### 2. Sinkronisasi Rutin
- Minimal 1x seminggu
- Lebih baik aktifkan auto-sync
- Jangan tunggu deadline!

### 3. Update Aplikasi
- Cek update rutin di menu "Cek Update"
- Download versi terbaru jika ada
- Backup data sebelum update

### 4. Gunakan Mode Auto
- Mode auto lebih flexible
- Otomatis switch online/offline
- Tidak perlu setting manual

### 5. Internet Stabil
- Sinkronisasi saat internet stabil
- Hindari jam sibuk (pagi/siang)
- Pakai WiFi lebih stabil dari hotspot HP

---

## 📞 BANTUAN & SUPPORT

### Kontak Dinas Pendidikan:
- **Telepon**: (akan diisi oleh dinas)
- **Email**: (akan diisi oleh dinas)
- **WhatsApp**: (akan diisi oleh dinas)

### Jam Operasional:
- Senin - Jumat: 08:00 - 16:00
- Sabtu - Minggu: Libur

### Pertanyaan Umum:

**Q: Apakah harus online terus?**
A: Tidak. Input data bisa offline, sinkronisasi butuh online.

**Q: Berapa lama sinkronisasi?**
A: Biasanya < 1 menit untuk data normal (ratusan siswa).

**Q: Data hilang saat update aplikasi?**
A: Tidak, data tersimpan di database terpisah. Tapi tetap backup!

**Q: Bisa install di laptop dan PC?**
A: Bisa, tapi data tidak auto-sync antar komputer. Harus manual export-import.

**Q: Gratis atau bayar?**
A: Gratis untuk sekolah yang terdaftar di Dinas Pendidikan.

**Q: Keamanan data?**
A: Data terenkripsi dan tersimpan lokal di komputer sekolah.

---

## 📋 CHECKLIST INSTALASI

- [ ] Download aplikasi
- [ ] Extract ke folder
- [ ] Jalankan JALANKAN-APLIKASI.bat
- [ ] Login berhasil
- [ ] Ubah password default
- [ ] Setup URL server dinas
- [ ] Test koneksi ke server
- [ ] Aktifkan auto-sync
- [ ] Import/input data siswa
- [ ] Test sinkronisasi manual
- [ ] Cek data di dashboard dinas (via admin)
- [ ] Bookmark halaman aplikasi di browser

---

## 🎯 LANGKAH BERIKUTNYA

1. ✅ Instalasi selesai
2. ✅ Setup sinkronisasi
3. ✅ Input data siswa
4. ✅ Input nilai
5. ✅ Sinkronisasi ke dinas
6. ✅ Cetak ijazah/rapor

---

**Selamat menggunakan Aplikasi Nilai E-Ijazah! 🎓**

*Versi: 2.7.0*
*Update: 3 Januari 2025*
