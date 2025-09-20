const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Portable Electron App...');

// 1. Clean old build
const distPath = path.join(__dirname, 'dist');
const portablePath = path.join(distPath, 'portable-fixed');

if (fs.existsSync(portablePath)) {
    console.log('🧹 Cleaning old build...');
    fs.rmSync(portablePath, { recursive: true, force: true });
}

// 2. Create portable directory
fs.mkdirSync(portablePath, { recursive: true });

// 3. Copy all necessary files
console.log('📂 Copying application files...');

const filesToCopy = [
    'electron-main-embedded.js',
    'package.json',
    'public',
    'src',
    'node_modules',
    'jalankan-electron.bat',
    'jalankan-web-mode.bat',
    'README-CARA-JALANKAN.txt',
    '.env'
];

filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(portablePath, file);

    if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
            console.log(`📁 Copying directory: ${file}`);
            fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
            console.log(`📄 Copying file: ${file}`);
            fs.copyFileSync(srcPath, destPath);
        }
    } else {
        console.log(`⚠️  File not found: ${file}`);
    }
});

// 4. Create simplified package.json
const packageJson = {
    "name": "aplikasi-nilai-e-ijazah",
    "version": "2.6.0",
    "description": "Aplikasi Nilai E-Ijazah - Portable Version",
    "main": "electron-main-embedded.js",
    "scripts": {
        "start": "electron ."
    },
    "author": "Prasetya Lukmana",
    "license": "ISC"
};

fs.writeFileSync(
    path.join(portablePath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
);

// 5. Create startup scripts
const startupBat = `@echo off
title Aplikasi Nilai E-Ijazah - Portable
color 0b

echo ================================================
echo    APLIKASI NILAI E-IJAZAH v2.6.0
echo    Portable Version - Embedded Server
echo ================================================
echo.

echo [INFO] Starting portable application...
echo [INFO] No installation required
echo.

if not exist "node_modules\\electron" (
    echo [ERROR] Electron tidak ditemukan!
    echo [ERROR] Aplikasi mungkin tidak lengkap
    pause
    exit /b 1
)

echo [INFO] Loading Aplikasi E-Ijazah...
npx electron .

if errorlevel 1 (
    echo [ERROR] Aplikasi gagal dijalankan
    echo [HELP] Solusi:
    echo [HELP] 1. Install Node.js dari https://nodejs.org/
    echo [HELP] 2. Jalankan sebagai Administrator
    echo [HELP] 3. Pastikan antivirus tidak memblokir
    pause
    exit /b 1
)

echo [INFO] Aplikasi ditutup dengan normal
pause`;

fs.writeFileSync(path.join(portablePath, 'JALANKAN-APLIKASI.bat'), startupBat);

// 6. Create README
const readme = `APLIKASI NILAI E-IJAZAH v2.6.0 - HYBRID MODE EDITION

🚀 CARA MENJALANKAN:

OPSI 1: MODE LOKAL (Embedded Server)
1. Double-click file "JALANKAN-APLIKASI.bat"
2. Tunggu server embedded start
3. Aplikasi buka dengan database lokal

OPSI 2: MODE WEB (Always Updated)
1. Double-click file "jalankan-web-mode.bat"
2. Aplikasi langsung connect ke nilai-e-ijazah.koyeb.app
3. Selalu mendapat update terbaru

OPSI 3: MANUAL COMMAND
npx electron .          → Mode lokal
npx electron . --web    → Mode web

🔄 SWITCH MODE:
- Dalam aplikasi: File → Switch ke Web Version
- Atau: File → Kembali ke Mode Lokal

REQUIREMENTS:
- Node.js 18+ (Download: https://nodejs.org/)
- Windows 10/11 64-bit
- Internet (untuk web mode)
- RAM: 4GB minimum

TROUBLESHOOTING:
- Jika error "npx not found": Install Node.js
- Jika error "Permission denied": Run as Administrator
- Jika antivirus block: Add folder to whitelist

HYBRID MODE BENEFITS:
✅ Local mode: Offline, stable, private database
✅ Web mode: Always updated, shared database
✅ User choice: Switch anytime

SUPPORT:
- GitHub: https://github.com/atha0604/e-ijazah-app
- Website: https://nilai-e-ijazah.koyeb.app

Build: ${new Date().toISOString()}
Version: 2.6.0-hybrid-mode-edition
`;

fs.writeFileSync(path.join(portablePath, 'README.txt'), readme);

console.log('✅ Portable build completed!');
console.log(`📁 Location: ${portablePath}`);
console.log('🎯 Ready for distribution!');