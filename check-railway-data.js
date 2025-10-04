/**
 * Check Railway Data
 * Script untuk mengecek data yang sudah masuk ke Railway
 */

const fetch = require('node-fetch');

const CENTRAL_SERVER = 'https://e-ijazah-app-test.up.railway.app';

async function checkData() {
    console.log('🔍 Checking data in Railway...\n');

    try {
        // Check sekolah
        const sekolahRes = await fetch(`${CENTRAL_SERVER}/api/admin/sekolah`);
        const sekolahData = await sekolahRes.json();

        if (sekolahData.success) {
            console.log(`Sekolah: ${sekolahData.data.length} records`);
            if (sekolahData.data.length > 0) {
                console.log('Sample:', sekolahData.data[0]);
            }
        }

        // Check stats
        const statsRes = await fetch(`${CENTRAL_SERVER}/api/admin/stats`);
        const statsData = await statsRes.json();

        if (statsData.success) {
            console.log('\n📊 Statistics:');
            console.log('  Total sekolah:', statsData.stats.total_sekolah);
            console.log('  Total siswa:', statsData.stats.total_siswa);
            console.log('  Total nilai:', statsData.stats.total_nilai);
            console.log('  Sekolah active (7d):', statsData.stats.sekolah_active);
            console.log('  Sync 24h:', statsData.stats.sync_24h);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkData();
