// Migration: Update nilai table structure
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

const run = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const queryAll = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

async function migrate() {
    const db = new sqlite3.Database(dbPath);

    try {
        console.log('Starting migration: Update nilai table structure...');

        // 1. Check current table structure
        const tableInfo = await queryAll(db, 'PRAGMA table_info(nilai)');
        const hasOldStructure = tableInfo.some(col => col.name === 'mata_pelajaran');

        if (!hasOldStructure) {
            console.log('✓ Table already has new structure, skipping migration');
            db.close();
            return;
        }

        console.log('Current table structure:', tableInfo.map(c => c.name).join(', '));

        // 2. Backup old data
        const oldData = await queryAll(db, 'SELECT * FROM nilai');
        console.log(`Found ${oldData.length} existing records`);

        // 3. Create new table
        await run(db, `CREATE TABLE IF NOT EXISTS nilai_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nisn TEXT NOT NULL,
            semester TEXT NOT NULL,
            subject TEXT NOT NULL,
            type TEXT NOT NULL,
            value TEXT,
            UNIQUE(nisn, semester, subject, type),
            FOREIGN KEY(nisn) REFERENCES siswa(nisn) ON DELETE CASCADE ON UPDATE CASCADE
        )`);
        console.log('✓ Created new table structure');

        // 4. Migrate data with mapping
        if (oldData.length > 0) {
            const stmt = db.prepare(`INSERT OR IGNORE INTO nilai_new (nisn, semester, subject, type, value) VALUES (?, ?, ?, ?, ?)`);
            let migratedCount = 0;

            for (const row of oldData) {
                try {
                    // Map old structure to new:
                    // jenis -> semester (e.g., "Semester 1" -> "9")
                    // mata_pelajaran -> subject
                    // type is new (default to "final")
                    // nilai -> value

                    const semester = row.jenis || '9'; // Default to semester 9 if not specified
                    const subject = row.mata_pelajaran || '';
                    const type = 'final'; // Default type
                    const value = row.nilai !== null && row.nilai !== undefined ? String(row.nilai) : '';

                    stmt.run(row.nisn, semester, subject, type, value);
                    migratedCount++;
                } catch (err) {
                    console.warn(`Failed to migrate record for NISN ${row.nisn}:`, err.message);
                }
            }

            stmt.finalize();
            console.log(`✓ Migrated ${migratedCount}/${oldData.length} records`);
        }

        // 5. Drop old table and rename new table
        await run(db, 'DROP TABLE nilai');
        await run(db, 'ALTER TABLE nilai_new RENAME TO nilai');
        console.log('✓ Replaced old table with new structure');

        // 6. Verify new structure
        const newTableInfo = await queryAll(db, 'PRAGMA table_info(nilai)');
        console.log('New table structure:', newTableInfo.map(c => c.name).join(', '));

        const count = await queryAll(db, 'SELECT COUNT(*) as count FROM nilai');
        console.log(`✓ Migration complete! Total records: ${count[0].count}`);

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Run migration
if (require.main === module) {
    migrate()
        .then(() => {
            console.log('\n✅ Migration successful!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = migrate;
