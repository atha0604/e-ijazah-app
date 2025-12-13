@echo off
title Installer E-Ijazah - Aplikasi Nilai Sekolah
color 0A
cls

echo ===============================================
echo    INSTALLER APLIKASI NILAI E-IJAZAH
echo    Tahun Pelajaran 2025/2026
echo ===============================================
echo.

REM Check if Node.js installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [PERINGATAN] Node.js belum terinstall!
    echo.
    echo Silakan install Node.js terlebih dahulu:
    echo https://nodejs.org/
    echo.
    echo Download versi LTS ^(Long Term Support^)
    echo.
    pause
    start https://nodejs.org/
    exit /b 1
)

echo [OK] Node.js terdeteksi!
node --version
echo.

REM Check if git installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Git tidak terdeteksi.
    echo.
    echo Pilihan:
    echo 1. Install Git dari: https://git-scm.com/
    echo 2. Atau download ZIP dari GitHub ^(lebih mudah^)
    echo.
    pause
    exit /b 1
)

echo [OK] Git terdeteksi!
git --version
echo.

echo ===============================================
echo MEMULAI INSTALASI...
echo ===============================================
echo.

REM Install dependencies
echo [STEP 1/3] Menginstall dependencies...
echo Mohon tunggu, ini akan memakan waktu 1-2 menit...
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Instalasi gagal!
    echo Silakan coba lagi atau hubungi admin.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies terinstall!
echo.

echo ===============================================
echo [STEP 2/3] Membuat shortcut...
echo ===============================================

REM Create start script
echo @echo off > JALANKAN-APLIKASI.bat
echo title Aplikasi Nilai E-Ijazah >> JALANKAN-APLIKASI.bat
echo color 0B >> JALANKAN-APLIKASI.bat
echo cls >> JALANKAN-APLIKASI.bat
echo echo ========================================= >> JALANKAN-APLIKASI.bat
echo echo    APLIKASI NILAI E-IJAZAH >> JALANKAN-APLIKASI.bat
echo echo    Tahun Pelajaran 2025/2026 >> JALANKAN-APLIKASI.bat
echo echo ========================================= >> JALANKAN-APLIKASI.bat
echo echo. >> JALANKAN-APLIKASI.bat
echo echo Server sedang starting... >> JALANKAN-APLIKASI.bat
echo echo. >> JALANKAN-APLIKASI.bat
echo echo Tunggu sampai browser terbuka otomatis! >> JALANKAN-APLIKASI.bat
echo echo. >> JALANKAN-APLIKASI.bat
echo echo JANGAN TUTUP WINDOW INI! >> JALANKAN-APLIKASI.bat
echo echo. >> JALANKAN-APLIKASI.bat
echo timeout /t 3 /nobreak ^>nul >> JALANKAN-APLIKASI.bat
echo start http://localhost:3000 >> JALANKAN-APLIKASI.bat
echo npm start >> JALANKAN-APLIKASI.bat

echo [OK] Shortcut dibuat!
echo.

echo ===============================================
echo [STEP 3/3] Setup database...
echo ===============================================

REM Check if database exists
if not exist "src\database\db.sqlite" (
    echo [INFO] Membuat database baru...
    REM Database will be created automatically on first run
    echo [OK] Database akan dibuat otomatis saat pertama kali jalan
) else (
    echo [OK] Database sudah ada
)

echo.
echo ===============================================
echo    INSTALASI SELESAI!
echo ===============================================
echo.
echo CARA MENGGUNAKAN:
echo.
echo 1. Double-click file: JALANKAN-APLIKASI.bat
echo 2. Tunggu browser terbuka otomatis
echo 3. Login dengan kode sekolah Anda
echo.
echo CATATAN PENTING:
echo - Jangan tutup window CMD hitam saat aplikasi berjalan
echo - Untuk menutup aplikasi: Tutup browser, lalu tutup CMD
echo - Untuk menjalankan lagi: Double-click JALANKAN-APLIKASI.bat
echo.
echo ===============================================
echo.

REM Ask if want to run now
set /p RUN="Jalankan aplikasi sekarang? (Y/N): "
if /i "%RUN%"=="Y" (
    echo.
    echo Membuka aplikasi...
    call JALANKAN-APLIKASI.bat
) else (
    echo.
    echo Instalasi selesai!
    echo Jalankan JALANKAN-APLIKASI.bat untuk membuka aplikasi.
    pause
)
