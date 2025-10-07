/**
 * Migration: Fix settings table schema
 * Changes from key-value pairs to school-based JSON storage
 */

const db = require('../database/database');

console.log('Running migration: fix-settings-table...');

// Drop old settings table and create new one
db.serialize(() => {
    // Backup old data if exists
    db.run(`CREATE TABLE IF NOT EXISTS settings_backup AS SELECT * FROM settings WHERE 1=0`, (err) => {
        if (!err) {
            db.run(`INSERT INTO settings_backup SELECT * FROM settings`, (err) => {
                if (err) console.log('No old settings data to backup');
            });
        }
    });

    // Drop old table
    db.run(`DROP TABLE IF EXISTS settings`, (err) => {
        if (err) {
            console.error('Error dropping old settings table:', err);
            return;
        }
        console.log('✓ Old settings table dropped');

        // Create new settings table with correct schema
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            kode_biasa TEXT PRIMARY KEY,
            settings_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating new settings table:', err);
            } else {
                console.log('✓ New settings table created with correct schema');
            }
        });
    });
});

module.exports = db;
