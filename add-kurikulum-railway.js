/**
 * Add kurikulum column to Railway database
 */

const fetch = require('node-fetch');

const CENTRAL_SERVER = 'https://e-ijazah-app-test.up.railway.app';

async function addKurikulumColumn() {
    console.log('🔧 Adding kurikulum column to sekolah_master...\n');

    try {
        const response = await fetch(`${CENTRAL_SERVER}/api/admin/run-sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sql: 'ALTER TABLE sekolah_master ADD COLUMN IF NOT EXISTS kurikulum TEXT'
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Column added successfully!');
        } else {
            console.log('Result:', result);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

addKurikulumColumn();
