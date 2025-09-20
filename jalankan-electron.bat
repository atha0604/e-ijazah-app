@echo off
title Aplikasi Nilai E-Ijazah - Production Mode
color 0b

echo.
echo ================================================
echo    APLIKASI NILAI E-IJAZAH v2.6.0
echo    Production Mode - Embedded Server
echo ================================================
echo.

echo [INFO] Memeriksa sistem...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js tidak ditemukan!
    echo [ERROR] Silakan install Node.js terlebih dahulu
    echo [ERROR] Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js:
node --version

if not exist "node_modules" (
    echo [WARNING] Dependencies tidak ditemukan
    echo [INFO] Installing dependencies...
    npm install --production
    if errorlevel 1 (
        echo [ERROR] Gagal menginstall dependencies
        pause
        exit /b 1
    )
)

echo [INFO] Sistem siap
echo.
echo [INFO] Memulai Aplikasi Nilai E-Ijazah...
echo [INFO] Mode: Production (tanpa DevTools)
echo [INFO] Server: Embedded di port 3000
echo.

echo [INFO] Loading...
timeout /t 2 /nobreak >nul

npx electron .

if errorlevel 1 (
    echo.
    echo [ERROR] Aplikasi gagal dijalankan
    echo [HELP] Troubleshooting:
    echo [HELP] 1. Tutup aplikasi lain yang mungkin menggunakan port 3000
    echo [HELP] 2. Jalankan sebagai Administrator
    echo [HELP] 3. Pastikan Windows Defender tidak memblokir
    echo [HELP] 4. Restart komputer jika masih bermasalah
    echo.
    pause
    exit /b 1
)

echo [INFO] Terima kasih telah menggunakan Aplikasi E-Ijazah
pause