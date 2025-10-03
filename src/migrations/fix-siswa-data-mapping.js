// Migration to fix siswa data column mapping
// Problem: Data was imported with incorrect column order
// nisn field contains name, namaPeserta contains TTL, ttl contains parent name, noPeserta contains actual NISN

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
    console.log('Starting siswa data mapping fix...');
    await run('PRAGMA foreign_keys = OFF');
    await run('BEGIN TRANSACTION');

    // Get all siswa records to fix
    const siswaRecords = await all('SELECT * FROM siswa');
    console.log(`Found ${siswaRecords.length} siswa records to fix`);

    // Create a temporary table with correct data mapping
    await run(`CREATE TABLE siswa_fixed (
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

    // Fix and insert data with correct mapping
    let fixed = 0;
    for (const record of siswaRecords) {
      try {
        // Current incorrect mapping:
        // record.nisn = nama peserta (should be namaPeserta)
        // record.namaPeserta = TTL (should be ttl)
        // record.ttl = nama ortu (should be namaOrtu)
        // record.noPeserta = actual NISN (should be nisn)

        const correctData = {
          nisn: record.noPeserta,           // actual NISN from noPeserta field
          kodeBiasa: record.kodeBiasa,
          kodePro: record.kodePro,
          namaSekolah: record.namaSekolah,
          kecamatan: record.kecamatan,
          noUrut: record.noUrut,
          noInduk: record.noInduk,
          noPeserta: record.noIjazah || '', // Use noIjazah as noPeserta if needed
          namaPeserta: record.nisn,         // nama peserta from nisn field
          ttl: record.namaPeserta,          // TTL from namaPeserta field
          namaOrtu: record.ttl,             // nama ortu from ttl field
          noIjazah: record.namaOrtu || '',  // Use namaOrtu as noIjazah if needed
          foto: record.foto
        };

        // Only insert if NISN is valid (looks like a number)
        if (correctData.nisn && /^\d+$/.test(String(correctData.nisn))) {
          await run(`INSERT OR REPLACE INTO siswa_fixed
            (nisn, kodeBiasa, kodePro, namaSekolah, kecamatan, noUrut, noInduk, noPeserta, namaPeserta, ttl, namaOrtu, noIjazah, foto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [correctData.nisn, correctData.kodeBiasa, correctData.kodePro, correctData.namaSekolah,
             correctData.kecamatan, correctData.noUrut, correctData.noInduk, correctData.noPeserta,
             correctData.namaPeserta, correctData.ttl, correctData.namaOrtu, correctData.noIjazah, correctData.foto]
          );
          fixed++;
        } else {
          console.warn(`Skipping record with invalid NISN: ${correctData.nisn}`);
        }
      } catch (err) {
        console.error(`Error fixing record for NISN ${record.noPeserta}:`, err.message);
      }
    }

    // Replace old table with fixed data
    await run('DROP TABLE siswa');
    await run('ALTER TABLE siswa_fixed RENAME TO siswa');

    await run('COMMIT');
    await run('PRAGMA foreign_keys = ON');
    console.log(`Siswa data mapping fix completed. Fixed ${fixed} records.`);
  } catch (e) {
    console.error('Siswa data mapping fix failed:', e.message);
    try { await run('ROLLBACK'); } catch (rollbackErr) { console.error('Rollback failed:', rollbackErr); }
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();