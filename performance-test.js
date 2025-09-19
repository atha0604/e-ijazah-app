// performance-test.js
// Script untuk testing performa database sebelum dan sesudah optimasi

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const OptimizedDatabase = require('./src/database/optimized-database');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');

// Test dengan connection biasa (cara lama)
async function testLegacyQueries() {
    console.log('🔄 Testing Legacy Database Queries...\n');

    const results = {};
    const db = new sqlite3.Database(dbPath);

    // Helper untuk legacy query
    const legacyQuery = (sql, params = []) => new Promise((resolve, reject) => {
        const start = Date.now();
        db.all(sql, params, (err, rows) => {
            const duration = Date.now() - start;
            if (err) reject(err);
            else resolve({ rows, duration });
        });
    });

    try {
        // Test 1: Get all sekolah
        console.log('📋 Test 1: Get All Sekolah');
        const test1 = await legacyQuery('SELECT * FROM sekolah');
        results.getAllSekolah = test1.duration;
        console.log(`   Legacy: ${test1.duration}ms (${test1.rows.length} records)\n`);

        // Test 2: Get siswa by sekolah
        console.log('👥 Test 2: Get Siswa by Sekolah');
        const test2 = await legacyQuery('SELECT * FROM siswa WHERE kodeBiasa = ?', ['SD001']);
        results.getSiswaBySekolah = test2.duration;
        console.log(`   Legacy: ${test2.duration}ms (${test2.rows.length} records)\n`);

        // Test 3: Get nilai with joins
        console.log('📊 Test 3: Complex Join Query (Siswa + Nilai)');
        const test3 = await legacyQuery(`
            SELECT s.nisn, s.namaPeserta, n.semester, n.subject, n.value
            FROM siswa s
            LEFT JOIN nilai n ON s.nisn = n.nisn
            WHERE s.kodeBiasa = ?
        `, ['SD001']);
        results.complexJoin = test3.duration;
        console.log(`   Legacy: ${test3.duration}ms (${test3.rows.length} records)\n`);

        // Test 4: Search siswa by name
        console.log('🔍 Test 4: Search Siswa by Name');
        const test4 = await legacyQuery(`
            SELECT * FROM siswa WHERE namaPeserta LIKE ?
        `, ['%A%']);
        results.searchSiswa = test4.duration;
        console.log(`   Legacy: ${test4.duration}ms (${test4.rows.length} records)\n`);

        // Test 5: Aggregate query
        console.log('📈 Test 5: Aggregate Query (Count by Kecamatan)');
        const test5 = await legacyQuery(`
            SELECT kecamatan, COUNT(*) as total
            FROM sekolah
            GROUP BY kecamatan
        `);
        results.aggregateQuery = test5.duration;
        console.log(`   Legacy: ${test5.duration}ms (${test5.rows.length} records)\n`);

    } catch (error) {
        console.error('Legacy test error:', error.message);
    } finally {
        db.close();
    }

    return results;
}

// Test dengan optimized database
async function testOptimizedQueries() {
    console.log('🚀 Testing Optimized Database Queries...\n');

    const results = {};

    try {
        // Test 1: Get all sekolah (dengan pagination)
        console.log('📋 Test 1: Get All Sekolah (Optimized + Pagination)');
        const start1 = Date.now();
        const test1 = await OptimizedDatabase.query(`
            SELECT kodeBiasa, kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat
            FROM sekolah
            ORDER BY namaSekolahLengkap
            LIMIT 50
        `);
        const duration1 = Date.now() - start1;
        results.getAllSekolah = duration1;
        console.log(`   Optimized: ${duration1}ms (${test1.length} records)\n`);

        // Test 2: Get siswa by sekolah (dengan index)
        console.log('👥 Test 2: Get Siswa by Sekolah (Using Index)');
        const start2 = Date.now();
        const test2 = await OptimizedDatabase.query(`
            SELECT nisn, kodeBiasa, namaPeserta, noUrut, noInduk
            FROM siswa
            WHERE kodeBiasa = ?
            ORDER BY noUrut ASC
        `, ['SD001']);
        const duration2 = Date.now() - start2;
        results.getSiswaBySekolah = duration2;
        console.log(`   Optimized: ${duration2}ms (${test2.length} records)\n`);

        // Test 3: Complex query dengan optimized indexes
        console.log('📊 Test 3: Complex Query with Optimized Indexes');
        const start3 = Date.now();
        const test3 = await OptimizedDatabase.query(`
            SELECT s.nisn, s.namaPeserta, n.semester, n.subject, n.value
            FROM siswa s
            LEFT JOIN nilai n ON s.nisn = n.nisn
            WHERE s.kodeBiasa = ?
            ORDER BY s.noUrut, n.semester, n.subject
        `, ['SD001']);
        const duration3 = Date.now() - start3;
        results.complexJoin = duration3;
        console.log(`   Optimized: ${duration3}ms (${test3.length} records)\n`);

        // Test 4: Search dengan index
        console.log('🔍 Test 4: Search Siswa by Name (Using Index)');
        const start4 = Date.now();
        const test4 = await OptimizedDatabase.query(`
            SELECT nisn, namaPeserta, kodeBiasa, noInduk
            FROM siswa
            WHERE namaPeserta LIKE ?
            ORDER BY namaPeserta
        `, ['%A%']);
        const duration4 = Date.now() - start4;
        results.searchSiswa = duration4;
        console.log(`   Optimized: ${duration4}ms (${test4.length} records)\n`);

        // Test 5: Aggregate query dengan index
        console.log('📈 Test 5: Aggregate Query (Using Index)');
        const start5 = Date.now();
        const test5 = await OptimizedDatabase.query(`
            SELECT kecamatan, COUNT(*) as total,
                   (SELECT COUNT(*) FROM siswa WHERE siswa.kecamatan = sekolah.kecamatan) as totalSiswa
            FROM sekolah
            GROUP BY kecamatan
            ORDER BY kecamatan
        `);
        const duration5 = Date.now() - start5;
        results.aggregateQuery = duration5;
        console.log(`   Optimized: ${duration5}ms (${test5.length} records)\n`);

        // Test 6: Connection pool stats
        console.log('🔗 Connection Pool Statistics:');
        const poolStats = OptimizedDatabase.getPoolStats();
        console.log(`   Total Connections: ${poolStats.totalConnections}`);
        console.log(`   Active Connections: ${poolStats.activeConnections}`);
        console.log(`   Available Connections: ${poolStats.availableConnections}\n`);

    } catch (error) {
        console.error('Optimized test error:', error.message);
    }

    return results;
}

// Bulk insert test
async function testBulkOperations() {
    console.log('📦 Testing Bulk Operations...\n');

    try {
        // Test bulk insert dengan transaction
        console.log('💾 Test: Bulk Insert Nilai (500 records)');

        const bulkData = [];
        for (let i = 0; i < 500; i++) {
            bulkData.push({
                nisn: `12345678${String(i).padStart(2, '0')}`,
                semester: 'Ganjil',
                subject: 'Matematika',
                type: 'UTS',
                value: String(Math.floor(Math.random() * 40) + 60)
            });
        }

        const start = Date.now();
        await OptimizedDatabase.bulkInsertNilai(bulkData);
        const duration = Date.now() - start;

        console.log(`   Bulk Insert: ${duration}ms (${bulkData.length} records)`);
        console.log(`   Rate: ${Math.round(bulkData.length / duration * 1000)} records/second\n`);

        // Clean up test data
        await OptimizedDatabase.run(`
            DELETE FROM nilai
            WHERE nisn LIKE '12345678%'
        `);

    } catch (error) {
        console.error('Bulk operation test error:', error.message);
    }
}

// Main performance test
async function runPerformanceTest() {
    console.log('⚡ DATABASE PERFORMANCE TEST\n');
    console.log('='.repeat(50));

    try {
        // Run legacy tests
        const legacyResults = await testLegacyQueries();

        console.log('='.repeat(50));

        // Run optimized tests
        const optimizedResults = await testOptimizedQueries();

        console.log('='.repeat(50));

        // Run bulk tests
        await testBulkOperations();

        console.log('='.repeat(50));

        // Performance comparison
        console.log('📊 PERFORMANCE COMPARISON:\n');

        const tests = [
            'getAllSekolah',
            'getSiswaBySekolah',
            'complexJoin',
            'searchSiswa',
            'aggregateQuery'
        ];

        tests.forEach(test => {
            const legacy = legacyResults[test] || 0;
            const optimized = optimizedResults[test] || 0;
            const improvement = legacy > 0 ? ((legacy - optimized) / legacy * 100) : 0;

            console.log(`${test}:`);
            console.log(`   Legacy: ${legacy}ms`);
            console.log(`   Optimized: ${optimized}ms`);
            console.log(`   Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%\n`);
        });

        console.log('✅ Performance test completed!');

    } catch (error) {
        console.error('❌ Performance test failed:', error.message);
    } finally {
        // Close optimized database pool
        await OptimizedDatabase.closePool();
    }
}

// Run test if called directly
if (require.main === module) {
    runPerformanceTest()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Test failed:', err);
            process.exit(1);
        });
}

module.exports = { runPerformanceTest };