@echo off
title APLIKASI E-IJAZAH - Installer Menu
color 0B
cls

:MENU
cls
echo ===============================================
echo    APLIKASI NILAI E-IJAZAH 2025/2026
echo    Sistem Instalasi via CMD
echo ===============================================
echo.
echo    Tahun Pelajaran: 2025/2026
echo    Version: 2.6.0
echo.
echo ===============================================
echo    MENU INSTALASI
echo ===============================================
echo.
echo    [1] Cek Sistem (Recommended untuk pemula)
echo    [2] Install One-Liner (Tercepat - semua otomatis)
echo    [3] Download Otomatis (Tanpa Git)
echo    [4] Git Clone (Untuk IT Staff)
echo    [5] Update Aplikasi (Jika sudah install)
echo.
echo    [6] Buka Panduan Lengkap
echo    [7] Buka Troubleshooting
echo    [8] Buka FAQ
echo.
echo    [0] Keluar
echo.
echo ===============================================
echo.

set /p choice="Pilih menu (0-8): "

if "%choice%"=="1" goto CEK_SISTEM
if "%choice%"=="2" goto ONE_LINER
if "%choice%"=="3" goto DOWNLOAD
if "%choice%"=="4" goto GIT_CLONE
if "%choice%"=="5" goto UPDATE
if "%choice%"=="6" goto PANDUAN
if "%choice%"=="7" goto TROUBLESHOOT
if "%choice%"=="8" goto FAQ
if "%choice%"=="0" goto EXIT

echo.
echo Pilihan tidak valid!
timeout /t 2 /nobreak >nul
goto MENU

:CEK_SISTEM
cls
echo Menjalankan System Checker...
echo.
call scripts\4-CEK-SISTEM.bat
pause
goto MENU

:ONE_LINER
cls
echo Menjalankan One-Liner Installer...
echo Ini akan menginstall semua secara otomatis!
echo.
call scripts\5-INSTALL-ONE-LINER.bat
pause
goto MENU

:DOWNLOAD
cls
echo Menjalankan Download Otomatis...
echo.
call scripts\1-DOWNLOAD-OTOMATIS.bat
pause
goto MENU

:GIT_CLONE
cls
echo Menjalankan Git Clone...
echo.
call scripts\2-GIT-CLONE.bat
pause
goto MENU

:UPDATE
cls
echo Menjalankan Update Script...
echo.
call scripts\3-UPDATE-APLIKASI.bat
pause
goto MENU

:PANDUAN
cls
echo Membuka Panduan Lengkap...
start panduan\PANDUAN-LENGKAP.md
timeout /t 2 /nobreak >nul
goto MENU

:TROUBLESHOOT
cls
echo Membuka Troubleshooting Guide...
start panduan\TROUBLESHOOTING.md
timeout /t 2 /nobreak >nul
goto MENU

:FAQ
cls
echo Membuka FAQ...
start panduan\FAQ.md
timeout /t 2 /nobreak >nul
goto MENU

:EXIT
cls
echo ===============================================
echo    Terima kasih!
echo    Selamat menggunakan Aplikasi E-Ijazah
echo ===============================================
echo.
timeout /t 2 /nobreak >nul
exit
