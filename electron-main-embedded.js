const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Konfigurasi untuk development atau production
const isDev = process.argv.includes('--dev');
const useWebVersion = process.argv.includes('--web') || process.env.USE_WEB_VERSION === 'true';

// Variabel global
let mainWindow;
let server;
const SERVER_PORT = isDev ? 3002 : 3003; // Port berbeda untuk development dan production

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
                    label: 'Switch ke Web Version',
                    click: () => {
                        const choice = dialog.showMessageBoxSync(mainWindow, {
                            type: 'question',
                            buttons: ['Ya, Switch ke Web', 'Batal'],
                            defaultId: 0,
                            title: 'Switch ke Web Version',
                            message: 'Switch ke versi web online?',
                            detail: 'Aplikasi akan beralih ke nilai-e-ijazah.koyeb.app\nVersi web selalu ter-update otomatis.\n\nInternet diperlukan untuk mode ini.'
                        });

                        if (choice === 0) {
                            mainWindow.loadURL('https://nilai-e-ijazah.koyeb.app');
                        }
                    }
                },
                {
                    label: 'Kembali ke Mode Lokal',
                    click: () => {
                        mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
                    }
                },
                { type: 'separator' },
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
                { role: 'zoomIn', label: 'Perbesar' },
                { role: 'zoomOut', label: 'Perkecil' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Layar Penuh' }
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
                            detail: 'Versi 2.6.0 - Hybrid Mode\\n\\nDibuat oleh: Prasetya Lukmana\\n\\nSistem pengelolaan nilai untuk sekolah dasar dengan fitur e-ijazah.\\n\\n✅ Mode Lokal: Embedded server\\n✅ Mode Web: nilai-e-ijazah.koyeb.app (selalu update)'
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
        if (useWebVersion) {
            console.log('Loading web version from nilai-e-ijazah.koyeb.app');
            mainWindow.loadURL('https://nilai-e-ijazah.koyeb.app');
        } else {
            console.log('Loading local embedded server');
            mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
        }

        mainWindow.show();

        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    }, useWebVersion ? 1000 : 3000); // Web mode lebih cepat, local mode tunggu server

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
        try {
            // Set environment variables
            process.env.PORT = SERVER_PORT.toString();
            process.env.NODE_ENV = 'production';

            console.log('Starting embedded server on port:', SERVER_PORT);

            // Import server modules directly
            const express = require('express');
            const cors = require('cors');
            const bodyParser = require('body-parser');
            const fs = require('fs');
            const path = require('path');
            const { createServer } = require('http');
            const { Server } = require('socket.io');

            // Initialize Express app
            const app = express();
            const httpServer = createServer(app);
            const io = new Server(httpServer, {
                cors: {
                    origin: "*",
                    methods: ["GET", "POST"]
                }
            });

            // Middleware
            app.use(cors());
            app.use(bodyParser.json({ limit: '50mb' }));
            app.use(express.static(path.join(__dirname, 'public')));

            // Make io accessible from routes
            app.set('io', io);

            // Basic routes
            app.get('/api', (req, res) => {
                res.json({ message: 'Selamat datang di API E-Ijazah!' });
            });

            app.get('/', (req, res) => {
                res.sendFile(path.join(__dirname, 'public', 'E-ijazah.html'));
            });

            // Import and use routes
            try {
                const authRoutes = require('./src/routes/authRoutes');
                app.use('/api/auth', authRoutes);

                const dataRoutes = require('./src/routes/dataRoutes');
                app.use('/api/data', dataRoutes);

                const notificationRoutes = require('./src/routes/notificationRoutes');
                app.use('/api/notifications', notificationRoutes);
            } catch (routeError) {
                console.warn('Some routes could not be loaded:', routeError.message);
            }

            // Socket.IO setup
            const connectedUsers = new Map();
            const activeCollaborations = new Map();

            io.on('connection', (socket) => {
                console.log('User connected:', socket.id);

                socket.on('join-collaboration', (data) => {
                    const { userType, userIdentifier, sessionId, userName } = data;

                    socket.join(sessionId);
                    connectedUsers.set(socket.id, {
                        userType, userIdentifier, sessionId, userName,
                        joinedAt: new Date()
                    });

                    if (!activeCollaborations.has(sessionId)) {
                        activeCollaborations.set(sessionId, {
                            users: new Set(), activity: [], createdAt: new Date()
                        });
                    }

                    activeCollaborations.get(sessionId).users.add(socket.id);

                    socket.to(sessionId).emit('user-joined', {
                        userType, userName, userIdentifier, joinedAt: new Date()
                    });
                });

                socket.on('disconnect', () => {
                    const user = connectedUsers.get(socket.id);
                    if (user) {
                        const session = activeCollaborations.get(user.sessionId);
                        if (session) {
                            session.users.delete(socket.id);
                            socket.to(user.sessionId).emit('user-left', {
                                userName: user.userName, userType: user.userType, leftAt: new Date()
                            });
                            if (session.users.size === 0) {
                                activeCollaborations.delete(user.sessionId);
                            }
                        }
                    }
                    connectedUsers.delete(socket.id);
                    console.log('User disconnected:', socket.id);
                });
            });

            // Start server
            httpServer.listen(SERVER_PORT, () => {
                console.log(`Embedded server running on http://localhost:${SERVER_PORT}`);
                server = httpServer; // Store reference for cleanup
                setTimeout(() => {
                    console.log('Embedded server started successfully');
                    resolve();
                }, 1000);
            });

        } catch (error) {
            console.error('Failed to start embedded server:', error);
            reject(error);
        }
    });
}

function stopServer() {
    if (server) {
        console.log('Stopping embedded server...');
        server.close(() => {
            console.log('Embedded server stopped');
        });
        server = null;
    }
}

// Event handlers
app.whenReady().then(async () => {
    try {
        if (useWebVersion) {
            console.log('Starting Aplikasi Nilai E-Ijazah (Web Mode)...');
            console.log('Connecting to nilai-e-ijazah.koyeb.app');

            // Skip server startup for web mode
            createWindow();
        } else {
            console.log('Starting Aplikasi Nilai E-Ijazah (Embedded Mode)...');

            // Start server terlebih dahulu
            await startServer();
            console.log('Server started successfully');

            // Buat window
            createWindow();
        }

    } catch (error) {
        console.error('Failed to start application:', error);

        dialog.showErrorBox(
            'Error Starting Application',
            `Gagal memulai server aplikasi!\n\nPossible causes:\n• Port ${SERVER_PORT} sedang digunakan\n• Database error\n• Module missing\n\nSolusi:\n• Restart aplikasi\n• Tutup aplikasi lain yang menggunakan port ${SERVER_PORT}\n• Reinstall aplikasi\n\nError: ${error.message}`
        );

        app.quit();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        stopServer();
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle before-quit untuk cleanup
app.on('before-quit', () => {
    stopServer();
});

// Handle certificate errors (untuk development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (url.startsWith(`http://localhost:${SERVER_PORT}`)) {
        // Ignore certificate errors untuk localhost
        event.preventDefault();
        callback(true);
    } else {
        callback(false);
    }
});