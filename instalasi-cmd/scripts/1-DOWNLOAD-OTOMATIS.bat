@echo off
title Download Aplikasi E-Ijazah Otomatis
color 0A
cls

echo ===============================================
echo    DOWNLOAD APLIKASI NILAI E-IJAZAH
echo    Download Otomatis dari GitHub
echo    Versi: 2.6.0
echo ===============================================
echo.

REM Set target directory
set "TARGET_DIR=C:\E-Ijazah"
set "ZIP_FILE=%TEMP%\e-ijazah-app.zip"
set "GITHUB_URL=https://github.com/atha0604/e-ijazah-app/archive/refs/heads/brave-black.zip"

echo [STEP 1/4] Membuat folder tujuan...
if not exist "%TARGET_DIR%" (
    mkdir "%TARGET_DIR%"
    echo [OK] Folder dibuat: %TARGET_DIR%
) else (
    echo [OK] Folder sudah ada: %TARGET_DIR%
)
echo.

echo [STEP 2/4] Mendownload aplikasi dari GitHub...
echo Mohon tunggu, ini akan memakan waktu beberapa menit...
echo URL: %GITHUB_URL%
echo.

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%GITHUB_URL%' -OutFile '%ZIP_FILE%' -UseBasicParsing}"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Download gagal!
    echo.
    echo Kemungkinan penyebab:
    echo - Tidak ada koneksi internet
    echo - GitHub sedang down
    echo - URL berubah
    echo.
    echo Silakan download manual dari:
    echo https://github.com/atha0604/e-ijazah-app
    echo.
    pause
    exit /b 1
)

echo [OK] Download selesai!
echo.

echo [STEP 3/4] Mengekstrak file...

powershell -Command "& {Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%TARGET_DIR%' -Force}"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Extract gagal!
    pause
    exit /b 1
)

echo [OK] Extract selesai!
echo.

echo [STEP 4/4] Membersihkan file temporary...
del "%ZIP_FILE%"
echo [OK] Cleanup selesai!
echo.

echo ===============================================
echo    DOWNLOAD SELESAI!
echo ===============================================
echo.
echo Lokasi aplikasi:
echo %TARGET_DIR%\e-ijazah-app-brave-black\
echo.
echo LANGKAH SELANJUTNYA:
echo.
echo 1. Buka folder: %TARGET_DIR%\e-ijazah-app-brave-black\
echo 2. Double-click: INSTALL-SEKOLAH.bat
echo 3. Ikuti instruksi installer
echo.

set /p OPEN="Buka folder sekarang? (Y/N): "
if /i "%OPEN%"=="Y" (
    explorer "%TARGET_DIR%\e-ijazah-app-brave-black"
)

echo.
echo ===============================================
pause
