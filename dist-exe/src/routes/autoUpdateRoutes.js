// Auto-Update API Routes
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');

// ============= PUBLIC ROUTES (NO AUTH REQUIRED) =============

// GET /api/auto-updates/status - Get updater status
router.get('/status', (req, res) => {
    try {
        if (!global.updateManager) {
            return res.json({
                success: false,
                message: 'Auto-updater not available',
                available: false
            });
        }

        const state = global.updateManager.getState();

        res.json({
            success: true,
            available: true,
            state: {
                initialized: state.initialized,
                updateAvailable: state.updateAvailable,
                downloading: state.downloading,
                installing: state.installing,
                currentVersion: require('../../package.json').version,
                autoUpdater: state.autoUpdater ? {
                    checking: state.autoUpdater.checking,
                    latestVersion: state.autoUpdater.latestVersion,
                    downloadUrl: state.autoUpdater.downloadUrl,
                    fileSize: state.autoUpdater.fileSize
                } : null
            }
        });
    } catch (error) {
        console.error('Error getting updater status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get updater status',
            error: error.message
        });
    }
});

// GET /api/auto-updates/check - Check for updates manually
router.get('/check', async (req, res) => {
    try {
        if (!global.updateManager) {
            return res.status(503).json({
                success: false,
                message: 'Auto-updater not available'
            });
        }

        console.log('📡 Manual update check requested');
        await global.updateManager.checkForUpdates();

        const state = global.updateManager.getState();

        res.json({
            success: true,
            message: 'Update check completed',
            updateAvailable: state.updateAvailable,
            currentVersion: require('../../package.json').version,
            latestVersion: state.autoUpdater?.latestVersion || null,
            releaseNotes: state.autoUpdater?.releaseNotes || null
        });

    } catch (error) {
        console.error('Error checking for updates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check for updates',
            error: error.message
        });
    }
});

// ============= AUTHENTICATED ROUTES =============

// Apply authentication middleware for admin operations
router.use(verifyToken);

// POST /api/auto-updates/download - Start download
router.post('/download', async (req, res) => {
    try {
        if (!global.updateManager) {
            return res.status(503).json({
                success: false,
                message: 'Auto-updater not available'
            });
        }

        const state = global.updateManager.getState();

        if (!state.updateAvailable) {
            return res.status(400).json({
                success: false,
                message: 'No update available to download'
            });
        }

        if (state.downloading) {
            return res.status(400).json({
                success: false,
                message: 'Download already in progress'
            });
        }

        console.log('📥 Manual download started');
        await global.updateManager.downloadUpdate();

        res.json({
            success: true,
            message: 'Download started',
            version: state.autoUpdater?.latestVersion
        });

    } catch (error) {
        console.error('Error starting download:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start download',
            error: error.message
        });
    }
});

// POST /api/auto-updates/install - Install downloaded update
router.post('/install', async (req, res) => {
    try {
        if (!global.updateManager) {
            return res.status(503).json({
                success: false,
                message: 'Auto-updater not available'
            });
        }

        const { updatePath } = req.body;

        if (!updatePath) {
            return res.status(400).json({
                success: false,
                message: 'Update path is required'
            });
        }

        const state = global.updateManager.getState();

        if (state.installing) {
            return res.status(400).json({
                success: false,
                message: 'Installation already in progress'
            });
        }

        console.log('🔧 Manual installation started');
        const result = await global.updateManager.installUpdate(updatePath);

        res.json({
            success: true,
            message: 'Installation completed',
            result: result,
            restartRequired: result.restartRequired
        });

    } catch (error) {
        console.error('Error installing update:', error);
        res.status(500).json({
            success: false,
            message: 'Installation failed',
            error: error.message
        });
    }
});

// POST /api/auto-updates/backup - Create backup
router.post('/backup', async (req, res) => {
    try {
        if (!global.updateManager) {
            return res.status(503).json({
                success: false,
                message: 'Auto-updater not available'
            });
        }

        const { type = 'manual' } = req.body;

        console.log(`💾 Creating ${type} backup`);
        const result = await global.updateManager.createBackup(type);

        res.json({
            success: true,
            message: `${type} backup created successfully`,
            backup: {
                path: result.path,
                size: result.size || 'unknown',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create backup',
            error: error.message
        });
    }
});

// GET /api/auto-updates/backups - List available backups
router.get('/backups', (req, res) => {
    try {
        if (!global.updateManager) {
            return res.status(503).json({
                success: false,
                message: 'Auto-updater not available'
            });
        }

        const backups = global.updateManager.getAvailableBackups();

        res.json({
            success: true,
            backups: backups.map(backup => ({
                name: backup.name,
                path: backup.path,
                size: backup.size,
                created: backup.created,
                type: backup.type,
                sizeFormatted: formatBytes(backup.size)
            })),
            total: backups.length
        });

    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list backups',
            error: error.message
        });
    }
});

// POST /api/auto-updates/restore - Restore from backup
router.post('/restore', async (req, res) => {
    try {
        if (!global.updateManager) {
            return res.status(503).json({
                success: false,
                message: 'Auto-updater not available'
            });
        }

        const { backupPath } = req.body;

        if (!backupPath) {
            return res.status(400).json({
                success: false,
                message: 'Backup path is required'
            });
        }

        console.log(`🔄 Restoring from backup: ${backupPath}`);
        const result = await global.updateManager.restoreFromBackup(backupPath);

        res.json({
            success: true,
            message: 'Restore completed successfully',
            result: result
        });

    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore backup',
            error: error.message
        });
    }
});

// POST /api/auto-updates/restart - Restart application
router.post('/restart', async (req, res) => {
    try {
        if (!global.updateManager) {
            return res.status(503).json({
                success: false,
                message: 'Auto-updater not available'
            });
        }

        // Send response before restarting
        res.json({
            success: true,
            message: 'Application will restart in 2 seconds',
            timestamp: new Date().toISOString()
        });

        console.log('🔄 Application restart requested');

        // Delay restart to allow response to be sent
        setTimeout(async () => {
            try {
                await global.updateManager.restartApplication();
            } catch (error) {
                console.error('Failed to restart application:', error);
            }
        }, 2000);

    } catch (error) {
        console.error('Error initiating restart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restart application',
            error: error.message
        });
    }
});

// GET /api/auto-updates/settings - Get updater settings
router.get('/settings', (req, res) => {
    try {
        if (!global.updateManager) {
            return res.status(503).json({
                success: false,
                message: 'Auto-updater not available'
            });
        }

        const settings = {
            autoCheck: global.updateManager.options.autoCheck,
            autoDownload: global.updateManager.options.autoDownload,
            autoInstall: global.updateManager.options.autoInstall,
            checkInterval: global.updateManager.options.checkInterval,
            fullBackupOnUpdate: global.updateManager.options.fullBackupOnUpdate,
            repository: {
                owner: global.updateManager.options.owner,
                repo: global.updateManager.options.repo
            }
        };

        res.json({
            success: true,
            settings: settings
        });

    } catch (error) {
        console.error('Error getting updater settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get updater settings',
            error: error.message
        });
    }
});

// POST /api/auto-updates/settings - Update settings
router.post('/settings', (req, res) => {
    try {
        if (!global.updateManager) {
            return res.status(503).json({
                success: false,
                message: 'Auto-updater not available'
            });
        }

        const {
            autoCheck,
            autoDownload,
            autoInstall,
            checkInterval,
            fullBackupOnUpdate
        } = req.body;

        // Update settings if provided
        if (typeof autoCheck === 'boolean') {
            global.updateManager.options.autoCheck = autoCheck;
        }
        if (typeof autoDownload === 'boolean') {
            global.updateManager.options.autoDownload = autoDownload;
        }
        if (typeof autoInstall === 'boolean') {
            global.updateManager.options.autoInstall = autoInstall;
        }
        if (typeof checkInterval === 'number' && checkInterval >= 60000) { // Minimum 1 minute
            global.updateManager.options.checkInterval = checkInterval;
        }
        if (typeof fullBackupOnUpdate === 'boolean') {
            global.updateManager.options.fullBackupOnUpdate = fullBackupOnUpdate;
        }

        console.log('⚙️ Updater settings updated');

        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings: {
                autoCheck: global.updateManager.options.autoCheck,
                autoDownload: global.updateManager.options.autoDownload,
                autoInstall: global.updateManager.options.autoInstall,
                checkInterval: global.updateManager.options.checkInterval,
                fullBackupOnUpdate: global.updateManager.options.fullBackupOnUpdate
            }
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
});

// ============= UTILITY FUNCTIONS =============

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;