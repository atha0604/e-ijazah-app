const ExcelJS = require('exceljs');
const fs = require('fs');

async function createTestExcel() {
    try {
        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template Nilai');

        // Sample data for Merdeka curriculum
        const headers = ['NISN', 'NAMA', 'AGAMA', 'PKN', 'B.INDO', 'MTK', 'IPAS', 'B.ING', 'SBDP', 'PJOK', 'BAHASA_DAERAH', 'MULOK1', 'MULOK2', 'MULOK3'];
        const exampleData = ['1234567890', 'NAMA SISWA', 85, 80, 88, 82, 83, 78, 88, 83, 78, 83, 78, 83];

        // Add headers
        worksheet.addRow(headers);

        // Add example data
        worksheet.addRow(exampleData);

        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF366092' }
            };
            cell.font = {
                color: { argb: 'FFFFFFFF' },
                bold: true
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
        });

        // Set column widths
        headers.forEach((header, index) => {
            const column = worksheet.getColumn(index + 1);
            if (index === 0) {
                column.width = 15; // NISN
            } else if (index === 1) {
                column.width = 20; // NAMA
            } else {
                column.width = 12; // Other columns
            }
        });

        // Write the file
        await workbook.xlsx.writeFile('Template-Test.xlsx');
        console.log('Test Excel file created: Template-Test.xlsx');

    } catch (error) {
        console.error('Error creating test Excel:', error);
    }
}

createTestExcel();