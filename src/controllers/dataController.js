
// src/controllers/dataController.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { createSystemNotification } = require('../utils/notificationHelper');
const { logDataChange, logUserAction } = require('../utils/auditLogger');
const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

const getDbConnection = () => {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Gagal koneksi ke database:', err.message);
  });
  db.run('PRAGMA foreign_keys = ON');
  return db;
};

// Helper untuk menjalankan query SELECT (mengembalikan banyak baris)
const queryAll = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

// Helper untuk menjalankan query INSERT, UPDATE, DELETE
const run = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this); // 'this' berisi info seperti lastID, changes
    });
});

// Helper untuk menjalankan operasi dalam transaction
const withTransaction = async (operation) => {
    const db = getDbConnection();
    try {
        await run(db, 'BEGIN TRANSACTION');
        const result = await operation(db);
        await run(db, 'COMMIT');
        return result;
    } catch (error) {
        await run(db, 'ROLLBACK');
        throw error;
    } finally {
        db.close();
    }
};

// Search sekolah dengan pagination dan filter
exports.searchSekolah = async (req, res) => {
    console.log('🔍 Search Sekolah endpoint called with query:', req.query);
    const db = getDbConnection();
    try {
        const {
            q: searchTerm = '',
            page = 1,
            limit = 20,
            kecamatan = '',
            sortBy = 'nama_lengkap',
            sortOrder = 'ASC'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build search conditions
        let whereConditions = [];
        let queryParams = [];

        if (searchTerm) {
            whereConditions.push(`(
                kode_biasa LIKE ? OR
                kode_pro LIKE ? OR
                npsn LIKE ? OR
                nama_lengkap LIKE ? OR
                nama_singkat LIKE ?
            )`);
            const searchParam = `%${searchTerm}%`;
            queryParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
        }

        if (kecamatan) {
            whereConditions.push('kecamatan = ?');
            queryParams.push(kecamatan);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['kode_biasa', 'kode_pro', 'kecamatan', 'npsn', 'nama_lengkap', 'nama_singkat'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'nama_lengkap';
        const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // Main search query with pagination
        const searchQuery = `
            SELECT
                kode_biasa,
                kode_pro,
                kecamatan,
                npsn,
                nama_lengkap,
                nama_singkat,
                (SELECT COUNT(*) FROM siswa WHERE siswa.kode_biasa = sekolah.kode_biasa) as jumlahSiswa
            FROM sekolah
            ${whereClause}
            ORDER BY ${validSortBy} ${validSortOrder}
            LIMIT ? OFFSET ?
        `;

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM sekolah
            ${whereClause}
        `;

        // Execute both queries
        const [results, countResult] = await Promise.all([
            queryAll(db, searchQuery, [...queryParams, parseInt(limit), offset]),
            queryAll(db, countQuery, queryParams)
        ]);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / parseInt(limit));

        // Get unique kecamatan for filter options
        const kecamatanQuery = 'SELECT DISTINCT kecamatan FROM sekolah ORDER BY kecamatan';
        const kecamatanList = await queryAll(db, kecamatanQuery);

        res.json({
            success: true,
            data: {
                sekolah: results,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalRecords: total,
                    recordsPerPage: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                },
                filters: {
                    kecamatanOptions: kecamatanList.map(item => item.kecamatan),
                    appliedFilters: {
                        searchTerm,
                        kecamatan,
                        sortBy: validSortBy,
                        sortOrder: validSortOrder
                    }
                }
            }
        });

    } catch (error) {
        console.error('Search Sekolah error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal melakukan pencarian sekolah.',
            error: error.message
        });
    } finally {
        db.close();
    }
};

// Mengambil semua data dari berbagai tabel
exports.getAllData = async (req, res) => {
    const db = getDbConnection();
    try {
        console.log(`📦 getAllData called - Reading from database...`);
        const [sekolahRows, siswaRows, nilaiRows, settingsRows, sklPhotosRows, mulokNamesRows] = await Promise.all([
            queryAll(db, 'SELECT * FROM sekolah'),
            queryAll(db, 'SELECT * FROM siswa'),
            queryAll(db, 'SELECT * FROM nilai'),
            queryAll(db, 'SELECT * FROM settings'),
            queryAll(db, 'SELECT * FROM skl_photos'),
            queryAll(db, 'SELECT * FROM mulok_names')
        ]);
        console.log(`📊 getAllData results: sekolah=${sekolahRows.length}, siswa=${siswaRows.length}, nilai=${nilaiRows.length}`);

        // Log sample nilai rows untuk debug - filter untuk semester 9 saja
        if (nilaiRows.length > 0) {
            const semester9Data = nilaiRows.filter(row => row.semester === '9');
            console.log(`📊 Total data semester 9 di database: ${semester9Data.length}`);
            if (semester9Data.length > 0) {
                console.log('📊 Sample 3 nilai semester 9 dari database:');
                semester9Data.slice(0, 3).forEach((row, i) => {
                    console.log(`  ${i+1}. NISN=${row.nisn}, Sem=${row.semester} (type: ${typeof row.semester}), Subject=${row.subject}, Type=${row.type}, Value=${row.value}`);
                });
            }
        }

        const finalDb = {
            sekolah: sekolahRows.map(row => [ row.kode_biasa, row.kode_pro, row.kecamatan, row.npsn, row.nama_lengkap, row.nama_singkat ]),
            // For siswa: exclude noPeserta from the array to match admin panel display expectations
            // Actual DB order: nisn, kode_biasa, kode_pro, namaSekolah, kecamatan, noUrut, noInduk, noPeserta, namaPeserta, ttl, namaOrtu, noIjazah, foto
            // Admin display order: kode_biasa, kode_pro, namaSekolah, kecamatan, noUrut, noInduk, nisn, namaPeserta, ttl, namaOrtu, noIjazah (skip noPeserta and foto)
            siswa: siswaRows.map(row => [
                row.kode_biasa,    // 0
                row.kode_pro,      // 1
                row.namaSekolah,  // 2
                row.kecamatan,    // 3
                row.noUrut,       // 4
                row.noInduk,      // 5
                row.nisn,         // 6
                row.namaPeserta,  // 7 (skip noPeserta)
                row.ttl,          // 8
                row.namaOrtu,     // 9
                row.noIjazah      // 10 (skip foto)
            ]),
            nilai: { _mulokNames: {} }, settings: {}, sklPhotos: {}
        };
        nilaiRows.forEach(row => {
            if (!finalDb.nilai[row.nisn]) finalDb.nilai[row.nisn] = {};
            if (!finalDb.nilai[row.nisn][row.semester]) finalDb.nilai[row.nisn][row.semester] = {};
            if (!finalDb.nilai[row.nisn][row.semester][row.subject]) finalDb.nilai[row.nisn][row.semester][row.subject] = {};
            finalDb.nilai[row.nisn][row.semester][row.subject][row.type] = row.value;
        });

        // Debug: Check if semester 9 data exists in finalDb after transformation
        const nisnsWithSem9 = Object.keys(finalDb.nilai).filter(nisn =>
            finalDb.nilai[nisn] && finalDb.nilai[nisn]['9']
        );
        console.log(`📊 Total NISN yang punya data semester 9 di finalDb: ${nisnsWithSem9.length}`);
        mulokNamesRows.forEach(row => {
            if (!finalDb.nilai._mulokNames[row.kode_biasa]) finalDb.nilai._mulokNames[row.kode_biasa] = {};
            finalDb.nilai._mulokNames[row.kode_biasa][row.mulok_key] = row.mulok_name;
        });
        settingsRows.forEach(row => {
            finalDb.settings[row.kode_biasa] = JSON.parse(row.settings_json || '{}');
        });
        sklPhotosRows.forEach(row => {
            finalDb.sklPhotos[row.nisn] = row.photo_data;
        });

        res.json({ success: true, data: finalDb });
    } catch (error) {
        console.error('Get All Data from SQLite error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data dari server.' });
    } finally {
        db.close();
    }
};

// Menyimpan (menambah atau mengedit) data sekolah
exports.saveSekolah = async (req, res) => {
    const { mode, sekolahData, originalKodeBiasa } = req.body;
    if (!mode || !sekolahData) return res.status(400).json({ success: false, message: 'Data yang dikirim tidak lengkap.' });

    const db = getDbConnection();
    try {
        if (mode === 'add') {
            const sql = `INSERT INTO sekolah (kode_biasa, kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat) VALUES (?, ?, ?, ?, ?, ?)`;
            await run(db, sql, sekolahData);
        } else { // mode 'edit'
            const [newKodeBiasa, kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat] = sekolahData;
            
            // Jika kode_biasa berubah, gunakan pendekatan INSERT-DELETE
            if (newKodeBiasa !== originalKodeBiasa) {
                console.log(`Updating kode_biasa from ${originalKodeBiasa} to ${newKodeBiasa}`);
                
                await run(db, 'BEGIN TRANSACTION');
                
                try {
                    // Cek apakah ada data duplicate dengan field lain sebelum insert
                    console.log('Checking for duplicate data before insert...');
                    const [_, kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat] = sekolahData;
                    
                    // Cek duplicate NPSN
                    if (npsn) {
                        const existingNpsn = await queryAll(db, 'SELECT kode_biasa FROM sekolah WHERE npsn = ? AND kode_biasa != ?', [npsn, originalKodeBiasa]);
                        if (existingNpsn.length > 0) {
                            throw new Error(`NPSN "${npsn}" sudah digunakan oleh sekolah dengan kode: ${existingNpsn[0].kode_biasa}`);
                        }
                    }
                    
                    // Cek duplicate nama sekolah lengkap
                    if (nama_lengkap) {
                        const existingNama = await queryAll(db, 'SELECT kode_biasa FROM sekolah WHERE nama_lengkap = ? AND kode_biasa != ?', [nama_lengkap, originalKodeBiasa]);
                        if (existingNama.length > 0) {
                            throw new Error(`Nama sekolah lengkap "${nama_lengkap}" sudah digunakan oleh sekolah dengan kode: ${existingNama[0].kode_biasa}`);
                        }
                    }
                    
                    // 1. Insert data sekolah baru
                    await run(db, `INSERT INTO sekolah (kode_biasa, kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat) VALUES (?, ?, ?, ?, ?, ?)`, 
                        sekolahData);
                    
                    // 2. Update semua referensi foreign key
                    await run(db, `UPDATE siswa SET kode_biasa = ? WHERE kode_biasa = ?`, [newKodeBiasa, originalKodeBiasa]);
                    await run(db, `UPDATE settings SET kode_biasa = ? WHERE kode_biasa = ?`, [newKodeBiasa, originalKodeBiasa]);
                    
                    try {
                        await run(db, `UPDATE mulok_names SET kode_biasa = ? WHERE kode_biasa = ?`, [newKodeBiasa, originalKodeBiasa]);
                    } catch (mulokError) {
                        console.log('mulok_names table might not exist, skipping...');
                    }
                    
                    // 3. Hapus data sekolah lama
                    await run(db, `DELETE FROM sekolah WHERE kode_biasa = ?`, [originalKodeBiasa]);
                    
                    await run(db, 'COMMIT');
                } catch (error) {
                    await run(db, 'ROLLBACK');
                    throw error;
                }
            } else {
                // Jika kode_biasa tidak berubah, update biasa saja
                console.log('Updating sekolah without changing kode_biasa...');
                console.log('Data to update:', [kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat, originalKodeBiasa]);
                
                // Cek duplicate data sebelum update
                if (npsn) {
                    const existingNpsn = await queryAll(db, 'SELECT kode_biasa FROM sekolah WHERE npsn = ? AND kode_biasa != ?', [npsn, originalKodeBiasa]);
                    if (existingNpsn.length > 0) {
                        throw new Error(`NPSN "${npsn}" sudah digunakan oleh sekolah lain dengan kode: ${existingNpsn[0].kode_biasa}`);
                    }
                }
                
                if (nama_lengkap) {
                    const existingNama = await queryAll(db, 'SELECT kode_biasa FROM sekolah WHERE nama_lengkap = ? AND kode_biasa != ?', [nama_lengkap, originalKodeBiasa]);
                    if (existingNama.length > 0) {
                        throw new Error(`Nama sekolah "${nama_lengkap}" sudah digunakan oleh sekolah lain dengan kode: ${existingNama[0].kode_biasa}`);
                    }
                }
                
                const sql = `UPDATE sekolah SET kode_pro = ?, kecamatan = ?, npsn = ?, nama_lengkap = ?, nama_singkat = ? WHERE kode_biasa = ?`;
                await run(db, sql, [kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat, originalKodeBiasa]);
            }
        }
        res.json({ success: true, message: `Data sekolah berhasil di${mode === 'add' ? 'tambahkan' : 'perbarui'}.` });
    } catch (error) {
        console.error('Save Sekolah error:', error.message);
        res.status(500).json({ success: false, message: 'Gagal menyimpan data sekolah: ' + error.message });
    } finally {
        db.close();
    }
};

// Menyimpan satu data nilai
exports.saveGrade = async (req, res) => {
    const { nisn, semester, subject, type, value } = req.body;
    if (nisn === undefined || semester === undefined || subject === undefined || type === undefined) {
        return res.status(400).json({ success: false, message: 'Data nilai tidak lengkap.' });
    }
    const db = getDbConnection();
    try {
        const sql = `INSERT OR REPLACE INTO nilai (nisn, semester, subject, type, value) VALUES (?, ?, ?, ?, ?)`;
        await run(db, sql, [nisn, semester, subject, type, value || '']);
        res.json({ success: true, message: 'Nilai tersimpan.' });
    } catch (error) {
        console.error('Save Grade error:', error.message);
        res.status(500).json({ success: false, message: 'Gagal menyimpan nilai.' });
    } finally {
        db.close();
    }
};

// Menyimpan banyak nilai sekaligus (bulk)
exports.saveBulkGrades = async (req, res) => {
    const gradesToSave = req.body;
    if (!gradesToSave || !Array.isArray(gradesToSave)) {
        return res.status(400).json({ success: false, message: 'Data yang dikirim tidak valid.' });
    }
    const db = getDbConnection();
    try {
        // Validate NISN exists in siswa table to prevent foreign key constraint errors
        const uniqueNisns = [...new Set(gradesToSave.map(g => g.nisn))];
        console.log(`📝 [SERVER] Total unique NISN di Excel: ${uniqueNisns.length}`);
        console.log(`📝 [SERVER] Sample NISN dari Excel:`, uniqueNisns.slice(0, 5));

        const existingNisns = await queryAll(db, `SELECT nisn FROM siswa WHERE nisn IN (${uniqueNisns.map(() => '?').join(',')})`, uniqueNisns);
        const existingNisnSet = new Set(existingNisns.map(row => row.nisn));

        console.log(`📝 [SERVER] Total NISN yang valid di database: ${existingNisnSet.size}`);

        const validGrades = [];
        const invalidGrades = [];

        for (const grade of gradesToSave) {
            if (existingNisnSet.has(grade.nisn)) {
                validGrades.push(grade);
            } else {
                invalidGrades.push({
                    nisn: grade.nisn,
                    reason: `NISN ${grade.nisn} tidak ditemukan dalam tabel siswa`
                });
            }
        }

        if (invalidGrades.length > 0) {
            console.warn(`⚠️ [SERVER] ${invalidGrades.length} NISN tidak valid (tidak ada di database siswa):`);
            invalidGrades.slice(0, 5).forEach(inv => {
                console.warn(`  - NISN: ${inv.nisn} → ${inv.reason}`);
            });
        }

        if (validGrades.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada NISN yang valid ditemukan. Pastikan data siswa sudah diimpor terlebih dahulu.',
                invalidGrades: invalidGrades
            });
        }

        // Log sample data untuk debug
        console.log('📝 [SERVER] Sample 3 data yang akan disimpan:');
        validGrades.slice(0, 3).forEach((g, i) => {
            console.log(`  ${i+1}.`, JSON.stringify(g));
        });

        await run(db, "BEGIN TRANSACTION");
        const stmt = db.prepare("INSERT OR REPLACE INTO nilai (nisn, semester, subject, type, value) VALUES (?, ?, ?, ?, ?)");
        let savedCount = 0;

        for (const grade of validGrades) {
            try {
                stmt.run(grade.nisn, grade.semester, grade.subject, grade.type, grade.value || '');
                savedCount++;
            } catch (gradeError) {
                console.warn(`Failed to save grade for NISN ${grade.nisn}:`, gradeError.message);
            }
        }

        stmt.finalize();
        await run(db, "COMMIT");
        console.log(`✅ [SERVER] COMMIT berhasil - ${savedCount} nilai tersimpan`);

        // VERIFY: Langsung query data yang baru disimpan
        const verifyNisn = validGrades[0].nisn;
        const verifySemester = validGrades[0].semester;
        const verifyData = await queryAll(db,
            'SELECT nisn, semester, subject, type, value FROM nilai WHERE nisn = ? AND semester = ? LIMIT 3',
            [verifyNisn, verifySemester]
        );
        console.log(`🔍 [SERVER] VERIFY data yang baru disimpan untuk NISN=${verifyNisn}, Semester=${verifySemester}:`);
        verifyData.forEach((row, i) => {
            console.log(`  ${i+1}. NISN=${row.nisn}, Sem=${row.semester} (type: ${typeof row.semester}), Subject=${row.subject}, Type=${row.type}, Value=${row.value}`);
        });

        let message = `Berhasil menyimpan ${savedCount} data nilai.`;
        if (invalidGrades.length > 0) {
            message += ` ${invalidGrades.length} data dilewati karena NISN tidak valid.`;
        }

        res.json({
            success: true,
            message: message,
            savedCount: savedCount,
            totalRequested: gradesToSave.length,
            invalidGrades: invalidGrades.length > 0 ? invalidGrades : undefined
        });
    } catch (error) {
        try {
            await run(db, "ROLLBACK");
        } catch (rollbackError) {
            console.error('Rollback error in saveBulkGrades:', rollbackError);
        }
        console.error('Save Bulk Grades error:', error);
        res.status(500).json({
            success: false,
            message: `Gagal menyimpan nilai bulk ke server: ${error.message}`,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        db.close();
    }
};

// Memperbarui data siswa
exports.updateSiswa = async (req, res) => {
    const { nisn, updatedData } = req.body;
    if (!nisn || !updatedData) return res.status(400).json({ success: false, message: 'Data update tidak lengkap.' });

    const db = getDbConnection();
    try {
        const fieldMap = {
            nis: 'noInduk', noPeserta: 'noPeserta', nisn: 'nisn',
            namaPeserta: 'namaPeserta', ttl: 'ttl', namaOrtu: 'namaOrtu',
            noIjazah: 'noIjazah', foto: 'foto'
        };

        const fieldsToUpdate = Object.keys(updatedData)
            .filter(key => fieldMap[key])
            .map(key => `${fieldMap[key]} = ?`);

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada field valid untuk diupdate.' });
        }

        const values = Object.keys(updatedData)
            .filter(key => fieldMap[key])
            .map(key => updatedData[key]);

        const sql = `UPDATE siswa SET ${fieldsToUpdate.join(', ')} WHERE nisn = ?`;
        await run(db, sql, [...values, nisn]);
        res.json({ success: true, message: 'Data siswa berhasil diperbarui.' });
    } catch (error) {
        console.error('Update Siswa error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui data siswa di server.' });
    } finally {
        db.close();
    }
};

// Menyimpan pengaturan
exports.saveSettings = async (req, res) => {
    const { schoolCode, settingsData, mulokNamesData } = req.body;
    if (!schoolCode) return res.status(400).json({ success: false, message: 'Kode sekolah tidak ada.' });

    const db = getDbConnection();
    try {
        await run(db, "BEGIN TRANSACTION");

        if (settingsData) {
            const existing = await queryAll(db, "SELECT settings_json FROM settings WHERE kode_biasa = ?", [schoolCode]);
            const existingSettings = existing.length > 0 ? JSON.parse(existing[0].settings_json) : {};
            const newSettings = { ...existingSettings, ...settingsData };
            await run(db, "INSERT OR REPLACE INTO settings (kode_biasa, settings_json) VALUES (?, ?)", [schoolCode, JSON.stringify(newSettings)]);
        }

        if (mulokNamesData) {
            for (const mulokKey in mulokNamesData) {
                await run(db, "INSERT OR REPLACE INTO mulok_names (kode_biasa, mulok_key, mulok_name) VALUES (?, ?, ?)", [schoolCode, mulokKey, mulokNamesData[mulokKey]]);
            }
        }

        await run(db, "COMMIT");
        res.json({ success: true, message: 'Pengaturan berhasil disimpan.' });
    } catch (error) {
        await run(db, "ROLLBACK");
        console.error('Save Settings error:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan pengaturan.' });
    } finally {
        db.close();
    }
};

// Menyimpan foto SKL
exports.saveSklPhoto = async (req, res) => {
    const { nisn, photoData } = req.body;
    const db = getDbConnection();
    try {
        await run(db, "INSERT OR REPLACE INTO skl_photos (nisn, photo_data) VALUES (?, ?)", [nisn, photoData]);
        res.json({ success: true, message: 'Foto berhasil disimpan.' });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
    finally { db.close(); }
};

// Menghapus foto SKL
exports.deleteSklPhoto = async (req, res) => {
    const { nisn } = req.body;
    const db = getDbConnection();
    try {
        await run(db, "DELETE FROM skl_photos WHERE nisn = ?", [nisn]);
        res.json({ success: true, message: 'Foto berhasil dihapus.' });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
    finally { db.close(); }
};

// Menghapus nilai berdasarkan semester
exports.deleteGradesBySemester = async (req, res) => {
    const { schoolCode, semesterId } = req.body;
    const db = getDbConnection();
    try {
        const siswa = await queryAll(db, "SELECT nisn FROM siswa WHERE kode_biasa = ?", [schoolCode]);
        if (siswa.length > 0) {
            const nisns = siswa.map(s => s.nisn);
            const placeholders = nisns.map(() => '?').join(',');
            await run(db, `DELETE FROM nilai WHERE semester = ? AND nisn IN (${placeholders})`, [semesterId, ...nisns]);
        }
        res.json({ success: true, message: 'Berhasil menghapus nilai semester.' });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
    finally { db.close(); }
};

// Mengimpor data dari payload (misal: Excel)
exports.importData = async (req, res) => {
  const { tableId } = req.params;
  const rows = req.body;

  if (!Array.isArray(rows)) {
    return res.status(400).json({ success: false, message: 'Payload harus berupa array-of-arrays.' });
  }

  const db = getDbConnection();


  const norm = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'string') {
      const t = v.trim();
      return t === '' || t.toUpperCase() === 'NULL' ? null : t;
    }
    return v;
  };

  try {
    await run(db,'PRAGMA foreign_keys = ON');
    await run(db,'BEGIN TRANSACTION');

    if (tableId === 'sekolah') {
      let inserted = 0, failed = [];
      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx] || [];
        const vals = [ norm(r[0]), norm(r[1]), norm(r[2]), norm(r[3]), norm(r[4]), norm(r[5]) ];
        try {
          await run(db,`INSERT OR REPLACE INTO sekolah (kode_biasa, kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat) VALUES (?, ?, ?, ?, ?, ?)`, vals);
          inserted++;
        } catch (e) {
          failed.push({ rowIndex: idx + 1, reason: e.message, row: r });
        }
      }
      await run(db,'COMMIT');
      return res.json({ success: true, message: `Import sekolah selesai.`, inserted, failedCount: failed.length, failed });
    }

    if (tableId === 'siswa') {
      const sekolahCodes = new Set((await queryAll(db,'SELECT kode_biasa FROM sekolah')).map((x) => String(x.kode_biasa)));
      let inserted = 0, skipped = [], failed = [];
      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx] || [];

        // Enhanced mapping to handle more columns and ensure we capture all data
        // Support up to 15 columns to accommodate various Excel formats
        const raw = [];
        for (let i = 0; i < Math.max(15, r.length); i++) {
          raw[i] = r[i];
        }

        const vals = raw.map(norm);

        // Core validation fields based on Excel structure
        // Excel header: KODE BIASA, KODE PRO, NAMA SEKOLAH, KECAMATAN, NO, NO INDUK, NISN, NAMA PESERTA, TEMPAT DAN TANGGAL LAHIR, NAMA ORANG TUA, NO IJAZAH
        // Index:           0,       1,           2,           3,       4,     5,      6,       7,             8,                     9,            10

        const kode_biasa = vals[0] ? String(vals[0]) : null;
        const nisn = vals[6] ? String(vals[6]) : null;  // NISN is at index 6 in Excel

        if (!kode_biasa || !nisn) {
          skipped.push({ rowIndex: idx + 1, reason: 'kode_biasa/nisn kosong', row: r });
          continue;
        }
        if (!sekolahCodes.has(kode_biasa)) {
          skipped.push({ rowIndex: idx + 1, reason: `kode_biasa '${kode_biasa}' tidak ada di tabel sekolah`, row: r });
          continue;
        }

        // Parse noUrut as integer if possible
        if (vals[4] !== null && !Number.isNaN(Number(vals[4]))) {
          vals[4] = parseInt(vals[4], 10);
        }

        // Excel column mapping based on header:
        // KODE BIASA, KODE PRO, NAMA SEKOLAH, KECAMATAN, NO, NO INDUK, NISN, NAMA PESERTA, TEMPAT DAN TANGGAL LAHIR, NAMA ORANG TUA, NO IJAZAH
        // Index:  0,     1,        2,           3,       4,     5,      6,       7,             8,                     9,            10

        // Extract data according to Excel structure (using existing variables)
        const kode_pro = vals[1];        // KODE PRO
        const namaSekolah = vals[2];    // NAMA SEKOLAH
        const kecamatan = vals[3];      // KECAMATAN
        const noUrut = vals[4];         // NO
        const noInduk = vals[5];        // NO INDUK
        const excelNisn = vals[6];      // NISN (from Excel column 6)
        const namaPeserta = vals[7];    // NAMA PESERTA
        const ttl = vals[8];            // TEMPAT DAN TANGGAL LAHIR
        const namaOrtu = vals[9];       // NAMA ORANG TUA
        const noIjazah = vals[10];      // NO IJAZAH

        // Database column order: kode_biasa, kode_pro, namaSekolah, kecamatan, noUrut, noInduk, noPeserta, nisn, namaPeserta, ttl, namaOrtu, noIjazah
        const insertVals = [
          kode_biasa,      // kode_biasa (already declared above)
          kode_pro,        // kode_pro
          namaSekolah,    // namaSekolah
          kecamatan,      // kecamatan
          noUrut,         // noUrut
          noInduk,        // noInduk
          '',             // noPeserta (empty, not in Excel)
          nisn,           // nisn (already declared above)
          namaPeserta,    // namaPeserta
          ttl,            // ttl
          namaOrtu,       // namaOrtu
          noIjazah        // noIjazah
        ];

        try {
          await run(db,`INSERT OR REPLACE INTO siswa (kode_biasa, kode_pro, namaSekolah, kecamatan, noUrut, noInduk, noPeserta, nisn, namaPeserta, ttl, namaOrtu, noIjazah) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, insertVals);
          inserted++;
        } catch (e) {
          failed.push({ rowIndex: idx + 1, reason: e.message, row: r, insertVals: insertVals });
        }
      }
      await run(db,'COMMIT');

      // DEBUG: Verify data was saved
      const savedCount = await queryAll(db, 'SELECT COUNT(*) as count FROM siswa');
      console.log(`✅ Import siswa committed. Total siswa in DB: ${savedCount[0].count}, Inserted: ${inserted}, Skipped: ${skipped.length}, Failed: ${failed.length}`);

      // Kirim notifikasi ke admin
      if (inserted > 0) {
        const firstRow = rows.find(r => r && r[0]);
        if (firstRow) {
            const kode_biasaSekolah = norm(firstRow[0]);
            try {
                const sekolah = await queryAll(db, 'SELECT nama_lengkap FROM sekolah WHERE kode_biasa = ?', [kode_biasaSekolah]);
                const namaSekolah = sekolah.length > 0 ? sekolah[0].nama_lengkap : `Sekolah (kode: ${kode_biasaSekolah})`;
                const message = `${namaSekolah} telah berhasil mengimpor ${inserted} data siswa.`;
                await createSystemNotification(message, 'admin', null, req.app.get('io'));
            } catch (notifError) {
                console.error('Gagal membuat notifikasi untuk impor siswa:', notifError);
            }
        }
      }

      return res.json({ success: true, message: 'Import siswa selesai.', inserted, skippedCount: skipped.length, failedCount: failed.length, skipped, failed });
    }

    await run(db,'ROLLBACK');
    return res.status(400).json({ success: false, message: `Import untuk '${tableId}' belum didukung.` });

  } catch (e) {
    try { await run(db,'ROLLBACK'); } catch (rollbackErr) { console.error("Rollback failed:", rollbackErr); }
    return res.status(500).json({ success: false, message: e.message });
  } finally {
    db.close();
  }
};

// Menghapus semua data untuk tabel tertentu ('sekolah' atau 'siswa')
exports.deleteAllData = async (req, res) => {
  const tableId = (req.body && req.body.tableId) || '';
  const db = getDbConnection();

  const getOne = (sql, params = []) => new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

  try {
    await run(db,'PRAGMA foreign_keys = ON');
    await run(db,'BEGIN TRANSACTION');

    if (tableId === 'sekolah') {
      // Hapus sekolah tanpa validasi siswa
      await run(db,'DELETE FROM sekolah');
      await run(db,'COMMIT');
      try { await run(db,`DELETE FROM sqlite_sequence WHERE name IN ('sekolah')`); } catch (err) { console.error('Failed to cleanup sqlite_sequence for sekolah:', err); }
      try { await run(db,'VACUUM'); } catch (err) { console.error('Failed to VACUUM after deleting sekolah:', err); }
      return res.json({ success: true, message: 'Semua data SEKOLAH telah dihapus.' });
    }

    if (tableId === 'siswa') {
      const rn = await getOne('SELECT COUNT(1) AS c FROM nilai');
      const rp = await getOne('SELECT COUNT(1) AS c FROM skl_photos');
      if ((rn?.c || 0) > 0 || (rp?.c || 0) > 0) {
        await run(db,'ROLLBACK');
        return res.status(409).json({ success: false, message: 'Tidak dapat menghapus semua SISWA karena masih ada data NILAI atau FOTO terkait. Hapus nilai/foto terlebih dahulu.' });
      }
      await run(db,'DELETE FROM siswa');
      await run(db,'COMMIT');
      try { await run(db,`DELETE FROM sqlite_sequence WHERE name IN ('siswa')`); } catch (err) { console.error('Failed to cleanup sqlite_sequence for siswa:', err); }
      try { await run(db,'VACUUM'); } catch (err) { console.error('Failed to VACUUM after deleting siswa:', err); }
      return res.json({ success: true, message: 'Semua data SISWA telah dihapus. Data SEKOLAH tetap ada.' });
    }

    await run(db,'ROLLBACK');
    return res.status(400).json({ success: false, message: "Parameter 'tableId' harus 'sekolah' atau 'siswa'." });
  } catch (e) {
    try { await run(db,'ROLLBACK'); } catch (err) { console.error('Failed to rollback transaction in deleteAllData:', err); }
    return res.status(500).json({ success: false, message: e.message || 'Terjadi kesalahan pada server.' });
  } finally {
    db.close();
  }
};

// Memulihkan (restore) data dari backup JSON
exports.restoreData = async (req, res) => {
  const db = getDbConnection();
  try {
    const payload = req.body || {};
    const data = payload.data ? payload.data : payload;
    
    console.log('Restore data keys:', Object.keys(data));
    
    // Handle new backup format - directly use properties from backup
    const sekolahData = data.siswa ? data.siswa.filter(s => s && s.length >= 6) : [];
    const siswaData = data.siswa || [];
    const nilaiData = data.nilai || {};
    const settingsData = data.settings || {};
    const sklPhotosData = data.sklPhotos || {};
    const mulokNamesData = data.mulokNames || {};

    await run(db, 'PRAGMA foreign_keys = OFF'); // Disable during restore
    await run(db, 'BEGIN TRANSACTION');

    // Clean existing data for the school being restored
    const schoolCode = data.schoolCode;
    if (schoolCode) {
      console.log('Cleaning data for school:', schoolCode);
      // Only clean data for specific school
      await run(db, `DELETE FROM nilai WHERE nisn IN (SELECT nisn FROM siswa WHERE kode_biasa = ?)`, [schoolCode]);
      await run(db, `DELETE FROM skl_photos WHERE nisn IN (SELECT nisn FROM siswa WHERE kode_biasa = ?)`, [schoolCode]);
      await run(db, `DELETE FROM siswa WHERE kode_biasa = ?`, [schoolCode]);
      await run(db, `DELETE FROM settings WHERE kode_biasa = ?`, [schoolCode]);
      await run(db, `DELETE FROM mulok_names WHERE kode_biasa = ?`, [schoolCode]);
      // Only delete sekolah if no other data depends on it
      const otherSiswa = await queryAll(db, `SELECT COUNT(*) as count FROM siswa WHERE kode_biasa = ?`, [schoolCode]);
      if (otherSiswa[0].count === 0) {
        await run(db, `DELETE FROM sekolah WHERE kode_biasa = ?`, [schoolCode]);
      }
    }

    // Insert sekolah data (extract from siswa data)
    if (siswaData.length > 0) {
      const sekolahInfo = siswaData[0]; // Get school info from first student
      if (sekolahInfo && sekolahInfo.length >= 4) {
        console.log('Inserting sekolah data:', sekolahInfo[0]);

        // Preserve existing NPSN if already set in DB
        const existing = await queryAll(db, 'SELECT npsn FROM sekolah WHERE kode_biasa = ? LIMIT 1', [sekolahInfo[0]]);
        const existingNpsn = (existing && existing[0] && existing[0].npsn) ? existing[0].npsn : '';

        const stmtSekolah = db.prepare(`INSERT OR REPLACE INTO sekolah (kode_biasa, kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat) VALUES (?, ?, ?, ?, ?, ?)`);
        // Use existing NPSN if present to avoid wiping it during restore
        stmtSekolah.run(
          sekolahInfo[0], // kode_biasa
          sekolahInfo[1], // kode_pro  
          sekolahInfo[3], // kecamatan
          existingNpsn, // keep current NPSN if available
          data.schoolName || sekolahInfo[2] || 'Unknown School', // nama_lengkap
          data.schoolName || sekolahInfo[2] || 'Unknown School'  // nama_singkat
        );
        stmtSekolah.finalize();
      }
    }

    // Insert siswa data
    if (siswaData.length) {
      console.log('Inserting siswa data:', siswaData.length, 'records');
      const stmtSiswa = db.prepare(`INSERT OR REPLACE INTO siswa (kode_biasa, kode_pro, namaSekolah, kecamatan, noUrut, noInduk, noPeserta, nisn, namaPeserta, ttl, namaOrtu, noIjazah, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const r of siswaData) { 
        if (r && r.length >= 8) {
          // Ensure we have at least 13 elements (0-12) for foto column
          const foto = r.length > 12 ? r[12] : null;
          stmtSiswa.run(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], foto); 
        }
      }
      stmtSiswa.finalize();
    }

    // Insert nilai data  
    if (nilaiData && typeof nilaiData === 'object') {
      console.log('Inserting nilai data for', Object.keys(nilaiData).length, 'students');
      const stmtNilai = db.prepare(`INSERT OR REPLACE INTO nilai (nisn, semester, subject, type, value) VALUES (?, ?, ?, ?, ?)`);
      let insertCount = 0;
      for (const nisn of Object.keys(nilaiData)) {
        if (nisn === '_mulokNames') continue; // Skip mulok names
        const studentData = nilaiData[nisn];
        for (const semester of Object.keys(studentData)) {
          const semesterData = studentData[semester];
          for (const subject of Object.keys(semesterData)) {
            const subjectData = semesterData[subject];
            for (const type of Object.keys(subjectData)) {
              const value = subjectData[type];
              if (value !== undefined) {
                stmtNilai.run(nisn, semester, subject, type, value || '');
                insertCount++;
              }
            }
          }
        }
      }
      stmtNilai.finalize();
      console.log('Successfully inserted', insertCount, 'nilai records');
    }

    // Insert SKL photos data
    if (sklPhotosData && typeof sklPhotosData === 'object') {
      console.log('Inserting SKL photos for', Object.keys(sklPhotosData).length, 'students');
      const stmtPhoto = db.prepare(`INSERT OR REPLACE INTO skl_photos (nisn, photo_data) VALUES (?, ?)`);
      for (const nisn of Object.keys(sklPhotosData)) {
        const photoData = sklPhotosData[nisn];
        if (photoData) {
          stmtPhoto.run(nisn, photoData);
        }
      }
      stmtPhoto.finalize();
    }
    
    // Insert settings data
    if (settingsData && typeof settingsData === 'object') {
      console.log('Inserting settings data');
      const stmtSet = db.prepare(`INSERT OR REPLACE INTO settings (kode_biasa, settings_json) VALUES (?, ?)`);
      if (schoolCode && Object.keys(settingsData).length > 0) {
        // If settings is direct object, use schoolCode as key
        stmtSet.run(schoolCode, JSON.stringify(settingsData));
      } else {
        // If settings has school codes as keys
        for (const kode_biasa of Object.keys(settingsData)) {
          const schoolSettings = settingsData[kode_biasa];
          if (schoolSettings && typeof schoolSettings === 'object') {
            stmtSet.run(kode_biasa, JSON.stringify(schoolSettings));
          }
        }
      }
      stmtSet.finalize();
    }

    // Insert mulok names data
    if (mulokNamesData && typeof mulokNamesData === 'object' && Object.keys(mulokNamesData).length > 0) {
      console.log('Inserting mulok names data');
      const stmtMulok = db.prepare(`INSERT OR REPLACE INTO mulok_names (kode_biasa, mulok_key, mulok_name) VALUES (?, ?, ?)`);
      for (const mulokKey of Object.keys(mulokNamesData)) {
        const mulokName = mulokNamesData[mulokKey];
        if (mulokName && schoolCode) {
          stmtMulok.run(schoolCode, mulokKey, mulokName);
        }
      }
      stmtMulok.finalize();
    }

    await run(db, 'PRAGMA foreign_keys = ON'); // Re-enable foreign keys
    await run(db, 'COMMIT');
    
    // Ensure database write is flushed to disk
    await run(db, 'PRAGMA wal_checkpoint(FULL)');
    
    console.log('Restore completed successfully');
    res.json({ success: true, message: 'Restore data berhasil.' });
  } catch (e) {
    console.error('Restore error:', e);
    try { 
      await run(db, 'PRAGMA foreign_keys = ON'); 
      await run(db, 'ROLLBACK'); 
    } catch (rollbackError) {
      console.error('Rollback error:', rollbackError);
    }
    res.status(500).json({ 
      success: false, 
      message: `Restore gagal: ${e.message}`,
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  } finally {
    db.close();
  }
};

// Mengambil semua data sekolah
exports.getAllSekolah = async (req, res) => {
    const db = getDbConnection();
    try {
        const sekolahRows = await queryAll(db, 'SELECT * FROM sekolah');
        const dataSekolah = sekolahRows.map(row => Object.values(row));
        res.json({ success: true, data: dataSekolah });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data sekolah.' });
    } finally {
        db.close();
    }
};

// Mengambil data siswa berdasarkan kode sekolah atau semua siswa (untuk admin)
exports.getSiswaBySekolah = async (req, res) => {
    const { kodeSekolah } = req.query;
    const db = getDbConnection();
    try {
        let siswaRows;
        if (kodeSekolah) {
            // Filter berdasarkan kode sekolah
            siswaRows = await queryAll(db, 'SELECT * FROM siswa WHERE kode_biasa = ?', [kodeSekolah]);
        } else {
            // Ambil semua siswa (untuk admin panel)
            siswaRows = await queryAll(db, 'SELECT * FROM siswa');
        }
        const dataSiswa = siswaRows.map(row => Object.values(row));
        res.json({ success: true, data: dataSiswa });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data siswa.' });
    } finally {
        db.close();
    }
};

// Mengambil data lengkap satu sekolah (termasuk siswa, nilai, dll)
exports.getFullDataSekolah = async (req, res) => {
    const { kode_biasa } = req.params;
    const db = getDbConnection();
    try {
        const [siswaRows, settingsRows, mulokNamesRows] = await Promise.all([
            queryAll(db, 'SELECT nisn FROM siswa WHERE kode_biasa = ?', [kode_biasa]),
            queryAll(db, 'SELECT * FROM settings WHERE kode_biasa = ?', [kode_biasa]),
            queryAll(db, 'SELECT * FROM mulok_names WHERE kode_biasa = ?', [kode_biasa])
        ]);

        const nisns = siswaRows.map(s => s.nisn);
        let nilaiRows = [], sklPhotosRows = [];

        if (nisns.length > 0) {
            const placeholders = nisns.map(() => '?').join(',');
            nilaiRows = await queryAll(db, `SELECT * FROM nilai WHERE nisn IN (${placeholders})`, nisns);
            sklPhotosRows = await queryAll(db, `SELECT * FROM skl_photos WHERE nisn IN (${placeholders})`, nisns);
        }

        const finalData = { nilai: { _mulokNames: {} }, settings: {}, sklPhotos: {} };
        nilaiRows.forEach(row => {
            if (!finalData.nilai[row.nisn]) finalData.nilai[row.nisn] = {};
            if (!finalData.nilai[row.nisn][row.semester]) finalData.nilai[row.nisn][row.semester] = {};
            if (!finalData.nilai[row.nisn][row.semester][row.subject]) finalData.nilai[row.nisn][row.semester][row.subject] = {};
            finalData.nilai[row.nisn][row.semester][row.subject][row.type] = row.value;
        });
        mulokNamesRows.forEach(row => {
            if (!finalData.nilai._mulokNames[row.kode_biasa]) finalData.nilai._mulokNames[row.kode_biasa] = {};
            finalData.nilai._mulokNames[row.kode_biasa][row.mulok_key] = row.mulok_name;
        });
        settingsRows.forEach(row => {
            finalData.settings[row.kode_biasa] = JSON.parse(row.settings_json || '{}');
        });
        sklPhotosRows.forEach(row => {
            finalData.sklPhotos[row.nisn] = row.photo_data;
        });

        res.json({ success: true, data: finalData });
    } catch (error) {
        console.error('Get Full Data Sekolah error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data lengkap sekolah.' });
    } finally {
        db.close();
    }
};

// Menambah sekolah baru
exports.addSekolah = async (req, res) => {
  const { sekolahData } = req.body;
  if (!sekolahData || sekolahData.length !== 6) {
    return res.status(400).json({ success: false, message: 'Payload sekolahData tidak valid.' });
  }
  const db = getDbConnection();
  try {
    const sql = `INSERT INTO sekolah (kode_biasa, kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat) VALUES (?, ?, ?, ?, ?, ?)`;
    await run(db, sql, sekolahData);
    res.json({ success: true, message: 'Sekolah berhasil ditambahkan.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  } finally { db.close(); }
};

// Memperbarui data sekolah
exports.updateSekolah = async (req, res) => {
  const { originalKodeBiasa, sekolahData } = req.body;
  if (!originalKodeBiasa || !sekolahData || sekolahData.length !== 6) {
    return res.status(400).json({ success: false, message: 'Payload tidak lengkap.' });
  }
  const db = getDbConnection();
  try {
    const sql = `UPDATE sekolah SET kode_biasa=?, kode_pro=?, kecamatan=?, npsn=?, nama_lengkap=?, nama_singkat=? WHERE kode_biasa=?`;
    await run(db, sql, [...sekolahData, originalKodeBiasa]);
    res.json({ success: true, message: 'Data sekolah berhasil diperbarui.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  } finally { db.close(); }
};

// Menghapus sekolah (dan data terkait via cascade)
exports.deleteSekolah = async (req, res) => {
  const { kode_biasa } = req.body;
  if (!kode_biasa) {
    return res.status(400).json({ success: false, message: 'Kode sekolah tidak ditemukan.' });
  }
  const db = getDbConnection();
  try {
    await run(db, 'PRAGMA foreign_keys = ON');
    const result = await run(db, 'DELETE FROM sekolah WHERE kode_biasa = ?', [kode_biasa]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Sekolah dengan kode tersebut tidak ditemukan.' });
    }
    return res.json({ success: true, message: 'Data sekolah dan semua data terkait berhasil dihapus.' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  } finally {
    db.close();
  }
};

// Menyimpan (menambah atau mengedit) data siswa
exports.saveSiswa = async (req, res) => {
    const { mode, siswaData, originalNisn } = req.body;
    if (!mode || !siswaData) return res.status(400).json({ success: false, message: 'Data yang dikirim tidak lengkap.' });

    const db = getDbConnection();
    try {
        // Get user info for audit logging
        const userType = req.headers['user-type'] || 'sekolah';
        const userIdentifier = req.headers['user-identifier'] || siswaData[0];
        if (mode === 'add') {
            // Validasi: cek apakah kode_biasa ada di tabel sekolah
            const existingSekolah = await queryAll(db, 'SELECT kode_biasa FROM sekolah WHERE kode_biasa = ?', [siswaData[0]]);
            if (existingSekolah.length === 0) {
                throw new Error(`Kode sekolah "${siswaData[0]}" tidak ditemukan. Pastikan sekolah sudah terdaftar terlebih dahulu.`);
            }

            // Validasi: cek apakah NISN sudah ada
            const existingNisn = await queryAll(db, 'SELECT nisn FROM siswa WHERE nisn = ?', [siswaData[7]]);
            if (existingNisn.length > 0) {
                throw new Error(`NISN "${siswaData[7]}" sudah digunakan oleh siswa lain.`);
            }

            // Validasi: cek apakah No Induk sudah ada di sekolah yang sama
            if (siswaData[5]) { // only check if noInduk is provided
                const existingNoInduk = await queryAll(db, 'SELECT noInduk FROM siswa WHERE kode_biasa = ? AND noInduk = ?', [siswaData[0], siswaData[5]]);
                if (existingNoInduk.length > 0) {
                    throw new Error(`No Induk "${siswaData[5]}" sudah digunakan di sekolah ini.`);
                }
            }

            const sql = `INSERT INTO siswa (kode_biasa, kode_pro, namaSekolah, kecamatan, noUrut, noInduk, noPeserta, nisn, namaPeserta, ttl, namaOrtu, noIjazah, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const result = await run(db, sql, [...siswaData, null]); // foto = null by default
            
            // Audit log for add siswa
            await logDataChange(
                userType,
                userIdentifier,
                'ADD_SISWA',
                'siswa',
                siswaData[7], // NISN as target ID
                null,
                {
                    nisn: siswaData[7],
                    namaPeserta: siswaData[8],
                    kode_biasa: siswaData[0]
                },
                { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
            );
        } else if (mode === 'edit') {
            // Validasi: cek apakah kode_biasa ada di tabel sekolah
            const existingSekolah = await queryAll(db, 'SELECT kode_biasa FROM sekolah WHERE kode_biasa = ?', [siswaData[0]]);
            if (existingSekolah.length === 0) {
                throw new Error(`Kode sekolah "${siswaData[0]}" tidak ditemukan.`);
            }

            // Get old data for audit log
            const oldData = await queryAll(db, 'SELECT * FROM siswa WHERE nisn = ?', [originalNisn]);
            
            // Update siswa
            const sql = `UPDATE siswa SET kode_biasa = ?, kode_pro = ?, namaSekolah = ?, kecamatan = ?, noUrut = ?, noInduk = ?, noPeserta = ?, nisn = ?, namaPeserta = ?, ttl = ?, namaOrtu = ?, noIjazah = ? WHERE nisn = ?`;
            const result = await run(db, sql, [...siswaData, originalNisn]);
            if (result.changes === 0) {
                throw new Error('Siswa dengan NISN tersebut tidak ditemukan.');
            }
            
            // Audit log for edit siswa
            await logDataChange(
                userType,
                userIdentifier,
                'EDIT_SISWA',
                'siswa',
                siswaData[7], // NISN as target ID
                oldData[0],
                {
                    nisn: siswaData[7],
                    namaPeserta: siswaData[8],
                    kode_biasa: siswaData[0]
                },
                { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
            );
        }
        res.json({ success: true, message: `Data siswa berhasil di${mode === 'add' ? 'tambahkan' : 'perbarui'}.` });
    } catch (error) {
        console.error('Save Siswa error:', error.message);
        res.status(500).json({ success: false, message: 'Gagal menyimpan data siswa: ' + error.message });
    } finally {
        db.close();
    }
};

// Menghapus siswa (dan data terkait)
exports.deleteSiswa = async (req, res) => {
    const { nisn } = req.body;
    if (!nisn) {
        return res.status(400).json({ success: false, message: "NISN diperlukan." });
    }
    const db = getDbConnection();
    try {
        await run(db, 'BEGIN TRANSACTION');
        await run(db, 'DELETE FROM nilai WHERE nisn = ?', [nisn]);
        await run(db, 'DELETE FROM skl_photos WHERE nisn = ?', [nisn]);
        const result = await run(db, 'DELETE FROM siswa WHERE nisn = ?', [nisn]);

        if (result.changes === 0) {
            throw new Error('Siswa dengan NISN tersebut tidak ditemukan.');
        }
        
        await run(db, 'COMMIT');
        res.json({ success: true, message: 'Siswa dan semua data terkait berhasil dihapus.' });
    } catch (error) {
        await run(db, 'ROLLBACK');
        console.error('Gagal menghapus siswa:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Gagal menghapus data siswa dari server.' });
    } finally {
        db.close();
    }
};

// Menghapus semua data sekolah (truncate)
exports.truncateSekolah = async (req, res) => {
  const db = getDbConnection();
  try {
    await run(db, 'PRAGMA foreign_keys = ON');
    await run(db, 'BEGIN TRANSACTION');
    await run(db, 'DELETE FROM nilai');
    await run(db, 'DELETE FROM skl_photos');
    await run(db, 'DELETE FROM siswa');
    await run(db, 'DELETE FROM sekolah');
    await run(db, 'COMMIT');
    try { await run(db, `DELETE FROM sqlite_sequence WHERE name IN ('nilai','skl_photos','siswa','sekolah')`); } catch (err) { console.error('Failed to cleanup sqlite_sequence for sekolah truncate:', err); }
    try { await run(db, 'VACUUM'); } catch (err) { console.error('Failed to VACUUM after truncating sekolah:', err); }
    return res.json({ success: true, message: 'Semua data SEKOLAH (beserta siswa, nilai, foto) telah dihapus.' });
  } catch (e) {
    try { await run(db, 'ROLLBACK'); } catch (err) { console.error('Failed to rollback transaction in truncateSekolah:', err); }
    return res.status(500).json({ success: false, message: e.message });
  } finally {
    db.close();
  }
};

// Menghapus semua data siswa (truncate)
exports.truncateSiswa = async (req, res) => {
  const db = getDbConnection();
  try {
    await run(db, 'PRAGMA foreign_keys = ON');
    await run(db, 'BEGIN TRANSACTION');
    await run(db, 'DELETE FROM nilai');
    await run(db, 'DELETE FROM skl_photos');
    await run(db, 'DELETE FROM siswa');
    await run(db, 'COMMIT');
    try { await run(db, `DELETE FROM sqlite_sequence WHERE name IN ('nilai','skl_photos','siswa')`); } catch (err) { console.error('Failed to cleanup sqlite_sequence for siswa truncate:', err); }
    try { await run(db, 'VACUUM'); } catch (err) { console.error('Failed to VACUUM after truncating siswa:', err); }
    return res.json({ success: true, message: 'Semua data SISWA (beserta nilai & foto) telah dihapus. Data sekolah tetap ada.' });
  } catch (e) {
    try { await run(db, 'ROLLBACK'); } catch (err) { console.error('Failed to rollback transaction in truncateSiswa:', err); }
    return res.status(500).json({ success: false, message: e.message });
  } finally {
    db.close();
  }
};

// Mengunduh file template
exports.downloadTemplate = async (req, res) => {
    try {
        const XLSX = require('xlsx');
        const path = require('path');
        const fs = require('fs');

        // Generate template dynamically instead of using static file
        const { semester, kurikulum, kodeSekolah } = req.query;

        if (!semester || !kurikulum) {
            return res.status(400).json({ success: false, message: 'Parameter semester dan kurikulum diperlukan.' });
        }

        // Use the existing template as base for Merdeka curriculum
        if (kurikulum === 'MERDEKA' || kurikulum === 'Merdeka') {
            const templatePath = path.join(__dirname, '../../template-base.xlsx');

            try {
                // Check if template file exists
                if (fs.existsSync(templatePath)) {
                    // Set headers for Excel download
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', `attachment; filename="Template-Nilai-Sem${semester}-${kurikulum}.xlsx"`);
                    res.setHeader('Cache-Control', 'no-cache');

                    // Create read stream and pipe to response
                    const fileStream = fs.createReadStream(templatePath);
                    fileStream.pipe(res);
                    return;
                } else {
                    console.log('Template file not found at:', templatePath);
                }

            } catch (fileError) {
                console.log('Error reading template file:', fileError.message);
                // Fall through to create new template
            }
        }

        // Create new workbook using XLSX (same library as frontend)
        const workbook = XLSX.utils.book_new();

        let headers;

        if (kurikulum === 'K13') {
            headers = ['NISN', 'NAMA', 'AGAMA_KI3', 'AGAMA_KI4', 'AGAMA_RT', 'PKN_KI3', 'PKN_KI4', 'PKN_RT', 'B.INDO_KI3', 'B.INDO_KI4', 'B.INDO_RT', 'MTK_KI3', 'MTK_KI4', 'MTK_RT', 'IPAS_KI3', 'IPAS_KI4', 'IPAS_RT', 'B.ING_KI3', 'B.ING_KI4', 'B.ING_RT', 'SBDP_KI3', 'SBDP_KI4', 'SBDP_RT', 'PJOK_KI3', 'PJOK_KI4', 'PJOK_RT', 'BAHASA_DAERAH_KI3', 'BAHASA_DAERAH_KI4', 'BAHASA_DAERAH_RT', 'MULOK1_KI3', 'MULOK1_KI4', 'MULOK1_RT', 'MULOK2_KI3', 'MULOK2_KI4', 'MULOK2_RT', 'MULOK3_KI3', 'MULOK3_KI4', 'MULOK3_RT'];
        } else {
            // Merdeka curriculum fallback
            headers = ['NISN', 'NAMA', 'AGAMA', 'PKN', 'B.INDO', 'MTK', 'IPAS', 'B.ING', 'SBDP', 'PJOK', 'MULOK1', 'MULOK2', 'MULOK3'];
        }

        // Get actual student data from database for the school
        const db = getDbConnection();
        let studentRows = [];

        if (kodeSekolah) {
            try {
                const rows = await queryAll(db, 'SELECT * FROM siswa WHERE kode_biasa = ? ORDER BY namaPeserta', [kodeSekolah]);
                studentRows = rows;
                console.log(`Found ${studentRows.length} students for school ${kodeSekolah}`);
            } catch (dbError) {
                console.error('Error fetching students:', dbError);
                studentRows = []; // Fallback to empty if database error
            }
        }

        // Create worksheet data starting with headers
        const worksheetData = [headers];

        // Add actual student data if available
        if (studentRows.length > 0) {
            studentRows.forEach(student => {
                const studentRow = [student.nisn || '', student.namaPeserta || ''];
                // Add empty values for grade columns to be filled by school
                for (let i = 2; i < headers.length; i++) {
                    studentRow.push(''); // Empty cells for grades
                }
                worksheetData.push(studentRow);
            });
        } else {
            // Fallback: add example row if no students found
            const exampleRow = ['0128593698', 'ACHMAD FAHRY SETIAWAN (CONTOH)'];
            for (let i = 2; i < headers.length; i++) {
                exampleRow.push(''); // Empty cells for grades
            }
            worksheetData.push(exampleRow);
        }

        // Create worksheet from array of arrays
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths (XLSX format)
        const columnWidths = [];
        columnWidths[0] = { wch: 15 }; // NISN
        columnWidths[1] = { wch: 20 }; // NAMA
        for (let i = 2; i < headers.length; i++) {
            columnWidths[i] = { wch: 10 }; // Grade columns
        }
        worksheet['!cols'] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Nilai');

        // Generate Excel buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Template-Nilai-Sem${semester}-${kurikulum}.xlsx"`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Length', buffer.length);

        // Send the Excel file
        res.send(buffer);

    } catch (error) {
        console.error('Download template error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengunduh template.' });
    }
};

// Mendapatkan semua kecamatan unik
exports.getAllKecamatan = async (req, res) => {
    const db = getDbConnection();
    try {
        const rows = await queryAll(db, 'SELECT DISTINCT kecamatan FROM sekolah WHERE kecamatan IS NOT NULL ORDER BY kecamatan');
        const kecamatanList = rows.map(row => row.kecamatan);
        res.json({ success: true, data: kecamatanList });
    } catch (error) {
        console.error('Get All Kecamatan error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data kecamatan.' });
    } finally {
        db.close();
    }
};

// Mendapatkan sekolah berdasarkan kecamatan
exports.getSekolahByKecamatan = async (req, res) => {
    const { kecamatan } = req.params;
    const db = getDbConnection();
    try {
        const rows = await queryAll(db, 'SELECT kode_biasa, nama_lengkap FROM sekolah WHERE kecamatan = ? ORDER BY nama_lengkap', [kecamatan]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Get Sekolah by Kecamatan error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data sekolah.' });
    } finally {
        db.close();
    }
};

// =================== BACKUP API ENDPOINTS ===================

// Simpan backup ke server
exports.saveBackup = async (req, res) => {
    const { type, data, timestamp, size } = req.body;
    const userToken = req.user; // dari middleware verifyToken

    if (!data || !type) {
        return res.status(400).json({
            success: false,
            message: 'Data backup dan type wajib diisi'
        });
    }

    const db = getDbConnection();
    try {
        // Cek apakah tabel backup sudah ada
        await run(db, `CREATE TABLE IF NOT EXISTS server_backups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            backup_id TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            size INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        const backupId = `backup_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await run(db,
            `INSERT INTO server_backups (backup_id, user_id, type, data, timestamp, size)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [backupId, userToken.userIdentifier || 'unknown', type, data, timestamp, size]
        );

        // Log action
        logUserAction(userToken.userIdentifier, 'BACKUP_SAVE', {
            backupId,
            type,
            size
        });

        res.json({
            success: true,
            message: 'Backup berhasil disimpan ke server',
            backupId: backupId,
            size: size
        });

    } catch (error) {
        console.error('Save backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menyimpan backup: ' + error.message
        });
    } finally {
        db.close();
    }
};

// Ambil daftar backup
exports.getBackupList = async (req, res) => {
    const userToken = req.user;
    const db = getDbConnection();

    try {
        // Pastikan tabel backup ada
        await run(db, `CREATE TABLE IF NOT EXISTS server_backups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            backup_id TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            size INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        const rows = await queryAll(db,
            `SELECT backup_id, type, timestamp, size, created_at
             FROM server_backups
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 50`,
            [userToken.userIdentifier || 'unknown']
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Get backup list error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar backup'
        });
    } finally {
        db.close();
    }
};

// Restore backup dari server
exports.restoreFromBackup = async (req, res) => {
    const { backupId } = req.params;
    const userToken = req.user;
    const db = getDbConnection();

    try {
        const backupRows = await queryAll(db,
            `SELECT data, type, timestamp FROM server_backups
             WHERE backup_id = ? AND user_id = ?`,
            [backupId, userToken.userIdentifier || 'unknown']
        );

        if (backupRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Backup tidak ditemukan'
            });
        }

        const backup = backupRows[0];

        // Log action
        logUserAction(userToken.userIdentifier, 'BACKUP_RESTORE', {
            backupId,
            type: backup.type
        });

        res.json({
            success: true,
            data: JSON.parse(backup.data),
            type: backup.type,
            timestamp: backup.timestamp
        });

    } catch (error) {
        console.error('Restore backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal restore backup'
        });
    } finally {
        db.close();
    }
};

// Hapus backup dari server
exports.deleteBackup = async (req, res) => {
    const { backupId } = req.params;
    const userToken = req.user;
    const db = getDbConnection();

    try {
        const result = await run(db,
            `DELETE FROM server_backups
             WHERE backup_id = ? AND user_id = ?`,
            [backupId, userToken.userIdentifier || 'unknown']
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Backup tidak ditemukan'
            });
        }

        // Log action
        logUserAction(userToken.userIdentifier, 'BACKUP_DELETE', { backupId });

        res.json({
            success: true,
            message: 'Backup berhasil dihapus'
        });

    } catch (error) {
        console.error('Delete backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus backup'
        });
    } finally {
        db.close();
    }
};

// Fungsi untuk menambah siswa baru (wrapper untuk saveSiswa dengan mode 'add')
exports.addSiswa = async (req, res) => {
    // Transform data dari format admin modal ke format saveSiswa
    const siswaData = [
        req.body.kode_biasa,
        req.body.kode_pro,
        req.body.namaSekolah,
        req.body.kecamatan,
        req.body.noUrut,
        req.body.noInduk,
        req.body.noPeserta,
        req.body.nisn,
        req.body.namaPeserta,
        req.body.ttl,
        req.body.namaOrtu,
        req.body.noIjazah,
        null // foto kosong untuk siswa baru
    ];

    // Buat request body yang sesuai dengan format saveSiswa
    const saveSiswaRequest = {
        ...req,
        body: {
            mode: 'add',
            siswaData: siswaData
        }
    };

    // Panggil fungsi saveSiswa yang sudah ada
    await exports.saveSiswa(saveSiswaRequest, res);
};

// Fungsi untuk update siswa dari admin modal (wrapper yang lebih lengkap)
exports.updateSiswaAdmin = async (req, res) => {
    const { originalNisn, ...formData } = req.body;

    if (!originalNisn) {
        return res.status(400).json({
            success: false,
            message: 'NISN original diperlukan untuk update.'
        });
    }

    const db = getDbConnection();
    try {
        // Update semua field sekaligus
        const sql = `UPDATE siswa SET
            kode_biasa = ?,
            kode_pro = ?,
            namaSekolah = ?,
            kecamatan = ?,
            noUrut = ?,
            noInduk = ?,
            noPeserta = ?,
            nisn = ?,
            namaPeserta = ?,
            ttl = ?,
            namaOrtu = ?,
            noIjazah = ?
            WHERE nisn = ?`;

        const params = [
            formData.kode_biasa,
            formData.kode_pro,
            formData.namaSekolah,
            formData.kecamatan,
            formData.noUrut,
            formData.noInduk,
            formData.noPeserta,
            formData.nisn,
            formData.namaPeserta,
            formData.ttl,
            formData.namaOrtu,
            formData.noIjazah,
            originalNisn
        ];

        const result = await run(db, sql, params);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Siswa dengan NISN tersebut tidak ditemukan.'
            });
        }

        res.json({
            success: true,
            message: 'Data siswa berhasil diperbarui.'
        });

    } catch (error) {
        console.error('Update Siswa Admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui data siswa: ' + error.message
        });
    } finally {
        db.close();
    }
};



// Change admin login code
exports.changeAdminCode = async (req, res) => {
    const { newLoginCode } = req.body;
    const userToken = req.user; // dari middleware verifyToken

    if (!newLoginCode || newLoginCode.trim().length < 3) {
        return res.status(400).json({
            success: false,
            message: "Kode login baru minimal 3 karakter."
        });
    }

    const cleanCode = newLoginCode.trim().toLowerCase();

    // Prevent using common school codes
    if (['admin', 'administrator', 'root', 'user', 'test'].includes(cleanCode)) {
        return res.status(400).json({
            success: false,
            message: "Kode login tidak boleh menggunakan kata umum."
        });
    }

    const db = getDbConnection();
    try {
        // Cek apakah tabel users ada, jika tidak buat dengan kolom login_code
        await run(db, `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            login_code TEXT NOT NULL DEFAULT "admin",
            role TEXT NOT NULL DEFAULT "admin",
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tambah kolom login_code jika belum ada
        try {
            await run(db, `ALTER TABLE users ADD COLUMN login_code TEXT NOT NULL DEFAULT "admin"`);
        } catch (alterError) {
            // Column might already exist, ignore error
        }

        // Ambil data user berdasarkan token
        const userIdentifier = userToken.userIdentifier || "admin";
        const users = await queryAll(db, "SELECT * FROM users WHERE username = ?", [userIdentifier]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User admin tidak ditemukan."
            });
        }

        const oldLoginCode = users[0].login_code;

        // Update login code di database
        await run(db,
            "UPDATE users SET login_code = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?",
            [cleanCode, userIdentifier]
        );

        // Log activity
        try {
            await logDataChange(
                'admin',
                userIdentifier,
                'CHANGE_ADMIN_CODE',
                'users',
                users[0].id,
                { login_code: oldLoginCode },
                { login_code: cleanCode },
                { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
            );
        } catch (logError) {
            console.error("Gagal mencatat perubahan kode login di audit log:", logError);
        }

        // JANGAN buat system notification - ini akan ditangani oleh client-side activity log
        // Komentar ini untuk mencegah duplikasi notification

        res.json({
            success: true,
            message: `Kode login berhasil diubah menjadi "${cleanCode}". Gunakan kode ini untuk login selanjutnya.`,
            newLoginCode: cleanCode
        });

    } catch (error) {
        console.error("Change admin code error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengubah kode login: " + error.message
        });
    } finally {
        db.close();
    }
};

// Get sekolah by kecamatan for popup display
exports.getSekolahByKecamatan = async (req, res) => {
    const { kecamatan } = req.params;

    if (!kecamatan) {
        return res.status(400).json({
            success: false,
            message: "Parameter kecamatan diperlukan"
        });
    }

    const db = getDbConnection();
    try {
        const sekolahList = await queryAll(db, `
            SELECT kode_biasa, nama_lengkap, npsn, kecamatan, nama_singkat
            FROM sekolah
            WHERE UPPER(TRIM(kecamatan)) = UPPER(TRIM(?))
            ORDER BY nama_lengkap ASC
        `, [kecamatan]);

        res.json({
            success: true,
            data: sekolahList,
            message: `Ditemukan ${sekolahList.length} sekolah di kecamatan ${kecamatan}`
        });

    } catch (error) {
        console.error("Get sekolah by kecamatan error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data sekolah: " + error.message
        });
    } finally {
        db.close();
    }
};

// Debug endpoint to check raw siswa data
exports.debugSiswaData = async (req, res) => {
    const { limit = 10 } = req.query;
    const db = getDbConnection();
    try {
        const siswaData = await queryAll(db, `
            SELECT kode_biasa, kode_pro, namaSekolah, kecamatan, noUrut, noInduk, noPeserta, nisn, namaPeserta, ttl, namaOrtu, noIjazah, foto
            FROM siswa
            ORDER BY kode_biasa, noUrut
            LIMIT ?
        `, [parseInt(limit)]);

        res.json({
            success: true,
            data: siswaData,
            message: `Debug data for ${siswaData.length} siswa records`,
            schema: {
                0: 'kode_biasa',
                1: 'kode_pro',
                2: 'namaSekolah',
                3: 'kecamatan',
                4: 'noUrut',
                5: 'noInduk',
                6: 'noPeserta',
                7: 'nisn',
                8: 'namaPeserta',
                9: 'ttl',
                10: 'namaOrtu',
                11: 'noIjazah',
                12: 'foto'
            }
        });

    } catch (error) {
        console.error("Debug siswa data error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil debug data siswa: " + error.message
        });
    } finally {
        db.close();
    }
};
