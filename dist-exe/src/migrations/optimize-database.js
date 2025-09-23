const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Script optimasi database untuk performa yang lebih baik
const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

function optimizeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('🔗 Connected to database for optimization...');
        });

        // Array of optimization queries
        const optimizations = [
            // 1. Indexes untuk tabel SISWA (query paling sering digunakan)
            {
                name: 'idx_siswa_kode_biasa',
                sql: 'CREATE INDEX IF NOT EXISTS idx_siswa_kode_biasa ON siswa(kodeBiasa)',
                description: 'Index untuk filter siswa berdasarkan kodeBiasa (sekolah)'
            },
            {
                name: 'idx_siswa_kecamatan',
                sql: 'CREATE INDEX IF NOT EXISTS idx_siswa_kecamatan ON siswa(kecamatan)',
                description: 'Index untuk filter siswa berdasarkan kecamatan'
            },
            {
                name: 'idx_siswa_nama',
                sql: 'CREATE INDEX IF NOT EXISTS idx_siswa_nama ON siswa(namaPeserta)',
                description: 'Index untuk pencarian siswa berdasarkan nama'
            },
            {
                name: 'idx_siswa_no_induk',
                sql: 'CREATE INDEX IF NOT EXISTS idx_siswa_no_induk ON siswa(noInduk)',
                description: 'Index untuk pencarian berdasarkan nomor induk'
            },

            // 2. Indexes untuk tabel NILAI (query complex untuk report)
            {
                name: 'idx_nilai_nisn_semester',
                sql: 'CREATE INDEX IF NOT EXISTS idx_nilai_nisn_semester ON nilai(nisn, semester)',
                description: 'Index untuk query nilai per siswa per semester'
            },
            {
                name: 'idx_nilai_semester_subject',
                sql: 'CREATE INDEX IF NOT EXISTS idx_nilai_semester_subject ON nilai(semester, subject)',
                description: 'Index untuk laporan per semester dan mata pelajaran'
            },
            {
                name: 'idx_nilai_type',
                sql: 'CREATE INDEX IF NOT EXISTS idx_nilai_type ON nilai(type)',
                description: 'Index untuk filter berdasarkan tipe nilai (UTS, UAS, etc)'
            },

            // 3. Indexes untuk tabel SEKOLAH
            {
                name: 'idx_sekolah_kecamatan',
                sql: 'CREATE INDEX IF NOT EXISTS idx_sekolah_kecamatan ON sekolah(kecamatan)',
                description: 'Index untuk filter sekolah berdasarkan kecamatan'
            },
            {
                name: 'idx_sekolah_npsn',
                sql: 'CREATE INDEX IF NOT EXISTS idx_sekolah_npsn ON sekolah(npsn)',
                description: 'Index untuk pencarian berdasarkan NPSN'
            },
            {
                name: 'idx_sekolah_nama',
                sql: 'CREATE INDEX IF NOT EXISTS idx_sekolah_nama ON sekolah(namaSekolahLengkap)',
                description: 'Index untuk pencarian berdasarkan nama sekolah'
            },

            // 4. Composite indexes untuk query yang kompleks
            {
                name: 'idx_siswa_sekolah_kecamatan',
                sql: 'CREATE INDEX IF NOT EXISTS idx_siswa_sekolah_kecamatan ON siswa(kodeBiasa, kecamatan)',
                description: 'Composite index untuk filter sekolah dan kecamatan'
            },
            {
                name: 'idx_nilai_complete',
                sql: 'CREATE INDEX IF NOT EXISTS idx_nilai_complete ON nilai(nisn, semester, subject, type)',
                description: 'Composite index untuk query nilai lengkap'
            }
        ];

        let completed = 0;
        const total = optimizations.length;

        console.log(`\n🚀 Memulai optimasi database dengan ${total} indexes...\n`);

        // Execute each optimization
        optimizations.forEach((opt, index) => {
            db.run(opt.sql, (err) => {
                if (err) {
                    console.error(`❌ Error creating ${opt.name}:`, err.message);
                } else {
                    console.log(`✅ ${index + 1}/${total} - ${opt.name}: ${opt.description}`);
                }

                completed++;
                if (completed === total) {
                    // Run ANALYZE to update statistics
                    db.run('ANALYZE', (err) => {
                        if (err) {
                            console.error('Error running ANALYZE:', err.message);
                        } else {
                            console.log('\n📊 Database statistics updated (ANALYZE completed)');
                        }

                        // Close database connection
                        db.close((err) => {
                            if (err) {
                                reject(err);
                            } else {
                                console.log('\n🎉 Database optimization completed successfully!');
                                console.log('\n📈 Performa query seharusnya meningkat significantly untuk:');
                                console.log('   - Filter siswa berdasarkan sekolah/kecamatan');
                                console.log('   - Pencarian siswa berdasarkan nama/NISN');
                                console.log('   - Query nilai per semester/mata pelajaran');
                                console.log('   - Laporan rekap admin');
                                resolve();
                            }
                        });
                    });
                }
            });
        });
    });
}

// Main execution
if (require.main === module) {
    optimizeDatabase()
        .then(() => {
            console.log('\n🔧 Untuk mengecek indexes yang telah dibuat, jalankan:');
            console.log('   node analyze-db.js');
            process.exit(0);
        })
        .catch((err) => {
            console.error('❌ Optimization failed:', err.message);
            process.exit(1);
        });
}

module.exports = optimizeDatabase;