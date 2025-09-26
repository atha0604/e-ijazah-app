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
const SERVER_PORT = process.env.PORT || 3000;
const ONLINE_URL = 'https://nilai-e-ijazah.koyeb.app';

console.log('🚀 Starting Aplikasi Nilai E-Ijazah (Native Version)');

// Fix path for executable
const isDev = !process.pkg;
const appPath = isDev ? __dirname : path.dirname(process.execPath);
const publicPath = path.join(appPath, 'public');
const srcPath = path.join(appPath, 'src');

console.log('📁 App Directory:', appPath);
console.log('📁 Public Directory:', publicPath);
console.log('🔧 Mode:', mode);
console.log('🔧 Is Development:', isDev);

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
                    server: 'local'
                });
            });

            app.get('/', (req, res) => {
                res.sendFile(path.join(publicPath, 'E-ijazah.html'));
            });

            // Import and use routes
            try {
                const authRoutes = require(path.join(srcPath, 'routes', 'authRoutes'));
                app.use('/api/auth', authRoutes);
                console.log('✅ Auth routes loaded');
            } catch (authError) {
                console.warn('⚠️ Auth routes failed to load:', authError.message);
            }

            try {
                const dataRoutes = require(path.join(srcPath, 'routes', 'dataRoutes'));
                app.use('/api/data', dataRoutes);
                console.log('✅ Data routes loaded');
            } catch (dataError) {
                console.warn('⚠️ Data routes failed to load:', dataError.message);
            }

            try {
                const updateRoutes = require(path.join(srcPath, 'routes', 'updateRoutes'));
                app.use('/api/updates', updateRoutes);
                console.log('✅ Update routes loaded');
            } catch (updateError) {
                console.warn('⚠️ Update routes failed to load:', updateError.message);
            }

            try {
                const notificationRoutes = require(path.join(srcPath, 'routes', 'notificationRoutes'));
                app.use('/api/notifications', notificationRoutes);
                console.log('✅ Notification routes loaded');
            } catch (notifError) {
                console.warn('⚠️ Notification routes failed to load:', notifError.message);
            }

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

            // Start server
            httpServer.listen(SERVER_PORT, () => {
                console.log(`✅ Local server running on http://localhost:${SERVER_PORT}`);
                resolve(httpServer);
            });

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
                await startLocalServer();
                openBrowser(`http://localhost:${SERVER_PORT}`);
            }

        } else {
            console.log('🖥️  Starting in OFFLINE mode');
            await startLocalServer();
            openBrowser(`http://localhost:${SERVER_PORT}`);
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