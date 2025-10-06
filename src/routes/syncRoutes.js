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

        // Mark as synced ONLY if all batches succeeded
        if (totalSynced > 0 && errors.length === 0) {
            await SyncService.markAsSynced(['sekolah', 'siswa', 'nilai'], npsn);
            console.log(`✅ Marked ${totalSynced} records as synced for NPSN ${npsn}`);
        } else if (errors.length > 0) {
            console.log(`⚠️ Not marking as synced due to ${errors.length} errors`);
        }

        // Log sync
        await SyncService.logSync('upload', totalSynced, errors.length > 0 ? 'partial' : 'success',
            errors.length > 0 ? errors.join('; ') : null);

        res.json({
            success: errors.length === 0,
            message: errors.length > 0
                ? `Sync gagal: ${errors.length} batch error. Data belum tersinkronisasi.`
                : 'Data synced successfully',
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
 * POST /api/sync/upload-with-progress
 * Upload data with real-time progress updates via SSE
 */
router.post('/upload-with-progress', async (req, res) => {
    try {
        const { serverUrl, npsn, batchSize = 100 } = req.body;

        if (!serverUrl || !npsn) {
            return res.status(400).json({
                success: false,
                error: 'serverUrl and npsn required'
            });
        }

        // Setup SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sendProgress = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Get unsynced data
        const unsyncedData = await SyncService.getUnsyncedData(npsn);

        if (unsyncedData.totalRecords === 0) {
            sendProgress({
                type: 'complete',
                success: true,
                message: 'No data to sync',
                synced: 0
            });
            return res.end();
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

        const totalBatches = 1 + siswaBatches.length + nilaiBatches.length;
        let currentBatch = 0;

        // Send initial progress
        sendProgress({
            type: 'start',
            totalBatches,
            totalRecords: unsyncedData.totalRecords,
            breakdown: {
                sekolah: unsyncedData.sekolah.length,
                siswa: unsyncedData.siswa.length,
                nilai: unsyncedData.nilai.length
            }
        });

        // Send sekolah
        if (unsyncedData.sekolah.length > 0) {
            currentBatch++;
            sendProgress({
                type: 'progress',
                stage: 'sekolah',
                currentBatch,
                totalBatches,
                message: 'Syncing sekolah data...'
            });

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(`${serverUrl}/api/sync/receive`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        npsn,
                        sekolah: unsyncedData.sekolah,
                        siswa: [],
                        nilai: []
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const result = await response.json();
                    totalSynced += result.synced || unsyncedData.sekolah.length;
                } else {
                    errors.push(`Sekolah sync failed: ${response.statusText}`);
                }
            } catch (fetchError) {
                errors.push(`Sekolah sync error: ${fetchError.message}`);
                console.error('Sekolah fetch error:', fetchError);
            }
        }

        // Send siswa batches
        for (let i = 0; i < siswaBatches.length; i++) {
            currentBatch++;
            sendProgress({
                type: 'progress',
                stage: 'siswa',
                currentBatch,
                totalBatches,
                batchNumber: i + 1,
                totalStageBatches: siswaBatches.length,
                message: `Syncing siswa batch ${i + 1}/${siswaBatches.length}...`,
                records: siswaBatches[i].length
            });

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(`${serverUrl}/api/sync/receive`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        npsn,
                        sekolah: [],
                        siswa: siswaBatches[i],
                        nilai: []
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const result = await response.json();
                    totalSynced += result.synced || siswaBatches[i].length;
                } else {
                    errors.push(`Siswa batch ${i + 1} failed: ${response.statusText}`);
                }
            } catch (fetchError) {
                errors.push(`Siswa batch ${i + 1} error: ${fetchError.message}`);
                console.error(`Siswa batch ${i + 1} fetch error:`, fetchError);
            }
        }

        // Send nilai batches
        for (let i = 0; i < nilaiBatches.length; i++) {
            currentBatch++;
            sendProgress({
                type: 'progress',
                stage: 'nilai',
                currentBatch,
                totalBatches,
                batchNumber: i + 1,
                totalStageBatches: nilaiBatches.length,
                message: `Syncing nilai batch ${i + 1}/${nilaiBatches.length}...`,
                records: nilaiBatches[i].length
            });

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(`${serverUrl}/api/sync/receive`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        npsn,
                        sekolah: [],
                        siswa: [],
                        nilai: nilaiBatches[i]
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const result = await response.json();
                    totalSynced += result.synced || nilaiBatches[i].length;
                } else {
                    errors.push(`Nilai batch ${i + 1} failed: ${response.statusText}`);
                }
            } catch (fetchError) {
                errors.push(`Nilai batch ${i + 1} error: ${fetchError.message}`);
                console.error(`Nilai batch ${i + 1} fetch error:`, fetchError);
            }
        }

        // Mark as synced ONLY if all batches succeeded
        if (totalSynced > 0 && errors.length === 0) {
            await SyncService.markAsSynced(['sekolah', 'siswa', 'nilai'], npsn);
            console.log(`✅ Marked ${totalSynced} records as synced for NPSN ${npsn}`);
        } else if (errors.length > 0) {
            console.log(`⚠️ Not marking as synced due to ${errors.length} errors`);
        }

        // Log sync
        await SyncService.logSync('upload', totalSynced, errors.length > 0 ? 'partial' : 'success',
            errors.length > 0 ? errors.join('; ') : null);

        // Send completion
        const finalMessage = errors.length > 0
            ? `Sync gagal: ${errors.length} batch error. Data belum tersinkronisasi.`
            : `Data synced successfully: ${totalSynced} records`;

        sendProgress({
            type: 'complete',
            success: errors.length === 0,
            message: finalMessage,
            synced: totalSynced,
            totalRecords: unsyncedData.totalRecords,
            batches: {
                sekolah: 1,
                siswa: siswaBatches.length,
                nilai: nilaiBatches.length
            },
            errors: errors.length > 0 ? errors : undefined
        });

        res.end();

    } catch (error) {
        console.error('Sync upload error:', error);

        // Log failed sync
        await SyncService.logSync('upload', 0, 'failed', error.message);

        // Send error via SSE if possible
        try {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                success: false,
                error: error.message
            })}\n\n`);
            res.end();
        } catch (e) {
            // Response already closed
        }
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
