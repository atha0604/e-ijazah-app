const ExcelJS = require('exceljs');

async function analyzeExcel() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('C:\\ProyekWeb\\web 2\\Template_Nilai_Merdeka_KELAS 5 SEMESTER 2.xlsx');

        console.log('=== WORKBOOK ANALYSIS ===');
        console.log('Total worksheets:', workbook.worksheets.length);

        workbook.worksheets.forEach((worksheet, index) => {
            console.log(`\n--- Worksheet ${index + 1}: "${worksheet.name}" ---`);
            console.log('Row count:', worksheet.rowCount);
            console.log('Column count:', worksheet.columnCount);

            // Get headers (first row)
            if (worksheet.rowCount > 0) {
                const headerRow = worksheet.getRow(1);
                const headers = [];
                for (let col = 1; col <= worksheet.columnCount; col++) {
                    const cell = headerRow.getCell(col);
                    headers.push(cell.value || '');
                }
                console.log('Headers:', headers);

                // Get first data row if exists
                if (worksheet.rowCount > 1) {
                    const dataRow = worksheet.getRow(2);
                    const data = [];
                    for (let col = 1; col <= worksheet.columnCount; col++) {
                        const cell = dataRow.getCell(col);
                        data.push(cell.value || '');
                    }
                    console.log('Example data:', data);
                }
            }

            // Check column widths
            console.log('Column widths:');
            for (let col = 1; col <= Math.min(worksheet.columnCount, 10); col++) {
                const column = worksheet.getColumn(col);
                console.log(`  Column ${col}: width = ${column.width || 'auto'}`);
            }
        });

    } catch (error) {
        console.error('Error analyzing Excel file:', error);
    }
}

analyzeExcel();