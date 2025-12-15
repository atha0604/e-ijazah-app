@echo off
title Cek Sistem - Prerequisite Checker
color 0B
cls

echo ===============================================
echo    CEK SISTEM - APLIKASI E-IJAZAH
echo    System Requirement Checker
echo ===============================================
echo.

set "PASS=0"
set "FAIL=0"

echo Memeriksa system requirements...
echo.
echo ===============================================
echo SYSTEM INFORMATION
echo ===============================================
echo.

REM Check Windows Version
echo [INFO] Windows Version:
ver
echo.

REM Check architecture
echo [INFO] System Architecture:
wmic os get osarchitecture
echo.

echo ===============================================
echo SOFTWARE REQUIREMENTS
echo ===============================================
echo.

REM Check Node.js
echo [1] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo     [PASS] Node.js terinstall
    echo     Versi:
    node --version
    set /a PASS+=1
) else (
    echo     [FAIL] Node.js BELUM terinstall!
    echo     Download: https://nodejs.org/
    set /a FAIL+=1
)
echo.

REM Check NPM
echo [2] Checking NPM...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo     [PASS] NPM terinstall
    echo     Versi:
    npm --version
    set /a PASS+=1
) else (
    echo     [FAIL] NPM tidak terdeteksi
    set /a FAIL+=1
)
echo.

REM Check Git (optional)
echo [3] Checking Git ^(optional^)...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo     [PASS] Git terinstall
    echo     Versi:
    git --version
    set /a PASS+=1
) else (
    echo     [INFO] Git tidak terinstall ^(optional^)
    echo     Untuk auto-update, install dari: https://git-scm.com/
)
echo.

echo ===============================================
echo DISK SPACE
echo ===============================================
echo.

REM Check free space on C:
echo Checking available space on C: drive...
wmic logicaldisk where "DeviceID='C:'" get FreeSpace,Size
echo.

echo ===============================================
echo NETWORK CONNECTION
echo ===============================================
echo.

echo [4] Checking Internet Connection...
ping -n 1 github.com >nul 2>&1
if %errorlevel% equ 0 (
    echo     [PASS] Internet connection OK
    echo     GitHub reachable
    set /a PASS+=1
) else (
    echo     [FAIL] Cannot reach GitHub
    echo     Periksa koneksi internet Anda
    set /a FAIL+=1
)
echo.

echo ===============================================
echo HASIL CEK SISTEM
echo ===============================================
echo.

echo Tests Passed: %PASS%
echo Tests Failed: %FAIL%
echo.

if %FAIL% equ 0 (
    echo [SUCCESS] Sistem Anda siap untuk install aplikasi E-Ijazah!
    echo.
    echo LANGKAH SELANJUTNYA:
    echo 1. Jalankan: 1-DOWNLOAD-OTOMATIS.bat ^(tanpa Git^)
    echo    ATAU
    echo 2. Jalankan: 2-GIT-CLONE.bat ^(dengan Git^)
    echo.
) else (
    echo [WARNING] Ada beberapa requirement yang belum terpenuhi.
    echo.
    echo YANG HARUS DIINSTALL:
    echo.

    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo - Node.js: https://nodejs.org/ ^(WAJIB!^)
    )

    git --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo - Git: https://git-scm.com/ ^(Optional, untuk auto-update^)
    )

    ping -n 1 github.com >nul 2>&1
    if %errorlevel% neq 0 (
        echo - Periksa koneksi internet Anda
    )

    echo.
    echo Setelah install yang kurang, jalankan script ini lagi.
)

echo.
echo ===============================================
pause
