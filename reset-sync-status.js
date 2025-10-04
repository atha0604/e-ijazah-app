/**
 * Reset Sync Status
 * Script untuk reset status sinkronisasi agar bisa test ulang
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Resetting sync status...\n');

db.serialize(() => {
    // Reset synced_at untuk SEMUA sekolah (atau bisa dibatasi dengan limit)
    db.run(`UPDATE sekolah SET synced_at = NULL`, (err) => {
        if (err) {
            console.error('Error reset sekolah:', err);
        } else {
            console.log(`✅ Reset SEMUA sekolah sync status`);
        }
    });

    // Reset sebagian siswa dari SEMUA sekolah (10 siswa per sekolah)
    db.all(`SELECT DISTINCT kode_biasa FROM sekolah`, (err, sekolahList) => {
        if (err) {
            console.error('Error getting sekolah list:', err);
            return;
        }

        console.log(`📚 Reset siswa untuk ${sekolahList.length} sekolah...`);

        sekolahList.forEach(sekolah => {
            const kodeBiasa = sekolah.kode_biasa;

            // Reset 10 siswa per sekolah
            db.run(`
                UPDATE siswa SET synced_at = NULL
                WHERE nisn IN (
                    SELECT nisn FROM siswa
                    WHERE kode_biasa = ?
                    LIMIT 10
                )
            `, [kodeBiasa], (err) => {
                if (err) {
                    console.error(`Error reset siswa ${kodeBiasa}:`, err);
                }
            });

            // Reset nilai untuk siswa tersebut
            db.run(`
                UPDATE nilai SET synced_at = NULL
                WHERE nisn IN (
                    SELECT nisn FROM siswa
                    WHERE kode_biasa = ?
                    LIMIT 10
                )
            `, [kodeBiasa], (err) => {
                if (err) {
                    console.error(`Error reset nilai ${kodeBiasa}:`, err);
                }
            });
        });
    });

    // Show unsynced count
    setTimeout(() => {
        db.all(`
            SELECT
                (SELECT COUNT(*) FROM sekolah WHERE synced_at IS NULL OR last_modified > synced_at) as sekolah,
                (SELECT COUNT(*) FROM siswa WHERE synced_at IS NULL OR last_modified > synced_at) as siswa,
                (SELECT COUNT(*) FROM nilai WHERE synced_at IS NULL OR last_modified > synced_at) as nilai
        `, (err, rows) => {
            if (err) {
                console.error('Error:', err);
            } else {
                console.log('\n📊 Unsynced Data:');
                console.log('  Sekolah:', rows[0].sekolah);
                console.log('  Siswa:', rows[0].siswa);
                console.log('  Nilai:', rows[0].nilai);
                console.log('  Total:', rows[0].sekolah + rows[0].siswa + rows[0].nilai);
            }
            db.close();
        });
    }, 500);
});
