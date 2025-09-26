@echo off
title Aplikasi Nilai E-Ijazah - Native Version
color 0A

echo ========================================
echo    APLIKASI NILAI E-IJAZAH (NATIVE)
echo ========================================
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
node app-native.js
goto end

:offline
echo.
echo 🖥️  Memulai dalam mode OFFLINE...
echo ✅ Aplikasi akan menggunakan server lokal
echo.
node app-native.js --offline
goto end

:online
echo.
echo 🌍 Memulai dalam mode ONLINE...
echo ✅ Aplikasi akan menggunakan server cloud
echo.
node app-native.js --online
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