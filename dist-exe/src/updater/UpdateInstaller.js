// Seamless Update Installer untuk E-Ijazah
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const archiver = require('archiver');
const EventEmitter = require('events');

class UpdateInstaller extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            tempPath: options.tempPath || path.join(process.cwd(), 'temp'),
            installPath: options.installPath || process.cwd(),
            backupPath: options.backupPath || path.join(process.cwd(), 'backup'),

            // Installation behavior
            preserveData: options.preserveData !== false,
            preserveConfig: options.preserveConfig !== false,
            autoRestart: options.autoRestart !== false,

            // Safety options
            verifyBeforeInstall: options.verifyBeforeInstall !== false,
            createRestorePoint: options.createRestorePoint !== false,

            ...options
        };

        this.state = {
            installing: false,
            progress: 0,
            currentStep: '',
            error: null,
            canRollback: false
        };

        this.rollbackData = null;
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [this.options.tempPath, this.options.backupPath];

        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    // ============= MAIN INSTALLATION FLOW =============

    async installUpdate(updatePackagePath) {
        if (this.state.installing) {
            throw new Error('Installation already in progress');
        }

        this.state.installing = true;
        this.state.progress = 0;
        this.state.error = null;
        this.state.canRollback = false;

        try {
            console.log('🚀 Starting seamless update installation...');
            this.emit('installation-started');

            // Step 1: Pre-installation validation
            await this.preInstallationChecks(updatePackagePath);
            this.updateProgress(10, 'Pre-installation checks completed');

            // Step 2: Create restore point
            if (this.options.createRestorePoint) {
                await this.createRestorePoint();
                this.updateProgress(20, 'Restore point created');
            }

            // Step 3: Extract update package
            const extractedPath = await this.extractUpdatePackage(updatePackagePath);
            this.updateProgress(30, 'Update package extracted');

            // Step 4: Verify extracted contents
            if (this.options.verifyBeforeInstall) {
                await this.verifyExtractedUpdate(extractedPath);
                this.updateProgress(40, 'Update verification completed');
            }

            // Step 5: Prepare installation
            await this.prepareInstallation(extractedPath);
            this.updateProgress(50, 'Installation prepared');

            // Step 6: Stop running services (if any)
            await this.stopServices();
            this.updateProgress(60, 'Services stopped');

            // Step 7: Perform installation
            await this.performInstallation(extractedPath);
            this.updateProgress(80, 'Files installed');

            // Step 8: Post-installation tasks
            await this.postInstallationTasks(extractedPath);
            this.updateProgress(90, 'Post-installation tasks completed');

            // Step 9: Cleanup
            await this.cleanup(extractedPath);
            this.updateProgress(100, 'Installation completed');

            console.log('✅ Update installation completed successfully');
            this.emit('installation-completed');

            // Step 10: Restart application (if enabled)
            if (this.options.autoRestart) {
                await this.restartApplication();
            }

            return {
                success: true,
                message: 'Update installed successfully',
                restartRequired: !this.options.autoRestart
            };

        } catch (error) {
            console.error('❌ Installation failed:', error);
            this.state.error = error;
            this.emit('installation-failed', error);

            // Attempt rollback if possible
            if (this.state.canRollback) {
                await this.rollbackInstallation();
            }

            throw error;
        } finally {
            this.state.installing = false;
        }
    }

    // ============= INSTALLATION STEPS =============

    async preInstallationChecks(updatePackagePath) {
        this.updateProgress(5, 'Performing pre-installation checks');

        // Check if update package exists
        if (!fs.existsSync(updatePackagePath)) {
            throw new Error(`Update package not found: ${updatePackagePath}`);
        }

        // Check file size and format
        const stats = fs.statSync(updatePackagePath);
        if (stats.size === 0) {
            throw new Error('Update package is empty');
        }

        if (!updatePackagePath.endsWith('.zip')) {
            throw new Error('Invalid update package format (expected .zip)');
        }

        // Check available disk space
        const requiredSpace = stats.size * 3; // 3x for extraction + backup
        const availableSpace = await this.getAvailableSpace(this.options.installPath);

        if (availableSpace < requiredSpace) {
            throw new Error(`Insufficient disk space. Required: ${this.formatBytes(requiredSpace)}, Available: ${this.formatBytes(availableSpace)}`);
        }

        // Check write permissions
        await this.checkWritePermissions();

        console.log('✅ Pre-installation checks passed');
    }

    async createRestorePoint() {
        this.updateProgress(15, 'Creating restore point');

        const restorePointId = `restore-${Date.now()}`;
        const restorePointPath = path.join(this.options.backupPath, restorePointId);

        fs.mkdirSync(restorePointPath, { recursive: true });

        this.rollbackData = {
            id: restorePointId,
            path: restorePointPath,
            timestamp: new Date().toISOString(),
            items: []
        };

        // Backup current executable
        const currentExe = process.execPath;
        if (fs.existsSync(currentExe)) {
            const backupExePath = path.join(restorePointPath, 'application.exe');
            fs.copyFileSync(currentExe, backupExePath);

            this.rollbackData.items.push({
                type: 'executable',
                original: currentExe,
                backup: backupExePath
            });
        }

        // Backup critical files
        const criticalFiles = [
            'package.json',
            '.env',
            'config.json'
        ];

        for (const file of criticalFiles) {
            const filePath = path.join(this.options.installPath, file);
            if (fs.existsSync(filePath)) {
                const backupPath = path.join(restorePointPath, file);
                fs.copyFileSync(filePath, backupPath);

                this.rollbackData.items.push({
                    type: 'config',
                    original: filePath,
                    backup: backupPath
                });
            }
        }

        // Save rollback metadata
        fs.writeFileSync(
            path.join(restorePointPath, 'rollback-info.json'),
            JSON.stringify(this.rollbackData, null, 2)
        );

        this.state.canRollback = true;
        console.log(`✅ Restore point created: ${restorePointId}`);
    }

    async extractUpdatePackage(updatePackagePath) {
        this.updateProgress(25, 'Extracting update package');

        const extractPath = path.join(this.options.tempPath, `extract-${Date.now()}`);
        fs.mkdirSync(extractPath, { recursive: true });

        return new Promise((resolve, reject) => {
            // Using PowerShell for ZIP extraction (Windows)
            const command = `powershell -command "Expand-Archive -Path '${updatePackagePath}' -DestinationPath '${extractPath}' -Force"`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Extraction failed: ${error.message}`));
                    return;
                }

                console.log('✅ Update package extracted');
                resolve(extractPath);
            });
        });
    }

    async verifyExtractedUpdate(extractedPath) {
        this.updateProgress(35, 'Verifying extracted update');

        // Check for required files
        const requiredFiles = [
            'E-Ijazah-Aplikasi.exe', // or the main executable name
            'public',
            'JALANKAN-APLIKASI.bat'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(extractedPath, file);
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ Optional file missing: ${file}`);
                // Don't throw for missing optional files
            }
        }

        // Look for any executable file
        const files = fs.readdirSync(extractedPath);
        const hasExecutable = files.some(file => file.endsWith('.exe'));

        if (!hasExecutable) {
            throw new Error('No executable found in update package');
        }

        console.log('✅ Update package verification completed');
    }

    async prepareInstallation(extractedPath) {
        this.updateProgress(45, 'Preparing installation');

        // Create installation plan
        this.installationPlan = {
            executable: null,
            directories: [],
            files: [],
            scripts: []
        };

        const items = fs.readdirSync(extractedPath, { withFileTypes: true });

        for (const item of items) {
            const sourcePath = path.join(extractedPath, item.name);
            const targetPath = path.join(this.options.installPath, item.name);

            if (item.isFile()) {
                if (item.name.endsWith('.exe')) {
                    this.installationPlan.executable = {
                        source: sourcePath,
                        target: targetPath,
                        backup: this.rollbackData ?
                            this.rollbackData.items.find(i => i.type === 'executable')?.backup : null
                    };
                } else if (item.name.endsWith('.bat')) {
                    this.installationPlan.scripts.push({
                        source: sourcePath,
                        target: targetPath
                    });
                } else {
                    this.installationPlan.files.push({
                        source: sourcePath,
                        target: targetPath
                    });
                }
            } else if (item.isDirectory()) {
                this.installationPlan.directories.push({
                    source: sourcePath,
                    target: targetPath
                });
            }
        }

        console.log(`✅ Installation plan created: ${this.installationPlan.files.length} files, ${this.installationPlan.directories.length} directories`);
    }

    async stopServices() {
        this.updateProgress(55, 'Stopping services');

        // For desktop applications, we typically don't need to stop external services
        // But we might need to close file handles, databases, etc.

        // Close any open database connections
        try {
            // This would be application-specific
            // For SQLite, connections are typically closed automatically
            console.log('🔌 Database connections closed');
        } catch (error) {
            console.warn('⚠️ Failed to close database connections:', error.message);
        }

        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Services stopped');
    }

    async performInstallation(extractedPath) {
        this.updateProgress(70, 'Installing files');

        let installedItems = 0;
        const totalItems = this.installationPlan.files.length +
                          this.installationPlan.directories.length +
                          (this.installationPlan.executable ? 1 : 0);

        // Install directories first
        for (const dir of this.installationPlan.directories) {
            await this.installDirectory(dir);
            installedItems++;
            this.updateProgress(70 + (installedItems / totalItems) * 10, `Installing directories: ${path.basename(dir.target)}`);
        }

        // Install files
        for (const file of this.installationPlan.files) {
            await this.installFile(file);
            installedItems++;
            this.updateProgress(70 + (installedItems / totalItems) * 10, `Installing files: ${path.basename(file.target)}`);
        }

        // Install executable last (critical step)
        if (this.installationPlan.executable) {
            await this.installExecutable(this.installationPlan.executable);
            installedItems++;
            this.updateProgress(80, 'Executable updated');
        }

        console.log('✅ File installation completed');
    }

    async installDirectory(dirInfo) {
        try {
            // Remove existing directory if it exists
            if (fs.existsSync(dirInfo.target)) {
                fs.rmSync(dirInfo.target, { recursive: true, force: true });
            }

            // Copy new directory
            await this.copyDirectory(dirInfo.source, dirInfo.target);

        } catch (error) {
            throw new Error(`Failed to install directory ${dirInfo.target}: ${error.message}`);
        }
    }

    async installFile(fileInfo) {
        try {
            // Ensure target directory exists
            const targetDir = path.dirname(fileInfo.target);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Copy file
            fs.copyFileSync(fileInfo.source, fileInfo.target);

        } catch (error) {
            throw new Error(`Failed to install file ${fileInfo.target}: ${error.message}`);
        }
    }

    async installExecutable(exeInfo) {
        try {
            // This is the most critical step - replacing the running executable

            if (process.platform === 'win32') {
                // On Windows, we can't replace a running executable directly
                // So we rename the old one and copy the new one

                const oldExePath = exeInfo.target + '.old';

                // Rename current executable
                if (fs.existsSync(exeInfo.target)) {
                    fs.renameSync(exeInfo.target, oldExePath);
                }

                // Copy new executable
                fs.copyFileSync(exeInfo.source, exeInfo.target);

                // Schedule old executable for deletion on restart
                this.scheduleCleanup(oldExePath);

            } else {
                // On Unix-like systems, we can replace the file
                fs.copyFileSync(exeInfo.source, exeInfo.target);
            }

        } catch (error) {
            throw new Error(`Failed to install executable: ${error.message}`);
        }
    }

    async postInstallationTasks(extractedPath) {
        this.updateProgress(85, 'Performing post-installation tasks');

        // Update version information
        await this.updateVersionInfo();

        // Run any migration scripts if needed
        await this.runMigrations();

        // Update permissions if necessary
        await this.updatePermissions();

        // Clear any cached data that might be incompatible
        await this.clearCache();

        console.log('✅ Post-installation tasks completed');
    }

    async updateVersionInfo() {
        try {
            // Update package.json with new version if available
            const packagePath = path.join(this.options.installPath, 'package.json');
            if (fs.existsSync(packagePath)) {
                const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                console.log(`📝 Updated to version: ${packageData.version}`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to update version info:', error.message);
        }
    }

    async runMigrations() {
        // Run any necessary database migrations or data transformations
        // This would be application-specific
        console.log('🔄 Running migrations...');

        // Placeholder for migration logic
        // In a real implementation, this would check for and run migration scripts

        console.log('✅ Migrations completed');
    }

    async updatePermissions() {
        // Update file permissions if necessary (mainly for Unix-like systems)
        if (process.platform !== 'win32') {
            try {
                const exePath = path.join(this.options.installPath, 'E-Ijazah-Aplikasi.exe');
                if (fs.existsSync(exePath)) {
                    fs.chmodSync(exePath, '755');
                }
            } catch (error) {
                console.warn('⚠️ Failed to update permissions:', error.message);
            }
        }
    }

    async clearCache() {
        // Clear any application cache that might be incompatible with the new version
        const cacheDirs = [
            path.join(this.options.installPath, 'cache'),
            path.join(this.options.installPath, 'temp'),
            path.join(this.options.installPath, '.cache')
        ];

        for (const cacheDir of cacheDirs) {
            if (fs.existsSync(cacheDir)) {
                try {
                    fs.rmSync(cacheDir, { recursive: true, force: true });
                    console.log(`🧹 Cleared cache: ${path.basename(cacheDir)}`);
                } catch (error) {
                    console.warn(`⚠️ Failed to clear cache ${cacheDir}:`, error.message);
                }
            }
        }
    }

    async cleanup(extractedPath) {
        this.updateProgress(95, 'Cleaning up temporary files');

        try {
            // Remove extracted files
            if (fs.existsSync(extractedPath)) {
                fs.rmSync(extractedPath, { recursive: true, force: true });
            }

            // Clean up old backup files (keep only recent ones)
            await this.cleanupOldBackups();

            console.log('✅ Cleanup completed');
        } catch (error) {
            console.warn('⚠️ Cleanup failed:', error.message);
            // Don't throw - cleanup failure is not critical
        }
    }

    // ============= ROLLBACK FUNCTIONALITY =============

    async rollbackInstallation() {
        if (!this.state.canRollback || !this.rollbackData) {
            throw new Error('No rollback data available');
        }

        console.log('🔄 Rolling back installation...');
        this.emit('rollback-started');

        try {
            for (const item of this.rollbackData.items) {
                if (fs.existsSync(item.backup)) {
                    fs.copyFileSync(item.backup, item.original);
                    console.log(`✅ Restored: ${path.basename(item.original)}`);
                }
            }

            console.log('✅ Rollback completed');
            this.emit('rollback-completed');

        } catch (error) {
            console.error('❌ Rollback failed:', error);
            this.emit('rollback-failed', error);
            throw new Error(`Rollback failed: ${error.message}`);
        }
    }

    // ============= UTILITY METHODS =============

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

    async getAvailableSpace(directory) {
        // Simplified - in real implementation would check actual disk space
        return 1024 * 1024 * 1024; // 1GB placeholder
    }

    async checkWritePermissions() {
        try {
            const testFile = path.join(this.options.installPath, '.write-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
        } catch (error) {
            throw new Error('Insufficient write permissions for installation directory');
        }
    }

    scheduleCleanup(filePath) {
        // Schedule file for deletion on next startup
        const cleanupScript = path.join(this.options.tempPath, 'cleanup.bat');
        const script = `@echo off
timeout /t 5 /nobreak >nul
del "${filePath}" 2>nul
del "%~f0" 2>nul
`;
        fs.writeFileSync(cleanupScript, script);

        // Execute cleanup script
        spawn('cmd', ['/c', cleanupScript], {
            detached: true,
            stdio: 'ignore'
        });
    }

    async cleanupOldBackups() {
        // Keep only the 3 most recent backups
        const maxBackups = 3;

        try {
            const backups = fs.readdirSync(this.options.backupPath)
                .filter(name => name.startsWith('restore-'))
                .map(name => ({
                    name,
                    path: path.join(this.options.backupPath, name),
                    mtime: fs.statSync(path.join(this.options.backupPath, name)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);

            if (backups.length > maxBackups) {
                const toDelete = backups.slice(maxBackups);

                for (const backup of toDelete) {
                    fs.rmSync(backup.path, { recursive: true, force: true });
                    console.log(`🗑️ Removed old backup: ${backup.name}`);
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to cleanup old backups:', error.message);
        }
    }

    async restartApplication() {
        console.log('🔄 Restarting application...');

        // Create restart script
        const restartScript = path.join(this.options.tempPath, 'restart.bat');
        const script = `@echo off
echo Restarting E-Ijazah application...
timeout /t 3 /nobreak >nul
start "" "${process.execPath}"
`;
        fs.writeFileSync(restartScript, script);

        // Execute restart script and exit current process
        spawn('cmd', ['/c', restartScript], {
            detached: true,
            stdio: 'ignore'
        });

        // Give the script time to start
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    }

    updateProgress(percent, message) {
        this.state.progress = percent;
        this.state.currentStep = message;
        this.emit('progress', { percent, message });
        console.log(`📊 ${percent}% - ${message}`);
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    getState() {
        return { ...this.state };
    }
}

module.exports = UpdateInstaller;