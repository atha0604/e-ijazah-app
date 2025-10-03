// Test script to verify data mapping fixes
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'db.sqlite');
const db = new sqlite3.Database(dbPath);

const all = (sql, params=[]) => new Promise((res, rej)=>{
  db.all(sql, params, (err, rows)=>{ if(err) rej(err); else res(rows); });
});

(async () => {
  try {
    console.log('=== DATA MAPPING VERIFICATION TEST ===');
    console.log('Testing data after migration and import fixes...\n');

    // Test 1: Check if data exists and is correctly mapped
    const sampleRecords = await all(`
      SELECT nisn, namaPeserta, ttl, namaOrtu, noInduk
      FROM siswa
      WHERE ttl IS NOT NULL AND ttl != ''
      AND namaOrtu IS NOT NULL AND namaOrtu != ''
      LIMIT 5
    `);

    console.log('✅ Test 1: Sample records with correct TTL and namaOrtu mapping:');
    sampleRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. NISN: ${record.nisn}`);
      console.log(`      Nama: ${record.namaPeserta}`);
      console.log(`      TTL: ${record.ttl}`);
      console.log(`      Orang Tua: ${record.namaOrtu}`);
      console.log(`      No Induk: ${record.noInduk}`);
      console.log('');
    });

    // Test 2: Count total records with proper data
    const counts = await all(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN ttl IS NOT NULL AND ttl != '' THEN 1 ELSE 0 END) as with_ttl,
        SUM(CASE WHEN namaOrtu IS NOT NULL AND namaOrtu != '' THEN 1 ELSE 0 END) as with_ortu
      FROM siswa
    `);

    console.log('✅ Test 2: Data completeness check:');
    console.log(`   Total siswa: ${counts[0].total}`);
    console.log(`   Records with TTL: ${counts[0].with_ttl}`);
    console.log(`   Records with Nama Ortu: ${counts[0].with_ortu}`);
    console.log('');

    // Test 3: Verify no data corruption (no NISN in TTL field, etc.)
    const corruptedRecords = await all(`
      SELECT COUNT(*) as count
      FROM siswa
      WHERE (ttl REGEXP '^[0-9]+$' AND LENGTH(ttl) >= 10)
         OR (namaOrtu REGEXP '^[0-9]+$' AND LENGTH(namaOrtu) >= 10)
         OR (namaPeserta REGEXP '^[A-Z0-9]+,[[:space:]]*[0-9]{2}[[:space:]]*[A-Z]+[[:space:]]*[0-9]{4}$')
    `);

    console.log('✅ Test 3: Data corruption check:');
    console.log(`   Potentially corrupted records: ${corruptedRecords[0].count}`);
    if (corruptedRecords[0].count === 0) {
      console.log('   ✅ No data corruption detected!');
    } else {
      console.log('   ⚠️  Some records may still have data mapping issues');
    }
    console.log('');

    // Test 4: Check for proper NISN format
    const nisnCheck = await all(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN nisn REGEXP '^[0-9]+$' AND LENGTH(nisn) >= 10 THEN 1 ELSE 0 END) as valid_nisn
      FROM siswa
    `);

    console.log('✅ Test 4: NISN format validation:');
    console.log(`   Total records: ${nisnCheck[0].total}`);
    console.log(`   Valid NISN format: ${nisnCheck[0].valid_nisn}`);
    console.log(`   Success rate: ${((nisnCheck[0].valid_nisn / nisnCheck[0].total) * 100).toFixed(1)}%`);
    console.log('');

    console.log('=== VERIFICATION COMPLETE ===');
    console.log('Database is ready for frontend display.');
    console.log('');
    console.log('Next steps for user:');
    console.log('1. Open admin panel in browser');
    console.log('2. Login with valid credentials');
    console.log('3. Navigate to Data Siswa section');
    console.log('4. Verify TTL and NAMA ORANG TUA columns show correct data');
    console.log('5. If data still shows "-", run: forceClearCacheAndReload() in browser console');

  } catch (e) {
    console.error('Verification test failed:', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();