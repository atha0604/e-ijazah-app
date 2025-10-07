/**
 * Sync Service
 * Handles synchronization between school app and central dinas server
 */

const db = require('../database/database');

class SyncService {
    /**
     * Transform TTL to tempat_lahir and tanggal_lahir
     */
    static parseTTL(ttl) {
        if (!ttl) return { tempat_lahir: null, tanggal_lahir: null };

        const parts = ttl.split(',');
        if (parts.length < 2) return { tempat_lahir: ttl, tanggal_lahir: null };

        const tempat = parts[0].trim();
        const tanggalStr = parts[1].trim();

        // Convert DD MONTH YYYY to YYYY-MM-DD
        const months = {
            'JANUARI': '01', 'FEBRUARI': '02', 'MARET': '03', 'APRIL': '04',
            'MEI': '05', 'JUNI': '06', 'JULI': '07', 'AGUSTUS': '08',
            'SEPTEMBER': '09', 'OKTOBER': '10', 'NOVEMBER': '11', 'DESEMBER': '12'
        };

        const dateParts = tanggalStr.split(' ');
        if (dateParts.length === 3) {
            const day = dateParts[0].padStart(2, '0');
            const month = months[dateParts[1].toUpperCase()] || '01';
            const year = dateParts[2];
            return {
                tempat_lahir: tempat,
                tanggal_lahir: `${year}-${month}-${day}`
            };
        }

        return { tempat_lahir: tempat, tanggal_lahir: null };
    }

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
                    // Transform sekolah data
                    unsyncedSekolah.push(...rows.map(s => ({
                        npsn: s.npsn,
                        kode_biasa: s.kode_biasa,
                        kode_pro: s.kode_pro,
                        nama_lengkap: s.nama_lengkap || s.nama_singkat,
                        alamat: s.alamat,
                        desa: s.desa,
                        kecamatan: s.kecamatan,
                        kabupaten: s.kabupaten,
                        kurikulum: s.kurikulum || null
                    })));
                });

                // Get unsynced siswa - FILTER by school codes
                // Also include siswa that have unsynced nilai (even if siswa itself is synced)
                db.all(`
                    SELECT DISTINCT s.* FROM siswa s
                    INNER JOIN sekolah sk ON (s.kode_biasa = sk.kode_biasa OR s.kode_pro = sk.kode_pro)
                    WHERE sk.npsn = ?
                    AND s.is_deleted = 0
                    AND (
                        s.last_modified > s.synced_at OR s.synced_at IS NULL
                        OR EXISTS (
                            SELECT 1 FROM nilai n
                            WHERE n.nisn = s.nisn
                            AND (n.last_modified > n.synced_at OR n.synced_at IS NULL)
                            AND n.is_deleted = 0
                        )
                    )
                `, [npsn], (err, rows) => {
                    if (err) return reject(err);
                    // Transform siswa data
                    unsyncedSiswa.push(...rows.map(s => {
                        const { tempat_lahir, tanggal_lahir } = this.parseTTL(s.ttl);
                        return {
                            nisn: s.nisn,
                            nama: s.namaPeserta,
                            jk: null, // Not available in current schema
                            tempat_lahir,
                            tanggal_lahir,
                            nama_ayah: s.namaOrtu,
                            nama_ibu: null, // Not available
                            nik: null,
                            no_kk: null,
                            alamat: null,
                            npsn: npsn,
                            last_modified: s.last_modified
                        };
                    }));
                });

                // Get unsynced nilai - FILTER by siswa from this school only
                db.all(`
                    SELECT n.* FROM nilai n
                    INNER JOIN siswa s ON n.nisn = s.nisn
                    INNER JOIN sekolah sk ON (s.kode_biasa = sk.kode_biasa OR s.kode_pro = sk.kode_pro)
                    WHERE sk.npsn = ?
                    AND (n.last_modified > n.synced_at OR n.synced_at IS NULL)
                    AND n.is_deleted = 0
                `, [npsn], (err, rows) => {
                    if (err) return reject(err);
                    // Transform nilai data
                    unsyncedNilai.push(...rows.map(n => ({
                        nisn: n.nisn,
                        jenis: n.type === 'NILAI' ? `Semester ${n.semester}` : n.type,
                        mata_pelajaran: n.subject,
                        nilai: n.value,
                        predikat: null, // Not available
                        last_modified: n.last_modified
                    })));

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
     * Mark records as synced for specific NPSN only
     */
    static async markAsSynced(tableNames, npsn = null) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                const promises = [];

                if (tableNames.includes('sekolah')) {
                    promises.push(new Promise((res, rej) => {
                        const query = npsn
                            ? `UPDATE sekolah
                               SET synced_at = datetime('now')
                               WHERE npsn = ?
                               AND (last_modified > synced_at OR synced_at IS NULL)`
                            : `UPDATE sekolah
                               SET synced_at = datetime('now')
                               WHERE last_modified > synced_at OR synced_at IS NULL`;

                        db.run(query, npsn ? [npsn] : [], (err) => err ? rej(err) : res());
                    }));
                }

                if (tableNames.includes('siswa')) {
                    promises.push(new Promise((res, rej) => {
                        const query = npsn
                            ? `UPDATE siswa
                               SET synced_at = datetime('now')
                               WHERE nisn IN (
                                   SELECT s.nisn FROM siswa s
                                   INNER JOIN sekolah sk ON (s.kode_biasa = sk.kode_biasa OR s.kode_pro = sk.kode_pro)
                                   WHERE sk.npsn = ?
                               )
                               AND (last_modified > synced_at OR synced_at IS NULL)`
                            : `UPDATE siswa
                               SET synced_at = datetime('now')
                               WHERE last_modified > synced_at OR synced_at IS NULL`;

                        db.run(query, npsn ? [npsn] : [], (err) => err ? rej(err) : res());
                    }));
                }

                if (tableNames.includes('nilai')) {
                    promises.push(new Promise((res, rej) => {
                        const query = npsn
                            ? `UPDATE nilai
                               SET synced_at = datetime('now')
                               WHERE nisn IN (
                                   SELECT s.nisn FROM siswa s
                                   INNER JOIN sekolah sk ON (s.kode_biasa = sk.kode_biasa OR s.kode_pro = sk.kode_pro)
                                   WHERE sk.npsn = ?
                               )
                               AND (last_modified > synced_at OR synced_at IS NULL)`
                            : `UPDATE nilai
                               SET synced_at = datetime('now')
                               WHERE last_modified > synced_at OR synced_at IS NULL`;

                        db.run(query, npsn ? [npsn] : [], (err) => err ? rej(err) : res());
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
