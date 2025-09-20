const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Konfigurasi untuk development atau production
const isDev = process.argv.includes('--dev');

// Variabel global
let mainWindow;
let serverProcess;
const SERVER_PORT = isDev ? 3001 : 3000; // Port berbeda untuk development

function createWindow() {
    // Buat browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'assets', 'icon.png'), // Icon aplikasi
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true
        },
        show: false, // Jangan tampilkan sampai ready
        title: 'Aplikasi Nilai E-Ijazah'
    });

    // Custom menu bar
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Keluar',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload', label: 'Muat Ulang' },
                { role: 'forceReload', label: 'Paksa Muat Ulang' },
                { role: 'toggleDevTools', label: 'Developer Tools' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Reset Zoom' },
                { role: 'zoomIn', label: 'Zoom In' },
                { role: 'zoomOut', label: 'Zoom Out' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Fullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Tentang',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Tentang Aplikasi',
                            message: 'Aplikasi Nilai E-Ijazah',
                            detail: 'Versi 2.6.0\\n\\nDibuat oleh: Prasetya Lukmana\\n\\nSistem pengelolaan nilai untuk sekolah dasar dengan fitur e-ijazah.'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // Load aplikasi setelah server ready
    setTimeout(() => {
        mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
        mainWindow.show();

        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    }, 3000); // Tunggu 3 detik untuk server startup

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Handle navigation
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        // Hanya izinkan navigasi dalam localhost
        if (parsedUrl.origin !== `http://localhost:${SERVER_PORT}`) {
            event.preventDefault();
        }
    });
}

function startServer() {
    return new Promise((resolve, reject) => {
        // Path ke server.js
        const serverPath = path.join(__dirname, 'server.js');

        // Tentukan path ke Node.js
        const nodePath = process.platform === 'win32' ? 'node.exe' : 'node';

        console.log('Starting server at:', serverPath);
        console.log('Using Node.js:', nodePath);

        // Spawn Node.js process untuk server dengan environment variable
        serverProcess = spawn(nodePath, [`"${serverPath}"`], {
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: __dirname,
            env: {
                ...process.env,
                PORT: SERVER_PORT.toString(),
                NODE_ENV: 'production'
            },
            shell: true // Gunakan shell untuk Windows
        });

        let serverReady = false;

        // Handle server output
        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('Server:', output);

            // Cek apakah server sudah ready
            if (output.includes('Server backend berjalan') ||
                output.includes('listening') ||
                output.includes('running') ||
                output.includes('started')) {
                if (!serverReady) {
                    serverReady = true;
                    setTimeout(() => resolve(), 1000); // Delay sedikit untuk memastikan server ready
                }
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error('Server Error:', data.toString());
        });

        serverProcess.on('close', (code) => {
            console.log(`Server process exited with code ${code}`);
            if (!serverReady) {
                reject(new Error(`Server failed to start (exit code: ${code})`));
            }
        });

        serverProcess.on('error', (error) => {
            console.error('Failed to start server:', error);
            reject(error);
        });

        // Fallback timeout - lebih lama untuk startup pertama
        setTimeout(() => {
            if (!serverReady) {
                console.log('Server timeout, assuming ready...');
                serverReady = true;
                resolve();
            }
        }, 10000); // 10 detik timeout
    });
}

function stopServer() {
    if (serverProcess) {
        console.log('Stopping server...');
        serverProcess.kill('SIGTERM');
        serverProcess = null;
    }
}

// Event handlers
app.whenReady().then(async () => {
    try {
        console.log('Starting Aplikasi Nilai E-Ijazah...');

        // Start server terlebih dahulu
        await startServer();
        console.log('Server started successfully');

        // Buat window
        createWindow();

    } catch (error) {
        console.error('Failed to start application:', error);

        dialog.showErrorBox(
            'Error Starting Application',
            `Gagal memulai server aplikasi!\n\nPossible causes:\n• Node.js tidak terinstall atau tidak ditemukan\n• Port ${SERVER_PORT} sedang digunakan\n• Antivirus memblokir aplikasi\n\nSolusi:\n• Restart aplikasi\n• Jalankan sebagai Administrator\n• Tutup aplikasi lain yang menggunakan port ${SERVER_PORT}\n\nError: ${error.message}`
        );

        app.quit();
    }
});

app.on('window-all-closed', () => {
    stopServer();
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    stopServer();
});

// Handle app crash
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    stopServer();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});