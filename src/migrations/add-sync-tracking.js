/**
 * Migration: Add Sync Tracking Columns
 * Adds last_modified, synced_at, and is_deleted columns to all tables
 * for synchronization tracking between school apps and central server
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

async function up() {
    const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');
    const db = new sqlite3.Database(dbPath);

    console.log('Adding sync tracking columns...');

    try {
        await run(db, 'BEGIN TRANSACTION');

        // Add tracking columns to sekolah table
        await run(db, `ALTER TABLE sekolah ADD COLUMN last_modified TEXT`);
        await run(db, `ALTER TABLE sekolah ADD COLUMN synced_at TEXT`);
        await run(db, `ALTER TABLE sekolah ADD COLUMN is_deleted INTEGER DEFAULT 0`);
        await run(db, `UPDATE sekolah SET last_modified = datetime('now') WHERE last_modified IS NULL`);

        // Add tracking columns to siswa table
        await run(db, `ALTER TABLE siswa ADD COLUMN last_modified TEXT`);
        await run(db, `ALTER TABLE siswa ADD COLUMN synced_at TEXT`);
        await run(db, `ALTER TABLE siswa ADD COLUMN is_deleted INTEGER DEFAULT 0`);
        await run(db, `UPDATE siswa SET last_modified = datetime('now') WHERE last_modified IS NULL`);

        // Add tracking columns to nilai table
        await run(db, `ALTER TABLE nilai ADD COLUMN last_modified TEXT`);
        await run(db, `ALTER TABLE nilai ADD COLUMN synced_at TEXT`);
        await run(db, `ALTER TABLE nilai ADD COLUMN is_deleted INTEGER DEFAULT 0`);
        await run(db, `UPDATE nilai SET last_modified = datetime('now') WHERE last_modified IS NULL`);

        // Create sync_log table to track synchronization history
        await run(db, `
            CREATE TABLE IF NOT EXISTS sync_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sync_type TEXT NOT NULL,
                records_synced INTEGER DEFAULT 0,
                status TEXT NOT NULL,
                error_message TEXT,
                synced_at TEXT DEFAULT (datetime('now'))
            )
        `);

        // Create triggers to auto-update last_modified

        // Trigger for sekolah UPDATE
        await run(db, `
            CREATE TRIGGER IF NOT EXISTS update_sekolah_last_modified
            AFTER UPDATE ON sekolah
            FOR EACH ROW
            BEGIN
                UPDATE sekolah SET last_modified = datetime('now') WHERE id = NEW.id;
            END
        `);

        // Trigger for siswa UPDATE
        await run(db, `
            CREATE TRIGGER IF NOT EXISTS update_siswa_last_modified
            AFTER UPDATE ON siswa
            FOR EACH ROW
            BEGIN
                UPDATE siswa SET last_modified = datetime('now') WHERE nisn = NEW.nisn;
            END
        `);

        // Trigger for nilai UPDATE
        await run(db, `
            CREATE TRIGGER IF NOT EXISTS update_nilai_last_modified
            AFTER UPDATE ON nilai
            FOR EACH ROW
            BEGIN
                UPDATE nilai SET last_modified = datetime('now') WHERE id = NEW.id;
            END
        `);

        await run(db, 'COMMIT');
        console.log('✅ Sync tracking columns added successfully');

        db.close();
        return true;

    } catch (error) {
        await run(db, 'ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        db.close();
        throw error;
    }
}

async function down() {
    const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');
    const db = new sqlite3.Database(dbPath);

    console.log('Removing sync tracking columns...');

    try {
        await run(db, 'BEGIN TRANSACTION');

        // Drop triggers
        await run(db, 'DROP TRIGGER IF EXISTS update_sekolah_last_modified');
        await run(db, 'DROP TRIGGER IF EXISTS update_siswa_last_modified');
        await run(db, 'DROP TRIGGER IF EXISTS update_nilai_last_modified');

        // Note: SQLite doesn't support DROP COLUMN, would need to recreate tables
        // For now, we'll just drop the sync_log table
        await run(db, 'DROP TABLE IF EXISTS sync_log');

        await run(db, 'COMMIT');
        console.log('✅ Sync tracking removed successfully');

        db.close();
        return true;

    } catch (error) {
        await run(db, 'ROLLBACK');
        console.error('❌ Rollback failed:', error.message);
        db.close();
        throw error;
    }
}

module.exports = { up, down };

// Run migration if called directly
if (require.main === module) {
    up().then(() => {
        console.log('Migration completed');
        process.exit(0);
    }).catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
