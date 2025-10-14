@echo off
echo =========================================
echo   E-IJAZAH DESKTOP APP LAUNCHER
echo =========================================
echo.
echo Starting backend server...
start /B node server.js
echo Server started on port 3000
echo.
timeout /t 3 /nobreak > nul
echo Launching desktop application...
start "" "src-tauri\target\release\app.exe"
echo.
echo Application launched!
echo.
echo Press any key to stop the server and exit...
pause > nul
taskkill /F /IM node.exe /T > nul 2>&1
echo Server stopped.
