@echo off
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
