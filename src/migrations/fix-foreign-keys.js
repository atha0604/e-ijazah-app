// src/migrations/fix-foreign-keys.js
// Rebuild tabel agar foreign keys lengkap (ON UPDATE CASCADE) dan nilai→siswa FK ada.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');
const db = new sqlite3.Database(dbPath);

const run = (sql, params=[]) => new Promise((res, rej)=>{
  db.run(sql, params, function(err){ if(err) rej(err); else res(this); });
});
const all = (sql, params=[]) => new Promise((res, rej)=>{
  db.all(sql, params, (err, rows)=>{ if(err) rej(err); else res(rows); });
});

(async () => {
  try {
    console.log('Starting FK migration...');
    await run('PRAGMA foreign_keys = OFF');
    await run('BEGIN TRANSACTION');

    // Create new tables with desired schema
    await run(`CREATE TABLE IF NOT EXISTS sekolah_new (
      kodeBiasa TEXT PRIMARY KEY,
      kodePro TEXT,
      kecamatan TEXT,
      npsn TEXT,
      namaSekolahLengkap TEXT,
      namaSekolahSingkat TEXT
    )`);

    await run(`CREATE TABLE IF NOT EXISTS siswa_new (
      nisn TEXT PRIMARY KEY,
      kodeBiasa TEXT,
      kodePro TEXT,
      namaSekolah TEXT,
      kecamatan TEXT,
      noUrut INTEGER,
      noInduk TEXT,
      noPeserta TEXT,
      namaPeserta TEXT,
      ttl TEXT,
      namaOrtu TEXT,
      noIjazah TEXT,
      foto TEXT,
      FOREIGN KEY(kodeBiasa) REFERENCES sekolah(kodeBiasa) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    await run(`CREATE TABLE IF NOT EXISTS nilai_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nisn TEXT NOT NULL,
      semester TEXT NOT NULL,
      subject TEXT NOT NULL,
      type TEXT NOT NULL,
      value TEXT,
      UNIQUE(nisn, semester, subject, type),
      FOREIGN KEY(nisn) REFERENCES siswa(nisn) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    await run(`CREATE TABLE IF NOT EXISTS settings_new (
      kodeBiasa TEXT PRIMARY KEY,
      settings_json TEXT,
      FOREIGN KEY(kodeBiasa) REFERENCES sekolah(kodeBiasa) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    await run(`CREATE TABLE IF NOT EXISTS skl_photos_new (
      nisn TEXT PRIMARY KEY,
      photo_data TEXT,
      FOREIGN KEY(nisn) REFERENCES siswa(nisn) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    await run(`CREATE TABLE IF NOT EXISTS mulok_names_new (
      kodeBiasa TEXT NOT NULL,
      mulok_key TEXT NOT NULL,
      mulok_name TEXT,
      PRIMARY KEY (kodeBiasa, mulok_key),
      FOREIGN KEY(kodeBiasa) REFERENCES sekolah(kodeBiasa) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    // Copy data
    await run(`INSERT OR IGNORE INTO sekolah_new SELECT * FROM sekolah`);

    // siswa: old may not have 'foto'
    const siswaCols = await all(`PRAGMA table_info(siswa)`);
    const hasFoto = siswaCols.some(c => c.name === 'foto');
    if (hasFoto) {
      await run(`INSERT OR IGNORE INTO siswa_new (nisn,kodeBiasa,kodePro,namaSekolah,kecamatan,noUrut,noInduk,noPeserta,namaPeserta,ttl,namaOrtu,noIjazah,foto)
                 SELECT nisn,kodeBiasa,kodePro,namaSekolah,kecamatan,noUrut,noInduk,noPeserta,namaPeserta,ttl,namaOrtu,noIjazah,foto FROM siswa`);
    } else {
      await run(`INSERT OR IGNORE INTO siswa_new (nisn,kodeBiasa,kodePro,namaSekolah,kecamatan,noUrut,noInduk,noPeserta,namaPeserta,ttl,namaOrtu,noIjazah,foto)
                 SELECT nisn,kodeBiasa,kodePro,namaSekolah,kecamatan,noUrut,noInduk,noPeserta,namaPeserta,ttl,namaOrtu,noIjazah,NULL as foto FROM siswa`);
    }

    await run(`INSERT OR IGNORE INTO nilai_new (id,nisn,semester,subject,type,value)
               SELECT id,nisn,semester,subject,type,value FROM nilai`);

    await run(`INSERT OR IGNORE INTO settings_new SELECT * FROM settings`);

    await run(`INSERT OR IGNORE INTO skl_photos_new SELECT * FROM skl_photos`);

    const mulokCols = await all(`PRAGMA table_info(mulok_names)`);
    if (mulokCols.length) {
      await run(`INSERT OR IGNORE INTO mulok_names_new SELECT * FROM mulok_names`);
    }

    // Replace old tables
    await run(`DROP TABLE IF EXISTS nilai`);
    await run(`DROP TABLE IF EXISTS skl_photos`);
    await run(`DROP TABLE IF EXISTS settings`);
    await run(`DROP TABLE IF EXISTS mulok_names`);
    await run(`DROP TABLE IF EXISTS siswa`);
    await run(`DROP TABLE IF EXISTS sekolah`);

    await run(`ALTER TABLE sekolah_new RENAME TO sekolah`);
    await run(`ALTER TABLE siswa_new RENAME TO siswa`);
    await run(`ALTER TABLE nilai_new RENAME TO nilai`);
    await run(`ALTER TABLE settings_new RENAME TO settings`);
    await run(`ALTER TABLE skl_photos_new RENAME TO skl_photos`);
    await run(`ALTER TABLE mulok_names_new RENAME TO mulok_names`);

    await run('COMMIT');
    await run('PRAGMA foreign_keys = ON');
    console.log('FK migration completed successfully.');
  } catch (e) {
    console.error('FK migration failed:', e.message);
    try { await run('ROLLBACK'); } catch (rollbackErr) { console.error('Rollback failed during migration:', rollbackErr); }
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();

