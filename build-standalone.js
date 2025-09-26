const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { exec } = require('child_process');

console.log('🏗️  Building True Standalone Executable...');

const distDir = path.join(__dirname, 'dist-standalone');
const packageName = 'aplikasi-nilai-e-ijazah-final';

// Clean dist directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Create executable using pkg
async function createStandaloneExecutable() {
    try {
        console.log('📦 Creating standalone executable with embedded routes...');

        // Create pkg command for standalone version
        const pkgCommand = `npx pkg app-standalone.js --targets node18-win-x64 --output "${path.join(distDir, 'E-Ijazah-Aplikasi.exe')}"`;

        await new Promise((resolve, reject) => {
            exec(pkgCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ PKG Error:', error);
                    reject(error);
                    return;
                }
                console.log('✅ Standalone executable created successfully');
                if (stdout) console.log('PKG Output:', stdout);
                if (stderr) console.log('PKG Warnings:', stderr);
                resolve();
            });
        });

        console.log('📁 Copying required files...');

        // Copy public folder (required for web interface)
        copyDirectory(path.join(__dirname, 'public'), path.join(distDir, 'public'));
        console.log('✅ Copied: public/');

        // Copy assets if exists
        const assetsPath = path.join(__dirname, 'assets');
        if (fs.existsSync(assetsPath)) {
            copyDirectory(assetsPath, path.join(distDir, 'assets'));
            console.log('✅ Copied: assets/');
        }

        // Create enhanced launcher batch file
        const launcherBat = `@echo off
title Aplikasi Nilai E-Ijazah - Final Standalone
color 0A
cls

echo.
echo ================================================================
echo                 APLIKASI NILAI E-IJAZAH
echo                    VERSI STANDALONE
echo ================================================================
echo.
echo  Aplikasi pengelolaan nilai sekolah dasar dengan fitur e-ijazah
echo  yang dapat berjalan offline dan online secara otomatis.
echo.
echo  Dikembangkan oleh: Prasetya Lukmana
echo  Versi: 2.7.0 Final
echo.
echo ================================================================
echo.
echo Pilih mode aplikasi:
echo.
echo [1] AUTO    - Deteksi otomatis (Recommended)
echo             Offline jika tidak ada internet, Online jika ada
echo.
echo [2] OFFLINE - Paksa mode offline
echo             Aplikasi hanya berjalan lokal di komputer ini
echo.
echo [3] ONLINE  - Paksa mode online
echo             Aplikasi menggunakan server cloud
echo.
echo [4] HELP    - Bantuan dan informasi
echo.
echo [5] EXIT    - Keluar dari aplikasi
echo.

choice /c 12345 /n /m "Masukkan pilihan (1-5): "

if errorlevel 5 goto exit
if errorlevel 4 goto help
if errorlevel 3 goto online
if errorlevel 2 goto offline
if errorlevel 1 goto auto

:auto
cls
echo.
echo ================================================================
echo                      MODE AUTO DETECTION
echo ================================================================
echo.
echo 🔍 Mendeteksi koneksi internet...
echo 🚀 Memulai aplikasi dalam mode AUTO...
echo.
echo ✅ Aplikasi akan:
echo    - Cek koneksi internet otomatis
echo    - Gunakan online jika internet tersedia
echo    - Gunakan offline jika tidak ada internet
echo    - Buka browser secara otomatis
echo.
echo 💡 Tunggu sebentar, aplikasi sedang starting...
echo.
"E-Ijazah-Aplikasi.exe"
goto end

:offline
cls
echo.
echo ================================================================
echo                        MODE OFFLINE
echo ================================================================
echo.
echo 🖥️  Memulai dalam mode OFFLINE...
echo.
echo ✅ Aplikasi akan:
echo    - Menggunakan server lokal
echo    - Data tersimpan di komputer ini
echo    - Tidak memerlukan koneksi internet
echo    - Buka browser ke localhost
echo.
echo 💡 Tunggu sebentar, server lokal sedang starting...
echo.
"E-Ijazah-Aplikasi.exe" --offline
goto end

:online
cls
echo.
echo ================================================================
echo                        MODE ONLINE
echo ================================================================
echo.
echo 🌍 Memulai dalam mode ONLINE...
echo.
echo ✅ Aplikasi akan:
echo    - Menggunakan server cloud
echo    - Data tersimpan di server online
echo    - Memerlukan koneksi internet
echo    - Buka browser ke server online
echo.
echo 💡 Tunggu sebentar, koneksi ke server sedang dibuat...
echo.
"E-Ijazah-Aplikasi.exe" --online
goto end

:help
cls
echo.
echo ================================================================
echo                    BANTUAN DAN INFORMASI
echo ================================================================
echo.
echo 📖 CARA PENGGUNAAN:
echo.
echo 1. INSTALASI:
echo    - Extract file ZIP ke folder mana saja
echo    - Tidak perlu install software tambahan
echo    - Langsung bisa dijalankan
echo.
echo 2. MENJALANKAN:
echo    - Double-click JALANKAN-APLIKASI.bat
echo    - Pilih mode sesuai kebutuhan
echo    - Browser akan terbuka otomatis
echo.
echo 3. MODE APLIKASI:
echo    - AUTO: Deteksi internet otomatis (Recommended)
echo    - OFFLINE: Paksa offline, data lokal
echo    - ONLINE: Paksa online, data cloud
echo.
echo 4. AKSES APLIKASI:
echo    - Offline: http://localhost:3000 (atau port lain)
echo    - Online: https://nilai-e-ijazah.koyeb.app
echo.
echo 5. KEBUTUHAN SISTEM:
echo    - Windows 7/8/10/11 (64-bit)
echo    - Browser modern (Chrome, Firefox, Edge)
echo    - 2GB RAM, 50MB HDD space
echo.
echo 6. TROUBLESHOOTING:
echo    - Port conflict: Aplikasi akan cari port kosong
echo    - Browser tidak buka: Buka manual ke localhost:3000
echo    - Error startup: Pastikan folder public/ ada
echo.
echo ================================================================
echo.
pause
goto start

:exit
cls
echo.
echo ================================================================
echo                         TERIMA KASIH
echo ================================================================
echo.
echo 👋 Terima kasih telah menggunakan Aplikasi Nilai E-Ijazah
echo.
echo 📧 Untuk dukungan dan feedback:
echo    Email: support@e-ijazah.app
echo    GitHub: https://github.com/atha0604/e-ijazah-app
echo.
echo 🎓 Semoga aplikasi ini membantu proses pendidikan di sekolah Anda!
echo.
echo ================================================================
goto realend

:start
goto top

:end
echo.
echo ================================================================
echo                    APLIKASI TELAH BERHENTI
echo ================================================================
echo.
echo 🛑 Aplikasi Nilai E-Ijazah telah dihentikan.
echo.
echo 💡 Tips:
echo    - Tutup browser jika masih terbuka
echo    - Data offline tetap tersimpan
echo    - Jalankan kembali kapan saja
echo.
echo ================================================================
echo.
pause

:realend
`;

        fs.writeFileSync(path.join(distDir, 'JALANKAN-APLIKASI.bat'), launcherBat);
        console.log('✅ Created: JALANKAN-APLIKASI.bat');

        // Create comprehensive README
        const readmeContent = `# Aplikasi Nilai E-Ijazah - Final Standalone

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
   - Extract ke folder mana saja (misal: C:\\E-Ijazah)
   - Pastikan folder public/ dan E-Ijazah-Aplikasi.exe dalam direktori yang sama

2. **Jalankan Aplikasi**
   - Double-click: \`JALANKAN-APLIKASI.bat\`
   - Atau manual: \`E-Ijazah-Aplikasi.exe\`

## Mode Aplikasi

### 1. AUTO MODE (Recommended)
- Deteksi koneksi internet otomatis
- Offline jika tidak ada internet
- Online jika ada internet
- Command: \`E-Ijazah-Aplikasi.exe\` (default)

### 2. OFFLINE MODE
- Paksa gunakan server lokal
- Data tersimpan di komputer
- Port: 3000 (atau auto-detect port kosong)
- Command: \`E-Ijazah-Aplikasi.exe --offline\`

### 3. ONLINE MODE
- Paksa gunakan server cloud
- Data tersimpan di server online
- URL: https://nilai-e-ijazah.koyeb.app
- Command: \`E-Ijazah-Aplikasi.exe --online\`

## Struktur File

\`\`\`
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
\`\`\`

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
`;

        fs.writeFileSync(path.join(distDir, 'README.txt'), readmeContent);
        console.log('✅ Created: README.txt');

        // Create .env file untuk konfigurasi
        const envContent = `# Konfigurasi Aplikasi E-Ijazah
PORT=3000
NODE_ENV=production
DATABASE_PATH=./data/e-ijazah.db
ONLINE_URL=https://nilai-e-ijazah.koyeb.app
`;
        fs.writeFileSync(path.join(distDir, '.env'), envContent);
        console.log('✅ Created: .env');

        console.log('📦 Creating final distribution ZIP...');

        // Create ZIP file
        const output = fs.createWriteStream(path.join(__dirname, `${packageName}-v2.7.0.zip`));
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`✅ Final standalone distribution created: ${packageName}-v2.7.0.zip`);
            console.log(`📊 Archive size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
            console.log('');
            console.log('🎯 TRUE STANDALONE EXECUTABLE READY!');
            console.log('');
            console.log('📋 Final Package Contents:');
            console.log('   - ✅ E-Ijazah-Aplikasi.exe (true standalone, no dependencies)');
            console.log('   - ✅ JALANKAN-APLIKASI.bat (enhanced launcher with help)');
            console.log('   - ✅ public/ folder (web interface)');
            console.log('   - ✅ README.txt (comprehensive documentation)');
            console.log('   - ✅ .env (configuration file)');
            console.log('   - ✅ All routes embedded in executable');
            console.log('   - ✅ Auto port detection');
            console.log('   - ✅ Internet auto-detection');
            console.log('');
            console.log('🏫 DISTRIBUTION TO SCHOOLS:');
            console.log('   ✅ Schools only need to extract and run .bat file');
            console.log('   ✅ No Node.js installation required');
            console.log('   ✅ No npm install needed');
            console.log('   ✅ Works offline and online');
            console.log('   ✅ Like Dapodik - ready to use!');
            console.log('');
            console.log('🚀 Ready for mass distribution!');
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(distDir, false);
        archive.finalize();

    } catch (error) {
        console.error('❌ Error creating standalone executable:', error);
        process.exit(1);
    }
}

// Helper function to copy directories recursively
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Start build process
createStandaloneExecutable();