// Migration: Add nama_singkat column to sekolah table
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

async function run(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.run(query, params, function(err) {
            db.close();
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function get(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.get(query, params, (err, row) => {
            db.close();
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function migrate() {
    console.log('🏫 Starting migration: Add nama_singkat to sekolah table...');

    try {
        // Check if nama_singkat column already exists
        const tableInfo = await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);
            db.all("PRAGMA table_info(sekolah)", [], (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const hasNamaSingkat = tableInfo.some(col => col.name === 'nama_singkat');

        if (!hasNamaSingkat) {
            // Add nama_singkat column
            await run('ALTER TABLE sekolah ADD COLUMN nama_singkat TEXT');
            console.log('✅ Added nama_singkat column to sekolah table');
        } else {
            console.log('✅ nama_singkat column already exists in sekolah table');
        }

        console.log('✅ Migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    migrate()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}

module.exports = migrate;
