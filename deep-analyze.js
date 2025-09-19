const ExcelJS = require('exceljs');

async function deepAnalyze() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('C:\\ProyekWeb\\web 2\\Template_Nilai_Merdeka_KELAS 5 SEMESTER 2.xlsx');

        const worksheet = workbook.worksheets[0];

        console.log('=== DEEP ANALYSIS ===');
        console.log('Worksheet name:', worksheet.name);
        console.log('Actual dimensions:', worksheet.actualRowCount, 'x', worksheet.actualColumnCount);
        console.log('Row count:', worksheet.rowCount);
        console.log('Column count:', worksheet.columnCount);

        // Analyze header row in detail
        console.log('\n=== HEADER ROW ANALYSIS ===');
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
            console.log(`Column ${colNumber}:`);
            console.log(`  Value: "${cell.value}"`);
            console.log(`  Type: ${cell.type}`);
            console.log(`  Font:`, cell.font);
            console.log(`  Fill:`, cell.fill);
            console.log(`  Alignment:`, cell.alignment);
            console.log(`  Border:`, cell.border);
        });

        // Analyze first data row
        console.log('\n=== FIRST DATA ROW ANALYSIS ===');
        const dataRow = worksheet.getRow(2);
        dataRow.eachCell((cell, colNumber) => {
            console.log(`Column ${colNumber}:`);
            console.log(`  Value: "${cell.value}"`);
            console.log(`  Type: ${cell.type}`);
            if (cell.formula) {
                console.log(`  Formula: ${cell.formula}`);
            }
            if (cell.result !== undefined) {
                console.log(`  Result: ${cell.result}`);
            }
        });

        // Column properties
        console.log('\n=== COLUMN PROPERTIES ===');
        for (let i = 1; i <= worksheet.columnCount; i++) {
            const column = worksheet.getColumn(i);
            console.log(`Column ${i}:`);
            console.log(`  Width: ${column.width}`);
            console.log(`  Key: ${column.key}`);
            console.log(`  Header: ${column.header}`);
        }

        // Workbook properties
        console.log('\n=== WORKBOOK PROPERTIES ===');
        console.log('Creator:', workbook.creator);
        console.log('Last modified by:', workbook.lastModifiedBy);
        console.log('Created:', workbook.created);
        console.log('Modified:', workbook.modified);
        console.log('Properties:', workbook.properties);

        // Now create an exact copy
        console.log('\n=== CREATING EXACT COPY ===');
        await createExactCopy();

    } catch (error) {
        console.error('Error in deep analysis:', error);
    }
}

async function createExactCopy() {
    try {
        // Read the original file
        const originalWorkbook = new ExcelJS.Workbook();
        await originalWorkbook.xlsx.readFile('C:\\ProyekWeb\\web 2\\Template_Nilai_Merdeka_KELAS 5 SEMESTER 2.xlsx');

        // Create new workbook
        const newWorkbook = new ExcelJS.Workbook();

        // Copy workbook properties
        newWorkbook.creator = originalWorkbook.creator || 'System';
        newWorkbook.lastModifiedBy = originalWorkbook.lastModifiedBy || 'System';
        newWorkbook.created = new Date();
        newWorkbook.modified = new Date();

        // Copy each worksheet
        originalWorkbook.worksheets.forEach(originalSheet => {
            const newSheet = newWorkbook.addWorksheet(originalSheet.name);

            // Copy all rows
            originalSheet.eachRow((row, rowNumber) => {
                const newRow = newSheet.getRow(rowNumber);

                row.eachCell((cell, colNumber) => {
                    const newCell = newRow.getCell(colNumber);

                    // Copy cell value/formula
                    if (cell.formula) {
                        newCell.formula = cell.formula;
                    } else {
                        newCell.value = cell.value;
                    }

                    // Copy cell styling
                    newCell.font = cell.font;
                    newCell.fill = cell.fill;
                    newCell.alignment = cell.alignment;
                    newCell.border = cell.border;
                    newCell.numFmt = cell.numFmt;
                });

                // Copy row properties
                newRow.height = row.height;
                newRow.hidden = row.hidden;
                newRow.outlineLevel = row.outlineLevel;
            });

            // Copy column properties
            originalSheet.columns.forEach((column, index) => {
                const newColumn = newSheet.getColumn(index + 1);
                newColumn.width = column.width;
                newColumn.hidden = column.hidden;
                newColumn.outlineLevel = column.outlineLevel;
            });

            // Copy sheet properties
            newSheet.properties = originalSheet.properties;
            newSheet.pageSetup = originalSheet.pageSetup;
            newSheet.views = originalSheet.views;
        });

        // Save the exact copy
        await newWorkbook.xlsx.writeFile('Template-Exact-Copy.xlsx');
        console.log('Exact copy created: Template-Exact-Copy.xlsx');

    } catch (error) {
        console.error('Error creating exact copy:', error);
    }
}

deepAnalyze();