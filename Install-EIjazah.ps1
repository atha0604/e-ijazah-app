# ============================================================
# E-IJAZAH INSTALLER - POWERSHELL SCRIPT
# Auto-install Node.js, Download App, Create Shortcut
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALLER APLIKASI NILAI E-IJAZAH" -ForegroundColor Green
Write-Host "   PowerShell Auto-Installer" -ForegroundColor Green
Write-Host "   Tahun Pelajaran 2025/2026" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$AppName = "E-Ijazah App"
$AppDir = "C:\E-Ijazah\e-ijazah-app"
$GitHubURL = "https://github.com/atha0604/e-ijazah-app/archive/refs/heads/brave-black.zip"
$NodeVersion = "20.11.0"
$NodeURL = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-x64.msi"

# ============================================================
# STEP 1: Check and Install Node.js
# ============================================================
Write-Host "[STEP 1/6] Checking Node.js..." -ForegroundColor Yellow
Write-Host ""

try {
    $nodeVer = node --version 2>$null
    if ($nodeVer) {
        Write-Host "[OK] Node.js already installed: $nodeVer" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "[INFO] Node.js not found. Installing..." -ForegroundColor Yellow
    Write-Host ""

    $NodeInstaller = "$env:TEMP\node-installer.msi"

    Write-Host "Downloading Node.js v$NodeVersion..." -ForegroundColor Cyan
    Write-Host "URL: $NodeURL" -ForegroundColor Gray

    # Download Node.js
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $NodeURL -OutFile $NodeInstaller -UseBasicParsing

    Write-Host "[OK] Download completed!" -ForegroundColor Green
    Write-Host ""

    Write-Host "Installing Node.js..." -ForegroundColor Cyan
    Write-Host "This may take 2-3 minutes..." -ForegroundColor Gray

    # Install Node.js silently
    Start-Process msiexec.exe -ArgumentList "/i `"$NodeInstaller`" /qn /norestart" -Wait -NoNewWindow

    # Cleanup
    Remove-Item $NodeInstaller -Force -ErrorAction SilentlyContinue

    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    Write-Host "[OK] Node.js installed successfully!" -ForegroundColor Green
    Write-Host ""

    # Verify
    Start-Sleep -Seconds 2
    $nodeVer = node --version 2>$null
    if ($nodeVer) {
        Write-Host "Node.js version: $nodeVer" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Node.js installed but not in PATH. Please restart your computer." -ForegroundColor Yellow
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit
    }
}

Write-Host ""

# ============================================================
# STEP 2: Create App Directory
# ============================================================
Write-Host "[STEP 2/6] Creating application directory..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path $AppDir) {
    Write-Host "[INFO] Application directory already exists." -ForegroundColor Cyan
    $reinstall = Read-Host "Reinstall? (Y/N)"
    if ($reinstall -ne "Y" -and $reinstall -ne "y") {
        Write-Host "Skipping download..." -ForegroundColor Gray
    } else {
        Write-Host "Removing old installation..." -ForegroundColor Gray
        Remove-Item $AppDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

if (-not (Test-Path "C:\E-Ijazah")) {
    New-Item -ItemType Directory -Path "C:\E-Ijazah" -Force | Out-Null
    Write-Host "[OK] Created directory: C:\E-Ijazah" -ForegroundColor Green
}

Write-Host ""

# ============================================================
# STEP 3: Download Application
# ============================================================
Write-Host "[STEP 3/6] Downloading E-Ijazah application..." -ForegroundColor Yellow
Write-Host ""

$ZipFile = "$env:TEMP\e-ijazah-app.zip"

Write-Host "Downloading from GitHub..." -ForegroundColor Cyan
Write-Host "URL: $GitHubURL" -ForegroundColor Gray
Write-Host ""

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $GitHubURL -OutFile $ZipFile -UseBasicParsing

Write-Host "[OK] Download completed!" -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 4: Extract Application
# ============================================================
Write-Host "[STEP 4/6] Extracting application..." -ForegroundColor Yellow
Write-Host ""

Expand-Archive -Path $ZipFile -DestinationPath "C:\E-Ijazah" -Force

# Rename folder
if (Test-Path "C:\E-Ijazah\e-ijazah-app-brave-black") {
    if (Test-Path $AppDir) {
        Remove-Item $AppDir -Recurse -Force
    }
    Rename-Item "C:\E-Ijazah\e-ijazah-app-brave-black" "e-ijazah-app"
}

# Cleanup
Remove-Item $ZipFile -Force -ErrorAction SilentlyContinue

Write-Host "[OK] Extraction completed!" -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 5: Install Dependencies
# ============================================================
Write-Host "[STEP 5/6] Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take 3-5 minutes..." -ForegroundColor Gray
Write-Host ""

Set-Location $AppDir

& npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] npm install failed. Trying again..." -ForegroundColor Yellow
    & npm cache clean --force
    & npm install
}

Write-Host ""
Write-Host "[OK] Dependencies installed!" -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 6: Create Shortcuts
# ============================================================
Write-Host "[STEP 6/6] Creating shortcuts..." -ForegroundColor Yellow
Write-Host ""

# Create startup batch file
$StartupBat = @"
@echo off
title Aplikasi Nilai E-Ijazah
color 0B
cls

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
timeout /t 5 /nobreak >nul
start http://localhost:3000
cd /d "$AppDir"
npm start
"@

$StartupBat | Out-File -FilePath "$AppDir\JALANKAN-APLIKASI.bat" -Encoding ASCII

Write-Host "[OK] Created startup script" -ForegroundColor Green

# Create desktop shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = "$Desktop\$AppName.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "$AppDir\JALANKAN-APLIKASI.bat"
$Shortcut.WorkingDirectory = $AppDir
$Shortcut.Description = "Aplikasi Nilai E-Ijazah 2025/2026"
$Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,21"
$Shortcut.Save()

Write-Host "[OK] Created desktop shortcut: $AppName.lnk" -ForegroundColor Green
Write-Host ""

# ============================================================
# Installation Complete
# ============================================================
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALASI BERHASIL!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Aplikasi terinstall di:" -ForegroundColor White
Write-Host "  $AppDir" -ForegroundColor Gray
Write-Host ""
Write-Host "Shortcut Desktop:" -ForegroundColor White
Write-Host "  $ShortcutPath" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CARA MENJALANKAN:" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Double-click shortcut 'E-Ijazah App' di Desktop" -ForegroundColor Yellow
Write-Host "   ATAU" -ForegroundColor Gray
Write-Host "2. Double-click file JALANKAN-APLIKASI.bat" -ForegroundColor Yellow
Write-Host ""
Write-Host "Aplikasi akan buka di: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$run = Read-Host "Jalankan aplikasi sekarang? (Y/N)"
if ($run -eq "Y" -or $run -eq "y") {
    Write-Host ""
    Write-Host "Starting application..." -ForegroundColor Green
    Start-Process "$AppDir\JALANKAN-APLIKASI.bat"
    Write-Host "Browser akan terbuka dalam beberapa detik..." -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Terima kasih! Press any key to exit..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
