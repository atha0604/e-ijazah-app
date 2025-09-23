// Auto-Updater Module Entry Point
const AutoUpdater = require('./AutoUpdater');
const BackupManager = require('./BackupManager');
const UpdateInstaller = require('./UpdateInstaller');

// Main Updater Manager Class
class UpdaterManager {
    constructor(options = {}) {
        this.options = {
            // GitHub repository info
            owner: options.owner || 'atha0604',
            repo: options.repo || 'e-ijazah-app',

            // Paths
            appPath: options.appPath || process.cwd(),
            tempPath: options.tempPath || require('path').join(process.cwd(), 'temp'),
            backupPath: options.backupPath || require('path').join(process.cwd(), 'backup'),

            // Update behavior
            autoCheck: options.autoCheck !== false,
            autoDownload: options.autoDownload || false,
            autoInstall: options.autoInstall || false,
            checkInterval: options.checkInterval || 30 * 60 * 1000, // 30 minutes

            // Backup settings
            maxBackups: options.maxBackups || 5,
            fullBackupOnUpdate: options.fullBackupOnUpdate !== false,

            ...options
        };

        this.autoUpdater = null;
        this.backupManager = null;
        this.updateInstaller = null;

        this.state = {
            initialized: false,
            updateAvailable: false,
            downloading: false,
            installing: false,
            error: null
        };

        this.init();
    }

    async init() {
        try {
            console.log('🔄 Initializing Update Manager...');

            // Initialize backup manager
            this.backupManager = new BackupManager({
                backupPath: this.options.backupPath,
                maxBackups: this.options.maxBackups,
                includeUserData: true
            });

            // Initialize update installer
            this.updateInstaller = new UpdateInstaller({
                tempPath: this.options.tempPath,
                installPath: this.options.appPath,
                backupPath: this.options.backupPath,
                preserveData: true,
                preserveConfig: true,
                autoRestart: false // We'll handle restart manually
            });

            // Initialize auto updater
            this.autoUpdater = new AutoUpdater({
                owner: this.options.owner,
                repo: this.options.repo,
                currentVersion: require('../../package.json').version,
                downloadPath: this.options.tempPath,
                backupPath: this.options.backupPath,
                autoCheck: this.options.autoCheck,
                autoDownload: this.options.autoDownload,
                autoInstall: false // We'll handle installation manually
            });

            // Setup event listeners
            this.setupEventListeners();

            this.state.initialized = true;
            console.log('✅ Update Manager initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Update Manager:', error);
            this.state.error = error;
            throw error;
        }
    }

    setupEventListeners() {
        // Auto-updater events
        this.autoUpdater.on('update-available', (updateInfo) => {
            console.log('🎉 Update available:', updateInfo.version);
            this.state.updateAvailable = true;
            this.onUpdateAvailable(updateInfo);
        });

        this.autoUpdater.on('update-not-available', () => {
            console.log('✅ No updates available');
            this.state.updateAvailable = false;
        });

        this.autoUpdater.on('download-progress', (progress) => {
            this.onDownloadProgress(progress);
        });

        this.autoUpdater.on('update-downloaded', (info) => {
            console.log('📥 Update downloaded:', info.path);
            this.onUpdateDownloaded(info);
        });

        this.autoUpdater.on('error', (error) => {
            console.error('❌ Auto-updater error:', error);
            this.state.error = error;
            this.onError(error);
        });

        // Update installer events
        this.updateInstaller.on('installation-started', () => {
            console.log('🚀 Installation started');
            this.state.installing = true;
        });

        this.updateInstaller.on('progress', (progress) => {
            this.onInstallProgress(progress);
        });

        this.updateInstaller.on('installation-completed', () => {
            console.log('✅ Installation completed');
            this.state.installing = false;
            this.onInstallationCompleted();
        });

        this.updateInstaller.on('installation-failed', (error) => {
            console.error('❌ Installation failed:', error);
            this.state.installing = false;
            this.state.error = error;
            this.onError(error);
        });

        this.updateInstaller.on('rollback-completed', () => {
            console.log('🔄 Rollback completed');
            this.onRollbackCompleted();
        });
    }

    // ============= PUBLIC API METHODS =============

    async checkForUpdates() {
        if (!this.state.initialized) {
            throw new Error('Update Manager not initialized');
        }

        console.log('🔍 Manually checking for updates...');
        return await this.autoUpdater.checkForUpdates();
    }

    async downloadUpdate() {
        if (!this.state.updateAvailable) {
            throw new Error('No update available to download');
        }

        console.log('📥 Starting manual download...');
        this.state.downloading = true;
        return await this.autoUpdater.downloadUpdate();
    }

    async installUpdate(updatePath) {
        if (!updatePath) {
            throw new Error('Update path is required');
        }

        console.log('🔧 Starting manual installation...');

        try {
            // Create full backup before installation
            if (this.options.fullBackupOnUpdate) {
                console.log('💾 Creating full backup before update...');
                const backupResult = await this.backupManager.createFullBackup(
                    this.autoUpdater.state.latestVersion || 'unknown'
                );
                console.log('✅ Full backup created:', backupResult.path);
            }

            // Install the update
            const result = await this.updateInstaller.installUpdate(updatePath);
            return result;

        } catch (error) {
            console.error('❌ Installation failed:', error);
            throw error;
        }
    }

    async createBackup(type = 'manual') {
        console.log(`💾 Creating ${type} backup...`);

        if (type === 'full') {
            return await this.backupManager.createFullBackup();
        } else {
            return await this.backupManager.createQuickBackup();
        }
    }

    async restoreFromBackup(backupPath) {
        console.log('🔄 Restoring from backup...');
        return await this.backupManager.restoreFromBackup(backupPath);
    }

    getAvailableBackups() {
        return this.backupManager.listBackups();
    }

    getState() {
        return {
            ...this.state,
            autoUpdater: this.autoUpdater ? this.autoUpdater.getState() : null,
            installer: this.updateInstaller ? this.updateInstaller.getState() : null
        };
    }

    // ============= EVENT HANDLERS =============

    onUpdateAvailable(updateInfo) {
        // Emit custom event for UI
        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI.onUpdateAvailable(updateInfo);
        }

        // Broadcast via Socket.IO if available
        if (typeof global !== 'undefined' && global.io) {
            global.io.emit('update-available', updateInfo);
        }
    }

    onDownloadProgress(progress) {
        console.log(`📊 Download progress: ${progress.percent}%`);

        // Update UI
        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI.updateDownloadProgress(progress);
        }

        // Broadcast progress
        if (typeof global !== 'undefined' && global.io) {
            global.io.emit('download-progress', progress);
        }
    }

    onUpdateDownloaded(info) {
        this.state.downloading = false;

        // Notify UI
        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI.onUpdateDownloaded(info);
        }

        // Auto-install if enabled
        if (this.options.autoInstall) {
            this.installUpdate(info.path);
        }
    }

    onInstallProgress(progress) {
        console.log(`🔧 Install progress: ${progress.percent}% - ${progress.message}`);

        // Update UI
        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI.updateInstallProgress(progress);
        }
    }

    onInstallationCompleted() {
        console.log('🎉 Update installation completed successfully!');

        // Notify UI
        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI.onInstallationComplete();
        }

        // Reset state
        this.state.updateAvailable = false;
        this.state.error = null;
    }

    onRollbackCompleted() {
        console.log('🔄 Rollback completed - application restored to previous state');

        // Notify UI
        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI.onRollbackComplete();
        }

        // Reset state
        this.state.error = null;
        this.state.installing = false;
    }

    onError(error) {
        console.error('❌ Update Manager error:', error);

        // Notify UI
        if (typeof window !== 'undefined' && window.updateUI) {
            window.updateUI.onUpdateError(error);
        }

        // Broadcast error
        if (typeof global !== 'undefined' && global.io) {
            global.io.emit('update-error', {
                message: error.message,
                stack: error.stack
            });
        }
    }

    // ============= UTILITY METHODS =============

    async restartApplication() {
        console.log('🔄 Restarting application...');

        // Give UI time to show restart message
        setTimeout(() => {
            if (process.platform === 'win32') {
                // Windows restart
                const { spawn } = require('child_process');
                spawn(process.execPath, process.argv.slice(1), {
                    detached: true,
                    stdio: 'ignore'
                });
                process.exit(0);
            } else {
                // Unix-like systems
                process.exit(0);
            }
        }, 2000);
    }

    destroy() {
        console.log('🧹 Cleaning up Update Manager...');

        if (this.autoUpdater) {
            this.autoUpdater.destroy();
        }

        // Reset state
        this.state.initialized = false;
        this.state.updateAvailable = false;
        this.state.downloading = false;
        this.state.installing = false;
        this.state.error = null;
    }
}

// Export classes
module.exports = {
    UpdaterManager,
    AutoUpdater,
    BackupManager,
    UpdateInstaller
};

// Create and export singleton instance
let instance = null;

module.exports.createUpdaterManager = (options = {}) => {
    if (instance) {
        console.log('⚠️ UpdaterManager instance already exists');
        return instance;
    }

    instance = new UpdaterManager(options);
    return instance;
};

module.exports.getUpdaterManager = () => {
    if (!instance) {
        throw new Error('UpdaterManager not initialized. Call createUpdaterManager() first.');
    }
    return instance;
};