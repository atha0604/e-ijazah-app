const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const siswaPath = 'C:\\Users\\prase\\OneDrive\\Dokumen\\tes web\\DATA SISWA full.xlsx';
const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');

console.log('🔍 Verifying ALL KODE BIASA from siswa Excel...\n');

// Read siswa Excel
const wb = XLSX.readFile(siswaPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Get unique KODE BIASA from siswa Excel
const siswaKodes = new Set();
for (let i = 1; i < data.length; i++) {
  const kode = String(data[i][0] || '');
  if (kode) siswaKodes.add(kode);
}

console.log(`📊 Siswa Excel has ${siswaKodes.size} unique KODE BIASA`);

// Get KODE BIASA from database
const db = new sqlite3.Database(dbPath);

db.all('SELECT kode_biasa, nama_lengkap FROM sekolah', [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    return;
  }

  const dbKodes = new Set(rows.map(r => r.kode_biasa));
  const kodeMap = {};
  rows.forEach(r => kodeMap[r.kode_biasa] = r.nama_lengkap);

  console.log(`📊 Database has ${dbKodes.size} KODE BIASA\n`);

  // Find missing codes
  const missing = [...siswaKodes].filter(k => !dbKodes.has(k));

  if (missing.length === 0) {
    console.log('✅ ALL KODE BIASA from siswa Excel exist in database!');
    console.log('\n⚠️  Siswa import should work now.');
    console.log('    If it still fails, check server logs for other errors.');
  } else {
    console.log(`❌ MISSING ${missing.length} KODE BIASA in database:\n`);

    missing.forEach(kode => {
      const siswaRow = data.find(row => String(row[0]) === kode);
      const namaSekolah = siswaRow ? siswaRow[2] : 'Unknown';
      const nisn = siswaRow ? siswaRow[6] : '';
      const namaSiswa = siswaRow ? siswaRow[7] : '';

      console.log(`  ❌ ${kode}`);
      console.log(`     Sekolah: ${namaSekolah}`);
      console.log(`     Sample siswa: ${namaSiswa} (NISN: ${nisn})\n`);
    });
  }

  // Check sample codes
  console.log('\n📋 Verifying sample codes:');
  ['U6RASS26', 'YARCYYS2', 'ZKU63ZZ6'].forEach(kode => {
    if (dbKodes.has(kode)) {
      console.log(`  ✅ ${kode} - ${kodeMap[kode]}`);
    } else {
      console.log(`  ❌ ${kode} - NOT FOUND`);
    }
  });

  db.close();
});
