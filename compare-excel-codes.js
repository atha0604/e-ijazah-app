const XLSX = require('xlsx');

const sekolahPath = 'C:\\Users\\prase\\OneDrive\\Dokumen\\tes web\\DATA SEKOLAH.xlsx';
const siswaPath = 'C:\\Users\\prase\\OneDrive\\Dokumen\\tes web\\DATA SISWA full.xlsx';

console.log('🔍 Comparing KODE BIASA between Excel files...\n');

// Read sekolah Excel
const wbSekolah = XLSX.readFile(sekolahPath);
const wsSekolah = wbSekolah.Sheets[wbSekolah.SheetNames[0]];
const dataSekolah = XLSX.utils.sheet_to_json(wsSekolah, { header: 1 });

// Read siswa Excel
const wbSiswa = XLSX.readFile(siswaPath);
const wsSiswa = wbSiswa.Sheets[wbSiswa.SheetNames[0]];
const dataSiswa = XLSX.utils.sheet_to_json(wsSiswa, { header: 1 });

// Extract KODE BIASA from sekolah (skip header)
const kodeBiasaSekolah = new Set();
for (let i = 1; i < dataSekolah.length; i++) {
  if (dataSekolah[i][0]) kodeBiasaSekolah.add(String(dataSekolah[i][0]));
}

// Extract KODE BIASA from siswa (skip header)
const kodeBiasaSiswa = new Set();
for (let i = 1; i < dataSiswa.length; i++) {
  if (dataSiswa[i][0]) kodeBiasaSiswa.add(String(dataSiswa[i][0]));
}

console.log(`📊 Excel SEKOLAH: ${kodeBiasaSekolah.size} unique KODE BIASA`);
console.log(`📊 Excel SISWA: ${kodeBiasaSiswa.size} unique KODE BIASA`);

// Find matching codes
const matching = new Set([...kodeBiasaSiswa].filter(x => kodeBiasaSekolah.has(x)));
const notInSekolah = new Set([...kodeBiasaSiswa].filter(x => !kodeBiasaSekolah.has(x)));

console.log(`\n✅ MATCHING: ${matching.size} codes`);
console.log(`❌ NOT IN SEKOLAH: ${notInSekolah.size} codes`);

if (matching.size > 0) {
  console.log('\n✅ Matching KODE BIASA (first 5):');
  [...matching].slice(0, 5).forEach(code => console.log(`  - ${code}`));
}

if (notInSekolah.size > 0) {
  console.log('\n❌ KODE BIASA in SISWA but NOT in SEKOLAH (first 10):');
  [...notInSekolah].slice(0, 10).forEach(code => {
    // Find school name from siswa Excel
    const siswaRow = dataSiswa.find(row => String(row[0]) === code);
    const namaSekolah = siswaRow ? siswaRow[2] : 'Unknown';
    console.log(`  - ${code} → ${namaSekolah}`);
  });
}

console.log('\n📋 KODE BIASA from SEKOLAH Excel (first 10):');
[...kodeBiasaSekolah].slice(0, 10).forEach(code => {
  const sekolahRow = dataSekolah.find(row => String(row[0]) === code);
  const namaSekolah = sekolahRow ? sekolahRow[4] : 'Unknown';
  console.log(`  - ${code} → ${namaSekolah}`);
});
