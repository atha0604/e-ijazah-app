const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Check reference database
const refDbPath = 'C:\\ProyekWeb\\web 2\\2 - Copy\\src\\database\\db.sqlite';

if (!fs.existsSync(refDbPath)) {
  console.log('❌ Reference database not found at:', refDbPath);
  process.exit(1);
}

console.log('🔍 Checking REFERENCE database schema...\n');

const db = new sqlite3.Database(refDbPath);

db.all("PRAGMA table_info(siswa)", [], (err, columns) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    return;
  }

  console.log('📋 REFERENCE SISWA TABLE COLUMNS:\n');
  columns.forEach((col, i) => {
    console.log(`  ${i + 1}. ${col.name.padEnd(20)} (${col.type})`);
  });

  // Get sample data
  db.all("SELECT * FROM siswa LIMIT 1", [], (err, rows) => {
    if (!err && rows.length > 0) {
      console.log('\n📝 Sample siswa data from reference DB:');
      console.log(rows[0]);
    }

    db.close();
  });
});
