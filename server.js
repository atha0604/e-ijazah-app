// server.js

// 1. Impor package yang dibutuhkan

require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('ENV JWT_SECRET belum di-set. Tambahkan JWT_SECRET ke file .env');
  process.exit(1);
}


const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');


// 2. Inisialisasi aplikasi Express
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// 3. Gunakan middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Buat instance io dapat diakses dari routes
app.set('io', io);

// 4. Definisikan route/endpoint dasar untuk tes
app.get('/api', (req, res) => {
  res.json({ message: 'Selamat datang di API E-Ijazah!' });
});

// Route untuk halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'E-ijazah.html'));
});

// 5. Impor dan gunakan SEMUA routes
// ==========================================================

// Daftarkan rute untuk otentikasi/login
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Daftarkan rute untuk impor data
const dataRoutes = require('./src/routes/dataRoutes');
app.use('/api/data', dataRoutes);

// Daftarkan rute untuk notifikasi (FIXED: Hanya satu kali)
const notificationRoutes = require('./src/routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// ==========================================================

// Socket.IO real-time collaboration setup
const connectedUsers = new Map(); // Store connected users
const activeCollaborations = new Map(); // Store active collaboration sessions

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining a collaboration session
    socket.on('join-collaboration', (data) => {
        const { userType, userIdentifier, sessionId, userName } = data;
        
        socket.join(sessionId);
        connectedUsers.set(socket.id, {
            userType,
            userIdentifier,
            sessionId,
            userName,
            joinedAt: new Date()
        });

        // Track active collaborations
        if (!activeCollaborations.has(sessionId)) {
            activeCollaborations.set(sessionId, {
                users: new Set(),
                activity: [],
                createdAt: new Date()
            });
        }
        
        activeCollaborations.get(sessionId).users.add(socket.id);

        // Notify others in the session
        socket.to(sessionId).emit('user-joined', {
            userType,
            userName,
            userIdentifier,
            joinedAt: new Date()
        });

        // Send current collaborators to the new user
        const currentSession = activeCollaborations.get(sessionId);
        const collaborators = Array.from(currentSession.users).map(userId => {
            const user = connectedUsers.get(userId);
            return user ? {
                userType: user.userType,
                userName: user.userName,
                userIdentifier: user.userIdentifier,
                joinedAt: user.joinedAt
            } : null;
        }).filter(Boolean);

        socket.emit('collaboration-status', {
            sessionId,
            collaborators,
            totalUsers: collaborators.length
        });
    });

    // Handle real-time form updates
    socket.on('form-update', (data) => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            const { field, value, targetId, formType } = data;
            
            // Broadcast to other users in the same session
            socket.to(user.sessionId).emit('form-updated', {
                field,
                value,
                targetId,
                formType,
                updatedBy: user.userName,
                timestamp: new Date()
            });

            // Log activity
            const session = activeCollaborations.get(user.sessionId);
            if (session) {
                session.activity.push({
                    type: 'form-update',
                    user: user.userName,
                    field,
                    value,
                    targetId,
                    formType,
                    timestamp: new Date()
                });

                // Keep only last 50 activities
                if (session.activity.length > 50) {
                    session.activity = session.activity.slice(-50);
                }
            }
        }
    });

    // Handle cursor/field focus updates
    socket.on('field-focus', (data) => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            socket.to(user.sessionId).emit('user-field-focus', {
                field: data.field,
                targetId: data.targetId,
                userName: user.userName,
                userType: user.userType,
                action: data.action // 'focus' or 'blur'
            });
        }
    });

    // Handle data save notifications
    socket.on('data-saved', (data) => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            socket.to(user.sessionId).emit('data-save-notification', {
                message: `${user.userName} saved ${data.dataType} data`,
                dataType: data.dataType,
                targetId: data.targetId,
                timestamp: new Date(),
                savedBy: user.userName
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            // Remove from session
            const session = activeCollaborations.get(user.sessionId);
            if (session) {
                session.users.delete(socket.id);
                
                // Notify others
                socket.to(user.sessionId).emit('user-left', {
                    userName: user.userName,
                    userType: user.userType,
                    leftAt: new Date()
                });

                // Clean up empty sessions
                if (session.users.size === 0) {
                    activeCollaborations.delete(user.sessionId);
                }
            }
        }
        
        connectedUsers.delete(socket.id);
        console.log('User disconnected:', socket.id);
    });
});

// API endpoint to get collaboration stats
app.get('/api/collaboration/stats', (req, res) => {
    const stats = {
        totalConnectedUsers: connectedUsers.size,
        activeSessions: activeCollaborations.size,
        sessions: Array.from(activeCollaborations.entries()).map(([sessionId, session]) => ({
            sessionId,
            userCount: session.users.size,
            createdAt: session.createdAt,
            recentActivity: session.activity.slice(-5)
        }))
    };
    res.json(stats);
});

// 6. Jalankan server
server.listen(PORT, () => {
  console.log(`Server backend berjalan di http://localhost:${PORT}`);
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
});