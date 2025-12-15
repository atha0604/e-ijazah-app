@echo off
title Git Clone - Download E-Ijazah
color 0A
cls

echo ===============================================
echo    GIT CLONE - DOWNLOAD E-IJAZAH
echo    Cara Professional untuk IT Staff
echo ===============================================
echo.

REM Check if git installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git belum terinstall!
    echo.
    echo Silakan install Git terlebih dahulu:
    echo https://git-scm.com/
    echo.
    echo Atau gunakan script: 1-DOWNLOAD-OTOMATIS.bat
    echo.
    pause
    start https://git-scm.com/
    exit /b 1
)

echo [OK] Git terdeteksi!
git --version
echo.

REM Set target directory
set "TARGET_DIR=C:\E-Ijazah"

echo Target folder: %TARGET_DIR%
echo.

REM Create directory if not exists
if not exist "%TARGET_DIR%" (
    echo Membuat folder: %TARGET_DIR%
    mkdir "%TARGET_DIR%"
)

echo ===============================================
echo MULAI CLONING...
echo ===============================================
echo.

REM Navigate to target directory
cd /d "%TARGET_DIR%"

REM Clone repository
echo Cloning dari GitHub...
echo Repository: https://github.com/atha0604/e-ijazah-app
echo Branch: brave-black
echo.

git clone -b brave-black https://github.com/atha0604/e-ijazah-app

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Clone gagal!
    echo.
    echo Kemungkinan:
    echo - Tidak ada koneksi internet
    echo - Folder sudah ada (gunakan update script)
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Clone selesai!
echo.

echo ===============================================
echo    DOWNLOAD SELESAI!
echo ===============================================
echo.
echo Lokasi aplikasi:
echo %TARGET_DIR%\e-ijazah-app\
echo.
echo LANGKAH SELANJUTNYA:
echo.
echo 1. Jalankan installer:
echo    %TARGET_DIR%\e-ijazah-app\INSTALL-SEKOLAH.bat
echo.
echo 2. Untuk update di masa depan, gunakan:
echo    3-UPDATE-APLIKASI.bat
echo.

set /p RUN="Jalankan installer sekarang? (Y/N): "
if /i "%RUN%"=="Y" (
    cd e-ijazah-app
    call INSTALL-SEKOLAH.bat
) else (
    echo.
    echo Instalasi akan dilakukan nanti.
    pause
)
