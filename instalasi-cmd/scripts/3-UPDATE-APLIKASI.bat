@echo off
title Update Aplikasi E-Ijazah
color 0E
cls

echo ===============================================
echo    UPDATE APLIKASI E-IJAZAH
echo    Pull Update Terbaru dari GitHub
echo ===============================================
echo.

set "APP_DIR=C:\E-Ijazah\e-ijazah-app"

REM Check if app directory exists
if not exist "%APP_DIR%" (
    echo [ERROR] Aplikasi belum terinstall!
    echo.
    echo Folder tidak ditemukan: %APP_DIR%
    echo.
    echo Silakan install dulu menggunakan:
    echo - 1-DOWNLOAD-OTOMATIS.bat, atau
    echo - 2-GIT-CLONE.bat
    echo.
    pause
    exit /b 1
)

echo [OK] Aplikasi ditemukan!
echo Lokasi: %APP_DIR%
echo.

REM Check if git installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git belum terinstall!
    echo.
    echo Update otomatis memerlukan Git.
    echo Install Git dari: https://git-scm.com/
    echo.
    echo Atau download manual dari:
    echo https://github.com/atha0604/e-ijazah-app
    echo.
    pause
    exit /b 1
)

echo [OK] Git terdeteksi!
echo.

cd /d "%APP_DIR%"

echo ===============================================
echo MEMULAI UPDATE...
echo ===============================================
echo.

REM Backup current database
echo [STEP 1/4] Backup database...
if exist "src\database\db.sqlite" (
    set "BACKUP_DIR=backup\auto-backup-%DATE:/=-%_%TIME::=-%"
    mkdir "%BACKUP_DIR%" 2>nul
    copy "src\database\db.sqlite" "%BACKUP_DIR%\db.sqlite.backup" >nul
    echo [OK] Database di-backup ke: %BACKUP_DIR%
) else (
    echo [INFO] Tidak ada database untuk di-backup
)
echo.

REM Stash any local changes
echo [STEP 2/4] Menyimpan perubahan lokal...
git stash
echo.

REM Pull latest changes
echo [STEP 3/4] Download update terbaru...
git pull origin brave-black

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Update gagal!
    echo.
    echo Coba:
    echo 1. Periksa koneksi internet
    echo 2. Atau download ulang aplikasi
    echo.
    pause
    exit /b 1
)

echo [OK] Update berhasil!
echo.

REM Update dependencies
echo [STEP 4/4] Update dependencies...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] npm install ada masalah
    echo Tapi aplikasi mungkin masih bisa jalan
    echo.
)

echo.
echo ===============================================
echo    UPDATE SELESAI!
echo ===============================================
echo.
echo Aplikasi sudah diupdate ke versi terbaru!
echo.
echo Database Anda aman (sudah di-backup otomatis)
echo.

set /p RUN="Jalankan aplikasi sekarang? (Y/N): "
if /i "%RUN%"=="Y" (
    if exist "JALANKAN-APLIKASI.bat" (
        call JALANKAN-APLIKASI.bat
    ) else (
        npm start
    )
) else (
    echo.
    echo Update selesai!
    pause
)
