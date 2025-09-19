const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Menganalisis struktur database...\n');

// Get all tables
db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('📋 STRUKTUR TABEL:\n');
    rows.forEach(row => {
        console.log(`=== TABLE: ${row.name.toUpperCase()} ===`);
        console.log(row.sql);
        console.log('');
    });

    // Get indexes
    db.all("SELECT name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL", (err, indexes) => {
        if (err) {
            console.error('Error getting indexes:', err);
            return;
        }

        console.log('\n📈 INDEX YANG ADA:\n');
        if (indexes.length === 0) {
            console.log('❌ Tidak ada custom indexes yang ditemukan!');
        } else {
            indexes.forEach(index => {
                console.log(`INDEX: ${index.name}`);
                console.log(index.sql);
                console.log('');
            });
        }

        // Get table stats
        console.log('\n📊 STATISTIK TABEL:\n');
        const tables = rows.map(r => r.name).filter(name => !name.startsWith('sqlite_'));

        let completed = 0;
        tables.forEach(tableName => {
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, result) => {
                if (!err) {
                    console.log(`${tableName}: ${result.count} records`);
                }
                completed++;
                if (completed === tables.length) {
                    db.close();
                    console.log('\n✅ Analisis database selesai!');
                }
            });
        });
    });
});