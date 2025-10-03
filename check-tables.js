// Check apa saja tabel yang ada di database

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cek kedua file database
const dbPath1 = path.join(__dirname, 'src', 'database', 'database.sqlite');
const dbPath2 = path.join(__dirname, 'src', 'database', 'db.sqlite');

console.log('📂 Checking both database files:\n');

// Check db.sqlite first
const dbPath = dbPath2;
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking database:', dbPath);
console.log('\n📋 Tables in database:\n');

db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`, [], (err, tables) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }

    if (tables.length === 0) {
        console.log('  (No tables found)');
    } else {
        tables.forEach(table => {
            console.log(`  - ${table.name}`);
        });
    }

    console.log('\n📊 Table structures:\n');

    let processed = 0;
    tables.forEach(table => {
        db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
            if (!err) {
                console.log(`\n📋 Table: ${table.name}`);
                console.log('   Columns:');
                columns.forEach(col => {
                    console.log(`   - ${col.name} (${col.type})`);
                });
            }

            processed++;
            if (processed === tables.length) {
                db.close();
            }
        });
    });
});
