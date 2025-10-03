#!/usr/bin/env node

/**
 * Database Migration Runner
 *
 * Runs all database migrations in proper order
 * Safe to run multiple times (idempotent)
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');
const migrationsDir = path.join(__dirname, 'src', 'migrations');

console.log('='.repeat(80));
console.log('DATABASE MIGRATION RUNNER');
console.log('='.repeat(80));
console.log();

// Check if database exists
const dbExists = fs.existsSync(dbPath);
if (!dbExists) {
    console.log('⚠️  Database does not exist yet.');
    console.log('📝 Run setup first: node src/setup.js');
    console.log();
    process.exit(1);
}

// Migration order (important!)
const migrationOrder = [
    'optimize-database.js',
    'create-audit-log.js',
    'add-notifications-table.js',
    // Add more migrations here in order
];

async function runMigrations() {
    console.log(`📂 Database: ${dbPath}`);
    console.log(`📁 Migrations directory: ${migrationsDir}`);
    console.log();

    // Check which migrations are available
    const availableMigrations = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.js'))
        .filter(file => !file.includes('fix-') && !file.includes('BACKUP'));

    console.log('📋 Available migrations:');
    availableMigrations.forEach(file => {
        console.log(`   - ${file}`);
    });
    console.log();

    // Run migrations in order
    console.log('🚀 Running migrations...');
    console.log();

    for (const migrationFile of migrationOrder) {
        const migrationPath = path.join(migrationsDir, migrationFile);

        if (!fs.existsSync(migrationPath)) {
            console.log(`⏭️  Skipping ${migrationFile} (not found)`);
            continue;
        }

        try {
            console.log(`▶️  Running: ${migrationFile}`);

            const migration = require(migrationPath);

            if (typeof migration === 'function') {
                await migration();
                console.log(`✅ Completed: ${migrationFile}`);
            } else {
                console.log(`⚠️  ${migrationFile} does not export a function`);
            }

            console.log();
        } catch (error) {
            console.error(`❌ Error in ${migrationFile}:`, error.message);
            console.log();

            // Continue with other migrations
            // Don't exit - some migrations might be already applied
        }
    }

    console.log('='.repeat(80));
    console.log('✅ MIGRATION RUNNER COMPLETED');
    console.log('='.repeat(80));
    console.log();
    console.log('Next steps:');
    console.log('1. Verify indexes: node analyze-db.js');
    console.log('2. Start server: npm start');
    console.log();
}

// Run migrations
runMigrations()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration runner failed:', error);
        process.exit(1);
    });