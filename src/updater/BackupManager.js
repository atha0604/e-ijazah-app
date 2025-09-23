// Enhanced Backup Manager untuk Auto-Update System
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { promisify } = require('util');

class BackupManager {
    constructor(options = {}) {
        this.options = {
            backupPath: options.backupPath || path.join(process.cwd(), 'backup'),
            maxBackups: options.maxBackups || 5,
            compressionLevel: options.compressionLevel || 6,
            includeUserData: options.includeUserData !== false,
            ...options
        };

        this.ensureBackupDirectory();
    }

    ensureBackupDirectory() {
        if (!fs.existsSync(this.options.backupPath)) {
            fs.mkdirSync(this.options.backupPath, { recursive: true });
        }
    }

    // ============= FULL SYSTEM BACKUP =============

    async createFullBackup(version = 'unknown') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `e-ijazah-backup-${version}-${timestamp}`;
        const backupDir = path.join(this.options.backupPath, backupName);

        console.log(`💾 Creating full backup: ${backupName}`);

        try {
            fs.mkdirSync(backupDir, { recursive: true });

            const backupInfo = {
                name: backupName,
                version: version,
                timestamp: new Date().toISOString(),
                type: 'full',
                items: []
            };

            // Backup executable
            await this.backupExecutable(backupDir, backupInfo);

            // Backup database
            await this.backupDatabase(backupDir, backupInfo);

            // Backup configuration
            await this.backupConfiguration(backupDir, backupInfo);

            // Backup user data (optional)
            if (this.options.includeUserData) {
                await this.backupUserData(backupDir, backupInfo);
            }

            // Backup public assets
            await this.backupPublicAssets(backupDir, backupInfo);

            // Create backup manifest
            const manifestPath = path.join(backupDir, 'backup-manifest.json');
            fs.writeFileSync(manifestPath, JSON.stringify(backupInfo, null, 2));

            // Create compressed archive
            const archivePath = await this.createArchive(backupDir, backupName);

            // Clean up old backups
            await this.cleanupOldBackups();

            console.log(`✅ Full backup created: ${archivePath}`);

            return {
                success: true,
                path: archivePath,
                info: backupInfo,
                size: this.getFileSize(archivePath)
            };

        } catch (error) {
            console.error('❌ Full backup failed:', error);

            // Clean up partial backup
            if (fs.existsSync(backupDir)) {
                fs.rmSync(backupDir, { recursive: true, force: true });
            }

            throw new Error(`Full backup failed: ${error.message}`);
        }
    }

    async backupExecutable(backupDir, backupInfo) {
        try {
            const currentExe = process.execPath;
            const exeName = path.basename(currentExe);
            const backupExePath = path.join(backupDir, 'executable', exeName);

            if (fs.existsSync(currentExe)) {
                fs.mkdirSync(path.dirname(backupExePath), { recursive: true });
                fs.copyFileSync(currentExe, backupExePath);

                backupInfo.items.push({
                    type: 'executable',
                    source: currentExe,
                    backup: backupExePath,
                    size: this.getFileSize(currentExe)
                });

                console.log(`✅ Executable backed up: ${exeName}`);
            } else {
                console.log('⚠️ Executable not found, skipping');
            }
        } catch (error) {
            console.error('❌ Failed to backup executable:', error);
            throw error;
        }
    }

    async backupDatabase(backupDir, backupInfo) {
        try {
            const dbSources = [
                path.join(process.cwd(), 'src', 'database', 'db.sqlite'),
                path.join(process.cwd(), 'database', 'db.sqlite'),
                path.join(process.cwd(), 'db.sqlite')
            ];

            const dbBackupDir = path.join(backupDir, 'database');
            fs.mkdirSync(dbBackupDir, { recursive: true });

            for (const dbPath of dbSources) {
                if (fs.existsSync(dbPath)) {
                    const dbName = path.basename(dbPath);
                    const backupDbPath = path.join(dbBackupDir, dbName);

                    // Create database backup with timestamp
                    const timestampedName = `${path.parse(dbName).name}-${Date.now()}${path.parse(dbName).ext}`;
                    const timestampedPath = path.join(dbBackupDir, timestampedName);

                    fs.copyFileSync(dbPath, backupDbPath);
                    fs.copyFileSync(dbPath, timestampedPath);

                    backupInfo.items.push({
                        type: 'database',
                        source: dbPath,
                        backup: backupDbPath,
                        timestamped: timestampedPath,
                        size: this.getFileSize(dbPath)
                    });

                    console.log(`✅ Database backed up: ${dbName}`);
                    break; // Only backup the first found database
                }
            }
        } catch (error) {
            console.error('❌ Failed to backup database:', error);
            throw error;
        }
    }

    async backupConfiguration(backupDir, backupInfo) {
        try {
            const configFiles = [
                '.env',
                '.env.local',
                '.env.production',
                'config.json',
                '.release-config.json',
                'package.json'
            ];

            const configBackupDir = path.join(backupDir, 'config');
            fs.mkdirSync(configBackupDir, { recursive: true });

            for (const configFile of configFiles) {
                const configPath = path.join(process.cwd(), configFile);

                if (fs.existsSync(configPath)) {
                    const backupConfigPath = path.join(configBackupDir, configFile);
                    fs.copyFileSync(configPath, backupConfigPath);

                    backupInfo.items.push({
                        type: 'configuration',
                        source: configPath,
                        backup: backupConfigPath,
                        size: this.getFileSize(configPath)
                    });

                    console.log(`✅ Configuration backed up: ${configFile}`);
                }
            }
        } catch (error) {
            console.error('❌ Failed to backup configuration:', error);
            throw error;
        }
    }

    async backupUserData(backupDir, backupInfo) {
        try {
            const userDataDirs = [
                'assets',
                'uploads',
                'data',
                'logs'
            ];

            const userDataBackupDir = path.join(backupDir, 'userdata');

            for (const dirName of userDataDirs) {
                const sourcePath = path.join(process.cwd(), dirName);

                if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isDirectory()) {
                    const backupPath = path.join(userDataBackupDir, dirName);
                    await this.copyDirectory(sourcePath, backupPath);

                    backupInfo.items.push({
                        type: 'userdata',
                        source: sourcePath,
                        backup: backupPath,
                        size: this.getDirectorySize(sourcePath)
                    });

                    console.log(`✅ User data backed up: ${dirName}`);
                }
            }
        } catch (error) {
            console.error('❌ Failed to backup user data:', error);
            // Don't throw - user data backup is optional
        }
    }

    async backupPublicAssets(backupDir, backupInfo) {
        try {
            const publicPath = path.join(process.cwd(), 'public');

            if (fs.existsSync(publicPath)) {
                const backupPublicPath = path.join(backupDir, 'public');
                await this.copyDirectory(publicPath, backupPublicPath);

                backupInfo.items.push({
                    type: 'assets',
                    source: publicPath,
                    backup: backupPublicPath,
                    size: this.getDirectorySize(publicPath)
                });

                console.log(`✅ Public assets backed up`);
            }
        } catch (error) {
            console.error('❌ Failed to backup public assets:', error);
            // Don't throw - assets can be restored from installation
        }
    }

    // ============= QUICK BACKUP FOR UPDATES =============

    async createQuickBackup() {
        const timestamp = Date.now();
        const backupName = `quick-backup-${timestamp}`;
        const backupDir = path.join(this.options.backupPath, backupName);

        console.log(`⚡ Creating quick backup: ${backupName}`);

        try {
            fs.mkdirSync(backupDir, { recursive: true });

            const backupInfo = {
                name: backupName,
                timestamp: new Date().toISOString(),
                type: 'quick',
                items: []
            };

            // Only backup critical items for quick recovery
            await this.backupExecutable(backupDir, backupInfo);
            await this.backupDatabase(backupDir, backupInfo);

            const manifestPath = path.join(backupDir, 'backup-manifest.json');
            fs.writeFileSync(manifestPath, JSON.stringify(backupInfo, null, 2));

            console.log(`✅ Quick backup created: ${backupDir}`);

            return {
                success: true,
                path: backupDir,
                info: backupInfo
            };

        } catch (error) {
            console.error('❌ Quick backup failed:', error);

            if (fs.existsSync(backupDir)) {
                fs.rmSync(backupDir, { recursive: true, force: true });
            }

            throw new Error(`Quick backup failed: ${error.message}`);
        }
    }

    // ============= RESTORE FUNCTIONALITY =============

    async restoreFromBackup(backupPath) {
        console.log(`🔄 Restoring from backup: ${backupPath}`);

        try {
            // Check if it's an archive or directory
            const isArchive = path.extname(backupPath) === '.zip';
            let manifestPath;
            let backupDir;

            if (isArchive) {
                // Extract archive first
                backupDir = await this.extractArchive(backupPath);
                manifestPath = path.join(backupDir, 'backup-manifest.json');
            } else {
                backupDir = backupPath;
                manifestPath = path.join(backupDir, 'backup-manifest.json');
            }

            if (!fs.existsSync(manifestPath)) {
                throw new Error('Invalid backup: manifest not found');
            }

            const backupInfo = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            console.log(`📋 Restoring backup: ${backupInfo.name} (${backupInfo.type})`);

            // Restore each item
            for (const item of backupInfo.items) {
                await this.restoreItem(item);
            }

            console.log(`✅ Restore completed successfully`);

            return {
                success: true,
                restoredItems: backupInfo.items.length,
                backupInfo: backupInfo
            };

        } catch (error) {
            console.error('❌ Restore failed:', error);
            throw new Error(`Restore failed: ${error.message}`);
        }
    }

    async restoreItem(item) {
        try {
            if (!fs.existsSync(item.backup)) {
                console.log(`⚠️ Backup item not found: ${item.backup}`);
                return;
            }

            // Ensure target directory exists
            const targetDir = path.dirname(item.source);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Restore the item
            if (fs.statSync(item.backup).isDirectory()) {
                await this.copyDirectory(item.backup, item.source);
            } else {
                fs.copyFileSync(item.backup, item.source);
            }

            console.log(`✅ Restored: ${item.type} - ${path.basename(item.source)}`);

        } catch (error) {
            console.error(`❌ Failed to restore ${item.type}:`, error);
            throw error;
        }
    }

    // ============= UTILITY METHODS =============

    async createArchive(sourceDir, archiveName) {
        const archivePath = path.join(this.options.backupPath, `${archiveName}.zip`);

        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(archivePath);
            const archive = archiver('zip', {
                zlib: { level: this.options.compressionLevel }
            });

            output.on('close', () => {
                console.log(`📦 Archive created: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);

                // Remove uncompressed directory
                fs.rmSync(sourceDir, { recursive: true, force: true });

                resolve(archivePath);
            });

            archive.on('error', reject);
            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    async extractArchive(archivePath) {
        // This would require a ZIP extraction library
        // For now, return error - implementation would use node-stream-zip or similar
        throw new Error('Archive extraction not implemented - use external tool');
    }

    async copyDirectory(source, destination) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }

        const items = fs.readdirSync(source, { withFileTypes: true });

        for (const item of items) {
            const sourcePath = path.join(source, item.name);
            const destPath = path.join(destination, item.name);

            if (item.isDirectory()) {
                await this.copyDirectory(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        }
    }

    getFileSize(filepath) {
        try {
            return fs.statSync(filepath).size;
        } catch {
            return 0;
        }
    }

    getDirectorySize(dirPath) {
        let totalSize = 0;

        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(dirPath, item.name);

            if (item.isDirectory()) {
                totalSize += this.getDirectorySize(itemPath);
            } else {
                totalSize += this.getFileSize(itemPath);
            }
        }

        return totalSize;
    }

    async cleanupOldBackups() {
        try {
            const backups = fs.readdirSync(this.options.backupPath)
                .filter(name => name.startsWith('e-ijazah-backup-'))
                .map(name => ({
                    name,
                    path: path.join(this.options.backupPath, name),
                    mtime: fs.statSync(path.join(this.options.backupPath, name)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime); // Newest first

            if (backups.length > this.options.maxBackups) {
                const toDelete = backups.slice(this.options.maxBackups);

                for (const backup of toDelete) {
                    if (backup.path.endsWith('.zip')) {
                        fs.unlinkSync(backup.path);
                    } else {
                        fs.rmSync(backup.path, { recursive: true, force: true });
                    }

                    console.log(`🗑️ Removed old backup: ${backup.name}`);
                }
            }
        } catch (error) {
            console.error('⚠️ Failed to cleanup old backups:', error);
            // Don't throw - cleanup failure is not critical
        }
    }

    listBackups() {
        try {
            const backups = fs.readdirSync(this.options.backupPath)
                .map(name => {
                    const fullPath = path.join(this.options.backupPath, name);
                    const stats = fs.statSync(fullPath);

                    return {
                        name,
                        path: fullPath,
                        size: stats.isDirectory() ? this.getDirectorySize(fullPath) : stats.size,
                        created: stats.mtime,
                        type: name.includes('quick-backup') ? 'quick' : 'full'
                    };
                })
                .sort((a, b) => b.created - a.created);

            return backups;
        } catch (error) {
            console.error('❌ Failed to list backups:', error);
            return [];
        }
    }
}

module.exports = BackupManager;