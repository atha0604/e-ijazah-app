const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const sekolahPath = 'C:\\Users\\prase\\OneDrive\\Dokumen\\tes web\\DATA SEKOLAH.xlsx';
const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');

console.log('🔍 Finding missing sekolah codes...\n');

// Read Excel
const wb = XLSX.readFile(sekolahPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

const excelCodes = new Set();
const excelData = {};

for (let i = 1; i < data.length; i++) {
  const kode = String(data[i][0] || '');
  if (kode) {
    excelCodes.add(kode);
    excelData[kode] = {
      kodePro: data[i][1],
      kecamatan: data[i][2],
      npsn: data[i][3],
      namaLengkap: data[i][4],
      namaSingkat: data[i][5]
    };
  }
}

console.log(`📊 Excel SEKOLAH: ${excelCodes.size} codes`);

// Check database
const db = new sqlite3.Database(dbPath);

db.all('SELECT kode_biasa FROM sekolah', [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    return;
  }

  const dbCodes = new Set(rows.map(r => r.kode_biasa));
  console.log(`📊 Database SEKOLAH: ${dbCodes.size} codes\n`);

  const missing = [...excelCodes].filter(code => !dbCodes.has(code));

  if (missing.length === 0) {
    console.log('✅ All codes from Excel are in database!');
  } else {
    console.log(`❌ MISSING in database: ${missing.length} codes\n`);
    console.log('📋 Missing codes:');
    missing.forEach(code => {
      const data = excelData[code];
      console.log(`  - ${code}`);
      console.log(`    NPSN: ${data.npsn}`);
      console.log(`    Nama: ${data.namaLengkap}`);
      console.log(`    Kecamatan: ${data.kecamatan}\n`);
    });

    // Check if U6RASS26 is missing
    if (missing.includes('U6RASS26')) {
      console.log('⚠️  U6RASS26 is one of the missing codes!');
      console.log('   This is why siswa import failed.');
    }
  }

  db.close();
});
