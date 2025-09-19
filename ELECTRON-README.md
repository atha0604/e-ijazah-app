# Aplikasi Nilai E-Ijazah - Desktop Version

Aplikasi desktop untuk pengelolaan nilai e-ijazah sekolah dasar yang dapat berjalan offline.

## 🚀 Cara Install Dependencies

1. **Install Node.js** (jika belum ada)
   - Download dari: https://nodejs.org/
   - Pilih versi LTS (Recommended)

2. **Install Dependencies Electron**
   ```bash
   npm install
   ```

## 🎯 Cara Menjalankan Aplikasi

### Mode Development (Testing)
```bash
npm run electron-dev
```

### Mode Production
```bash
npm run electron
```

### Build .exe untuk Distribusi
```bash
npm run dist
```

File .exe akan dibuat di folder `dist/`

## 📁 Struktur File

```
aplikasi-nilai-e-ijazah/
├── electron-main.js       # Main process Electron
├── server.js              # Backend Express server
├── package.json           # Dependencies & build config
├── public/                # Frontend files
├── src/                   # Source code
├── assets/                # Icons & resources
└── dist/                  # Built .exe files
```

## ✨ Fitur Desktop

- ✅ **Offline Operation** - Tidak perlu koneksi internet
- ✅ **Portable Database** - File SQLite tersimpan di folder aplikasi
- ✅ **Auto Server Start** - Server backend otomatis jalan saat buka aplikasi
- ✅ **Native Menu** - Menu bar Windows yang familiar
- ✅ **Desktop Shortcut** - Installer otomatis buat shortcut
- ✅ **Single .exe Installer** - Mudah distribusi ke sekolah

## 🏫 Distribusi ke Sekolah

1. **Build aplikasi:**
   ```bash
   npm run dist
   ```

2. **File yang didistribusikan:**
   - `aplikasi-nilai-e-ijazah Setup.exe` (installer)
   - Atau folder lengkap untuk portable version

3. **Instruksi untuk sekolah:**
   - Double-click installer
   - Follow wizard installation
   - Buka aplikasi dari desktop shortcut
   - Data tersimpan otomatis di folder aplikasi

## 🔧 Troubleshooting

### Server Tidak Start
- Pastikan port 3000 tidak digunakan aplikasi lain
- Restart aplikasi
- Check antivirus (mungkin block Node.js)

### Database Error
- Pastikan folder aplikasi memiliki write permission
- Check file `src/database/db.sqlite` ada dan tidak corrupt

### Build Error
- Pastikan semua dependencies ter-install: `npm install`
- Check Node.js version minimal 16.x
- Run `npm run build-win` dengan admin privilege

## 📞 Support

Untuk bantuan teknis, hubungi:
**Prasetya Lukmana**

---
*Generated with Electron v28.0.0*