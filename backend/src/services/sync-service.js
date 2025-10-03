/**
 * Sync Service
 * Handles synchronization between school app and central dinas server
 */

const db = require('../database/database');

class SyncService {
    /**
     * Get all unsynced data (data that has been modified since last sync)
     */
    static async getUnsyncedData(npsn) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                const unsyncedSiswa = [];
                const unsyncedNilai = [];
                const unsyncedSekolah = [];

                // Get unsynced sekolah data
                db.all(`
                    SELECT * FROM sekolah
                    WHERE npsn = ?
                    AND (last_modified > synced_at OR synced_at IS NULL)
                    AND is_deleted = 0
                `, [npsn], (err, rows) => {
                    if (err) return reject(err);
                    unsyncedSekolah.push(...rows);
                });

                // Get unsynced siswa
                db.all(`
                    SELECT * FROM siswa
                    WHERE (last_modified > synced_at OR synced_at IS NULL)
                    AND is_deleted = 0
                `, [], (err, rows) => {
                    if (err) return reject(err);
                    unsyncedSiswa.push(...rows);
                });

                // Get unsynced nilai
                db.all(`
                    SELECT * FROM nilai
                    WHERE (last_modified > synced_at OR synced_at IS NULL)
                    AND is_deleted = 0
                `, [], (err, rows) => {
                    if (err) return reject(err);
                    unsyncedNilai.push(...rows);

                    resolve({
                        sekolah: unsyncedSekolah,
                        siswa: unsyncedSiswa,
                        nilai: unsyncedNilai,
                        totalRecords: unsyncedSekolah.length + unsyncedSiswa.length + unsyncedNilai.length
                    });
                });
            });
        });
    }

    /**
     * Mark records as synced
     */
    static async markAsSynced(tableNames) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                const promises = [];

                if (tableNames.includes('sekolah')) {
                    promises.push(new Promise((res, rej) => {
                        db.run(`
                            UPDATE sekolah
                            SET synced_at = datetime('now')
                            WHERE last_modified > synced_at OR synced_at IS NULL
                        `, (err) => err ? rej(err) : res());
                    }));
                }

                if (tableNames.includes('siswa')) {
                    promises.push(new Promise((res, rej) => {
                        db.run(`
                            UPDATE siswa
                            SET synced_at = datetime('now')
                            WHERE last_modified > synced_at OR synced_at IS NULL
                        `, (err) => err ? rej(err) : res());
                    }));
                }

                if (tableNames.includes('nilai')) {
                    promises.push(new Promise((res, rej) => {
                        db.run(`
                            UPDATE nilai
                            SET synced_at = datetime('now')
                            WHERE last_modified > synced_at OR synced_at IS NULL
                        `, (err) => err ? rej(err) : res());
                    }));
                }

                Promise.all(promises)
                    .then(() => {
                        db.run('COMMIT', (err) => {
                            if (err) return reject(err);
                            resolve(true);
                        });
                    })
                    .catch(err => {
                        db.run('ROLLBACK');
                        reject(err);
                    });
            });
        });
    }

    /**
     * Log sync activity
     */
    static async logSync(syncType, recordsSynced, status, errorMessage = null) {
        return new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO sync_log (sync_type, records_synced, status, error_message)
                VALUES (?, ?, ?, ?)
            `, [syncType, recordsSynced, status, errorMessage], function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    }

    /**
     * Get sync history
     */
    static async getSyncHistory(limit = 10) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT * FROM sync_log
                ORDER BY synced_at DESC
                LIMIT ?
            `, [limit], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    /**
     * Get last sync time
     */
    static async getLastSyncTime() {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT synced_at FROM sync_log
                WHERE status = 'success'
                ORDER BY synced_at DESC
                LIMIT 1
            `, [], (err, row) => {
                if (err) return reject(err);
                resolve(row ? row.synced_at : null);
            });
        });
    }
}

module.exports = SyncService;
