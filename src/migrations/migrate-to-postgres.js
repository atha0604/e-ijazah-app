#!/usr/bin/env node
/**
 * Migration Script: SQLite to PostgreSQL
 *
 * This script migrates all data from SQLite to PostgreSQL
 *
 * Usage:
 *   node src/migrations/migrate-to-postgres.js
 *
 * Prerequisites:
 *   1. PostgreSQL database must be created
 *   2. Run postgresql-schema.sql on PostgreSQL first
 *   3. Set DATABASE_URL in .env file
 */

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Configuration
const sqliteDbPath = path.join(__dirname, '..', 'database', 'db.sqlite');
const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
    console.error('❌ ERROR: DATABASE_URL not set in environment variables');
    console.error('Please set DATABASE_URL in your .env file');
    console.error('Example: DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    process.exit(1);
}

if (!fs.existsSync(sqliteDbPath)) {
    console.error('❌ ERROR: SQLite database not found at:', sqliteDbPath);
    process.exit(1);
}

// Setup connections
const sqliteDb = new sqlite3.Database(sqliteDbPath);
const pgPool = new Pool({ connectionString: postgresUrl });

// Helper: Convert SQLite row to PostgreSQL compatible format
function convertValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'boolean') return value;
    return value;
}

// Helper: Get all rows from SQLite table
function getSqliteRows(tableName) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
            if (err) {
                // Table might not exist
                console.log(`⚠️  Table ${tableName} not found in SQLite, skipping...`);
                resolve([]);
            } else {
                resolve(rows || []);
            }
        });
    });
}

// Helper: Insert rows into PostgreSQL
async function insertPgRows(tableName, rows, columns) {
    if (rows.length === 0) {
        console.log(`  No data to migrate for ${tableName}`);
        return 0;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
        try {
            const values = columns.map(col => convertValue(row[col]));
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

            await pgPool.query(sql, values);
            successCount++;
        } catch (error) {
            errorCount++;
            console.error(`  ⚠️  Error inserting row into ${tableName}:`, error.message);
        }
    }

    return successCount;
}

// Main migration function
async function migrate() {
    console.log('🚀 Starting migration from SQLite to PostgreSQL...\n');

    try {
        // Test PostgreSQL connection
        await pgPool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connection successful\n');

        // Migration plan: table name -> columns to migrate
        const tables = [
            {
                name: 'users',
                columns: ['username', 'password', 'login_code', 'role']
            },
            {
                name: 'sekolah',
                columns: ['kodeBiasa', 'kodePro', 'kecamatan', 'npsn', 'namaSekolahLengkap', 'namaSekolahSingkat']
            },
            {
                name: 'siswa',
                columns: ['nisn', 'kodeBiasa', 'kodePro', 'namaSekolah', 'kecamatan', 'noUrut', 'noInduk', 'noPeserta', 'namaPeserta', 'ttl', 'namaOrtu', 'noIjazah', 'foto']
            },
            {
                name: 'nilai',
                columns: ['nisn', 'semester', 'subject', 'type', 'value']
            },
            {
                name: 'settings',
                columns: ['kodeBiasa', 'settings_json']
            },
            {
                name: 'skl_photos',
                columns: ['nisn', 'photo_data']
            },
            {
                name: 'mulok_names',
                columns: ['kodeBiasa', 'mulok_key', 'mulok_name']
            },
            {
                name: 'notifications',
                columns: ['message', 'type', 'sender_id', 'recipient_scope', 'recipient_id', 'created_at', 'expires_at']
            },
            {
                name: 'notification_reads',
                columns: ['notification_id', 'user_id', 'read_at']
            },
            {
                name: 'audit_logs',
                columns: ['user_type', 'user_identifier', 'action', 'target_table', 'target_id', 'old_data', 'new_data', 'ip_address', 'user_agent', 'timestamp', 'session_id', 'additional_info']
            }
        ];

        let totalMigrated = 0;

        // Migrate each table
        for (const table of tables) {
            console.log(`📊 Migrating table: ${table.name}`);

            const rows = await getSqliteRows(table.name);
            console.log(`  Found ${rows.length} rows`);

            const migrated = await insertPgRows(table.name, rows, table.columns);
            console.log(`  ✅ Migrated ${migrated} rows\n`);

            totalMigrated += migrated;
        }

        console.log('═══════════════════════════════════════');
        console.log(`🎉 Migration completed successfully!`);
        console.log(`📈 Total rows migrated: ${totalMigrated}`);
        console.log('═══════════════════════════════════════\n');

        console.log('🔄 Next steps:');
        console.log('1. Verify data in PostgreSQL database');
        console.log('2. Update .env with DATABASE_URL (if not already set)');
        console.log('3. Test your application with PostgreSQL');
        console.log('4. Keep SQLite backup until everything is verified');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        // Close connections
        sqliteDb.close();
        await pgPool.end();
    }
}

// Run migration
if (require.main === module) {
    migrate()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { migrate };
