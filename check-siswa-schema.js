const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');

console.log('🔍 Checking siswa table schema...\n');

const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(siswa)", [], (err, columns) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    return;
  }

  console.log('📋 SISWA TABLE COLUMNS:\n');
  columns.forEach((col, i) => {
    console.log(`  ${i + 1}. ${col.name.padEnd(20)} (${col.type})`);
  });

  console.log('\n📋 SEKOLAH TABLE COLUMNS (for comparison):\n');
  db.all("PRAGMA table_info(sekolah)", [], (err, sekolahCols) => {
    if (!err) {
      sekolahCols.forEach((col, i) => {
        console.log(`  ${i + 1}. ${col.name.padEnd(20)} (${col.type})`);
      });
    }

    db.close();
  });
});
