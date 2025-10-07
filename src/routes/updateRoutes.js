const express = require('express');
const router = express.Router();
const packageJson = require('../../package.json');
const UpdateNotifier = require('../utils/updateNotifier');

// Current version dari package.json
const CURRENT_VERSION = packageJson.version;

// Changelog database (nanti bisa dipindah ke database)
const versionHistory = [
    {
        version: '2.7.0',
        releaseDate: '2025-01-03',
        type: 'minor',
        features: [
            'Sistem sinkronisasi data ke server dinas pusat',
            'Auto-sync scheduler dengan interval kustom (1 jam - 24 jam)',
            'Dashboard monitoring untuk admin dinas (PostgreSQL)',
            'Riwayat sinkronisasi lengkap dengan status tracking',
            'Sistem auto-update checker dengan notifikasi real-time',
            'Offline-first architecture untuk input data tanpa internet',
            'Server dinas pusat untuk agregasi data 300+ sekolah'
        ],
        bugfixes: [
            'Optimasi performa database dengan proper indexing',
            'Perbaikan UI responsif untuk sync panel',
            'Fix connection timeout handling',
            'Improved error messaging untuk sync failures'
        ],
        downloadUrl: 'https://github.com/atha0604/e-ijazah-app/releases/latest'
    },
    {
        version: '2.6.0',
        releaseDate: '2024-12-20',
        type: 'major',
        features: [
            'Login type indicator card',
            'Disable mobile responsive untuk desktop-only',
            'Electron embedded server improvements',
            'Hybrid mode (web/desktop) switching'
        ],
        bugfixes: [
            'Fixed sidebar positioning issues',
            'Fixed port conflicts in Electron',
            'Improved mobile layout stability'
        ],
        downloadUrl: 'https://github.com/atha0604/e-ijazah-app/releases/tag/v2.6.0'
    },
    {
        version: '2.5.0',
        releaseDate: '2024-12-15',
        type: 'minor',
        features: [
            'Enhanced UI/UX design',
            'Real-time collaboration',
            'Advanced authentication system'
        ],
        bugfixes: [
            'Performance optimizations',
            'Database query improvements'
        ],
        downloadUrl: 'https://github.com/atha0604/e-ijazah-app/releases/tag/v2.5.0'
    }
];

// GET /api/updates/check - Cek versi terbaru
router.get('/check', async (req, res) => {
    try {
        const currentVersion = CURRENT_VERSION;
        const latestVersion = versionHistory[0]; // Versi terbaru selalu di index 0

        const isUpdateAvailable = compareVersions(latestVersion.version, currentVersion) > 0;

        res.json({
            success: true,
            currentVersion,
            latestVersion: latestVersion.version,
            updateAvailable: isUpdateAvailable,
            updateInfo: isUpdateAvailable ? latestVersion : null
        });
    } catch (error) {
        console.error('Error checking for updates:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memeriksa update',
            error: error.message
        });
    }
});

// GET /api/updates/changelog - Lihat changelog lengkap
router.get('/changelog', (req, res) => {
    try {
        res.json({
            success: true,
            currentVersion: CURRENT_VERSION,
            changelog: versionHistory
        });
    } catch (error) {
        console.error('Error fetching changelog:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil changelog',
            error: error.message
        });
    }
});

// GET /api/updates/latest - Info versi terbaru
router.get('/latest', (req, res) => {
    try {
        const latest = versionHistory[0];
        res.json({
            success: true,
            latest,
            downloadUrl: latest.downloadUrl
        });
    } catch (error) {
        console.error('Error fetching latest version:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil info versi terbaru',
            error: error.message
        });
    }
});

// POST /api/updates/mark-updated - Mark bahwa user sudah update
router.post('/mark-updated', (req, res) => {
    try {
        const { version } = req.body;

        // Simpan info bahwa user sudah aware dengan update ini
        // Bisa disimpan di localStorage di frontend atau session

        res.json({
            success: true,
            message: `Update ke versi ${version} telah ditandai sebagai sudah dibaca`,
            markedVersion: version
        });
    } catch (error) {
        console.error('Error marking update:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menandai update',
            error: error.message
        });
    }
});

// POST /api/updates/broadcast - Broadcast update ke semua sekolah
router.post('/broadcast', async (req, res) => {
    try {
        const { version, adminKey } = req.body;

        // SECURITY: Verify admin key from environment variable only
        if (!process.env.ADMIN_BROADCAST_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: ADMIN_BROADCAST_KEY not set'
            });
        }

        if (adminKey !== process.env.ADMIN_BROADCAST_KEY) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Invalid admin key'
            });
        }

        // Find version in history
        const updateInfo = versionHistory.find(v => v.version === version);
        if (!updateInfo) {
            return res.status(404).json({
                success: false,
                message: `Version ${version} not found in history`
            });
        }

        // Broadcast update
        const notifier = new UpdateNotifier();
        const result = await notifier.broadcastUpdate(updateInfo);

        res.json({
            success: true,
            message: `Update v${version} broadcast completed`,
            details: result
        });

    } catch (error) {
        console.error('Error broadcasting update:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal broadcast update',
            error: error.message
        });
    }
});

// GET /api/updates/preview-message - Preview pesan update
router.get('/preview-message/:version', (req, res) => {
    try {
        const { version } = req.params;
        const { format = 'text' } = req.query;

        const updateInfo = versionHistory.find(v => v.version === version);
        if (!updateInfo) {
            return res.status(404).json({
                success: false,
                message: `Version ${version} not found`
            });
        }

        const notifier = new UpdateNotifier();
        notifier.setUpdateInfo(updateInfo);

        const messageContent = notifier.generateUpdateMessage(format);
        const whatsappMessage = notifier.generateWhatsAppMessage();
        const socialMediaPost = notifier.generateSocialMediaPost();
        const releaseNotes = notifier.generateReleaseNotes();

        res.json({
            success: true,
            version,
            previews: {
                email: format === 'html' ? messageContent : null,
                text: format === 'text' ? messageContent : null,
                whatsapp: whatsappMessage,
                socialMedia: socialMediaPost,
                releaseNotes: releaseNotes
            }
        });

    } catch (error) {
        console.error('Error generating message preview:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal generate preview',
            error: error.message
        });
    }
});

// GET /api/updates/communication-channels - Daftar channel komunikasi
router.get('/communication-channels', (req, res) => {
    try {
        const channels = [
            {
                name: 'In-App Notification',
                type: 'in-app',
                status: 'active',
                description: 'Banner dan modal di dalam aplikasi (Auto-check setiap 30 menit)',
                reach: 'All active users',
                automated: true,
                primary: true
            },
            {
                name: 'WhatsApp Broadcast',
                type: 'whatsapp',
                status: 'manual',
                description: 'Manual broadcast via WhatsApp (Message generator tersedia)',
                reach: 'School contacts with WhatsApp',
                automated: false,
                primary: false
            },
            {
                name: 'Social Media',
                type: 'social',
                status: 'manual',
                description: 'Manual post di media sosial (Post generator tersedia)',
                reach: 'Public followers',
                automated: false,
                primary: false
            }
        ];

        res.json({
            success: true,
            channels,
            summary: {
                total: channels.length,
                automated: channels.filter(c => c.automated).length,
                manual: channels.filter(c => !c.automated).length,
                primary: 'in-app'
            },
            note: 'Primary notification method is in-app. Email removed for simplicity.'
        });

    } catch (error) {
        console.error('Error fetching communication channels:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar channel',
            error: error.message
        });
    }
});

// Utility function untuk compare versi
function compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;

        if (v1Part > v2Part) return 1;
        if (v1Part < v2Part) return -1;
    }

    return 0;
}

module.exports = router;