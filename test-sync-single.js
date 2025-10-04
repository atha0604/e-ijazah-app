/**
 * Test Single Record Sync
 * Test dengan 1 record untuk debug detail
 */

const fetch = require('node-fetch');

const CENTRAL_SERVER = 'https://e-ijazah-app-test.up.railway.app';
const TEST_NPSN = '69854814';

async function testSingleSync() {
    console.log('🧪 Testing single record sync...\n');

    const testData = {
        npsn: TEST_NPSN,
        sekolah: [{
            npsn: '69854814',
            kode_biasa: 'U6RASS26',
            kode_pro: '23C2KC32',
            nama_lengkap: 'SD SWASTA ISLAM TERPADU INSAN KAMIL',
            alamat: 'Jl. Test',
            desa: 'Desa Test',
            kecamatan: 'NANGA PINOH',
            kabupaten: 'MELAWI'
        }],
        siswa: [{
            nisn: '0128593698',
            nama: 'ACHMAD FAHRY SETIAWAN',
            jk: 'L',
            tempat_lahir: 'NANGA PINOH',
            tanggal_lahir: '2012-09-08',
            nama_ayah: 'TATO',
            nama_ibu: 'IBU TATO',
            nik: null,
            no_kk: null,
            alamat: null,
            npsn: TEST_NPSN,
            last_modified: new Date().toISOString()
        }],
        nilai: [{
            nisn: '0128593698',
            jenis: 'Semester 12',
            mata_pelajaran: 'AGAMA',
            nilai: '90',
            predikat: 'A',
            last_modified: new Date().toISOString()
        }]
    };

    try {
        console.log('Sending data:');
        console.log(JSON.stringify(testData, null, 2));
        console.log('\n---\n');

        const response = await fetch(`${CENTRAL_SERVER}/api/sync/receive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        console.log('Response status:', response.status, response.statusText);

        const text = await response.text();
        console.log('Response body:', text);

        try {
            const result = JSON.parse(text);
            console.log('\nParsed result:', JSON.stringify(result, null, 2));
        } catch (e) {
            console.log('\nCould not parse as JSON');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

testSingleSync();
