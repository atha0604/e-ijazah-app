// src/controllers/optimized-dataController.js
// Optimized version dengan improved queries dan connection pooling

const fs = require('fs');
const path = require('path');
const OptimizedDatabase = require('../database/optimized-database');

// Helper untuk menangani error response
const handleError = (res, error, message = 'Terjadi kesalahan pada server') => {
    console.error('Database Error:', error.message);
    res.status(500).json({ success: false, message, error: error.message });
};

// ===== OPTIMIZED QUERIES =====

// Get all sekolah with pagination
exports.getAllSekolah = async (req, res) => {
    try {
        const { page = 1, limit = 50, kecamatan } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT kodeBiasa, kodePro, kecamatan, npsn,
                   namaSekolahLengkap, namaSekolahSingkat,
                   (SELECT COUNT(*) FROM siswa WHERE siswa.kodeBiasa = sekolah.kodeBiasa) as jumlahSiswa
            FROM sekolah
        `;

        const params = [];

        if (kecamatan) {
            sql += ' WHERE kecamatan = ?';
            params.push(kecamatan);
        }

        sql += ' ORDER BY namaSekolahLengkap LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        // Get total count for pagination
        let countSql = 'SELECT COUNT(*) as total FROM sekolah';
        const countParams = [];

        if (kecamatan) {
            countSql += ' WHERE kecamatan = ?';
            countParams.push(kecamatan);
        }

        const [sekolahRows, countResult] = await Promise.all([
            OptimizedDatabase.query(sql, params),
            OptimizedDatabase.get(countSql, countParams)
        ]);

        res.json({
            success: true,
            data: sekolahRows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(countResult.total / limit),
                totalRecords: countResult.total,
                hasNextPage: offset + sekolahRows.length < countResult.total,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        handleError(res, error, 'Gagal mengambil data sekolah');
    }
};

// Get siswa by sekolah dengan optimization
exports.getSiswaBySekolah = async (req, res) => {
    try {
        const { kodeBiasa } = req.query;
        const { page = 1, limit = 100, search } = req.query;

        if (!kodeBiasa) {
            return res.status(400).json({ success: false, message: 'kodeBiasa diperlukan' });
        }

        const offset = (page - 1) * limit;

        let sql = `
            SELECT nisn, kodeBiasa, namaSekolah, kecamatan, noUrut,
                   noInduk, noPeserta, namaPeserta, ttl, namaOrtu, noIjazah, foto
            FROM siswa
            WHERE kodeBiasa = ?
        `;

        const params = [kodeBiasa];

        // Add search functionality
        if (search) {
            sql += ` AND (namaPeserta LIKE ? OR nisn LIKE ? OR noInduk LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        sql += ' ORDER BY noUrut ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        // Count query for pagination
        let countSql = 'SELECT COUNT(*) as total FROM siswa WHERE kodeBiasa = ?';
        const countParams = [kodeBiasa];

        if (search) {
            countSql += ` AND (namaPeserta LIKE ? OR nisn LIKE ? OR noInduk LIKE ?)`;
            const searchParam = `%${search}%`;
            countParams.push(searchParam, searchParam, searchParam);
        }

        const [siswaRows, countResult] = await Promise.all([
            OptimizedDatabase.query(sql, params),
            OptimizedDatabase.get(countSql, countParams)
        ]);

        res.json({
            success: true,
            data: siswaRows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(countResult.total / limit),
                totalRecords: countResult.total,
                hasNextPage: offset + siswaRows.length < countResult.total,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        handleError(res, error, 'Gagal mengambil data siswa');
    }
};

// Get full data sekolah (optimized dengan join)
exports.getFullDataSekolah = async (req, res) => {
    try {
        const { kodeBiasa } = req.params;

        if (!kodeBiasa) {
            return res.status(400).json({ success: false, message: 'kodeBiasa diperlukan' });
        }

        // Use parallel queries for better performance
        const [sekolahData, siswaData, settingsData, mulokData] = await Promise.all([
            // Get sekolah info
            OptimizedDatabase.get('SELECT * FROM sekolah WHERE kodeBiasa = ?', [kodeBiasa]),

            // Get siswa with optimized query
            OptimizedDatabase.query(`
                SELECT nisn, kodeBiasa, namaSekolah, kecamatan, noUrut,
                       noInduk, noPeserta, namaPeserta, ttl, namaOrtu, noIjazah, foto
                FROM siswa
                WHERE kodeBiasa = ?
                ORDER BY noUrut ASC
            `, [kodeBiasa]),

            // Get settings
            OptimizedDatabase.get('SELECT settings_json FROM settings WHERE kodeBiasa = ?', [kodeBiasa]),

            // Get mulok names
            OptimizedDatabase.query('SELECT mulok_key, mulok_name FROM mulok_names WHERE kodeBiasa = ?', [kodeBiasa])
        ]);

        if (!sekolahData) {
            return res.status(404).json({ success: false, message: 'Sekolah tidak ditemukan' });
        }

        // Get nilai for all siswa (optimized with IN clause)
        const nisns = siswaData.map(s => s.nisn);
        let nilaiData = [];

        if (nisns.length > 0) {
            const placeholders = nisns.map(() => '?').join(',');
            nilaiData = await OptimizedDatabase.query(`
                SELECT nisn, semester, subject, type, value
                FROM nilai
                WHERE nisn IN (${placeholders})
                ORDER BY nisn, semester, subject, type
            `, nisns);
        }

        // Transform nilai data ke format yang diharapkan
        const nilaiFormatted = {};
        nilaiData.forEach(row => {
            if (!nilaiFormatted[row.nisn]) nilaiFormatted[row.nisn] = {};
            if (!nilaiFormatted[row.nisn][row.semester]) nilaiFormatted[row.nisn][row.semester] = {};
            if (!nilaiFormatted[row.nisn][row.semester][row.subject]) nilaiFormatted[row.nisn][row.semester][row.subject] = {};
            nilaiFormatted[row.nisn][row.semester][row.subject][row.type] = row.value;
        });

        // Transform mulok data
        const mulokFormatted = {};
        mulokData.forEach(row => {
            mulokFormatted[row.mulok_key] = row.mulok_name;
        });

        const response = {
            success: true,
            data: {
                sekolah: [sekolahData.kodeBiasa, sekolahData.kodePro, sekolahData.kecamatan,
                         sekolahData.npsn, sekolahData.namaSekolahLengkap, sekolahData.namaSekolahSingkat],
                siswa: siswaData.map(row => [row.kodeBiasa, row.kodePro, row.namaSekolah, row.kecamatan,
                                           row.noUrut, row.noInduk, row.noPeserta, row.nisn, row.namaPeserta,
                                           row.ttl, row.namaOrtu, row.noIjazah, row.foto]),
                nilai: {
                    ...nilaiFormatted,
                    _mulokNames: { [kodeBiasa]: mulokFormatted }
                },
                settings: { [kodeBiasa]: JSON.parse(settingsData?.settings_json || '{}') }
            }
        };

        res.json(response);
    } catch (error) {
        handleError(res, error, 'Gagal mengambil data lengkap sekolah');
    }
};

// Get semua kecamatan (untuk filter admin)
exports.getAllKecamatan = async (req, res) => {
    try {
        const sql = `
            SELECT kecamatan,
                   COUNT(*) as jumlahSekolah,
                   SUM((SELECT COUNT(*) FROM siswa WHERE siswa.kodeBiasa = sekolah.kodeBiasa)) as jumlahSiswa
            FROM sekolah
            GROUP BY kecamatan
            ORDER BY kecamatan
        `;

        const kecamatanData = await OptimizedDatabase.query(sql);

        res.json({
            success: true,
            data: kecamatanData
        });
    } catch (error) {
        handleError(res, error, 'Gagal mengambil data kecamatan');
    }
};

// Get sekolah by kecamatan (untuk filter admin)
exports.getSekolahByKecamatan = async (req, res) => {
    try {
        const { kecamatan } = req.params;

        if (!kecamatan) {
            return res.status(400).json({ success: false, message: 'kecamatan diperlukan' });
        }

        const sekolahData = await OptimizedDatabase.getSekolahByKecamatan(kecamatan);

        res.json({
            success: true,
            data: sekolahData
        });
    } catch (error) {
        handleError(res, error, 'Gagal mengambil data sekolah berdasarkan kecamatan');
    }
};

// Bulk save grades (optimized dengan prepared statements)
exports.saveBulkGrades = async (req, res) => {
    try {
        const { grades } = req.body;

        if (!grades || !Array.isArray(grades)) {
            return res.status(400).json({ success: false, message: 'Data grades tidak valid' });
        }

        // Transform data ke format yang dibutuhkan
        const nilaiData = grades.map(grade => ({
            nisn: grade.nisn,
            semester: grade.semester,
            subject: grade.subject,
            type: grade.type,
            value: grade.value
        }));

        await OptimizedDatabase.bulkInsertNilai(nilaiData);

        res.json({
            success: true,
            message: `${nilaiData.length} nilai berhasil disimpan`,
            count: nilaiData.length
        });
    } catch (error) {
        handleError(res, error, 'Gagal menyimpan bulk grades');
    }
};

// Performance monitoring endpoint
exports.getPerformanceStats = async (req, res) => {
    try {
        const poolStats = OptimizedDatabase.getPoolStats();

        // Get database size
        const dbStats = await OptimizedDatabase.get(`
            SELECT
                page_count * page_size as size_bytes,
                page_count,
                page_size
            FROM pragma_page_count(), pragma_page_size()
        `);

        // Get table statistics
        const tableStats = await OptimizedDatabase.query(`
            SELECT
                name as table_name,
                (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as index_count
            FROM sqlite_master m
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);

        res.json({
            success: true,
            data: {
                connectionPool: poolStats,
                database: {
                    sizeBytes: dbStats.size_bytes,
                    sizeMB: Math.round(dbStats.size_bytes / 1024 / 1024 * 100) / 100,
                    pageCount: dbStats.page_count,
                    pageSize: dbStats.page_size
                },
                tables: tableStats
            }
        });
    } catch (error) {
        handleError(res, error, 'Gagal mengambil statistik performa');
    }
};

// ===== EXPORTS LEGACY FUNCTIONS (untuk backward compatibility) =====

// Fallback functions yang masih menggunakan cara lama
const legacyDataController = require('./dataController');

// Export semua fungsi legacy
Object.keys(legacyDataController).forEach(key => {
    if (!exports[key]) {
        exports[key] = legacyDataController[key];
    }
});

// Override dengan versi optimized
exports.getAllSekolah = exports.getAllSekolah;
exports.getSiswaBySekolah = exports.getSiswaBySekolah;
exports.getFullDataSekolah = exports.getFullDataSekolah;
exports.getAllKecamatan = exports.getAllKecamatan;
exports.getSekolahByKecamatan = exports.getSekolahByKecamatan;
exports.saveBulkGrades = exports.saveBulkGrades;
exports.getPerformanceStats = exports.getPerformanceStats;