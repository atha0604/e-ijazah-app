/**
 * Run Database Migration
 * Execute schema.sql on PostgreSQL via Railway
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🔄 Starting database migration...');

    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found!');
        console.error('Make sure you run this via: railway run node run-migration.js');
        process.exit(1);
    }

    // Create connection pool
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // Read schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('📄 Reading schema.sql...');
        console.log('🔗 Connecting to database...');

        // Execute migration
        await pool.query(schemaSql);

        console.log('✅ Migration completed successfully!');
        console.log('📊 Tables created:');
        console.log('   - sekolah_master');
        console.log('   - siswa_pusat');
        console.log('   - nilai_pusat');
        console.log('   - sync_logs');
        console.log('🎯 Indexes and views created!');

        // Verify tables
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log('\n📋 Database tables:');
        result.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migration
runMigration();
