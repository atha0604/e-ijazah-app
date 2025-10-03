/**
 * Central Dinas Server
 * Receives and aggregates data from all schools
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
    } else {
        console.log('✅ Database connected:', res.rows[0].now);
    }
});

// Health check (for Railway healthcheck)
app.get('/api/ping', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Health check (detailed)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Dinas Central Server'
    });
});

// Ping endpoint for connection testing
app.get('/api/sync/ping', (req, res) => {
    res.json({
        success: true,
        message: 'Dinas server online',
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/sync/receive
 * Receive sync data from schools
 */
app.post('/api/sync/receive', async (req, res) => {
    const client = await pool.connect();

    try {
        const { npsn, sekolah, siswa, nilai } = req.body;

        if (!npsn) {
            return res.status(400).json({
                success: false,
                error: 'NPSN required'
            });
        }

        await client.query('BEGIN');

        let totalSynced = 0;

        // Update/Insert sekolah data
        if (sekolah && sekolah.length > 0) {
            for (const s of sekolah) {
                await client.query(`
                    INSERT INTO sekolah_master (
                        npsn, kode_biasa, kode_pro, nama_lengkap,
                        alamat, desa, kecamatan, kabupaten,
                        last_sync, status
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'active')
                    ON CONFLICT (npsn)
                    DO UPDATE SET
                        kode_biasa = EXCLUDED.kode_biasa,
                        kode_pro = EXCLUDED.kode_pro,
                        nama_lengkap = EXCLUDED.nama_lengkap,
                        alamat = EXCLUDED.alamat,
                        desa = EXCLUDED.desa,
                        kecamatan = EXCLUDED.kecamatan,
                        kabupaten = EXCLUDED.kabupaten,
                        last_sync = NOW(),
                        status = 'active'
                `, [
                    s.npsn, s.kode_biasa, s.kode_pro, s.nama_lengkap,
                    s.alamat, s.desa, s.kecamatan, s.kabupaten
                ]);
                totalSynced++;
            }
        }

        // Update/Insert siswa data
        if (siswa && siswa.length > 0) {
            for (const s of siswa) {
                await client.query(`
                    INSERT INTO siswa_pusat (
                        nisn, nama, jk, tempat_lahir, tanggal_lahir,
                        nama_ayah, nama_ibu, nik, no_kk, alamat,
                        npsn, last_modified, synced_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
                    ON CONFLICT (nisn)
                    DO UPDATE SET
                        nama = EXCLUDED.nama,
                        jk = EXCLUDED.jk,
                        tempat_lahir = EXCLUDED.tempat_lahir,
                        tanggal_lahir = EXCLUDED.tanggal_lahir,
                        nama_ayah = EXCLUDED.nama_ayah,
                        nama_ibu = EXCLUDED.nama_ibu,
                        nik = EXCLUDED.nik,
                        no_kk = EXCLUDED.no_kk,
                        alamat = EXCLUDED.alamat,
                        npsn = EXCLUDED.npsn,
                        last_modified = EXCLUDED.last_modified,
                        synced_at = NOW()
                    WHERE EXCLUDED.last_modified > siswa_pusat.last_modified
                       OR siswa_pusat.last_modified IS NULL
                `, [
                    s.nisn, s.nama, s.jk, s.tempat_lahir, s.tanggal_lahir,
                    s.nama_ayah, s.nama_ibu, s.nik, s.no_kk, s.alamat,
                    npsn, s.last_modified
                ]);
                totalSynced++;
            }
        }

        // Update/Insert nilai data
        if (nilai && nilai.length > 0) {
            for (const n of nilai) {
                await client.query(`
                    INSERT INTO nilai_pusat (
                        nisn, jenis, mata_pelajaran, nilai, predikat,
                        last_modified, synced_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                    ON CONFLICT (nisn, jenis, mata_pelajaran)
                    DO UPDATE SET
                        nilai = EXCLUDED.nilai,
                        predikat = EXCLUDED.predikat,
                        last_modified = EXCLUDED.last_modified,
                        synced_at = NOW()
                    WHERE EXCLUDED.last_modified > nilai_pusat.last_modified
                       OR nilai_pusat.last_modified IS NULL
                `, [
                    n.nisn, n.jenis, n.mata_pelajaran, n.nilai, n.predikat,
                    n.last_modified
                ]);
                totalSynced++;
            }
        }

        // Log sync
        await client.query(`
            INSERT INTO sync_logs (npsn, synced_records, synced_at)
            VALUES ($1, $2, NOW())
        `, [npsn, totalSynced]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Data synced successfully',
            synced: totalSynced,
            breakdown: {
                sekolah: sekolah?.length || 0,
                siswa: siswa?.length || 0,
                nilai: nilai?.length || 0
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/admin/sekolah
 * Get all schools with sync status
 */
app.get('/api/admin/sekolah', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                sm.npsn,
                sm.nama_lengkap,
                sm.kecamatan,
                sm.kabupaten,
                sm.last_sync,
                COUNT(DISTINCT sp.nisn) as total_siswa,
                COUNT(np.id) as total_nilai,
                CASE
                    WHEN sm.last_sync > NOW() - INTERVAL '7 days' THEN 'up-to-date'
                    WHEN sm.last_sync > NOW() - INTERVAL '30 days' THEN 'outdated'
                    ELSE 'critical'
                END as status
            FROM sekolah_master sm
            LEFT JOIN siswa_pusat sp ON sm.npsn = sp.npsn
            LEFT JOIN nilai_pusat np ON sp.nisn = np.nisn
            GROUP BY sm.npsn, sm.nama_lengkap, sm.kecamatan, sm.kabupaten, sm.last_sync
            ORDER BY sm.last_sync DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching schools:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/admin/nilai
 * Get all nilai data with filters
 */
app.get('/api/admin/nilai', async (req, res) => {
    try {
        const { npsn, kecamatan, kabupaten } = req.query;

        let query = `
            SELECT
                sm.npsn,
                sm.nama_lengkap as sekolah,
                sm.kecamatan,
                sm.kabupaten,
                sp.nisn,
                sp.nama,
                sp.jk,
                np.jenis,
                np.mata_pelajaran,
                np.nilai,
                np.predikat,
                np.synced_at
            FROM nilai_pusat np
            JOIN siswa_pusat sp ON np.nisn = sp.nisn
            JOIN sekolah_master sm ON sp.npsn = sm.npsn
            WHERE 1=1
        `;

        const params = [];

        if (npsn) {
            params.push(npsn);
            query += ` AND sm.npsn = $${params.length}`;
        }

        if (kecamatan) {
            params.push(kecamatan);
            query += ` AND sm.kecamatan = $${params.length}`;
        }

        if (kabupaten) {
            params.push(kabupaten);
            query += ` AND sm.kabupaten = $${params.length}`;
        }

        query += ` ORDER BY sm.nama_lengkap, sp.nama, np.jenis, np.mata_pelajaran`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching nilai:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/admin/siswa
 * Get all siswa data with filters
 */
app.get('/api/admin/siswa', async (req, res) => {
    try {
        const { npsn, kecamatan, kabupaten } = req.query;

        let query = `
            SELECT
                sm.npsn,
                sm.nama_lengkap as sekolah,
                sm.kecamatan,
                sm.kabupaten,
                sp.*
            FROM siswa_pusat sp
            JOIN sekolah_master sm ON sp.npsn = sm.npsn
            WHERE 1=1
        `;

        const params = [];

        if (npsn) {
            params.push(npsn);
            query += ` AND sm.npsn = $${params.length}`;
        }

        if (kecamatan) {
            params.push(kecamatan);
            query += ` AND sm.kecamatan = $${params.length}`;
        }

        if (kabupaten) {
            params.push(kabupaten);
            query += ` AND sm.kabupaten = $${params.length}`;
        }

        query += ` ORDER BY sm.nama_lengkap, sp.nama`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching siswa:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/admin/stats
 * Get overall statistics
 */
app.get('/api/admin/stats', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM sekolah_master) as total_sekolah,
                (SELECT COUNT(*) FROM siswa_pusat) as total_siswa,
                (SELECT COUNT(*) FROM nilai_pusat) as total_nilai,
                (SELECT COUNT(*) FROM sekolah_master WHERE last_sync > NOW() - INTERVAL '7 days') as sekolah_active,
                (SELECT COUNT(*) FROM sync_logs WHERE synced_at > NOW() - INTERVAL '24 hours') as sync_24h
        `);

        res.json({
            success: true,
            stats: stats.rows[0]
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/admin/migrate
 * Run database migration (schema.sql)
 */
app.post('/api/admin/migrate', async (req, res) => {
    const fs = require('fs');
    const path = require('path');

    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        await pool.query(schemaSql);

        // Verify tables created
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        res.json({
            success: true,
            message: 'Migration completed successfully',
            tables: result.rows.map(r => r.table_name)
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Dinas Central Server running on port ${PORT}`);
});

module.exports = app;
