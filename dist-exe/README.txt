# Aplikasi Nilai E-Ijazah (Standalone Executable)

## Cara Penggunaan

### 1. Menjalankan Aplikasi
Double-click file: `JALANKAN-APLIKASI.bat`

Atau manual:
- Auto mode: `Aplikasi-Nilai-E-Ijazah.exe`
- Offline mode: `Aplikasi-Nilai-E-Ijazah.exe --offline`
- Online mode: `Aplikasi-Nilai-E-Ijazah.exe --online`

### 2. Mode Aplikasi

#### AUTO MODE (Recommended)
- Aplikasi akan otomatis mendeteksi koneksi internet
- Jika ada internet: menggunakan versi online (selalu update)
- Jika tidak ada internet: menggunakan versi offline (data lokal)

#### OFFLINE MODE
- Paksa menggunakan server lokal
- Data tersimpan di komputer
- Tidak memerlukan internet
- Port default: 3000

#### ONLINE MODE
- Paksa menggunakan server online
- Data tersimpan di cloud
- Memerlukan koneksi internet
- URL: https://nilai-e-ijazah.koyeb.app

### 3. File dan Folder

- `Aplikasi-Nilai-E-Ijazah.exe` - Executable utama
- `JALANKAN-APLIKASI.bat` - Launcher dengan menu
- `public/` - File web aplikasi
- `src/` - Source code backend
- `assets/` - Aset aplikasi
- `.env.example` - Contoh konfigurasi

### 4. Kebutuhan Sistem

- Windows 7/8/10/11 (64-bit)
- Minimal 2GB RAM
- 50MB space hard disk
- Browser modern untuk interface

### 5. Akses Aplikasi

Setelah aplikasi berjalan, browser akan terbuka otomatis.
Jika tidak, buka browser dan kunjungi:
- Mode offline: http://localhost:3000
- Mode online: https://nilai-e-ijazah.koyeb.app

### 6. Troubleshooting

#### Port sudah digunakan
- Tutup aplikasi lain yang menggunakan port 3000
- Atau restart komputer

#### Browser tidak terbuka otomatis
- Buka browser manual
- Kunjungi http://localhost:3000 (offline) atau https://nilai-e-ijazah.koyeb.app (online)

#### Error saat startup
- Pastikan folder public/ dan src/ ada di direktori yang sama dengan .exe
- Cek koneksi internet untuk mode online

---

**Dikembangkan oleh:** Prasetya Lukmana
**Versi:** 2.7.0 Standalone
**Teknologi:** Node.js Native, Express, Socket.IO

**Keunggulan Standalone:**
✅ Tidak perlu install Node.js
✅ Tidak perlu install dependencies
✅ Satu file executable
✅ Auto-detection internet
✅ Browser auto-open
✅ Distribusi mudah ke sekolah
