/**
 * Sync All Sekolah Master Data to Railway
 * Sync data sekolah saja (tanpa siswa/nilai) agar semua sekolah muncul di dashboard
 */

const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');
const db = new sqlite3.Database(dbPath);
const CENTRAL_SERVER = 'https://e-ijazah-app-test.up.railway.app';

async function syncAllSekolah() {
    console.log('🏫 Syncing all sekolah to Railway...\n');

    try {
        // Get all sekolah from local database
        const sekolahData = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM sekolah`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log(`Found ${sekolahData.length} sekolah in local database`);

        // Sync each sekolah with its own NPSN
        let totalSynced = 0;

        for (const s of sekolahData) {
            try {
                const response = await fetch(`${CENTRAL_SERVER}/api/sync/receive`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        npsn: s.npsn,
                        sekolah: [{
                            npsn: s.npsn,
                            kode_biasa: s.kode_biasa,
                            kode_pro: s.kode_pro,
                            nama_lengkap: s.nama_lengkap || s.nama_singkat,
                            alamat: s.alamat,
                            desa: s.desa,
                            kecamatan: s.kecamatan,
                            kabupaten: s.kabupaten,
                            kurikulum: s.kurikulum || null
                        }],
                        siswa: [],
                        nilai: []
                    })
                });

                const result = await response.json();
                if (result.success) {
                    totalSynced++;
                    if (totalSynced % 50 === 0) {
                        console.log(`Synced ${totalSynced}/${sekolahData.length} sekolah...`);
                    }
                }
            } catch (error) {
                console.error(`Error syncing ${s.npsn}:`, error.message);
            }
        }

        console.log(`\n✅ Success! ${totalSynced}/${sekolahData.length} sekolah synced to Railway`);
        console.log('Sekarang semua sekolah akan muncul di dashboard Railway');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        db.close();
    }
}

syncAllSekolah();
