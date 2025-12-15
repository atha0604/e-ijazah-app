@echo off
title One-Liner Installer - E-Ijazah
color 0A
cls

echo ===============================================
echo    ONE-LINER INSTALLER
echo    Install Semua Sekaligus
echo ===============================================
echo.

echo Script ini akan:
echo 1. Cek sistem requirements
echo 2. Download aplikasi dari GitHub
echo 3. Install dependencies
echo 4. Setup database
echo 5. Siap digunakan!
echo.

set /p CONFIRM="Lanjutkan instalasi? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Instalasi dibatalkan.
    pause
    exit /b 0
)

echo.
echo ===============================================
echo MEMULAI INSTALASI...
echo ===============================================
echo.

REM Step 1: Check Node.js
echo [STEP 1/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstall!
    echo.
    echo Install Node.js dulu dari: https://nodejs.org/
    echo Lalu jalankan script ini lagi.
    pause
    start https://nodejs.org/
    exit /b 1
)
echo [OK] Node.js:
node --version
echo.

REM Step 2: Download
echo [STEP 2/5] Download aplikasi...
set "TARGET_DIR=C:\E-Ijazah"
set "ZIP_FILE=%TEMP%\e-ijazah-app.zip"
set "GITHUB_URL=https://github.com/atha0604/e-ijazah-app/archive/refs/heads/brave-black.zip"

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%GITHUB_URL%' -OutFile '%ZIP_FILE%' -UseBasicParsing}"

if %errorlevel% neq 0 (
    echo [ERROR] Download gagal!
    pause
    exit /b 1
)
echo [OK] Download selesai!
echo.

REM Step 3: Extract
echo [STEP 3/5] Extract file...
powershell -Command "& {Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%TARGET_DIR%' -Force}"
del "%ZIP_FILE%"
echo [OK] Extract selesai!
echo.

REM Step 4: Install dependencies
echo [STEP 4/5] Install dependencies...
echo Mohon tunggu 1-2 menit...
cd /d "%TARGET_DIR%\e-ijazah-app-brave-black"
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Install dependencies gagal!
    pause
    exit /b 1
)
echo [OK] Dependencies installed!
echo.

REM Step 5: Create shortcuts
echo [STEP 5/5] Membuat shortcuts...

echo @echo off > JALANKAN-APLIKASI.bat
echo title Aplikasi Nilai E-Ijazah >> JALANKAN-APLIKASI.bat
echo color 0B >> JALANKAN-APLIKASI.bat
echo cls >> JALANKAN-APLIKASI.bat
echo echo ========================================= >> JALANKAN-APLIKASI.bat
echo echo    APLIKASI NILAI E-IJAZAH >> JALANKAN-APLIKASI.bat
echo echo ========================================= >> JALANKAN-APLIKASI.bat
echo echo. >> JALANKAN-APLIKASI.bat
echo echo Server starting... >> JALANKAN-APLIKASI.bat
echo timeout /t 3 /nobreak ^>nul >> JALANKAN-APLIKASI.bat
echo start http://localhost:3000 >> JALANKAN-APLIKASI.bat
echo npm start >> JALANKAN-APLIKASI.bat

echo [OK] Shortcuts created!
echo.

echo ===============================================
echo    INSTALASI SELESAI!
echo ===============================================
echo.
echo Aplikasi terinstall di:
echo %TARGET_DIR%\e-ijazah-app-brave-black\
echo.
echo CARA MENJALANKAN:
echo 1. Double-click: JALANKAN-APLIKASI.bat
echo 2. Browser akan terbuka otomatis
echo 3. Login dengan kode sekolah Anda
echo.

set /p RUN="Jalankan aplikasi sekarang? (Y/N): "
if /i "%RUN%"=="Y" (
    call JALANKAN-APLIKASI.bat
) else (
    echo.
    echo Jalankan aplikasi dengan double-click:
    echo JALANKAN-APLIKASI.bat
    pause
)
