/**
 * Test Sync Function
 * Script untuk test fungsi sinkronisasi
 */

const fetch = require('node-fetch');

// Configuration
const SCHOOL_SERVER = 'http://localhost:3000';
const CENTRAL_SERVER = 'https://e-ijazah-app-test.up.railway.app';
const TEST_NPSN = '69854814'; // Ganti dengan NPSN sekolah Anda

async function testSyncFunction() {
    console.log('🧪 Testing Sync Function\n');
    console.log('School Server:', SCHOOL_SERVER);
    console.log('Central Server:', CENTRAL_SERVER);
    console.log('NPSN:', TEST_NPSN);
    console.log('='.repeat(60));

    try {
        // 1. Test koneksi ke central server
        console.log('\n1️⃣ Testing connection to central server...');
        const testResponse = await fetch(`${SCHOOL_SERVER}/api/sync/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serverUrl: CENTRAL_SERVER })
        });
        const testResult = await testResponse.json();

        if (testResult.success) {
            console.log('   ✅ Connection successful!');
            console.log('   Server status:', JSON.stringify(testResult.serverStatus, null, 2));
        } else {
            console.log('   ❌ Connection failed:', testResult.error);
            return;
        }

        // 2. Cek data belum tersinkron
        console.log('\n2️⃣ Checking unsynced data...');
        const unsyncedResponse = await fetch(`${SCHOOL_SERVER}/api/sync/unsynced?npsn=${TEST_NPSN}`);
        const unsyncedData = await unsyncedResponse.json();

        if (unsyncedData.success) {
            console.log('   Total unsynced records:', unsyncedData.totalRecords);
            console.log('   Breakdown:');
            console.log('     - Sekolah:', unsyncedData.breakdown.sekolah);
            console.log('     - Siswa:', unsyncedData.breakdown.siswa);
            console.log('     - Nilai:', unsyncedData.breakdown.nilai);
        } else {
            console.log('   ❌ Error:', unsyncedData.error);
            return;
        }

        if (unsyncedData.totalRecords === 0) {
            console.log('\n   ℹ️  No data to sync. All data is up-to-date.');
            return;
        }

        // 3. Sync ke server pusat
        console.log('\n3️⃣ Syncing data to central server...');
        const syncResponse = await fetch(`${SCHOOL_SERVER}/api/sync/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serverUrl: CENTRAL_SERVER,
                npsn: TEST_NPSN
            })
        });
        const syncResult = await syncResponse.json();

        if (syncResult.success) {
            console.log('   ✅ Sync successful!');
            console.log('   Records synced:', syncResult.synced);
            if (syncResult.serverResponse) {
                console.log('   Server response:', JSON.stringify(syncResult.serverResponse, null, 2));
            }
        } else {
            console.log('   ❌ Sync failed:', syncResult.error);
            return;
        }

        // 4. Verify sync
        console.log('\n4️⃣ Verifying sync...');
        const verifyResponse = await fetch(`${SCHOOL_SERVER}/api/sync/unsynced?npsn=${TEST_NPSN}`);
        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
            console.log('   Remaining unsynced records:', verifyData.totalRecords);
            if (verifyData.totalRecords === 0) {
                console.log('   ✅ All data successfully synced!');
            } else {
                console.log('   ⚠️  Some data still unsynced');
            }
        }

        // 5. Check sync history
        console.log('\n5️⃣ Checking sync history...');
        const historyResponse = await fetch(`${SCHOOL_SERVER}/api/sync/history?limit=5`);
        const historyData = await historyResponse.json();

        if (historyData.success && historyData.history.length > 0) {
            console.log('   Recent sync history:');
            historyData.history.forEach((h, i) => {
                console.log(`   ${i + 1}. ${h.synced_at} - ${h.sync_type} - ${h.status} (${h.records_synced} records)`);
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Test completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run test
testSyncFunction();
