const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');
console.log('📂 Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Check total siswa
db.get('SELECT COUNT(*) as total FROM siswa', [], (err, row) => {
  if (err) {
    console.error('❌ Error counting siswa:', err.message);
  } else {
    console.log(`📊 Total siswa in DB: ${row.total}`);
  }

  // Get sample data
  db.all('SELECT * FROM siswa LIMIT 3', [], (err, rows) => {
    if (err) {
      console.error('❌ Error getting siswa sample:', err.message);
    } else {
      console.log(`\n📝 Sample siswa data (${rows.length} rows):`);
      rows.forEach((row, i) => {
        console.log(`  Row ${i + 1}:`, {
          nisn: row.nisn,
          kode_biasa: row.kode_biasa,
          nama: row.namaPeserta,
          noUrut: row.noUrut
        });
      });
    }

    // Check sekolah for comparison
    db.get('SELECT COUNT(*) as total FROM sekolah', [], (err, row) => {
      if (err) {
        console.error('❌ Error counting sekolah:', err.message);
      } else {
        console.log(`\n🏫 Total sekolah in DB: ${row.total}`);
      }

      db.close((err) => {
        if (err) console.error('Error closing DB:', err.message);
        else console.log('\n✅ Database check complete');
      });
    });
  });
});
