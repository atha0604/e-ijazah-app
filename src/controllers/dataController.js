
// src/controllers/dataController.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
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

// Mengambil semua data dari berbagai tabel
exports.getAllData = async (req, res) => {
    const db = getDbConnection();
    try {
        const [sekolahRows, siswaRows, nilaiRows, settingsRows, sklPhotosRows, mulokNamesRows] = await Promise.all([
            queryAll(db, 'SELECT * FROM sekolah'),
            queryAll(db, 'SELECT * FROM siswa'),
            queryAll(db, 'SELECT * FROM nilai'),
            queryAll(db, 'SELECT * FROM settings'),
            queryAll(db, 'SELECT * FROM skl_photos'),
            queryAll(db, 'SELECT * FROM mulok_names')
        ]);

        const finalDb = {
            sekolah: sekolahRows.map(row => [ row.kodeBiasa, row.kodePro, row.kecamatan, row.npsn, row.namaSekolahLengkap, row.namaSekolahSingkat ]),
            siswa: siswaRows.map(row => [ row.kodeBiasa, row.kodePro, row.namaSekolah, row.kecamatan, row.noUrut, row.noInduk, row.noPeserta, row.nisn, row.namaPeserta, row.ttl, row.namaOrtu, row.noIjazah, row.foto ]),
            nilai: { _mulokNames: {} }, settings: {}, sklPhotos: {}
        };
        nilaiRows.forEach(row => {
            if (!finalDb.nilai[row.nisn]) finalDb.nilai[row.nisn] = {};
            if (!finalDb.nilai[row.nisn][row.semester]) finalDb.nilai[row.nisn][row.semester] = {};
            if (!finalDb.nilai[row.nisn][row.semester][row.subject]) finalDb.nilai[row.nisn][row.semester][row.subject] = {};
            finalDb.nilai[row.nisn][row.semester][row.subject][row.type] = row.value;
        });
        mulokNamesRows.forEach(row => {
            if (!finalDb.nilai._mulokNames[row.kodeBiasa]) finalDb.nilai._mulokNames[row.kodeBiasa] = {};
            finalDb.nilai._mulokNames[row.kodeBiasa][row.mulok_key] = row.mulok_name;
        });
        settingsRows.forEach(row => {
            finalDb.settings[row.kodeBiasa] = JSON.parse(row.settings_json || '{}');
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
            const sql = `INSERT INTO sekolah (kodeBiasa, kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat) VALUES (?, ?, ?, ?, ?, ?)`;
            await run(db, sql, sekolahData);
        } else { // mode 'edit'
            const [newKodeBiasa, kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat] = sekolahData;
            
            // Jika kodeBiasa berubah, gunakan pendekatan INSERT-DELETE
            if (newKodeBiasa !== originalKodeBiasa) {
                console.log(`Updating kodeBiasa from ${originalKodeBiasa} to ${newKodeBiasa}`);
                
                await run(db, 'BEGIN TRANSACTION');
                await run(db, 'PRAGMA foreign_keys = OFF');
                
                try {
                    // Cek apakah ada data duplicate dengan field lain sebelum insert
                    console.log('Checking for duplicate data before insert...');
                    const [_, kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat] = sekolahData;
                    
                    // Cek duplicate NPSN
                    if (npsn) {
                        const existingNpsn = await queryAll(db, 'SELECT kodeBiasa FROM sekolah WHERE npsn = ? AND kodeBiasa != ?', [npsn, originalKodeBiasa]);
                        if (existingNpsn.length > 0) {
                            throw new Error(`NPSN "${npsn}" sudah digunakan oleh sekolah dengan kode: ${existingNpsn[0].kodeBiasa}`);
                        }
                    }
                    
                    // Cek duplicate nama sekolah lengkap
                    if (namaSekolahLengkap) {
                        const existingNama = await queryAll(db, 'SELECT kodeBiasa FROM sekolah WHERE namaSekolahLengkap = ? AND kodeBiasa != ?', [namaSekolahLengkap, originalKodeBiasa]);
                        if (existingNama.length > 0) {
                            throw new Error(`Nama sekolah lengkap "${namaSekolahLengkap}" sudah digunakan oleh sekolah dengan kode: ${existingNama[0].kodeBiasa}`);
                        }
                    }
                    
                    // 1. Insert data sekolah baru
                    await run(db, `INSERT INTO sekolah (kodeBiasa, kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat) VALUES (?, ?, ?, ?, ?, ?)`, 
                        sekolahData);
                    
                    // 2. Update semua referensi foreign key
                    await run(db, `UPDATE siswa SET kodeBiasa = ? WHERE kodeBiasa = ?`, [newKodeBiasa, originalKodeBiasa]);
                    await run(db, `UPDATE settings SET kodeBiasa = ? WHERE kodeBiasa = ?`, [newKodeBiasa, originalKodeBiasa]);
                    
                    try {
                        await run(db, `UPDATE mulok_names SET kodeBiasa = ? WHERE kodeBiasa = ?`, [newKodeBiasa, originalKodeBiasa]);
                    } catch (mulokError) {
                        console.log('mulok_names table might not exist, skipping...');
                    }
                    
                    // 3. Hapus data sekolah lama
                    await run(db, `DELETE FROM sekolah WHERE kodeBiasa = ?`, [originalKodeBiasa]);
                    
                    await run(db, 'PRAGMA foreign_keys = ON');
                    await run(db, 'COMMIT');
                } catch (error) {
                    await run(db, 'PRAGMA foreign_keys = ON');
                    await run(db, 'ROLLBACK');
                    throw error;
                }
            } else {
                // Jika kodeBiasa tidak berubah, update biasa saja
                console.log('Updating sekolah without changing kodeBiasa...');
                console.log('Data to update:', [kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat, originalKodeBiasa]);
                
                // Cek duplicate data sebelum update
                if (npsn) {
                    const existingNpsn = await queryAll(db, 'SELECT kodeBiasa FROM sekolah WHERE npsn = ? AND kodeBiasa != ?', [npsn, originalKodeBiasa]);
                    if (existingNpsn.length > 0) {
                        throw new Error(`NPSN "${npsn}" sudah digunakan oleh sekolah lain dengan kode: ${existingNpsn[0].kodeBiasa}`);
                    }
                }
                
                if (namaSekolahLengkap) {
                    const existingNama = await queryAll(db, 'SELECT kodeBiasa FROM sekolah WHERE namaSekolahLengkap = ? AND kodeBiasa != ?', [namaSekolahLengkap, originalKodeBiasa]);
                    if (existingNama.length > 0) {
                        throw new Error(`Nama sekolah "${namaSekolahLengkap}" sudah digunakan oleh sekolah lain dengan kode: ${existingNama[0].kodeBiasa}`);
                    }
                }
                
                const sql = `UPDATE sekolah SET kodePro = ?, kecamatan = ?, npsn = ?, namaSekolahLengkap = ?, namaSekolahSingkat = ? WHERE kodeBiasa = ?`;
                await run(db, sql, [kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat, originalKodeBiasa]);
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
        await run(db, "BEGIN TRANSACTION");
        const stmt = db.prepare("INSERT OR REPLACE INTO nilai (nisn, semester, subject, type, value) VALUES (?, ?, ?, ?, ?)");
        gradesToSave.forEach(grade => {
            stmt.run(grade.nisn, grade.semester, grade.subject, grade.type, grade.value || '');
        });
        stmt.finalize();
        await run(db, "COMMIT");
        res.json({ success: true, message: `Berhasil menyimpan ${gradesToSave.length} data nilai.` });
    } catch (error) {
        await run(db, "ROLLBACK");
        console.error('Save Bulk Grades error:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan nilai bulk ke server.' });
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
            const existing = await queryAll(db, "SELECT settings_json FROM settings WHERE kodeBiasa = ?", [schoolCode]);
            const existingSettings = existing.length > 0 ? JSON.parse(existing[0].settings_json) : {};
            const newSettings = { ...existingSettings, ...settingsData };
            await run(db, "INSERT OR REPLACE INTO settings (kodeBiasa, settings_json) VALUES (?, ?)", [schoolCode, JSON.stringify(newSettings)]);
        }

        if (mulokNamesData) {
            for (const mulokKey in mulokNamesData) {
                await run(db, "INSERT OR REPLACE INTO mulok_names (kodeBiasa, mulok_key, mulok_name) VALUES (?, ?, ?)", [schoolCode, mulokKey, mulokNamesData[mulokKey]]);
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
        const siswa = await queryAll(db, "SELECT nisn FROM siswa WHERE kodeBiasa = ?", [schoolCode]);
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

  const runP = (sql, params = []) => new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve(this);
      });
    });

  const allP = (sql, params = []) => new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

  const norm = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'string') {
      const t = v.trim();
      return t === '' || t.toUpperCase() === 'NULL' ? null : t;
    }
    return v;
  };

  try {
    await runP('PRAGMA foreign_keys = ON');
    await runP('BEGIN TRANSACTION');

    if (tableId === 'sekolah') {
      let inserted = 0, failed = [];
      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx] || [];
        const vals = [ norm(r[0]), norm(r[1]), norm(r[2]), norm(r[3]), norm(r[4]), norm(r[5]) ];
        try {
          await runP(`INSERT OR REPLACE INTO sekolah (kodeBiasa, kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat) VALUES (?, ?, ?, ?, ?, ?)`, vals);
          inserted++;
        } catch (e) {
          failed.push({ rowIndex: idx + 1, reason: e.message, row: r });
        }
      }
      await runP('COMMIT');
      return res.json({ success: true, message: `Import sekolah selesai.`, inserted, failedCount: failed.length, failed });
    }

    if (tableId === 'siswa') {
      const sekolahCodes = new Set((await allP('SELECT kodeBiasa FROM sekolah')).map((x) => String(x.kodeBiasa)));
      let inserted = 0, skipped = [], failed = [];
      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx] || [];
        const raw = [ r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11] ];
        const vals = raw.map(norm);
        const kodeBiasa = vals[0] ? String(vals[0]) : null;
        const nisn = vals[7] ? String(vals[7]) : null;

        if (!kodeBiasa || !nisn) {
          skipped.push({ rowIndex: idx + 1, reason: 'kodeBiasa/nisn kosong', row: r });
          continue;
        }
        if (!sekolahCodes.has(kodeBiasa)) {
          skipped.push({ rowIndex: idx + 1, reason: `kodeBiasa '${kodeBiasa}' tidak ada di tabel sekolah`, row: r });
          continue;
        }
        if (vals[4] !== null && !Number.isNaN(Number(vals[4]))) {
          vals[4] = parseInt(vals[4], 10);
        }
        try {
          await runP(`INSERT OR REPLACE INTO siswa (kodeBiasa, kodePro, namaSekolah, kecamatan, noUrut, noInduk, noPeserta, nisn, namaPeserta, ttl, namaOrtu, noIjazah) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, vals);
          inserted++;
        } catch (e) {
          failed.push({ rowIndex: idx + 1, reason: e.message, row: r });
        }
      }
      await runP('COMMIT');
      return res.json({ success: true, message: 'Import siswa selesai.', inserted, skippedCount: skipped.length, failedCount: failed.length, skipped, failed });
    }

    await runP('ROLLBACK');
    return res.status(400).json({ success: false, message: `Import untuk '${tableId}' belum didukung.` });

  } catch (e) {
    try { await runP('ROLLBACK'); } catch {}
    return res.status(500).json({ success: false, message: e.message });
  } finally {
    db.close();
  }
};

// Menghapus semua data untuk tabel tertentu ('sekolah' atau 'siswa')
exports.deleteAllData = async (req, res) => {
  const tableId = (req.body && req.body.tableId) || '';
  const db = getDbConnection();

  const runP = (sql, params = []) => new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve(this);
      });
    });

  const getOne = (sql, params = []) => new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

  try {
    await runP('PRAGMA foreign_keys = ON');
    await runP('BEGIN TRANSACTION');

    if (tableId === 'sekolah') {
      const row = await getOne('SELECT COUNT(1) AS c FROM siswa');
      if (row?.c > 0) {
        await runP('ROLLBACK');
        return res.status(409).send('Tidak dapat menghapus semua SEKOLAH karena masih ada data SISWA. Hapus semua siswa terlebih dahulu.');
      }
      await runP('DELETE FROM sekolah');
      await runP('COMMIT');
      try { await runP(`DELETE FROM sqlite_sequence WHERE name IN ('sekolah')`); } catch {}
      try { await runP('VACUUM'); } catch {}
      return res.json({ success: true, message: 'Semua data SEKOLAH telah dihapus.' });
    }

    if (tableId === 'siswa') {
      const rn = await getOne('SELECT COUNT(1) AS c FROM nilai');
      const rp = await getOne('SELECT COUNT(1) AS c FROM skl_photos');
      if ((rn?.c || 0) > 0 || (rp?.c || 0) > 0) {
        await runP('ROLLBACK');
        return res.status(409).send('Tidak dapat menghapus semua SISWA karena masih ada data NILAI atau FOTO terkait. Hapus nilai/foto terlebih dahulu.');
      }
      await runP('DELETE FROM siswa');
      await runP('COMMIT');
      try { await runP(`DELETE FROM sqlite_sequence WHERE name IN ('siswa')`); } catch {}
      try { await runP('VACUUM'); } catch {}
      return res.json({ success: true, message: 'Semua data SISWA telah dihapus. Data SEKOLAH tetap ada.' });
    }

    await runP('ROLLBACK');
    return res.status(400).send("Parameter 'tableId' harus 'sekolah' atau 'siswa'.");
  } catch (e) {
    try { await runP('ROLLBACK'); } catch {}
    return res.status(500).send(e.message || 'Terjadi kesalahan pada server.');
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
      await run(db, `DELETE FROM nilai WHERE nisn IN (SELECT nisn FROM siswa WHERE kodeBiasa = ?)`, [schoolCode]);
      await run(db, `DELETE FROM skl_photos WHERE nisn IN (SELECT nisn FROM siswa WHERE kodeBiasa = ?)`, [schoolCode]);
      await run(db, `DELETE FROM siswa WHERE kodeBiasa = ?`, [schoolCode]);
      await run(db, `DELETE FROM settings WHERE kodeBiasa = ?`, [schoolCode]);
      await run(db, `DELETE FROM mulok_names WHERE kodeBiasa = ?`, [schoolCode]);
      // Only delete sekolah if no other data depends on it
      const otherSiswa = await queryAll(db, `SELECT COUNT(*) as count FROM siswa WHERE kodeBiasa = ?`, [schoolCode]);
      if (otherSiswa[0].count === 0) {
        await run(db, `DELETE FROM sekolah WHERE kodeBiasa = ?`, [schoolCode]);
      }
    }

    // Insert sekolah data (extract from siswa data)
    if (siswaData.length > 0) {
      const sekolahInfo = siswaData[0]; // Get school info from first student
      if (sekolahInfo && sekolahInfo.length >= 4) {
        console.log('Inserting sekolah data:', sekolahInfo[0]);
        const stmtSekolah = db.prepare(`INSERT OR REPLACE INTO sekolah (kodeBiasa, kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat) VALUES (?, ?, ?, ?, ?, ?)`);
        // Use data from backup directly
        stmtSekolah.run(
          sekolahInfo[0], // kodeBiasa
          sekolahInfo[1], // kodePro  
          sekolahInfo[3], // kecamatan
          '', // npsn - will be updated if available
          data.schoolName || sekolahInfo[2] || 'Unknown School', // namaSekolahLengkap
          data.schoolName || sekolahInfo[2] || 'Unknown School'  // namaSekolahSingkat
        );
        stmtSekolah.finalize();
      }
    }

    // Insert siswa data
    if (siswaData.length) {
      console.log('Inserting siswa data:', siswaData.length, 'records');
      const stmtSiswa = db.prepare(`INSERT OR REPLACE INTO siswa (kodeBiasa, kodePro, namaSekolah, kecamatan, noUrut, noInduk, noPeserta, nisn, namaPeserta, ttl, namaOrtu, noIjazah, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const r of siswaData) { 
        if (r && r.length >= 8) {
          stmtSiswa.run(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12] || null); 
        }
      }
      stmtSiswa.finalize();
    }

    // Insert nilai data  
    if (nilaiData && typeof nilaiData === 'object') {
      console.log('Inserting nilai data for', Object.keys(nilaiData).length, 'students');
      const stmtNilai = db.prepare(`INSERT OR REPLACE INTO nilai (nisn, semester, subject, type, value) VALUES (?, ?, ?, ?, ?)`);
      for (const nisn of Object.keys(nilaiData)) {
        if (nisn === '_mulokNames') continue; // Skip mulok names
        const studentData = nilaiData[nisn];
        for (const semester of Object.keys(studentData)) {
          const semesterData = studentData[semester];
          for (const subject of Object.keys(semesterData)) {
            const subjectData = semesterData[subject];
            for (const type of Object.keys(subjectData)) {
              const value = subjectData[type];
              if (value !== undefined && value !== '') {
                stmtNilai.run(nisn, semester, subject, type, value);
              }
            }
          }
        }
      }
      stmtNilai.finalize();
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
      const stmtSet = db.prepare(`INSERT OR REPLACE INTO settings (kodeBiasa, settings_json) VALUES (?, ?)`);
      if (schoolCode && Object.keys(settingsData).length > 0) {
        // If settings is direct object, use schoolCode as key
        stmtSet.run(schoolCode, JSON.stringify(settingsData));
      } else {
        // If settings has school codes as keys
        for (const kodeBiasa of Object.keys(settingsData)) {
          const schoolSettings = settingsData[kodeBiasa];
          if (schoolSettings && typeof schoolSettings === 'object') {
            stmtSet.run(kodeBiasa, JSON.stringify(schoolSettings));
          }
        }
      }
      stmtSet.finalize();
    }

    // Insert mulok names data
    if (mulokNamesData && typeof mulokNamesData === 'object' && Object.keys(mulokNamesData).length > 0) {
      console.log('Inserting mulok names data');
      const stmtMulok = db.prepare(`INSERT OR REPLACE INTO mulok_names (kodeBiasa, mulok_key, mulok_name) VALUES (?, ?, ?)`);
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

// Mengambil data siswa berdasarkan kode sekolah
exports.getSiswaBySekolah = async (req, res) => {
    const { kodeSekolah } = req.query;
    if (!kodeSekolah) {
        return res.status(400).json({ success: false, message: 'Kode sekolah dibutuhkan.' });
    }
    const db = getDbConnection();
    try {
        const siswaRows = await queryAll(db, 'SELECT * FROM siswa WHERE kodeBiasa = ?', [kodeSekolah]);
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
    const { kodeBiasa } = req.params;
    const db = getDbConnection();
    try {
        const [siswaRows, settingsRows, mulokNamesRows] = await Promise.all([
            queryAll(db, 'SELECT nisn FROM siswa WHERE kodeBiasa = ?', [kodeBiasa]),
            queryAll(db, 'SELECT * FROM settings WHERE kodeBiasa = ?', [kodeBiasa]),
            queryAll(db, 'SELECT * FROM mulok_names WHERE kodeBiasa = ?', [kodeBiasa])
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
            if (!finalData.nilai._mulokNames[row.kodeBiasa]) finalData.nilai._mulokNames[row.kodeBiasa] = {};
            finalData.nilai._mulokNames[row.kodeBiasa][row.mulok_key] = row.mulok_name;
        });
        settingsRows.forEach(row => {
            finalData.settings[row.kodeBiasa] = JSON.parse(row.settings_json || '{}');
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
    const sql = `INSERT INTO sekolah (kodeBiasa, kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat) VALUES (?, ?, ?, ?, ?, ?)`;
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
    const sql = `UPDATE sekolah SET kodeBiasa=?, kodePro=?, kecamatan=?, npsn=?, namaSekolahLengkap=?, namaSekolahSingkat=? WHERE kodeBiasa=?`;
    await run(db, sql, [...sekolahData, originalKodeBiasa]);
    res.json({ success: true, message: 'Data sekolah berhasil diperbarui.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  } finally { db.close(); }
};

// Menghapus sekolah (dan data terkait via cascade)
exports.deleteSekolah = async (req, res) => {
  const { kodeBiasa } = req.body;
  if (!kodeBiasa) {
    return res.status(400).json({ success: false, message: 'Kode sekolah tidak ditemukan.' });
  }
  const db = getDbConnection();
  try {
    await run(db, 'PRAGMA foreign_keys = ON');
    const result = await run(db, 'DELETE FROM sekolah WHERE kodeBiasa = ?', [kodeBiasa]);
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
    try { await run(db, `DELETE FROM sqlite_sequence WHERE name IN ('nilai','skl_photos','siswa','sekolah')`); } catch {}
    try { await run(db, 'VACUUM'); } catch {}
    return res.json({ success: true, message: 'Semua data SEKOLAH (beserta siswa, nilai, foto) telah dihapus.' });
  } catch (e) {
    try { await run(db, 'ROLLBACK'); } catch {}
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
    try { await run(db, `DELETE FROM sqlite_sequence WHERE name IN ('nilai','skl_photos','siswa')`); } catch {}
    try { await run(db, 'VACUUM'); } catch {}
    return res.json({ success: true, message: 'Semua data SISWA (beserta nilai & foto) telah dihapus. Data sekolah tetap ada.' });
  } catch (e) {
    try { await run(db, 'ROLLBACK'); } catch {}
    return res.status(500).json({ success: false, message: e.message });
  } finally {
    db.close();
  }
};

// Mengunduh file template
exports.downloadTemplate = async (req, res) => {
    try {
        const templatePath = path.join(__dirname, '../../TemplateNilai-Sem9-Merdeka.xlsx');
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ success: false, message: 'Template file tidak ditemukan.' });
        }
        const { semester, kurikulum } = req.query;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Template-Nilai-Sem${semester || '9'}-${kurikulum || 'Merdeka'}.xlsx"`);
        const fileStream = fs.createReadStream(templatePath);
        fileStream.pipe(res);
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
        const rows = await queryAll(db, 'SELECT kodeBiasa, namaSekolahLengkap FROM sekolah WHERE kecamatan = ? ORDER BY namaSekolahLengkap', [kecamatan]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Get Sekolah by Kecamatan error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data sekolah.' });
    } finally {
        db.close();
    }
};
