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
 * Upload data to central server
 */
router.post('/upload', async (req, res) => {
    try {
        const { serverUrl, npsn } = req.body;

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

        // Send to central server
        const fetch = require('node-fetch');
        const response = await fetch(`${serverUrl}/api/sync/receive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                npsn,
                sekolah: unsyncedData.sekolah,
                siswa: unsyncedData.siswa,
                nilai: unsyncedData.nilai
            })
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Mark as synced
        await SyncService.markAsSynced(['sekolah', 'siswa', 'nilai']);

        // Log sync
        await SyncService.logSync('upload', unsyncedData.totalRecords, 'success');

        res.json({
            success: true,
            message: 'Data synced successfully',
            synced: unsyncedData.totalRecords,
            serverResponse: result
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
