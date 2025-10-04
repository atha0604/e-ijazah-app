/**
 * Sync Routes
 * API endpoints for data synchronization
 */

const express = require('express');
const router = express.Router();
const SyncService = require('../services/sync-service');
const db = require('../database/database');

/**
 * GET /api/sync/status
 * Get sync status and last sync time
 */
router.get('/status', async (req, res) => {
    try {
        const lastSyncTime = await SyncService.getLastSyncTime();
        const history = await SyncService.getSyncHistory(5);

        res.json({
            success: true,
            lastSyncTime,
            history
        });
    } catch (error) {
        console.error('Error getting sync status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/sync/unsynced
 * Get count of unsynced records
 */
router.get('/unsynced', async (req, res) => {
    try {
        const npsn = req.query.npsn;
        if (!npsn) {
            return res.status(400).json({
                success: false,
                error: 'NPSN required'
            });
        }

        const unsyncedData = await SyncService.getUnsyncedData(npsn);

        res.json({
            success: true,
            totalRecords: unsyncedData.totalRecords,
            breakdown: {
                sekolah: unsyncedData.sekolah.length,
                siswa: unsyncedData.siswa.length,
                nilai: unsyncedData.nilai.length
            }
        });
    } catch (error) {
        console.error('Error getting unsynced data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sync/upload
 * Upload data to central server (with batching)
 */
router.post('/upload', async (req, res) => {
    try {
        const { serverUrl, npsn, batchSize = 100 } = req.body;

        if (!serverUrl || !npsn) {
            return res.status(400).json({
                success: false,
                error: 'serverUrl and npsn required'
            });
        }

        // Get unsynced data
        const unsyncedData = await SyncService.getUnsyncedData(npsn);

        if (unsyncedData.totalRecords === 0) {
            return res.json({
                success: true,
                message: 'No data to sync',
                synced: 0
            });
        }

        const fetch = require('node-fetch');
        let totalSynced = 0;
        const errors = [];

        // Batch siswa
        const siswaBatches = [];
        for (let i = 0; i < unsyncedData.siswa.length; i += batchSize) {
            siswaBatches.push(unsyncedData.siswa.slice(i, i + batchSize));
        }

        // Batch nilai
        const nilaiBatches = [];
        for (let i = 0; i < unsyncedData.nilai.length; i += batchSize) {
            nilaiBatches.push(unsyncedData.nilai.slice(i, i + batchSize));
        }

        // Send sekolah (always small, no batch needed)
        if (unsyncedData.sekolah.length > 0) {
            const response = await fetch(`${serverUrl}/api/sync/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    npsn,
                    sekolah: unsyncedData.sekolah,
                    siswa: [],
                    nilai: []
                })
            });

            if (response.ok) {
                const result = await response.json();
                totalSynced += result.synced || unsyncedData.sekolah.length;
            } else {
                errors.push(`Sekolah sync failed: ${response.statusText}`);
            }
        }

        // Send siswa batches
        for (let i = 0; i < siswaBatches.length; i++) {
            const response = await fetch(`${serverUrl}/api/sync/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    npsn,
                    sekolah: [],
                    siswa: siswaBatches[i],
                    nilai: []
                })
            });

            if (response.ok) {
                const result = await response.json();
                totalSynced += result.synced || siswaBatches[i].length;
            } else {
                errors.push(`Siswa batch ${i + 1} failed: ${response.statusText}`);
            }
        }

        // Send nilai batches
        for (let i = 0; i < nilaiBatches.length; i++) {
            const response = await fetch(`${serverUrl}/api/sync/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    npsn,
                    sekolah: [],
                    siswa: [],
                    nilai: nilaiBatches[i]
                })
            });

            if (response.ok) {
                const result = await response.json();
                totalSynced += result.synced || nilaiBatches[i].length;
            } else {
                errors.push(`Nilai batch ${i + 1} failed: ${response.statusText}`);
            }
        }

        // Mark as synced
        await SyncService.markAsSynced(['sekolah', 'siswa', 'nilai']);

        // Log sync
        await SyncService.logSync('upload', totalSynced, errors.length > 0 ? 'partial' : 'success',
            errors.length > 0 ? errors.join('; ') : null);

        res.json({
            success: true,
            message: errors.length > 0 ? 'Partial sync completed' : 'Data synced successfully',
            synced: totalSynced,
            totalRecords: unsyncedData.totalRecords,
            batches: {
                sekolah: 1,
                siswa: siswaBatches.length,
                nilai: nilaiBatches.length
            },
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Sync upload error:', error);

        // Log failed sync
        await SyncService.logSync('upload', 0, 'failed', error.message);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/sync/history
 * Get sync history
 */
router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const history = await SyncService.getSyncHistory(limit);

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Error getting sync history:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sync/test
 * Test connection to central server
 */
router.post('/test', async (req, res) => {
    try {
        const { serverUrl } = req.body;

        if (!serverUrl) {
            return res.status(400).json({
                success: false,
                error: 'serverUrl required'
            });
        }

        const fetch = require('node-fetch');
        const response = await fetch(`${serverUrl}/api/sync/ping`, {
            method: 'GET',
            timeout: 5000
        });

        if (response.ok) {
            res.json({
                success: true,
                message: 'Connection successful',
                serverStatus: await response.json()
            });
        } else {
            throw new Error(`Server responded with ${response.status}`);
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
