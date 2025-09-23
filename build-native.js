const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { exec } = require('child_process');

console.log('🏗️  Building Native Aplikasi Nilai E-Ijazah...');

const distDir = path.join(__dirname, 'dist');
const packageName = 'aplikasi-nilai-e-ijazah-native';

// Clean dist directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Files and directories to include in distribution
const includeFiles = [
    'app-native.js',
    'server.js',
    'package.json',
    'public/',
    'src/',
    'assets/',
    '.env.example',
    'README.md'
];

// Create batch files for easy execution
const runBat = `@echo off
echo ================================
echo Aplikasi Nilai E-Ijazah (Native)
echo ================================
echo.
echo Mode tersedia:
echo 1. Auto (detect internet)
echo 2. Offline only
echo 3. Online only
echo.
choice /c 123 /m "Pilih mode"
if errorlevel 3 goto online
if errorlevel 2 goto offline
if errorlevel 1 goto auto

:auto
echo.
echo 🚀 Starting in AUTO mode...
node app-native.js
goto end

:offline
echo.
echo 🖥️  Starting in OFFLINE mode...
node app-native.js --offline
goto end

:online
echo.
echo 🌍 Starting in ONLINE mode...
node app-native.js --online
goto end

:end
echo.
echo Aplikasi telah berhenti.
pause
`;

const installBat = `@echo off
echo =======================================
echo Instalasi Aplikasi Nilai E-Ijazah
echo =======================================
echo.
echo Menginstall dependencies...
npm install
echo.
echo ✅ Instalasi selesai!
echo.
echo Untuk menjalankan aplikasi, double-click "JALANKAN-APLIKASI.bat"
echo.
pause
`;

// Create distribution package
async function createDistribution() {
    try {
        console.log('📁 Creating distribution files...');

        // Copy main files
        for (const file of includeFiles) {
            const sourcePath = path.join(__dirname, file);
            const destPath = path.join(distDir, file);

            if (fs.existsSync(sourcePath)) {
                const stat = fs.statSync(sourcePath);
                if (stat.isDirectory()) {
                    copyDirectory(sourcePath, destPath);
                } else {
                    fs.copyFileSync(sourcePath, destPath);
                }
                console.log(`✅ Copied: ${file}`);
            } else {
                console.log(`⚠️  Skipped (not found): ${file}`);
            }
        }

        // Create batch files
        fs.writeFileSync(path.join(distDir, 'JALANKAN-APLIKASI.bat'), runBat);
        fs.writeFileSync(path.join(distDir, 'INSTALL.bat'), installBat);

        // Create simplified package.json for distribution
        const originalPackage = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        const distPackage = {
            name: originalPackage.name,
            version: originalPackage.version,
            description: originalPackage.description,
            main: originalPackage.main,
            scripts: {
                start: "node app-native.js",
                offline: "node app-native.js --offline",
                online: "node app-native.js --online"
            },
            dependencies: originalPackage.dependencies
        };
        fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(distPackage, null, 2));

        // Create README for distribution
        const readmeContent = `# Aplikasi Nilai E-Ijazah (Native Version)

## Cara Instalasi dan Penggunaan

### 1. Instalasi Dependencies
Double-click file: \`INSTALL.bat\`

Atau manual via command prompt:
\`\`\`
npm install
\`\`\`

### 2. Menjalankan Aplikasi
Double-click file: \`JALANKAN-APLIKASI.bat\`

Atau manual via command prompt:
- Auto mode: \`node app-native.js\`
- Offline only: \`node app-native.js --offline\`
- Online only: \`node app-native.js --online\`

### 3. Mode Aplikasi

#### AUTO MODE (Recommended)
- Aplikasi akan otomatis mendeteksi koneksi internet
- Jika ada internet: menggunakan versi online (selalu update)
- Jika tidak ada internet: menggunakan versi offline (data lokal)

#### OFFLINE MODE
- Paksa menggunakan server lokal
- Data tersimpan di komputer
- Tidak memerlukan internet

#### ONLINE MODE
- Paksa menggunakan server online
- Data tersimpan di cloud
- Memerlukan koneksi internet

### 4. Akses Aplikasi
Setelah aplikasi berjalan, browser akan terbuka otomatis.
Jika tidak, buka browser dan kunjungi:
- Mode offline: http://localhost:3000
- Mode online: https://nilai-e-ijazah.koyeb.app

### 5. Kebutuhan Sistem
- Node.js 18 atau lebih baru
- NPM 9 atau lebih baru
- Browser modern (Chrome, Firefox, Edge)

### 6. Troubleshooting
- Jika port 3000 sudah digunakan, ubah PORT di file .env
- Jika ada error, coba install ulang dependencies dengan INSTALL.bat
- Untuk reset data offline, hapus file database di folder src/database/

---
Dikembangkan oleh: Prasetya Lukmana
Versi: ${originalPackage.version}
`;

        fs.writeFileSync(path.join(distDir, 'README.md'), readmeContent);

        console.log('📦 Creating ZIP archive...');

        // Create ZIP file
        const output = fs.createWriteStream(path.join(__dirname, `${packageName}-v${originalPackage.version}.zip`));
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`✅ Distribution created: ${packageName}-v${originalPackage.version}.zip`);
            console.log(`📊 Archive size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
            console.log('');
            console.log('🎯 Distribution ready for schools!');
            console.log('');
            console.log('📋 What\'s included:');
            console.log('   - Native app (no Electron dependency)');
            console.log('   - Auto offline/online detection');
            console.log('   - Easy installation with INSTALL.bat');
            console.log('   - Easy running with JALANKAN-APLIKASI.bat');
            console.log('   - Complete documentation');
            console.log('');
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(distDir, false);
        archive.finalize();

    } catch (error) {
        console.error('❌ Error creating distribution:', error);
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
createDistribution();