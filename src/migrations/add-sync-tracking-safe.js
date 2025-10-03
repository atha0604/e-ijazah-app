/**
 * Safe Migration: Add Sync Tracking Columns
 * Cek dulu apakah kolom sudah ada sebelum menambahkan
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function get(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function all(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function columnExists(db, tableName, columnName) {
    const result = await all(db, `PRAGMA table_info(${tableName})`);
    return result.some(col => col.name === columnName);
}

async function up() {
    const dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');
    const db = new sqlite3.Database(dbPath);

    console.log('🔍 Checking sync tracking columns...\n');

    try {
        await run(db, 'BEGIN TRANSACTION');

        // === SEKOLAH TABLE ===
        console.log('📋 Checking table: sekolah');

        if (!(await columnExists(db, 'sekolah', 'last_modified'))) {
            await run(db, `ALTER TABLE sekolah ADD COLUMN last_modified TEXT`);
            console.log('  ✅ Added: last_modified');
        } else {
            console.log('  ⏭️  Skipped: last_modified (already exists)');
        }

        if (!(await columnExists(db, 'sekolah', 'synced_at'))) {
            await run(db, `ALTER TABLE sekolah ADD COLUMN synced_at TEXT`);
            console.log('  ✅ Added: synced_at');
        } else {
            console.log('  ⏭️  Skipped: synced_at (already exists)');
        }

        if (!(await columnExists(db, 'sekolah', 'is_deleted'))) {
            await run(db, `ALTER TABLE sekolah ADD COLUMN is_deleted INTEGER DEFAULT 0`);
            console.log('  ✅ Added: is_deleted');
        } else {
            console.log('  ⏭️  Skipped: is_deleted (already exists)');
        }

        // Update existing records
        await run(db, `UPDATE sekolah SET last_modified = datetime('now') WHERE last_modified IS NULL`);

        // === SISWA TABLE ===
        console.log('\n📋 Checking table: siswa');

        if (!(await columnExists(db, 'siswa', 'last_modified'))) {
            await run(db, `ALTER TABLE siswa ADD COLUMN last_modified TEXT`);
            console.log('  ✅ Added: last_modified');
        } else {
            console.log('  ⏭️  Skipped: last_modified (already exists)');
        }

        if (!(await columnExists(db, 'siswa', 'synced_at'))) {
            await run(db, `ALTER TABLE siswa ADD COLUMN synced_at TEXT`);
            console.log('  ✅ Added: synced_at');
        } else {
            console.log('  ⏭️  Skipped: synced_at (already exists)');
        }

        if (!(await columnExists(db, 'siswa', 'is_deleted'))) {
            await run(db, `ALTER TABLE siswa ADD COLUMN is_deleted INTEGER DEFAULT 0`);
            console.log('  ✅ Added: is_deleted');
        } else {
            console.log('  ⏭️  Skipped: is_deleted (already exists)');
        }

        await run(db, `UPDATE siswa SET last_modified = datetime('now') WHERE last_modified IS NULL`);

        // === NILAI TABLE ===
        console.log('\n📋 Checking table: nilai');

        if (!(await columnExists(db, 'nilai', 'last_modified'))) {
            await run(db, `ALTER TABLE nilai ADD COLUMN last_modified TEXT`);
            console.log('  ✅ Added: last_modified');
        } else {
            console.log('  ⏭️  Skipped: last_modified (already exists)');
        }

        if (!(await columnExists(db, 'nilai', 'synced_at'))) {
            await run(db, `ALTER TABLE nilai ADD COLUMN synced_at TEXT`);
            console.log('  ✅ Added: synced_at');
        } else {
            console.log('  ⏭️  Skipped: synced_at (already exists)');
        }

        if (!(await columnExists(db, 'nilai', 'is_deleted'))) {
            await run(db, `ALTER TABLE nilai ADD COLUMN is_deleted INTEGER DEFAULT 0`);
            console.log('  ✅ Added: is_deleted');
        } else {
            console.log('  ⏭️  Skipped: is_deleted (already exists)');
        }

        await run(db, `UPDATE nilai SET last_modified = datetime('now') WHERE last_modified IS NULL`);

        // === SYNC_LOG TABLE ===
        console.log('\n📋 Checking table: sync_log');

        const tableExists = await all(db, `SELECT name FROM sqlite_master WHERE type='table' AND name='sync_log'`);

        if (tableExists.length === 0) {
            await run(db, `
                CREATE TABLE sync_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sync_type TEXT NOT NULL,
                    records_synced INTEGER DEFAULT 0,
                    status TEXT NOT NULL,
                    error_message TEXT,
                    synced_at TEXT DEFAULT (datetime('now'))
                )
            `);
            console.log('  ✅ Created: sync_log table');
        } else {
            console.log('  ⏭️  Skipped: sync_log table (already exists)');
        }

        // === TRIGGERS ===
        console.log('\n🔧 Creating triggers...');

        // Drop existing triggers first (if any)
        await run(db, `DROP TRIGGER IF EXISTS update_sekolah_last_modified`);
        await run(db, `DROP TRIGGER IF EXISTS update_siswa_last_modified`);
        await run(db, `DROP TRIGGER IF EXISTS update_nilai_last_modified`);

        // Sekolah trigger
        await run(db, `
            CREATE TRIGGER update_sekolah_last_modified
            AFTER UPDATE ON sekolah
            FOR EACH ROW
            BEGIN
                UPDATE sekolah SET last_modified = datetime('now') WHERE id = NEW.id;
            END
        `);
        console.log('  ✅ Created trigger: update_sekolah_last_modified');

        // Siswa trigger
        await run(db, `
            CREATE TRIGGER update_siswa_last_modified
            AFTER UPDATE ON siswa
            FOR EACH ROW
            BEGIN
                UPDATE siswa SET last_modified = datetime('now') WHERE nisn = NEW.nisn;
            END
        `);
        console.log('  ✅ Created trigger: update_siswa_last_modified');

        // Nilai trigger
        await run(db, `
            CREATE TRIGGER update_nilai_last_modified
            AFTER UPDATE ON nilai
            FOR EACH ROW
            BEGIN
                UPDATE nilai SET last_modified = datetime('now') WHERE id = NEW.id;
            END
        `);
        console.log('  ✅ Created trigger: update_nilai_last_modified');

        await run(db, 'COMMIT');

        console.log('\n✅ Migration completed successfully!\n');

        db.close();
        return true;

    } catch (error) {
        await run(db, 'ROLLBACK');
        console.error('\n❌ Migration failed:', error.message);
        db.close();
        throw error;
    }
}

// Run migration
if (require.main === module) {
    up().then(() => {
        console.log('🎉 All done! Your database is ready for sync.');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
}

module.exports = { up };
