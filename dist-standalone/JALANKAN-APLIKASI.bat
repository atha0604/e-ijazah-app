@echo off
title Aplikasi Nilai E-Ijazah - Final Standalone
color 0A
cls

echo.
echo ================================================================
echo                 APLIKASI NILAI E-IJAZAH
echo                    VERSI STANDALONE
echo ================================================================
echo.
echo  Aplikasi pengelolaan nilai sekolah dasar dengan fitur e-ijazah
echo  yang dapat berjalan offline dan online secara otomatis.
echo.
echo  Dikembangkan oleh: Prasetya Lukmana
echo  Versi: 2.7.0 Final
echo.
echo ================================================================
echo.
echo Pilih mode aplikasi:
echo.
echo [1] AUTO    - Deteksi otomatis (Recommended)
echo             Offline jika tidak ada internet, Online jika ada
echo.
echo [2] OFFLINE - Paksa mode offline
echo             Aplikasi hanya berjalan lokal di komputer ini
echo.
echo [3] ONLINE  - Paksa mode online
echo             Aplikasi menggunakan server cloud
echo.
echo [4] HELP    - Bantuan dan informasi
echo.
echo [5] EXIT    - Keluar dari aplikasi
echo.

choice /c 12345 /n /m "Masukkan pilihan (1-5): "

if errorlevel 5 goto exit
if errorlevel 4 goto help
if errorlevel 3 goto online
if errorlevel 2 goto offline
if errorlevel 1 goto auto

:auto
cls
echo.
echo ================================================================
echo                      MODE AUTO DETECTION
echo ================================================================
echo.
echo 🔍 Mendeteksi koneksi internet...
echo 🚀 Memulai aplikasi dalam mode AUTO...
echo.
echo ✅ Aplikasi akan:
echo    - Cek koneksi internet otomatis
echo    - Gunakan online jika internet tersedia
echo    - Gunakan offline jika tidak ada internet
echo    - Buka browser secara otomatis
echo.
echo 💡 Tunggu sebentar, aplikasi sedang starting...
echo.
"E-Ijazah-Aplikasi.exe"
goto end

:offline
cls
echo.
echo ================================================================
echo                        MODE OFFLINE
echo ================================================================
echo.
echo 🖥️  Memulai dalam mode OFFLINE...
echo.
echo ✅ Aplikasi akan:
echo    - Menggunakan server lokal
echo    - Data tersimpan di komputer ini
echo    - Tidak memerlukan koneksi internet
echo    - Buka browser ke localhost
echo.
echo 💡 Tunggu sebentar, server lokal sedang starting...
echo.
"E-Ijazah-Aplikasi.exe" --offline
goto end

:online
cls
echo.
echo ================================================================
echo                        MODE ONLINE
echo ================================================================
echo.
echo 🌍 Memulai dalam mode ONLINE...
echo.
echo ✅ Aplikasi akan:
echo    - Menggunakan server cloud
echo    - Data tersimpan di server online
echo    - Memerlukan koneksi internet
echo    - Buka browser ke server online
echo.
echo 💡 Tunggu sebentar, koneksi ke server sedang dibuat...
echo.
"E-Ijazah-Aplikasi.exe" --online
goto end

:help
cls
echo.
echo ================================================================
echo                    BANTUAN DAN INFORMASI
echo ================================================================
echo.
echo 📖 CARA PENGGUNAAN:
echo.
echo 1. INSTALASI:
echo    - Extract file ZIP ke folder mana saja
echo    - Tidak perlu install software tambahan
echo    - Langsung bisa dijalankan
echo.
echo 2. MENJALANKAN:
echo    - Double-click JALANKAN-APLIKASI.bat
echo    - Pilih mode sesuai kebutuhan
echo    - Browser akan terbuka otomatis
echo.
echo 3. MODE APLIKASI:
echo    - AUTO: Deteksi internet otomatis (Recommended)
echo    - OFFLINE: Paksa offline, data lokal
echo    - ONLINE: Paksa online, data cloud
echo.
echo 4. AKSES APLIKASI:
echo    - Offline: http://localhost:3000 (atau port lain)
echo    - Online: https://nilai-e-ijazah.koyeb.app
echo.
echo 5. KEBUTUHAN SISTEM:
echo    - Windows 7/8/10/11 (64-bit)
echo    - Browser modern (Chrome, Firefox, Edge)
echo    - 2GB RAM, 50MB HDD space
echo.
echo 6. TROUBLESHOOTING:
echo    - Port conflict: Aplikasi akan cari port kosong
echo    - Browser tidak buka: Buka manual ke localhost:3000
echo    - Error startup: Pastikan folder public/ ada
echo.
echo ================================================================
echo.
pause
goto start

:exit
cls
echo.
echo ================================================================
echo                         TERIMA KASIH
echo ================================================================
echo.
echo 👋 Terima kasih telah menggunakan Aplikasi Nilai E-Ijazah
echo.
echo 📧 Untuk dukungan dan feedback:
echo    Email: support@e-ijazah.app
echo    GitHub: https://github.com/atha0604/e-ijazah-app
echo.
echo 🎓 Semoga aplikasi ini membantu proses pendidikan di sekolah Anda!
echo.
echo ================================================================
goto realend

:start
goto top

:end
echo.
echo ================================================================
echo                    APLIKASI TELAH BERHENTI
echo ================================================================
echo.
echo 🛑 Aplikasi Nilai E-Ijazah telah dihentikan.
echo.
echo 💡 Tips:
echo    - Tutup browser jika masih terbuka
echo    - Data offline tetap tersimpan
echo    - Jalankan kembali kapan saja
echo.
echo ================================================================
echo.
pause

:realend
