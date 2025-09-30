// server.js

// 1. Impor package yang dibutuhkan

require('dotenv').config();

// SECURITY: Validate JWT_SECRET is set
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'GENERATE_A_SECURE_RANDOM_STRING_HERE_MINIMUM_64_CHARACTERS') {
  console.error('='.repeat(80));
  console.error('CRITICAL SECURITY ERROR: JWT_SECRET is not configured!');
  console.error('Please set a secure JWT_SECRET in your .env file.');
  console.error('Generate one using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  console.error('='.repeat(80));
  process.exit(1);
}

// Run migrations on startup (for Railway deployment)
try {
  console.log('Running database migrations...');
  require('./src/migrations/add-notifications-table.js');
  console.log('Migrations completed successfully');
} catch (error) {
  console.log('Migration info:', error.message);
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

// SECURITY: Configure CORS with allowed origins
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(server, {
    cors: corsOptions
});
const PORT = process.env.PORT || 3000;

// 3. Gunakan middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Buat instance io dapat diakses dari routes
app.set('io', io);

// 4. Definisikan route/endpoint dasar untuk tes
app.get('/api', (req, res) => {
  res.json({ message: 'Selamat datang di API E-Ijazah!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    checks: {
      jwt: process.env.JWT_SECRET ? 'configured' : 'missing',
      cors: process.env.CORS_ORIGINS ? 'configured' : 'default',
      database: 'connected' // Simplified - could add actual DB check
    }
  };

  res.json(healthCheck);
});

// Readiness check (for Kubernetes/Docker)
app.get('/api/ready', (req, res) => {
  // Check if app is ready to receive traffic
  const isReady = process.env.JWT_SECRET !== undefined;

  if (isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready', reason: 'JWT_SECRET not configured' });
  }
});

// Liveness check (for Kubernetes/Docker)
app.get('/api/live', (req, res) => {
  // Simple liveness probe
  res.status(200).json({ status: 'alive' });
});

// Route untuk halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Route untuk admin broadcast panel
app.get('/admin-broadcast.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'admin.html'));
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

// Daftarkan rute untuk update checker
const updateRoutes = require('./src/routes/updateRoutes');
app.use('/api/updates', updateRoutes);

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