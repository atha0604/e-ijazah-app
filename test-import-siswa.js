const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const siswaPath = 'C:\\Users\\prase\\OneDrive\\Dokumen\\tes web\\DATA SISWA full.xlsx';
const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');

console.log('🧪 Testing siswa import directly to database...\n');

// Read Excel
const wb = XLSX.readFile(siswaPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

// Remove header
allRows.shift();

console.log(`📊 Total rows from Excel: ${allRows.length}`);

// Get valid sekolah codes
const db = new sqlite3.Database(dbPath);

db.all('SELECT kode_biasa FROM sekolah', [], async (err, sekolahRows) => {
  if (err) {
    console.error('❌ Error getting sekolah:', err.message);
    db.close();
    return;
  }

  const sekolahCodes = new Set(sekolahRows.map(r => r.kode_biasa));
  console.log(`📋 Valid sekolah codes: ${sekolahCodes.size}\n`);

  let inserted = 0;
  let skipped = [];
  let failed = [];

  console.log('🔄 Processing rows...\n');

  // Process first 5 rows for testing
  const testRows = allRows.slice(0, 5);

  for (let idx = 0; idx < testRows.length; idx++) {
    const r = testRows[idx] || [];

    const norm = (v) => {
      if (v === undefined || v === null) return null;
      if (typeof v === 'string') {
        const t = v.trim();
        return t === '' || t.toUpperCase() === 'NULL' ? null : t;
      }
      return v;
    };

    const vals = r.map(norm);

    const kode_biasa = vals[0] ? String(vals[0]) : null;
    const nisn = vals[6] ? String(vals[6]) : null;

    console.log(`Row ${idx + 1}:`);
    console.log(`  KODE BIASA: ${kode_biasa}`);
    console.log(`  NISN: ${nisn}`);
    console.log(`  Nama: ${vals[7]}`);

    if (!kode_biasa || !nisn) {
      console.log(`  ❌ SKIP: kode_biasa/nisn kosong\n`);
      skipped.push({ rowIndex: idx + 1, reason: 'kode_biasa/nisn kosong' });
      continue;
    }

    if (!sekolahCodes.has(kode_biasa)) {
      console.log(`  ❌ SKIP: kode_biasa '${kode_biasa}' tidak ada di sekolah\n`);
      skipped.push({ rowIndex: idx + 1, reason: `kode_biasa tidak ada` });
      continue;
    }

    // Parse noUrut as integer
    if (vals[4] !== null && !Number.isNaN(Number(vals[4]))) {
      vals[4] = parseInt(vals[4], 10);
    }

    const insertVals = [
      kode_biasa,      // kode_biasa
      vals[1],         // kode_pro
      vals[2],         // namaSekolah
      vals[3],         // kecamatan
      vals[4],         // noUrut
      vals[5],         // noInduk
      '',              // noPeserta
      nisn,            // nisn
      vals[7],         // namaPeserta
      vals[8],         // ttl
      vals[9],         // namaOrtu
      vals[10]         // noIjazah
    ];

    console.log(`  📝 Values:`, insertVals);

    try {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO siswa (kode_biasa, kode_pro, namaSekolah, kecamatan, noUrut, noInduk, noPeserta, nisn, namaPeserta, ttl, namaOrtu, noIjazah) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          insertVals,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      inserted++;
      console.log(`  ✅ INSERTED\n`);
    } catch (e) {
      console.log(`  ❌ FAILED: ${e.message}\n`);
      failed.push({ rowIndex: idx + 1, reason: e.message, insertVals });
    }
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`  ✅ Inserted: ${inserted}`);
  console.log(`  ⚠️  Skipped: ${skipped.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n❌ FAILED DETAILS:');
    failed.forEach(f => {
      console.log(`  Row ${f.rowIndex}: ${f.reason}`);
      console.log(`  Values:`, f.insertVals);
    });
  }

  if (skipped.length > 0) {
    console.log('\n⚠️  SKIPPED DETAILS:');
    skipped.forEach(s => {
      console.log(`  Row ${s.rowIndex}: ${s.reason}`);
    });
  }

  // Verify
  db.get('SELECT COUNT(*) as total FROM siswa', [], (err, row) => {
    if (!err) {
      console.log(`\n📊 Total siswa in DB after test: ${row.total}`);
    }
    db.close();
  });
});
