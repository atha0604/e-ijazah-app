// Script untuk generate checksums otomatis
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ChecksumGenerator {
    constructor() {
        this.algorithm = 'sha256';
        this.results = [];
    }

    // Generate checksum untuk single file
    generateFileChecksum(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash(this.algorithm);
            const stream = fs.createReadStream(filePath);

            stream.on('error', reject);
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => {
                const checksum = hash.digest('hex');
                const fileName = path.basename(filePath);
                const fileSize = fs.statSync(filePath).size;

                resolve({
                    file: fileName,
                    path: filePath,
                    checksum: checksum,
                    size: fileSize,
                    algorithm: this.algorithm.toUpperCase()
                });
            });
        });
    }

    // Generate checksums untuk semua file dalam direktori
    async generateDirectoryChecksums(directory, pattern = '*') {
        const files = this.findFiles(directory, pattern);
        const checksums = [];

        console.log(`🔍 Found ${files.length} files to process...`);

        for (const file of files) {
            try {
                const result = await this.generateFileChecksum(file);
                checksums.push(result);
                console.log(`✅ ${result.file}: ${result.checksum}`);
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
            }
        }

        return checksums;
    }

    // Find files dengan pattern
    findFiles(directory, pattern) {
        const files = [];

        if (!fs.existsSync(directory)) {
            console.warn(`⚠️  Directory not found: ${directory}`);
            return files;
        }

        const items = fs.readdirSync(directory, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(directory, item.name);

            if (item.isDirectory()) {
                // Recursively search subdirectories
                files.push(...this.findFiles(fullPath, pattern));
            } else if (item.isFile()) {
                // Check if file matches pattern
                if (this.matchesPattern(item.name, pattern)) {
                    files.push(fullPath);
                }
            }
        }

        return files;
    }

    // Simple pattern matching
    matchesPattern(filename, pattern) {
        if (pattern === '*') return true;

        // Support for extensions like '*.exe', '*.zip'
        if (pattern.startsWith('*.')) {
            const extension = pattern.substring(2);
            return filename.endsWith('.' + extension);
        }

        // Support for exact filenames
        return filename === pattern;
    }

    // Save checksums ke file
    saveChecksumsFile(checksums, outputPath) {
        let content = '';

        // Header
        content += `# Checksums Generated: ${new Date().toISOString()}\n`;
        content += `# Algorithm: ${this.algorithm.toUpperCase()}\n`;
        content += `# Total Files: ${checksums.length}\n\n`;

        // Standard format: checksum filename
        for (const item of checksums) {
            content += `${item.checksum}  ${item.file}\n`;
        }

        // Detailed format (commented)
        content += '\n# Detailed Information:\n';
        for (const item of checksums) {
            content += `# ${item.file} - Size: ${this.formatFileSize(item.size)} - ${item.checksum}\n`;
        }

        fs.writeFileSync(outputPath, content);
        console.log(`💾 Checksums saved to: ${outputPath}`);
    }

    // Save checksums dalam format JSON
    saveChecksumsJSON(checksums, outputPath) {
        const data = {
            generated: new Date().toISOString(),
            algorithm: this.algorithm.toUpperCase(),
            totalFiles: checksums.length,
            files: checksums.map(item => ({
                filename: item.file,
                checksum: item.checksum,
                size: item.size,
                sizeFormatted: this.formatFileSize(item.size)
            }))
        };

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`💾 Checksums JSON saved to: ${outputPath}`);
    }

    // Format file size untuk readability
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';

        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Verify checksums dari file
    async verifyChecksums(checksumsFilePath) {
        if (!fs.existsSync(checksumsFilePath)) {
            throw new Error(`Checksums file not found: ${checksumsFilePath}`);
        }

        const content = fs.readFileSync(checksumsFilePath, 'utf8');
        const lines = content.split('\n').filter(line =>
            line.trim() && !line.startsWith('#')
        );

        const results = [];
        const directory = path.dirname(checksumsFilePath);

        console.log(`🔍 Verifying ${lines.length} files...`);

        for (const line of lines) {
            const [expectedChecksum, filename] = line.trim().split(/\s+/, 2);
            const filePath = path.join(directory, filename);

            if (!fs.existsSync(filePath)) {
                results.push({
                    file: filename,
                    status: 'missing',
                    message: 'File not found'
                });
                continue;
            }

            try {
                const result = await this.generateFileChecksum(filePath);
                const isValid = result.checksum === expectedChecksum;

                results.push({
                    file: filename,
                    status: isValid ? 'valid' : 'invalid',
                    expected: expectedChecksum,
                    actual: result.checksum,
                    message: isValid ? 'Checksum verified' : 'Checksum mismatch'
                });

                console.log(`${isValid ? '✅' : '❌'} ${filename}: ${result.message}`);
            } catch (error) {
                results.push({
                    file: filename,
                    status: 'error',
                    message: error.message
                });
                console.error(`❌ ${filename}: ${error.message}`);
            }
        }

        return results;
    }
}

// CLI Usage
async function main() {
    const generator = new ChecksumGenerator();
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
🔐 Checksum Generator for E-Ijazah Releases

Usage:
  node generate-checksums.js <directory> [pattern] [output]

Examples:
  node generate-checksums.js dist-standalone            # All files
  node generate-checksums.js dist-standalone "*.exe"   # Only .exe files
  node generate-checksums.js . "*.zip" checksums.txt   # Custom output

Commands:
  node generate-checksums.js verify checksums.txt      # Verify checksums

Default patterns:
  * = All files
  *.exe = Executable files
  *.zip = ZIP archives
        `);
        return;
    }

    const [command, ...restArgs] = args;

    // Verify command
    if (command === 'verify') {
        const checksumsFile = restArgs[0] || 'checksums.txt';
        try {
            const results = await generator.verifyChecksums(checksumsFile);
            const valid = results.filter(r => r.status === 'valid').length;
            const total = results.length;

            console.log(`\n📊 Verification Results: ${valid}/${total} files verified`);

            if (valid === total) {
                console.log('🎉 All checksums verified successfully!');
                process.exit(0);
            } else {
                console.log('⚠️  Some files failed verification');
                process.exit(1);
            }
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
            process.exit(1);
        }
        return;
    }

    // Generate checksums
    const directory = command;
    const pattern = restArgs[0] || '*';
    const outputFile = restArgs[1] || 'checksums.txt';

    try {
        console.log(`🔐 Generating checksums for: ${directory}`);
        console.log(`📋 Pattern: ${pattern}`);

        const checksums = await generator.generateDirectoryChecksums(directory, pattern);

        if (checksums.length === 0) {
            console.log('⚠️  No files found matching pattern');
            return;
        }

        // Save in both formats
        const txtPath = outputFile.endsWith('.txt') ? outputFile : outputFile + '.txt';
        const jsonPath = outputFile.replace(/\.txt$/, '') + '.json';

        generator.saveChecksumsFile(checksums, txtPath);
        generator.saveChecksumsJSON(checksums, jsonPath);

        console.log(`\n✅ Generated checksums for ${checksums.length} files`);
        console.log(`📄 Text format: ${txtPath}`);
        console.log(`📄 JSON format: ${jsonPath}`);

    } catch (error) {
        console.error('❌ Error generating checksums:', error.message);
        process.exit(1);
    }
}

// Export untuk programmatic usage
module.exports = ChecksumGenerator;

// Run jika dipanggil langsung
if (require.main === module) {
    main();
}