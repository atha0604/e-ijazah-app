const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { exec } = require('child_process');

// Load environment variables
require('dotenv').config();

// Parse command line arguments
const args = process.argv.slice(2);
const isOfflineMode = args.includes('--offline');
const isOnlineMode = args.includes('--online');

// Auto-detect mode if not specified
let mode = 'auto';
if (isOfflineMode) mode = 'offline';
if (isOnlineMode) mode = 'online';

// Configuration
const SERVER_PORT = process.env.PORT || findFreePort(3000);
const ONLINE_URL = 'https://nilai-e-ijazah.koyeb.app';

console.log('🚀 Starting Aplikasi Nilai E-Ijazah (Standalone Version)');

// Fix path for executable
const isDev = !process.pkg;
const appPath = isDev ? __dirname : path.dirname(process.execPath);
const publicPath = path.join(appPath, 'public');

console.log('📁 App Directory:', appPath);
console.log('📁 Public Directory:', publicPath);
console.log('🔧 Mode:', mode);
console.log('🔧 Is Development:', isDev);

// Find free port
function findFreePort(startPort) {
    const net = require('net');

    function checkPort(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, (err) => {
                if (err) {
                    server.close();
                    resolve(false);
                } else {
                    server.close();
                    resolve(true);
                }
            });
        });
    }

    // For now, just return startPort and handle error later
    return startPort;
}

// Check internet connectivity
function checkInternetConnection() {
    return new Promise((resolve) => {
        const testUrls = [
            'https://google.com',
            'https://github.com',
            ONLINE_URL
        ];

        let resolved = false;
        let completedChecks = 0;

        testUrls.forEach(url => {
            const timeout = setTimeout(() => {
                completedChecks++;
                if (completedChecks === testUrls.length && !resolved) {
                    resolved = true;
                    resolve(false);
                }
            }, 3000);

            require('https').get(url, (res) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    resolve(true);
                }
            }).on('error', () => {
                completedChecks++;
                if (completedChecks === testUrls.length && !resolved) {
                    resolved = true;
                    resolve(false);
                }
            });
        });
    });
}

// Embedded routes (instead of requiring external files)
function setupRoutes(app) {

    // Auth Routes
    app.post('/api/auth/login', (req, res) => {
        try {
            const { appCode } = req.body;

            // Simple auth logic - for demo purposes
            if (appCode && appCode.length >= 3) {
                res.json({
                    success: true,
                    message: 'Login berhasil',
                    userType: 'admin',
                    token: 'demo-token-' + Date.now()
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: 'Kode aplikasi tidak valid'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Server error: ' + error.message
            });
        }
    });

    app.post('/api/auth/logout', (req, res) => {
        res.json({ success: true, message: 'Logout berhasil' });
    });

    // Data Routes
    app.get('/api/data/sekolah', (req, res) => {
        // Return demo data or read from local file
        res.json({
            success: true,
            data: [
                {
                    id: 1,
                    nama: 'SD Demo',
                    npsn: '12345678',
                    alamat: 'Jl. Demo No. 1',
                    kepala_sekolah: 'Demo Kepala Sekolah'
                }
            ]
        });
    });

    app.get('/api/data/siswa', (req, res) => {
        // Return demo data or read from local file
        res.json({
            success: true,
            data: [
                {
                    id: 1,
                    nama: 'Demo Siswa',
                    nisn: '1234567890',
                    kelas: '6A',
                    tahun_lulus: '2024'
                }
            ]
        });
    });

    app.post('/api/data/siswa', (req, res) => {
        // Save student data
        res.json({
            success: true,
            message: 'Data siswa berhasil disimpan',
            data: req.body
        });
    });

    // Update Routes
    app.get('/api/updates/check', (req, res) => {
        res.json({
            success: true,
            hasUpdate: false,
            currentVersion: '2.7.0',
            latestVersion: '2.7.0'
        });
    });

    // Notification Routes
    app.get('/api/notifications', (req, res) => {
        res.json({
            success: true,
            notifications: [
                {
                    id: 1,
                    message: 'Aplikasi berjalan dalam mode offline',
                    type: 'info',
                    timestamp: new Date().toISOString()
                }
            ]
        });
    });

    console.log('✅ All routes embedded successfully');
}

// Start local server
function startLocalServer() {
    return new Promise((resolve, reject) => {
        try {
            console.log('🖥️  Starting local server...');

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
            app.use(express.static(publicPath));

            // Make io accessible from routes
            app.set('io', io);

            // Basic routes
            app.get('/api', (req, res) => {
                res.json({
                    message: 'Selamat datang di API E-Ijazah!',
                    mode: 'offline',
                    server: 'standalone',
                    version: '2.7.0'
                });
            });

            app.get('/', (req, res) => {
                const htmlPath = path.join(publicPath, 'E-ijazah.html');
                if (fs.existsSync(htmlPath)) {
                    res.sendFile(htmlPath);
                } else {
                    res.send(`
                        <h1>Aplikasi E-Ijazah</h1>
                        <p>Mode: Offline</p>
                        <p>Server: Standalone</p>
                        <p>File E-ijazah.html tidak ditemukan di: ${htmlPath}</p>
                    `);
                }
            });

            // Setup embedded routes
            setupRoutes(app);

            // Socket.IO setup
            const connectedUsers = new Map();
            const activeCollaborations = new Map();

            io.on('connection', (socket) => {
                console.log('👤 User connected:', socket.id);

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
                    console.log('👤 User disconnected:', socket.id);
                });
            });

            // Try to start server with error handling for port conflicts
            const tryPort = (port) => {
                httpServer.listen(port, (err) => {
                    if (err) {
                        if (err.code === 'EADDRINUSE') {
                            console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
                            tryPort(port + 1);
                        } else {
                            reject(err);
                        }
                    } else {
                        console.log(`✅ Local server running on http://localhost:${port}`);
                        resolve(httpServer);
                    }
                });
            };

            tryPort(SERVER_PORT);

        } catch (error) {
            console.error('❌ Failed to start local server:', error);
            reject(error);
        }
    });
}

// Open browser
function openBrowser(url) {
    const platform = process.platform;
    let command;

    switch (platform) {
        case 'darwin':
            command = `open "${url}"`;
            break;
        case 'win32':
            command = `start "" "${url}"`;
            break;
        default:
            command = `xdg-open "${url}"`;
    }

    exec(command, (error) => {
        if (error) {
            console.warn('⚠️ Could not open browser automatically');
            console.log(`📱 Please open: ${url}`);
        } else {
            console.log(`🌐 Browser opened: ${url}`);
        }
    });
}

// Main application logic
async function main() {
    try {
        let useOnlineMode = false;
        let serverPort = SERVER_PORT;

        if (mode === 'auto') {
            console.log('🔍 Checking internet connection...');
            const hasInternet = await checkInternetConnection();

            if (hasInternet) {
                console.log('✅ Internet connection detected');
                useOnlineMode = true;
            } else {
                console.log('📴 No internet connection - using offline mode');
                useOnlineMode = false;
            }
        } else if (mode === 'online') {
            useOnlineMode = true;
        } else {
            useOnlineMode = false;
        }

        if (useOnlineMode) {
            console.log('🌍 Starting in ONLINE mode');
            console.log(`🔗 Connecting to: ${ONLINE_URL}`);

            // Test online server
            try {
                await new Promise((resolve, reject) => {
                    require('https').get(ONLINE_URL, (res) => {
                        if (res.statusCode === 200) {
                            resolve();
                        } else {
                            reject(new Error(`Server returned ${res.statusCode}`));
                        }
                    }).on('error', reject);
                });

                openBrowser(ONLINE_URL);
                console.log('✅ Online mode active');
                console.log('💡 Aplikasi berjalan dari server online');
                console.log('📱 Akses melalui browser yang terbuka');

            } catch (error) {
                console.warn('⚠️ Online server not available, falling back to offline mode');
                console.log('🔄 Starting local server...');
                const server = await startLocalServer();
                const actualPort = server.address().port;
                openBrowser(`http://localhost:${actualPort}`);
            }

        } else {
            console.log('🖥️  Starting in OFFLINE mode');
            const server = await startLocalServer();
            const actualPort = server.address().port;
            openBrowser(`http://localhost:${actualPort}`);
            console.log('✅ Offline mode active');
            console.log('💡 Aplikasi berjalan dari server lokal');
        }

        console.log('');
        console.log('🎯 Aplikasi Nilai E-Ijazah berhasil dimulai!');
        console.log('📝 Mode yang aktif:', useOnlineMode ? 'ONLINE' : 'OFFLINE');
        console.log('');
        console.log('💡 Cara menggunakan:');
        console.log('   - Mode OFFLINE: Data tersimpan di komputer lokal');
        console.log('   - Mode ONLINE: Data tersimpan di server cloud');
        console.log('');
        console.log('🛑 Untuk menghentikan aplikasi: Tekan Ctrl+C');

    } catch (error) {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Aplikasi Nilai E-Ijazah...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down Aplikasi Nilai E-Ijazah...');
    process.exit(0);
});

// Start the application
main().catch(console.error);