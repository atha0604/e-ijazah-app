const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const sekolahPath = 'C:\\Users\\prase\\OneDrive\\Dokumen\\tes web\\DATA SEKOLAH.xlsx';
const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');

console.log('🔍 Checking for duplicate NPSN...\n');

// Read Excel
const wb = XLSX.readFile(sekolahPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Check for duplicate NPSN in Excel
const npsnCount = {};
const kodeBiasaCount = {};

for (let i = 1; i < data.length; i++) {
  const kode = String(data[i][0] || '');
  const npsn = String(data[i][3] || '');

  if (kode) {
    kodeBiasaCount[kode] = (kodeBiasaCount[kode] || 0) + 1;
  }

  if (npsn) {
    if (!npsnCount[npsn]) npsnCount[npsn] = [];
    npsnCount[npsn].push({ kode, nama: data[i][4], row: i + 1 });
  }
}

// Check for duplicate KODE BIASA
console.log('📋 Checking KODE BIASA duplicates in Excel:');
const dupKode = Object.entries(kodeBiasaCount).filter(([k, v]) => v > 1);
if (dupKode.length > 0) {
  console.log(`❌ Found ${dupKode.length} duplicate KODE BIASA:`);
  dupKode.forEach(([kode, count]) => console.log(`  - ${kode}: ${count} times`));
} else {
  console.log('✅ No duplicate KODE BIASA\n');
}

// Check for duplicate NPSN
console.log('📋 Checking NPSN duplicates in Excel:');
const dupNpsn = Object.entries(npsnCount).filter(([k, v]) => v.length > 1);
if (dupNpsn.length > 0) {
  console.log(`❌ Found ${dupNpsn.length} duplicate NPSN:\n`);
  dupNpsn.forEach(([npsn, schools]) => {
    console.log(`  NPSN: ${npsn}`);
    schools.forEach(s => {
      console.log(`    - Row ${s.row}: ${s.kode} → ${s.nama}`);
    });
    console.log('');
  });
} else {
  console.log('✅ No duplicate NPSN\n');
}

// Check if U6RASS26 NPSN exists in database
const db = new sqlite3.Database(dbPath);
db.get('SELECT * FROM sekolah WHERE npsn = ?', ['69854814'], (err, row) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else if (row) {
    console.log('⚠️  NPSN 69854814 ALREADY EXISTS in database:');
    console.log(`   KODE BIASA: ${row.kode_biasa}`);
    console.log(`   Nama: ${row.nama_lengkap}`);
    console.log('\n💡 This is likely why U6RASS26 was skipped during import!');
    console.log('   Backend uses INSERT OR REPLACE, so it replaced the existing row.');
  } else {
    console.log('✅ NPSN 69854814 not in database');
  }

  db.close();
});
