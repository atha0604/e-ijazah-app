# Aplikasi Nilai E-Ijazah - Final Standalone

## Deskripsi
Aplikasi pengelolaan nilai untuk sekolah dasar dengan fitur e-ijazah yang dapat berjalan offline dan online secara otomatis, mirip dengan aplikasi Dapodik.

## Fitur Utama
- ✅ **Standalone Executable** - Tidak perlu install Node.js atau dependencies
- ✅ **Auto Detection** - Otomatis pilih offline/online berdasarkan koneksi internet
- ✅ **Offline First** - Dapat berjalan tanpa internet
- ✅ **Online Sync** - Sinkronisasi data ke server cloud saat ada internet
- ✅ **Browser Auto-Open** - Interface web terbuka otomatis
- ✅ **Port Auto-Detection** - Otomatis cari port yang tersedia
- ✅ **Embedded Routes** - Semua API sudah tertanam dalam executable

## Cara Instalasi

1. **Extract File ZIP**
   - Extract ke folder mana saja (misal: C:\E-Ijazah)
   - Pastikan folder public/ dan E-Ijazah-Aplikasi.exe dalam direktori yang sama

2. **Jalankan Aplikasi**
   - Double-click: `JALANKAN-APLIKASI.bat`
   - Atau manual: `E-Ijazah-Aplikasi.exe`

## Mode Aplikasi

### 1. AUTO MODE (Recommended)
- Deteksi koneksi internet otomatis
- Offline jika tidak ada internet
- Online jika ada internet
- Command: `E-Ijazah-Aplikasi.exe` (default)

### 2. OFFLINE MODE
- Paksa gunakan server lokal
- Data tersimpan di komputer
- Port: 3000 (atau auto-detect port kosong)
- Command: `E-Ijazah-Aplikasi.exe --offline`

### 3. ONLINE MODE
- Paksa gunakan server cloud
- Data tersimpan di server online
- URL: https://nilai-e-ijazah.koyeb.app
- Command: `E-Ijazah-Aplikasi.exe --online`

## Struktur File

```
aplikasi-nilai-e-ijazah-final/
├── E-Ijazah-Aplikasi.exe      # Executable utama
├── JALANKAN-APLIKASI.bat      # Launcher dengan menu
├── README.txt                 # Dokumentasi ini
├── public/                    # File web interface
│   ├── E-ijazah.html         # Halaman utama
│   ├── style.css             # Styling
│   ├── script.js             # JavaScript
│   └── ...                   # File pendukung lainnya
└── assets/                    # Asset aplikasi (opsional)
    └── icon.ico              # Icon aplikasi
```

## Kebutuhan Sistem

- **OS**: Windows 7/8/10/11 (64-bit)
- **RAM**: Minimal 2GB
- **Storage**: 50MB free space
- **Browser**: Chrome, Firefox, Edge (modern browser)
- **Network**: Opsional (untuk mode online)

## Akses Aplikasi

### Mode Offline
- URL: http://localhost:3000 (atau port yang ditampilkan)
- Browser akan terbuka otomatis
- Jika tidak: buka browser manual ke localhost:3000

### Mode Online
- URL: https://nilai-e-ijazah.koyeb.app
- Browser akan terbuka otomatis
- Memerlukan koneksi internet

## Troubleshooting

### Port Already in Use
- Aplikasi akan otomatis cari port kosong
- Jika masih error: restart komputer
- Atau tutup aplikasi lain yang menggunakan port 3000

### Browser Tidak Terbuka
- Buka browser manual
- Ketik: localhost:3000 (untuk offline)
- Atau: nilai-e-ijazah.koyeb.app (untuk online)

### Error "public/E-ijazah.html not found"
- Pastikan folder public/ ada di direktori yang sama dengan .exe
- Re-extract file ZIP dengan lengkap

### Aplikasi Tidak Bisa Start
- Pastikan Windows Defender tidak memblokir
- Run as Administrator jika perlu
- Cek apakah .exe corrupt (re-download)

## Workflow Penggunaan (Seperti Dapodik)

1. **Input Data Offline**
   - Buka aplikasi dalam mode offline/auto
   - Input data siswa, nilai, dll
   - Data tersimpan lokal secara otomatis

2. **Sinkronisasi Online**
   - Saat ada internet, ganti ke mode online
   - Data akan tersinkronisasi ke server cloud
   - Backup otomatis tersimpan online

3. **Akses Multi-Device**
   - Mode online dapat diakses dari komputer mana saja
   - Mode offline hanya di komputer lokal
   - Data terpusat di server cloud

## Informasi Teknis

- **Engine**: Node.js 18 (embedded)
- **Framework**: Express.js, Socket.IO
- **Database**: SQLite (offline), MySQL (online)
- **Packaging**: PKG (Node.js to executable)
- **Size**: ~20MB (standalone)

## Dukungan

- **Developer**: Prasetya Lukmana
- **Email**: support@e-ijazah.app
- **GitHub**: https://github.com/atha0604/e-ijazah-app
- **Version**: 2.7.0 Final Standalone

## Lisensi

ISC License - Free for educational use

---

**Catatan**: Aplikasi ini dirancang khusus untuk sekolah dasar di Indonesia dengan mengikuti standar kurikulum dan format ijazah yang berlaku.

**Semoga bermanfaat untuk kemajuan pendidikan di Indonesia! 🇮🇩**
