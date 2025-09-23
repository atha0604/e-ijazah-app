// Core Auto-Updater System untuk E-Ijazah
const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const crypto = require('crypto');
const EventEmitter = require('events');

class AutoUpdater extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            // GitHub repository info
            owner: options.owner || 'atha0604',
            repo: options.repo || 'e-ijazah-app',

            // Release settings
            channel: options.channel || 'stable', // stable, beta, alpha
            currentVersion: options.currentVersion || require('../../package.json').version,

            // Download settings
            downloadPath: options.downloadPath || path.join(process.cwd(), 'temp'),
            backupPath: options.backupPath || path.join(process.cwd(), 'backup'),

            // Update behavior
            autoCheck: options.autoCheck !== false,
            autoDownload: options.autoDownload || false,
            autoInstall: options.autoInstall || false,
            checkInterval: options.checkInterval || 30 * 60 * 1000, // 30 minutes

            // Verification
            verifyChecksum: options.verifyChecksum !== false,
            verifySignature: options.verifySignature || false,

            ...options
        };

        this.state = {
            checking: false,
            downloading: false,
            installing: false,
            updateAvailable: false,
            error: null,
            progress: 0,

            // Update info
            latestVersion: null,
            downloadUrl: null,
            releaseNotes: null,
            fileSize: 0,
            checksum: null
        };

        this.checkTimer = null;
        this.abortController = null;

        this.init();
    }

    async init() {
        console.log('🔄 AutoUpdater initialized');

        // Create directories
        await this.ensureDirectories();

        // Start auto-check if enabled
        if (this.options.autoCheck) {
            await this.checkForUpdates();
            this.startPeriodicCheck();
        }

        this.emit('ready');
    }

    async ensureDirectories() {
        const dirs = [this.options.downloadPath, this.options.backupPath];

        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    // ============= VERSION CHECKING =============

    async checkForUpdates() {
        if (this.state.checking) {
            console.log('⏳ Update check already in progress');
            return;
        }

        this.state.checking = true;
        this.state.error = null;
        this.emit('checking-for-update');

        try {
            console.log(`🔍 Checking for updates from ${this.options.owner}/${this.options.repo}`);

            const releaseInfo = await this.fetchLatestRelease();
            const isNewVersion = this.compareVersions(releaseInfo.version, this.options.currentVersion) > 0;

            if (isNewVersion) {
                this.state.updateAvailable = true;
                this.state.latestVersion = releaseInfo.version;
                this.state.downloadUrl = releaseInfo.downloadUrl;
                this.state.releaseNotes = releaseInfo.releaseNotes;
                this.state.fileSize = releaseInfo.fileSize;
                this.state.checksum = releaseInfo.checksum;

                console.log(`🎉 New version available: ${releaseInfo.version}`);
                this.emit('update-available', releaseInfo);

                // Auto-download if enabled
                if (this.options.autoDownload) {
                    await this.downloadUpdate();
                }
            } else {
                console.log('✅ Already on latest version');
                this.emit('update-not-available');
            }

        } catch (error) {
            console.error('❌ Error checking for updates:', error);
            this.state.error = error;
            this.emit('error', error);
        } finally {
            this.state.checking = false;
        }
    }

    async fetchLatestRelease() {
        const apiUrl = `https://api.github.com/repos/${this.options.owner}/${this.options.repo}/releases/latest`;

        return new Promise((resolve, reject) => {
            const request = https.get(apiUrl, {
                headers: {
                    'User-Agent': 'E-Ijazah-AutoUpdater',
                    'Accept': 'application/vnd.github.v3+json'
                }
            }, (response) => {
                let data = '';

                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try {
                        const release = JSON.parse(data);

                        if (response.statusCode !== 200) {
                            reject(new Error(`GitHub API error: ${release.message}`));
                            return;
                        }

                        // Find the appropriate asset (standalone version)
                        const asset = release.assets.find(asset =>
                            asset.name.includes('standalone') && asset.name.endsWith('.zip')
                        );

                        if (!asset) {
                            reject(new Error('No suitable release asset found'));
                            return;
                        }

                        // Find checksum file
                        const checksumAsset = release.assets.find(asset =>
                            asset.name.includes('checksums-standalone.txt')
                        );

                        resolve({
                            version: release.tag_name,
                            downloadUrl: asset.browser_download_url,
                            releaseNotes: release.body,
                            fileSize: asset.size,
                            checksum: checksumAsset ? checksumAsset.browser_download_url : null,
                            publishedAt: release.published_at
                        });

                    } catch (error) {
                        reject(new Error(`Failed to parse release info: ${error.message}`));
                    }
                });
            });

            request.on('error', reject);
            request.setTimeout(30000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    compareVersions(version1, version2) {
        // Remove 'v' prefix if present
        const v1 = version1.replace(/^v/, '').split('.').map(Number);
        const v2 = version2.replace(/^v/, '').split('.').map(Number);

        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const part1 = v1[i] || 0;
            const part2 = v2[i] || 0;

            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }

        return 0;
    }

    // ============= DOWNLOAD MANAGEMENT =============

    async downloadUpdate() {
        if (this.state.downloading) {
            console.log('⏳ Download already in progress');
            return;
        }

        if (!this.state.updateAvailable) {
            throw new Error('No update available to download');
        }

        this.state.downloading = true;
        this.state.progress = 0;
        this.state.error = null;
        this.abortController = new AbortController();

        this.emit('download-progress', { percent: 0, transferred: 0, total: this.state.fileSize });

        try {
            const filename = path.basename(this.state.downloadUrl);
            const filepath = path.join(this.options.downloadPath, filename);

            console.log(`📥 Downloading update: ${filename}`);

            // Download the main file
            await this.downloadFile(this.state.downloadUrl, filepath);

            // Download and verify checksum if available
            if (this.state.checksum && this.options.verifyChecksum) {
                await this.verifyDownload(filepath);
            }

            console.log('✅ Download completed and verified');
            this.emit('update-downloaded', { path: filepath });

            // Auto-install if enabled
            if (this.options.autoInstall) {
                await this.installUpdate(filepath);
            }

        } catch (error) {
            console.error('❌ Download failed:', error);
            this.state.error = error;
            this.emit('error', error);
        } finally {
            this.state.downloading = false;
            this.abortController = null;
        }
    }

    async downloadFile(url, filepath) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filepath);
            let downloadedBytes = 0;

            const request = https.get(url, (response) => {
                // Handle redirects
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    file.close();
                    fs.unlinkSync(filepath);
                    return this.downloadFile(response.headers.location, filepath)
                        .then(resolve)
                        .catch(reject);
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(filepath);
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                const totalBytes = parseInt(response.headers['content-length']) || this.state.fileSize;

                response.on('data', (chunk) => {
                    if (this.abortController?.signal.aborted) {
                        file.close();
                        fs.unlinkSync(filepath);
                        reject(new Error('Download aborted'));
                        return;
                    }

                    downloadedBytes += chunk.length;
                    this.state.progress = Math.round((downloadedBytes / totalBytes) * 100);

                    this.emit('download-progress', {
                        percent: this.state.progress,
                        transferred: downloadedBytes,
                        total: totalBytes
                    });
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve();
                });

                file.on('error', (error) => {
                    file.close();
                    fs.unlinkSync(filepath);
                    reject(error);
                });
            });

            request.on('error', (error) => {
                file.close();
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
                reject(error);
            });

            request.setTimeout(300000, () => { // 5 minutes timeout
                request.destroy();
                file.close();
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
                reject(new Error('Download timeout'));
            });
        });
    }

    async verifyDownload(filepath) {
        if (!this.state.checksum) {
            console.log('⚠️ No checksum available for verification');
            return;
        }

        console.log('🔐 Verifying download integrity...');

        try {
            // Download checksum file
            const checksumPath = filepath + '.checksum';
            await this.downloadFile(this.state.checksum, checksumPath);

            // Read expected checksum
            const checksumContent = fs.readFileSync(checksumPath, 'utf8');
            const expectedChecksum = checksumContent.split('\n')[0].split(/\s+/)[0];

            // Calculate actual checksum
            const actualChecksum = await this.calculateChecksum(filepath);

            if (actualChecksum !== expectedChecksum) {
                throw new Error('Checksum verification failed - file may be corrupted');
            }

            console.log('✅ Download integrity verified');

            // Clean up checksum file
            fs.unlinkSync(checksumPath);

        } catch (error) {
            throw new Error(`Verification failed: ${error.message}`);
        }
    }

    async calculateChecksum(filepath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filepath);

            stream.on('error', reject);
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
        });
    }

    // ============= INSTALLATION =============

    async installUpdate(filepath) {
        if (this.state.installing) {
            console.log('⏳ Installation already in progress');
            return;
        }

        this.state.installing = true;
        this.emit('before-quit-for-update');

        try {
            console.log('💾 Creating backup before installation...');
            await this.createBackup();

            console.log('🔧 Installing update...');
            await this.performInstallation(filepath);

            console.log('✅ Update installed successfully');
            this.emit('update-installed');

            // Restart application
            await this.restartApplication();

        } catch (error) {
            console.error('❌ Installation failed:', error);
            this.state.error = error;
            this.emit('error', error);

            // Attempt rollback
            await this.rollbackUpdate();
        } finally {
            this.state.installing = false;
        }
    }

    async createBackup() {
        const backupDir = path.join(this.options.backupPath, `backup-${Date.now()}`);
        fs.mkdirSync(backupDir, { recursive: true });

        // Backup current executable
        const currentExe = process.execPath;
        if (fs.existsSync(currentExe)) {
            fs.copyFileSync(currentExe, path.join(backupDir, 'application.exe'));
        }

        // Backup database
        const dbPath = path.join(process.cwd(), 'src', 'database', 'db.sqlite');
        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, path.join(backupDir, 'database.sqlite'));
        }

        // Backup config files
        const configFiles = ['.env', 'config.json', '.release-config.json'];
        for (const file of configFiles) {
            const filepath = path.join(process.cwd(), file);
            if (fs.existsSync(filepath)) {
                fs.copyFileSync(filepath, path.join(backupDir, file));
            }
        }

        this.lastBackupPath = backupDir;
        console.log(`💾 Backup created: ${backupDir}`);
    }

    async performInstallation(updateFilepath) {
        // This is a simplified version - actual implementation would be more complex
        // Depending on the packaging format (ZIP, installer, etc.)

        console.log('🚀 Extracting and installing update...');

        // For now, we'll create a script that will be executed after app restart
        const installScript = this.createInstallScript(updateFilepath);

        // The actual replacement will happen during restart
        fs.writeFileSync(
            path.join(process.cwd(), 'pending-update.json'),
            JSON.stringify({
                updateFile: updateFilepath,
                installScript: installScript,
                timestamp: Date.now(),
                version: this.state.latestVersion
            })
        );
    }

    createInstallScript(updateFilepath) {
        // Create a batch script for Windows installation
        const scriptPath = path.join(this.options.downloadPath, 'install-update.bat');

        const script = `@echo off
echo Installing E-Ijazah update...
timeout /t 3 /nobreak >nul

echo Extracting update...
powershell -command "Expand-Archive -Path '${updateFilepath}' -DestinationPath '${process.cwd()}' -Force"

echo Update installed successfully!
echo Restarting application...

start "" "${process.execPath}"
exit
`;

        fs.writeFileSync(scriptPath, script);
        return scriptPath;
    }

    async restartApplication() {
        console.log('🔄 Restarting application...');

        // Check if there's a pending update to process
        const pendingUpdateFile = path.join(process.cwd(), 'pending-update.json');

        if (fs.existsSync(pendingUpdateFile)) {
            const updateInfo = JSON.parse(fs.readFileSync(pendingUpdateFile, 'utf8'));

            // Execute the install script
            spawn('cmd', ['/c', updateInfo.installScript], {
                detached: true,
                stdio: 'ignore'
            });

            // Exit current process
            process.exit(0);
        } else {
            // Normal restart
            spawn(process.execPath, process.argv.slice(1), {
                detached: true,
                stdio: 'ignore'
            });

            process.exit(0);
        }
    }

    async rollbackUpdate() {
        if (!this.lastBackupPath) {
            console.error('❌ No backup available for rollback');
            return;
        }

        console.log('🔄 Rolling back update...');

        try {
            // Restore from backup
            const backupExe = path.join(this.lastBackupPath, 'application.exe');
            if (fs.existsSync(backupExe)) {
                fs.copyFileSync(backupExe, process.execPath);
            }

            const backupDb = path.join(this.lastBackupPath, 'database.sqlite');
            const dbPath = path.join(process.cwd(), 'src', 'database', 'db.sqlite');
            if (fs.existsSync(backupDb)) {
                fs.copyFileSync(backupDb, dbPath);
            }

            console.log('✅ Rollback completed');
            this.emit('update-rollback');

        } catch (error) {
            console.error('❌ Rollback failed:', error);
            this.emit('error', new Error(`Rollback failed: ${error.message}`));
        }
    }

    // ============= UTILITY METHODS =============

    startPeriodicCheck() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
        }

        this.checkTimer = setInterval(async () => {
            if (!this.state.checking && !this.state.downloading && !this.state.installing) {
                await this.checkForUpdates();
            }
        }, this.options.checkInterval);
    }

    stopPeriodicCheck() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
    }

    abortDownload() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    getState() {
        return { ...this.state };
    }

    // Clean up
    destroy() {
        this.stopPeriodicCheck();
        this.abortDownload();
        this.removeAllListeners();
    }
}

module.exports = AutoUpdater;