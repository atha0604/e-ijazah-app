/**
 * Clean Railway Data - Delete siswa dan nilai untuk re-sync
 * Karena ada bug sync yang menyebabkan siswa ter-assign ke NPSN yang salah
 */

const fetch = require('node-fetch');

const CENTRAL_SERVER = 'https://e-ijazah-app-test.up.railway.app';

async function cleanRailwayData() {
    console.log('⚠️  WARNING: Script ini akan menghapus SEMUA data siswa dan nilai di Railway!');
    console.log('Data sekolah (sekolah_master) tidak akan dihapus.\n');

    console.log('Setelah cleanup, Anda perlu:');
    console.log('1. Restart local server (agar code baru aktif)');
    console.log('2. Login sekolah 69854814 dengan kurikulum Merdeka');
    console.log('3. Sync ulang data dari panel sekolah\n');

    console.log('Press Ctrl+C dalam 5 detik untuk batalkan...\n');

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔴 Melanjutkan cleanup...\n');

    try {
        const response = await fetch(`${CENTRAL_SERVER}/api/admin/cleanup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Cleanup berhasil!');
            console.log(`   Dihapus: ${result.deleted.siswa} siswa, ${result.deleted.nilai} nilai\n`);
            console.log('Sekarang:');
            console.log('1. Restart local server: Ctrl+C lalu npm start');
            console.log('2. Login sekolah 69854814 dengan Kurikulum Merdeka');
            console.log('3. Buka menu Sinkronisasi → Sync ke server');
        } else {
            console.error('❌ Cleanup gagal:', result.error);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

cleanRailwayData();
