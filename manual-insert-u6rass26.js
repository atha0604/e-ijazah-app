const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');

console.log('🔧 Manually inserting U6RASS26...\n');

const db = new sqlite3.Database(dbPath);

// Data from Excel row 134
const data = {
  kode_biasa: 'U6RASS26',
  kode_pro: '23C2KC32',
  kecamatan: 'NANGA PINOH',
  npsn: '69854814_U6RASS26', // Add suffix to make unique
  nama_lengkap: 'SEKOLAH DASAR SWASTA ISLAM TERPADU INSAN KAMIL',
  nama_singkat: 'SD SWASTA ISLAM TERPADU INSAN KAMIL NANGA PINOH'
};

console.log('📝 Inserting:', data);

db.run(
  `INSERT INTO sekolah (kode_biasa, kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [data.kode_biasa, data.kode_pro, data.kecamatan, data.npsn, data.nama_lengkap, data.nama_singkat],
  function(err) {
    if (err) {
      console.error('❌ Error inserting:', err.message);
    } else {
      console.log('✅ U6RASS26 inserted successfully!');
      console.log(`   Row ID: ${this.lastID}\n`);

      // Verify
      db.get('SELECT COUNT(*) as total FROM sekolah', [], (err, row) => {
        if (!err) {
          console.log(`📊 Total sekolah in DB now: ${row.total}`);
        }

        db.close(() => {
          console.log('\n✅ Done! Now you can import siswa.');
        });
      });
    }
  }
);
