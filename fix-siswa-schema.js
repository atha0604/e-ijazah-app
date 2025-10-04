const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');

console.log('🔧 Fixing siswa table schema...\n');
console.log('⚠️  WARNING: This will DROP the current siswa table and recreate it!\n');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Drop existing siswa table
  db.run('DROP TABLE IF EXISTS siswa', (err) => {
    if (err) {
      console.error('❌ Error dropping table:', err.message);
      db.close();
      return;
    }
    console.log('✅ Dropped old siswa table');

    // Create new siswa table with correct schema (using snake_case to match backend)
    db.run(`CREATE TABLE siswa (
      nisn TEXT PRIMARY KEY,
      kode_biasa TEXT,
      kode_pro TEXT,
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
      FOREIGN KEY(kode_biasa) REFERENCES sekolah(kode_biasa)
    )`, (err) => {
      if (err) {
        console.error('❌ Error creating table:', err.message);
        db.close();
        return;
      }

      console.log('✅ Created new siswa table with correct schema\n');

      // Verify schema
      db.all("PRAGMA table_info(siswa)", [], (err, columns) => {
        if (err) {
          console.error('❌ Error checking schema:', err.message);
        } else {
          console.log('📋 NEW SISWA TABLE COLUMNS:\n');
          columns.forEach((col, i) => {
            console.log(`  ${i + 1}. ${col.name.padEnd(20)} (${col.type})`);
          });

          console.log('\n✅ Schema fixed! Now you can import siswa data.');
        }

        db.close();
      });
    });
  });
});
