const XLSX = require('xlsx');

const excelPath = process.argv[2] || 'C:\\Users\\prase\\OneDrive\\Dokumen\\tes web\\DATA SISWA full.xlsx';

console.log('📂 Reading Excel file:', excelPath);

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  console.log(`📄 Sheet name: ${sheetName}`);

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`\n📊 Total rows (including header): ${data.length}`);

  // Show header
  console.log('\n📋 HEADER (Row 1):');
  console.log(data[0]);

  // Show first 3 data rows
  console.log('\n📝 SAMPLE DATA (First 3 rows):');
  for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
    console.log(`\nRow ${i}:`, data[i]);
  }

  // Check expected format
  console.log('\n✅ EXPECTED FORMAT BY BACKEND:');
  console.log('Index 0: KODE BIASA');
  console.log('Index 1: KODE PRO');
  console.log('Index 2: NAMA SEKOLAH');
  console.log('Index 3: KECAMATAN');
  console.log('Index 4: NO');
  console.log('Index 5: NO INDUK');
  console.log('Index 6: NISN');
  console.log('Index 7: NAMA PESERTA');
  console.log('Index 8: TEMPAT DAN TANGGAL LAHIR');
  console.log('Index 9: NAMA ORANG TUA');
  console.log('Index 10: NO IJAZAH');

} catch (error) {
  console.error('❌ Error reading Excel:', error.message);
  process.exit(1);
}
