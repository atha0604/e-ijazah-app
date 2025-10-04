const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');
const kodeBiasa = 'U6RASS26'; // Sample from Excel

console.log('🔍 Checking if KODE BIASA exists in sekolah table...');
console.log('📂 Database:', dbPath);
console.log('🔑 KODE BIASA:', kodeBiasa);

const db = new sqlite3.Database(dbPath);

db.get('SELECT * FROM sekolah WHERE kode_biasa = ?', [kodeBiasa], (err, row) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else if (row) {
    console.log('\n✅ FOUND in sekolah table:');
    console.log(row);
  } else {
    console.log('\n❌ NOT FOUND in sekolah table!');
    console.log('');
    console.log('This is why siswa import is failing!');
    console.log('Backend validation: kode_biasa must exist in sekolah table.');
  }

  // Show first few kode_biasa from sekolah table for comparison
  db.all('SELECT kode_biasa, nama_lengkap FROM sekolah LIMIT 5', [], (err, rows) => {
    if (!err) {
      console.log('\n📋 Sample KODE BIASA from sekolah table:');
      rows.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.kode_biasa} - ${r.nama_lengkap}`);
      });
    }

    db.close();
  });
});
