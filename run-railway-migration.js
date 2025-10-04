/**
 * Run Migration on Railway
 * Script untuk menjalankan migration di Railway PostgreSQL database
 */

const fetch = require('node-fetch');

const CENTRAL_SERVER = 'https://e-ijazah-app-test.up.railway.app';

async function runMigration() {
    console.log('🔧 Running migration on Railway database...\n');

    try {
        const response = await fetch(`${CENTRAL_SERVER}/api/admin/migrate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Migration successful!');
            console.log('Tables created:', result.tables);
        } else {
            console.log('❌ Migration failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

runMigration();
