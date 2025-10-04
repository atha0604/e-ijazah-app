/**
 * Debug Sync Data
 * Script untuk melihat data yang akan dikirim saat sync
 */

const fetch = require('node-fetch');

const SCHOOL_SERVER = 'http://localhost:3000';
const TEST_NPSN = '69854814';

async function debugSyncData() {
    console.log('🔍 Debugging sync data...\n');

    try {
        // Get unsynced data
        const response = await fetch(`${SCHOOL_SERVER}/api/sync/unsynced?npsn=${TEST_NPSN}`);
        const data = await response.json();

        if (!data.success) {
            console.error('❌ Error:', data.error);
            return;
        }

        console.log('Total records:', data.totalRecords);
        console.log('Breakdown:', data.breakdown);

        // Get actual unsynced data with sample
        const SyncService = require('./src/services/sync-service');
        const unsyncedData = await SyncService.getUnsyncedData(TEST_NPSN);

        console.log('\n📊 Sample Data:\n');

        if (unsyncedData.sekolah.length > 0) {
            console.log('Sekolah (first record):');
            console.log(JSON.stringify(unsyncedData.sekolah[0], null, 2));
        }

        if (unsyncedData.siswa.length > 0) {
            console.log('\nSiswa (first record):');
            console.log(JSON.stringify(unsyncedData.siswa[0], null, 2));
        }

        if (unsyncedData.nilai.length > 0) {
            console.log('\nNilai (first record):');
            console.log(JSON.stringify(unsyncedData.nilai[0], null, 2));
        }

        console.log('\n✅ Debug complete');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugSyncData();
