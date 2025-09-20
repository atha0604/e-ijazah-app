@echo off
title Aplikasi E-Ijazah - Web Mode
color 0e

echo ================================================
echo    APLIKASI NILAI E-IJAZAH v2.6.0
echo    WEB MODE - Selalu Update Otomatis
echo ================================================
echo.

echo [INFO] Starting web mode...
echo [INFO] Connecting to: nilai-e-ijazah.koyeb.app
echo [INFO] Mode ini selalu mendapat update terbaru
echo.

SET USE_WEB_VERSION=true
npx electron . --web

if errorlevel 1 (
    echo [ERROR] Gagal memulai web mode
    echo [HELP] Solusi:
    echo [HELP] 1. Pastikan koneksi internet stabil
    echo [HELP] 2. Install Node.js dari https://nodejs.org/
    echo [HELP] 3. Jalankan sebagai Administrator
    pause
    exit /b 1
)

echo [INFO] Aplikasi ditutup dengan normal
pause