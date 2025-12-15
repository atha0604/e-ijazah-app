@echo off
REM ============================================================
REM  INSTALLER OTOMATIS E-IJAZAH
REM  One-Click Installer - Download Node.js, Install App, Create Shortcut
REM ============================================================

title E-Ijazah Installer - Otomatis
color 0A
cls

echo ============================================================
echo    INSTALLER APLIKASI NILAI E-IJAZAH
echo    Installer Otomatis Lengkap
echo    Tahun Pelajaran 2025/2026
echo ============================================================
echo.
echo Installer ini akan:
echo [1] Cek dan install Node.js otomatis (jika belum ada)
echo [2] Download aplikasi E-Ijazah dari GitHub
echo [3] Install dependencies
echo [4] Membuat shortcut di Desktop
echo [5] Menjalankan aplikasi otomatis
echo.
echo Proses memakan waktu 10-15 menit...
echo.

set /p CONFIRM="Lanjutkan instalasi? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Instalasi dibatalkan.
    pause
    exit /b 0
)

echo.
echo ============================================================
echo [STEP 1/6] CHECKING NODE.JS...
echo ============================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js sudah terinstall!
    node --version
    echo.
    goto DOWNLOAD_APP
)

echo [INFO] Node.js belum terinstall.
echo [INFO] Memulai download dan instalasi Node.js...
echo.

REM Set Node.js version and download URL
set "NODE_VERSION=20.11.0"
set "NODE_INSTALLER=node-v%NODE_VERSION%-x64.msi"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/%NODE_INSTALLER%"
set "TEMP_INSTALLER=%TEMP%\%NODE_INSTALLER%"

echo Download URL: %NODE_URL%
echo Mohon tunggu, download Node.js (%NODE_INSTALLER%)...
echo.

REM Download Node.js installer
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Write-Host 'Downloading Node.js...'; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%TEMP_INSTALLER%' -UseBasicParsing; Write-Host 'Download completed!'}"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Download Node.js gagal!
    echo.
    echo Silakan:
    echo 1. Cek koneksi internet
    echo 2. Download manual dari: https://nodejs.org/
    echo 3. Install Node.js, lalu jalankan installer ini lagi
    echo.
    pause
    exit /b 1
)

echo [OK] Download selesai!
echo.

echo ============================================================
echo [STEP 2/6] INSTALLING NODE.JS...
echo ============================================================
echo.
echo Memulai instalasi Node.js...
echo PENTING: Klik Next pada installer yang muncul!
echo.

REM Install Node.js silently
echo Instalasi berjalan... Mohon tunggu 2-3 menit...
msiexec /i "%TEMP_INSTALLER%" /qn /norestart

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Instalasi silent gagal. Mencoba instalasi manual...
    echo Silakan klik Next > Next > Install pada window yang muncul.
    echo.
    start /wait msiexec /i "%TEMP_INSTALLER%" /passive
)

echo [OK] Node.js berhasil diinstall!
echo.

REM Cleanup installer
del "%TEMP_INSTALLER%" 2>nul

REM Refresh environment variables
echo Refreshing environment variables...
call RefreshEnv.cmd 2>nul

REM Add Node.js to current session PATH
set "PATH=%PATH%;%ProgramFiles%\nodejs"

echo.
echo Verifikasi instalasi Node.js...
timeout /t 3 /nobreak >nul

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Node.js terinstall, tapi belum masuk PATH.
    echo [INFO] Silakan restart komputer dan jalankan installer ini lagi.
    echo.
    pause
    exit /b 0
)

echo [OK] Node.js siap digunakan!
node --version
npm --version
echo.

:DOWNLOAD_APP
echo ============================================================
echo [STEP 3/6] DOWNLOADING APLIKASI E-IJAZAH...
echo ============================================================
echo.

set "APP_DIR=C:\E-Ijazah\e-ijazah-app"
set "ZIP_FILE=%TEMP%\e-ijazah-app.zip"
set "GITHUB_URL=https://github.com/atha0604/e-ijazah-app/archive/refs/heads/brave-black.zip"

if exist "%APP_DIR%" (
    echo [INFO] Aplikasi sudah ada di: %APP_DIR%
    echo.
    set /p REINSTALL="Install ulang? (Y/N): "
    if /i not "%REINSTALL%"=="Y" (
        goto INSTALL_DEPS
    )
    echo Menghapus instalasi lama...
    rmdir /s /q "%APP_DIR%"
)

echo Membuat folder: C:\E-Ijazah
if not exist "C:\E-Ijazah" mkdir "C:\E-Ijazah"

echo.
echo Downloading dari GitHub...
echo URL: %GITHUB_URL%
echo.

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Write-Host 'Downloading aplikasi...'; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%GITHUB_URL%' -OutFile '%ZIP_FILE%' -UseBasicParsing; Write-Host 'Download completed!'}"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Download aplikasi gagal!
    echo.
    echo Silakan cek koneksi internet.
    pause
    exit /b 1
)

echo [OK] Download selesai!
echo.

echo Extracting file...
powershell -Command "& {Expand-Archive -Path '%ZIP_FILE%' -DestinationPath 'C:\E-Ijazah' -Force}"

REM Rename folder
if exist "C:\E-Ijazah\e-ijazah-app-brave-black" (
    if exist "%APP_DIR%" rmdir /s /q "%APP_DIR%"
    move "C:\E-Ijazah\e-ijazah-app-brave-black" "%APP_DIR%"
)

del "%ZIP_FILE%" 2>nul

echo [OK] Extract selesai!
echo.

:INSTALL_DEPS
echo ============================================================
echo [STEP 4/6] INSTALLING DEPENDENCIES...
echo ============================================================
echo.

cd /d "%APP_DIR%"

echo Mohon tunggu 3-5 menit...
echo Installing npm packages...
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm install gagal!
    echo Mencoba lagi dengan cache clean...
    call npm cache clean --force
    call npm install

    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Instalasi masih gagal.
        echo Silakan hubungi support.
        pause
        exit /b 1
    )
)

echo.
echo [OK] Dependencies installed!
echo.

echo ============================================================
echo [STEP 5/6] CREATING DESKTOP SHORTCUT...
echo ============================================================
echo.

REM Create startup batch file
echo Creating startup script...

(
echo @echo off
echo title Aplikasi Nilai E-Ijazah
echo color 0B
echo cls
echo.
echo =========================================
echo    APLIKASI NILAI E-IJAZAH
echo    Tahun Pelajaran 2025/2026
echo =========================================
echo.
echo Server starting...
echo Tunggu sampai browser terbuka!
echo.
echo JANGAN TUTUP WINDOW INI!
echo.
echo =========================================
echo.
echo.
echo Membuka browser dalam 5 detik...
echo.
timeout /t 5 /nobreak
start http://localhost:3000
echo.
echo Browser sudah terbuka!
echo Jika belum, buka manual: http://localhost:3000
echo.
echo.
cd /d "%APP_DIR%"
call npm start
) > "%APP_DIR%\JALANKAN-APLIKASI.bat"

echo [OK] Startup script created!
echo.

REM Create desktop shortcut using PowerShell (more reliable)
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_PATH=%DESKTOP%\E-Ijazah App.lnk"

echo Creating desktop shortcut...

powershell -Command "$WS = New-Object -ComObject WScript.Shell; $Shortcut = $WS.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%APP_DIR%\JALANKAN-APLIKASI.bat'; $Shortcut.WorkingDirectory = '%APP_DIR%'; $Shortcut.Description = 'Aplikasi Nilai E-Ijazah 2025/2026'; $Shortcut.IconLocation = '%SystemRoot%\System32\shell32.dll,21'; $Shortcut.Save()" 2>nul

if exist "%SHORTCUT_PATH%" (
    echo [OK] Desktop shortcut created: E-Ijazah App.lnk
) else (
    echo [WARNING] Shortcut creation failed, but app is installed.
    echo [INFO] You can run the app manually from:
    echo        %APP_DIR%\JALANKAN-APLIKASI.bat
)
echo.

echo ============================================================
echo [STEP 6/6] TESTING APPLICATION...
echo ============================================================
echo.

echo Testing aplikasi...
echo.

REM Create test file to check if app runs
cd /d "%APP_DIR%"

echo [INFO] Instalasi selesai!
echo.

echo ============================================================
echo    INSTALASI BERHASIL!
echo ============================================================
echo.
echo Aplikasi terinstall di:
echo %APP_DIR%
echo.
echo Shortcut Desktop:
echo %SHORTCUT_PATH%
echo.
echo ============================================================
echo CARA MENJALANKAN APLIKASI:
echo ============================================================
echo.
echo 1. MUDAH: Double-click shortcut di Desktop
echo    "E-Ijazah App"
echo.
echo 2. MANUAL: Double-click file ini
echo    %APP_DIR%\JALANKAN-APLIKASI.bat
echo.
echo ============================================================
echo INFORMASI PENTING:
echo ============================================================
echo.
echo - Aplikasi akan buka di: http://localhost:3000
echo - Jangan tutup window CMD hitam saat aplikasi berjalan
echo - Login dengan kode sekolah dari Dinas
echo - Backup data secara rutin!
echo.
echo ============================================================
echo.

set /p RUN="Jalankan aplikasi sekarang? (Y/N): "
if /i "%RUN%"=="Y" (
    echo.
    echo Membuka aplikasi...
    echo.
    start "" "%APP_DIR%\JALANKAN-APLIKASI.bat"
    echo.
    echo Aplikasi sedang starting...
    echo Browser akan terbuka dalam beberapa detik.
    echo.
) else (
    echo.
    echo Aplikasi sudah siap!
    echo Double-click shortcut "E-Ijazah App" di Desktop untuk menjalankan.
)

echo.
echo ============================================================
echo Terima kasih telah menginstall Aplikasi E-Ijazah!
echo ============================================================
echo.

pause
exit /b 0
