@echo off
title Aplikasi Nilai E-Ijazah - Development Mode
color 0a

echo.
echo ================================================
echo    APLIKASI NILAI E-IJAZAH v2.6.0
echo    Development Mode - Embedded Server
echo ================================================
echo.

echo [INFO] Memeriksa Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js tidak ditemukan!
    echo [ERROR] Silakan install Node.js terlebih dahulu
    echo [ERROR] Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js terdeteksi:
node --version

echo.
echo [INFO] Memeriksa dependensi...
if not exist "node_modules" (
    echo [WARNING] node_modules tidak ditemukan
    echo [INFO] Menginstall dependensi...
    npm install
    if errorlevel 1 (
        echo [ERROR] Gagal menginstall dependensi
        pause
        exit /b 1
    )
)

echo [INFO] Dependensi OK
echo.
echo [INFO] Menjalankan aplikasi Electron...
echo [INFO] Mode: Development dengan DevTools
echo [INFO] Server: Embedded di port 3002
echo.

npx electron . --dev

if errorlevel 1 (
    echo.
    echo [ERROR] Aplikasi gagal dijalankan
    echo [ERROR] Kemungkinan penyebab:
    echo [ERROR] - Port 3002 sedang digunakan
    echo [ERROR] - File rusak atau tidak lengkap
    echo [ERROR] - Masalah permissions
    echo.
    echo [SOLUSI] Coba:
    echo [SOLUSI] 1. Restart komputer
    echo [SOLUSI] 2. Jalankan sebagai Administrator
    echo [SOLUSI] 3. Tutup aplikasi lain yang menggunakan port 3002
    echo.
    pause
    exit /b 1
)

echo.
echo [INFO] Aplikasi ditutup dengan normal
pause