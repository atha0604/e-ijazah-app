const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');

console.log('🔍 Checking what is kode 133...\n');

const db = new sqlite3.Database(dbPath);

// Check if 133 is kode_biasa
db.get('SELECT * FROM sekolah WHERE kode_biasa = ?', ['133'], (err, row) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else if (row) {
    console.log('✅ Found sekolah with kode_biasa = "133":');
    console.log('  NPSN:', row.npsn);
    console.log('  Nama:', row.nama_lengkap);
    console.log('  Kecamatan:', row.kecamatan);

    // Check siswa for this school
    db.all('SELECT COUNT(*) as total FROM siswa WHERE kode_biasa = ?', ['133'], (err, rows) => {
      if (!err) {
        console.log('  Total siswa:', rows[0].total);
      }
    });
  } else {
    console.log('❌ No sekolah with kode_biasa = "133"');
  }

  // Check if 133 is NPSN
  db.get('SELECT * FROM sekolah WHERE npsn = ?', ['133'], (err, row) => {
    if (!err && row) {
      console.log('\n✅ Found sekolah with NPSN = "133":');
      console.log('  KODE BIASA:', row.kode_biasa);
      console.log('  Nama:', row.nama_lengkap);
    }

    // Check if 133 is ID
    db.get('SELECT * FROM sekolah WHERE id = ?', [133], (err, row) => {
      if (!err && row) {
        console.log('\n✅ Found sekolah with ID = 133:');
        console.log('  KODE BIASA:', row.kode_biasa);
        console.log('  NPSN:', row.npsn);
        console.log('  Nama:', row.nama_lengkap);

        // Check siswa
        db.all('SELECT COUNT(*) as total FROM siswa WHERE kode_biasa = ?', [row.kode_biasa], (err, rows) => {
          if (!err) {
            console.log('  Total siswa for this school:', rows[0].total);
          }

          db.close();
        });
      } else {
        db.close();
      }
    });
  });
});
