const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { exec } = require('child_process');

console.log('🏗️  Building Standalone Executable...');

const distDir = path.join(__dirname, 'dist-exe');
const packageName = 'aplikasi-nilai-e-ijazah-standalone';

// Clean dist directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Create executable using pkg
async function createExecutable() {
    try {
        console.log('📦 Creating executable with pkg...');

        // Create pkg command
        const pkgCommand = `npx pkg app-native.js --targets node18-win-x64 --output "${path.join(distDir, 'Aplikasi-Nilai-E-Ijazah.exe')}"`;

        await new Promise((resolve, reject) => {
            exec(pkgCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ PKG Error:', error);
                    reject(error);
                    return;
                }
                console.log('✅ Executable created successfully');
                resolve();
            });
        });

        console.log('📁 Copying required files...');

        // Copy public folder
        copyDirectory(path.join(__dirname, 'public'), path.join(distDir, 'public'));
        console.log('✅ Copied: public/');

        // Copy src folder
        copyDirectory(path.join(__dirname, 'src'), path.join(distDir, 'src'));
        console.log('✅ Copied: src/');

        // Copy assets if exists
        const assetsPath = path.join(__dirname, 'assets');
        if (fs.existsSync(assetsPath)) {
            copyDirectory(assetsPath, path.join(distDir, 'assets'));
            console.log('✅ Copied: assets/');
        }

        // Copy .env.example
        const envExamplePath = path.join(__dirname, '.env.example');
        if (fs.existsSync(envExamplePath)) {
            fs.copyFileSync(envExamplePath, path.join(distDir, '.env.example'));
            console.log('✅ Copied: .env.example');
        }

        // Create launcher batch file
        const launcherBat = `@echo off
title Aplikasi Nilai E-Ijazah - Launcher
color 0A

echo ==========================================
echo     APLIKASI NILAI E-IJAZAH (STANDALONE)
echo ==========================================
echo.
echo Pilih mode aplikasi:
echo.
echo [1] AUTO    - Deteksi otomatis (Recommended)
echo [2] OFFLINE - Paksa mode offline
echo [3] ONLINE  - Paksa mode online
echo [4] EXIT    - Keluar
echo.

choice /c 1234 /n /m "Masukkan pilihan (1-4): "

if errorlevel 4 goto exit
if errorlevel 3 goto online
if errorlevel 2 goto offline
if errorlevel 1 goto auto

:auto
echo.
echo 🚀 Memulai dalam mode AUTO...
echo ✅ Aplikasi akan mendeteksi koneksi internet otomatis
echo.
"Aplikasi-Nilai-E-Ijazah.exe"
goto end

:offline
echo.
echo 🖥️  Memulai dalam mode OFFLINE...
echo ✅ Aplikasi akan menggunakan server lokal
echo.
"Aplikasi-Nilai-E-Ijazah.exe" --offline
goto end

:online
echo.
echo 🌍 Memulai dalam mode ONLINE...
echo ✅ Aplikasi akan menggunakan server cloud
echo.
"Aplikasi-Nilai-E-Ijazah.exe" --online
goto end

:exit
echo.
echo 👋 Terima kasih telah menggunakan Aplikasi Nilai E-Ijazah
goto end

:end
echo.
echo 🛑 Aplikasi telah berhenti.
echo.
pause
`;

        fs.writeFileSync(path.join(distDir, 'JALANKAN-APLIKASI.bat'), launcherBat);
        console.log('✅ Created: JALANKAN-APLIKASI.bat');

        // Create README
        const readmeContent = `# Aplikasi Nilai E-Ijazah (Standalone Executable)

## Cara Penggunaan

### 1. Menjalankan Aplikasi
Double-click file: \`JALANKAN-APLIKASI.bat\`

Atau manual:
- Auto mode: \`Aplikasi-Nilai-E-Ijazah.exe\`
- Offline mode: \`Aplikasi-Nilai-E-Ijazah.exe --offline\`
- Online mode: \`Aplikasi-Nilai-E-Ijazah.exe --online\`

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

- \`Aplikasi-Nilai-E-Ijazah.exe\` - Executable utama
- \`JALANKAN-APLIKASI.bat\` - Launcher dengan menu
- \`public/\` - File web aplikasi
- \`src/\` - Source code backend
- \`assets/\` - Aset aplikasi
- \`.env.example\` - Contoh konfigurasi

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
`;

        fs.writeFileSync(path.join(distDir, 'README.txt'), readmeContent);
        console.log('✅ Created: README.txt');

        console.log('📦 Creating distribution ZIP...');

        // Create ZIP file
        const output = fs.createWriteStream(path.join(__dirname, `${packageName}-v2.7.0.zip`));
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`✅ Standalone distribution created: ${packageName}-v2.7.0.zip`);
            console.log(`📊 Archive size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
            console.log('');
            console.log('🎯 Executable ready for distribution!');
            console.log('');
            console.log('📋 What\'s included:');
            console.log('   - ✅ Aplikasi-Nilai-E-Ijazah.exe (standalone executable)');
            console.log('   - ✅ JALANKAN-APLIKASI.bat (easy launcher)');
            console.log('   - ✅ Complete public/ and src/ folders');
            console.log('   - ✅ README.txt documentation');
            console.log('   - ✅ No dependencies required!');
            console.log('');
            console.log('📦 Ready for school distribution!');
            console.log('   Schools only need to extract ZIP and double-click .bat file');
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(distDir, false);
        archive.finalize();

    } catch (error) {
        console.error('❌ Error creating executable:', error);
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
createExecutable();