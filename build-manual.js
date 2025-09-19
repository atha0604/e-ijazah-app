const fs = require('fs');
const path = require('path');

console.log('🚀 Building Aplikasi Nilai E-Ijazah for distribution...');

// Fungsi untuk copy directory
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Buat folder distribusi
const distDir = path.join(__dirname, 'aplikasi-nilai-e-ijazah-portable');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

console.log('📁 Copying application files...');

// Copy semua file kecuali yang tidak diperlukan
const excludeDirs = ['node_modules', 'dist', '.git', 'aplikasi-nilai-e-ijazah-portable'];
const excludeFiles = ['.gitignore', 'build-manual.js', 'ELECTRON-README.md'];

const items = fs.readdirSync(__dirname);
for (const item of items) {
    const itemPath = path.join(__dirname, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory() && !excludeDirs.includes(item)) {
        console.log(`  📂 ${item}/`);
        copyDir(itemPath, path.join(distDir, item));
    } else if (stat.isFile() && !excludeFiles.includes(item)) {
        console.log(`  📄 ${item}`);
        fs.copyFileSync(itemPath, path.join(distDir, item));
    }
}

// Copy node_modules yang diperlukan saja
console.log('📦 Installing production dependencies...');
const nodeModulesDir = path.join(distDir, 'node_modules');
fs.mkdirSync(nodeModulesDir);

// Copy dependencies utama
const requiredDeps = [
    'body-parser',
    'cors',
    'dotenv',
    'express',
    'jsonwebtoken',
    'multer',
    'socket.io',
    'sqlite3',
    'xlsx'
];

for (const dep of requiredDeps) {
    const srcPath = path.join(__dirname, 'node_modules', dep);
    const destPath = path.join(nodeModulesDir, dep);
    if (fs.existsSync(srcPath)) {
        console.log(`  📦 ${dep}`);
        copyDir(srcPath, destPath);
    }
}

// Buat script untuk run aplikasi
const startScript = `@echo off
echo Starting Aplikasi Nilai E-Ijazah...
echo.
echo Memulai server backend...
start /B node server.js
echo.
echo Server berjalan di http://localhost:3000
echo Silakan buka browser dan akses http://localhost:3000
echo.
echo Tekan Ctrl+C untuk menghentikan aplikasi
pause
`;

fs.writeFileSync(path.join(distDir, 'start-aplikasi.bat'), startScript);

// Buat README untuk distribusi
const readmeContent = `# Aplikasi Nilai E-Ijazah - Portable Version

## Cara Menjalankan Aplikasi

1. **Pastikan Node.js ter-install**
   - Download dari: https://nodejs.org/
   - Pilih versi LTS (Recommended)

2. **Jalankan Aplikasi**
   - Double-click file: start-aplikasi.bat
   - Atau buka Command Prompt di folder ini dan ketik: node server.js

3. **Akses Aplikasi**
   - Buka browser (Chrome/Firefox/Edge)
   - Kunjungi: http://localhost:3000

## Folder Structure

- server.js - File utama server backend
- public/ - File frontend (HTML, CSS, JS)
- src/ - Source code backend
- node_modules/ - Dependencies yang diperlukan
- database/ - File database SQLite

## Troubleshooting

### Port Sudah Digunakan
Jika port 3000 sudah digunakan, edit file .env:
\`\`\`
PORT=3001
\`\`\`

### Error Module
Pastikan semua dependencies ter-install:
\`\`\`
npm install
\`\`\`

## Support
Hubungi: Prasetya Lukmana

---
Version: 2.6.0
Build Date: ${new Date().toLocaleDateString('id-ID')}
`;

fs.writeFileSync(path.join(distDir, 'README.txt'), readmeContent);

console.log('✅ Build completed successfully!');
console.log(`📦 Output directory: ${distDir}`);
console.log('');
console.log('🚀 Distribution package ready for schools:');
console.log('   1. Copy entire folder to target computer');
console.log('   2. Install Node.js (if not installed)');
console.log('   3. Run start-aplikasi.bat');
console.log('   4. Open browser to http://localhost:3000');
console.log('');
console.log('💡 Tip: Zip the folder for easier distribution');