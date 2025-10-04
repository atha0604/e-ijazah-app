/**
 * Test Sync with Debug
 */

const fetch = require('node-fetch');

const SCHOOL_SERVER = 'http://localhost:3000';
const CENTRAL_SERVER = 'https://e-ijazah-app-test.up.railway.app';
const TEST_NPSN = '69854814';

async function testSyncDebug() {
    console.log('🧪 Testing Sync with Debug...\n');

    try {
        // 1. Get unsynced count
        console.log('1️⃣ Getting unsynced count...');
        const unsyncedRes = await fetch(`${SCHOOL_SERVER}/api/sync/unsynced?npsn=${TEST_NPSN}`);
        const unsyncedData = await unsyncedRes.json();
        console.log('Unsynced:', unsyncedData);

        if (unsyncedData.totalRecords === 0) {
            console.log('No data to sync');
            return;
        }

        // 2. Perform sync
        console.log('\n2️⃣ Performing sync...');
        const syncRes = await fetch(`${SCHOOL_SERVER}/api/sync/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serverUrl: CENTRAL_SERVER,
                npsn: TEST_NPSN,
                batchSize: 10 // Small batch for testing
            })
        });

        const syncResult = await syncRes.json();
        console.log('Sync result:', JSON.stringify(syncResult, null, 2));

        // 3. Check if errors
        if (!syncResult.success) {
            console.log('\n❌ Sync failed:', syncResult.error);
        } else {
            console.log('\n✅ Sync success!');
            console.log('Total synced:', syncResult.synced);
            console.log('Batches:', syncResult.batches);
            if (syncResult.errors) {
                console.log('Errors:', syncResult.errors);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

testSyncDebug();
