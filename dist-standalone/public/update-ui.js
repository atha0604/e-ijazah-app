// Modern Update UI dengan progress dan notifications
class UpdateUI {
    constructor() {
        this.updater = null;
        this.updateInfo = null;
        this.isVisible = false;

        this.elements = {
            container: null,
            modal: null,
            notification: null,
            progressBar: null,
            progressText: null
        };

        this.init();
    }

    init() {
        this.createUpdateElements();
        this.setupEventListeners();
        this.connectToUpdater();

        console.log('🎨 Update UI initialized');
    }

    createUpdateElements() {
        // Create main update container
        this.elements.container = this.createElement('div', 'update-ui-container', `
            <!-- Update Notification Banner -->
            <div id="updateNotificationBanner" class="update-notification-banner hidden">
                <div class="update-banner-content">
                    <div class="update-banner-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <div class="update-banner-text">
                        <div class="update-banner-title">Update tersedia!</div>
                        <div class="update-banner-subtitle">Versi baru dengan fitur dan perbaikan</div>
                    </div>
                    <div class="update-banner-actions">
                        <button id="updateBannerView" class="update-btn update-btn-primary">Lihat Detail</button>
                        <button id="updateBannerLater" class="update-btn update-btn-secondary">Nanti</button>
                    </div>
                    <button id="updateBannerClose" class="update-banner-close">&times;</button>
                </div>
            </div>

            <!-- Update Modal -->
            <div id="updateModal" class="update-modal hidden">
                <div class="update-modal-overlay"></div>
                <div class="update-modal-content">
                    <div class="update-modal-header">
                        <h2 id="updateModalTitle">Update Aplikasi E-Ijazah</h2>
                        <button id="updateModalClose" class="update-modal-close">&times;</button>
                    </div>

                    <div class="update-modal-body">
                        <!-- Update Available View -->
                        <div id="updateAvailableView" class="update-view">
                            <div class="update-info">
                                <div class="update-version">
                                    <span class="update-label">Versi Terbaru:</span>
                                    <span id="updateLatestVersion" class="update-value">-</span>
                                </div>
                                <div class="update-current">
                                    <span class="update-label">Versi Saat Ini:</span>
                                    <span id="updateCurrentVersion" class="update-value">-</span>
                                </div>
                                <div class="update-size">
                                    <span class="update-label">Ukuran Download:</span>
                                    <span id="updateFileSize" class="update-value">-</span>
                                </div>
                            </div>

                            <div class="update-changelog">
                                <h3>📋 Apa yang Baru?</h3>
                                <div id="updateReleaseNotes" class="update-release-notes">
                                    <div class="update-loading">Memuat informasi update...</div>
                                </div>
                            </div>

                            <div class="update-actions">
                                <button id="updateDownloadBtn" class="update-btn update-btn-primary update-btn-large">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                                    </svg>
                                    Download & Install
                                </button>
                                <button id="updateLaterBtn" class="update-btn update-btn-secondary update-btn-large">
                                    Remind Me Later
                                </button>
                            </div>
                        </div>

                        <!-- Download Progress View -->
                        <div id="updateDownloadView" class="update-view hidden">
                            <div class="update-progress-container">
                                <div class="update-progress-header">
                                    <h3 id="updateProgressTitle">Downloading Update...</h3>
                                    <div id="updateProgressStatus" class="update-progress-status">Preparing download...</div>
                                </div>

                                <div class="update-progress-bar-container">
                                    <div class="update-progress-bar">
                                        <div id="updateProgressFill" class="update-progress-fill" style="width: 0%"></div>
                                    </div>
                                    <div class="update-progress-text">
                                        <span id="updateProgressPercent">0%</span>
                                        <span id="updateProgressSize">0 MB / 0 MB</span>
                                    </div>
                                </div>

                                <div class="update-progress-details">
                                    <div class="update-progress-speed">
                                        <span class="update-label">Speed:</span>
                                        <span id="updateProgressSpeed">- KB/s</span>
                                    </div>
                                    <div class="update-progress-eta">
                                        <span class="update-label">Time remaining:</span>
                                        <span id="updateProgressETA">Calculating...</span>
                                    </div>
                                </div>

                                <div class="update-progress-actions">
                                    <button id="updateCancelBtn" class="update-btn update-btn-secondary">
                                        Cancel Download
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Installation Progress View -->
                        <div id="updateInstallView" class="update-view hidden">
                            <div class="update-install-container">
                                <div class="update-install-header">
                                    <div class="update-install-icon">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" class="update-spinner">
                                            <path d="M12,4a8,8 0 0,1 7.89,6.7 1.53,1.53 0 0,0 1.49,1.3 1.5,1.5 0 0,0 1.48-1.75A11,11 0 0,0 12,1L12,4Z"/>
                                        </svg>
                                    </div>
                                    <h3>Installing Update</h3>
                                    <p>Please don't close the application during installation</p>
                                </div>

                                <div class="update-install-progress">
                                    <div class="update-progress-bar">
                                        <div id="updateInstallFill" class="update-progress-fill" style="width: 0%"></div>
                                    </div>
                                    <div id="updateInstallStatus" class="update-install-status">Preparing installation...</div>
                                </div>

                                <div class="update-install-steps">
                                    <div class="update-step" id="step-backup">
                                        <div class="update-step-icon">📦</div>
                                        <div class="update-step-text">Creating backup</div>
                                        <div class="update-step-status">pending</div>
                                    </div>
                                    <div class="update-step" id="step-extract">
                                        <div class="update-step-icon">📁</div>
                                        <div class="update-step-text">Extracting files</div>
                                        <div class="update-step-status">pending</div>
                                    </div>
                                    <div class="update-step" id="step-install">
                                        <div class="update-step-icon">⚡</div>
                                        <div class="update-step-text">Installing update</div>
                                        <div class="update-step-status">pending</div>
                                    </div>
                                    <div class="update-step" id="step-restart">
                                        <div class="update-step-icon">🔄</div>
                                        <div class="update-step-text">Restarting application</div>
                                        <div class="update-step-status">pending</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Update Complete View -->
                        <div id="updateCompleteView" class="update-view hidden">
                            <div class="update-complete-container">
                                <div class="update-complete-icon">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" class="update-success-icon">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                </div>
                                <h3>Update Completed!</h3>
                                <p>E-Ijazah has been successfully updated to the latest version.</p>

                                <div class="update-complete-actions">
                                    <button id="updateRestartBtn" class="update-btn update-btn-primary update-btn-large">
                                        Restart Now
                                    </button>
                                    <button id="updateContinueBtn" class="update-btn update-btn-secondary update-btn-large">
                                        Continue Working
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Error View -->
                        <div id="updateErrorView" class="update-view hidden">
                            <div class="update-error-container">
                                <div class="update-error-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                    </svg>
                                </div>
                                <h3>Update Failed</h3>
                                <p id="updateErrorMessage">An error occurred during the update process.</p>

                                <div class="update-error-details">
                                    <button id="updateErrorToggle" class="update-btn update-btn-text">Show Details</button>
                                    <div id="updateErrorDetails" class="update-error-details-content hidden"></div>
                                </div>

                                <div class="update-error-actions">
                                    <button id="updateRetryBtn" class="update-btn update-btn-primary">
                                        Try Again
                                    </button>
                                    <button id="updateErrorCloseBtn" class="update-btn update-btn-secondary">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        document.body.appendChild(this.elements.container);

        // Cache element references
        this.elements.modal = document.getElementById('updateModal');
        this.elements.notification = document.getElementById('updateNotificationBanner');
        this.elements.progressBar = document.getElementById('updateProgressFill');
        this.elements.progressText = document.getElementById('updateProgressPercent');
    }

    createElement(tag, id, innerHTML) {
        const element = document.createElement(tag);
        if (id) element.id = id;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    setupEventListeners() {
        // Banner events
        document.getElementById('updateBannerView')?.addEventListener('click', () => this.showUpdateModal());
        document.getElementById('updateBannerLater')?.addEventListener('click', () => this.hideNotification());
        document.getElementById('updateBannerClose')?.addEventListener('click', () => this.hideNotification());

        // Modal events
        document.getElementById('updateModalClose')?.addEventListener('click', () => this.hideModal());
        document.getElementById('updateDownloadBtn')?.addEventListener('click', () => this.startDownload());
        document.getElementById('updateLaterBtn')?.addEventListener('click', () => this.remindLater());
        document.getElementById('updateCancelBtn')?.addEventListener('click', () => this.cancelDownload());
        document.getElementById('updateRetryBtn')?.addEventListener('click', () => this.retryUpdate());
        document.getElementById('updateRestartBtn')?.addEventListener('click', () => this.restartApplication());
        document.getElementById('updateContinueBtn')?.addEventListener('click', () => this.hideModal());

        // Error details toggle
        document.getElementById('updateErrorToggle')?.addEventListener('click', () => this.toggleErrorDetails());

        // Close modal on overlay click
        document.querySelector('.update-modal-overlay')?.addEventListener('click', () => this.hideModal());

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideModal();
            }
        });
    }

    connectToUpdater() {
        // This would connect to the actual AutoUpdater instance
        // For now, we'll simulate the connection
        console.log('🔗 Connecting to updater...');

        // Simulate updater events for demo
        setTimeout(() => {
            this.onUpdateAvailable({
                version: 'v2.8.0',
                currentVersion: '2.7.0',
                fileSize: 25 * 1024 * 1024, // 25MB
                releaseNotes: this.getMockReleaseNotes()
            });
        }, 3000);
    }

    // ============= UPDATE FLOW METHODS =============

    onUpdateAvailable(updateInfo) {
        this.updateInfo = updateInfo;
        this.showNotification();
        this.populateUpdateInfo();

        console.log('🎉 Update available:', updateInfo.version);
    }

    showNotification() {
        this.elements.notification.classList.remove('hidden');
        this.elements.notification.classList.add('show');

        // Auto-hide after 10 seconds if user doesn't interact
        setTimeout(() => {
            if (this.elements.notification.classList.contains('show')) {
                this.hideNotification();
            }
        }, 10000);
    }

    hideNotification() {
        this.elements.notification.classList.remove('show');
        this.elements.notification.classList.add('hidden');
    }

    showUpdateModal() {
        this.hideNotification();
        this.elements.modal.classList.remove('hidden');
        this.isVisible = true;
        this.showView('updateAvailableView');

        // Add show class for animation
        setTimeout(() => {
            this.elements.modal.classList.add('show');
        }, 10);
    }

    hideModal() {
        this.elements.modal.classList.remove('show');
        this.isVisible = false;

        setTimeout(() => {
            this.elements.modal.classList.add('hidden');
        }, 300);
    }

    populateUpdateInfo() {
        if (!this.updateInfo) return;

        document.getElementById('updateLatestVersion').textContent = this.updateInfo.version;
        document.getElementById('updateCurrentVersion').textContent = this.updateInfo.currentVersion;
        document.getElementById('updateFileSize').textContent = this.formatBytes(this.updateInfo.fileSize);
        document.getElementById('updateReleaseNotes').innerHTML = this.updateInfo.releaseNotes;
    }

    startDownload() {
        this.showView('updateDownloadView');
        console.log('📥 Starting download...');

        // Simulate download progress
        this.simulateDownload();
    }

    simulateDownload() {
        let progress = 0;
        const totalSize = this.updateInfo.fileSize;
        const startTime = Date.now();

        const interval = setInterval(() => {
            progress += Math.random() * 5;
            if (progress > 100) progress = 100;

            const downloaded = (progress / 100) * totalSize;
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = downloaded / elapsed;
            const remaining = (totalSize - downloaded) / speed;

            this.updateDownloadProgress({
                percent: progress,
                transferred: downloaded,
                total: totalSize,
                speed: speed,
                eta: remaining
            });

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.startInstallation();
                }, 1000);
            }
        }, 100);
    }

    updateDownloadProgress(progress) {
        document.getElementById('updateProgressFill').style.width = `${progress.percent}%`;
        document.getElementById('updateProgressPercent').textContent = `${Math.round(progress.percent)}%`;
        document.getElementById('updateProgressSize').textContent =
            `${this.formatBytes(progress.transferred)} / ${this.formatBytes(progress.total)}`;
        document.getElementById('updateProgressSpeed').textContent = `${this.formatSpeed(progress.speed)}`;
        document.getElementById('updateProgressETA').textContent = this.formatTime(progress.eta);
    }

    startInstallation() {
        this.showView('updateInstallView');
        console.log('🔧 Starting installation...');

        // Simulate installation steps
        this.simulateInstallation();
    }

    simulateInstallation() {
        const steps = ['backup', 'extract', 'install', 'restart'];
        let currentStep = 0;

        const processStep = () => {
            if (currentStep > 0) {
                this.updateStepStatus(steps[currentStep - 1], 'completed');
            }

            if (currentStep < steps.length) {
                this.updateStepStatus(steps[currentStep], 'active');

                const progress = ((currentStep + 1) / steps.length) * 100;
                document.getElementById('updateInstallFill').style.width = `${progress}%`;
                document.getElementById('updateInstallStatus').textContent =
                    this.getStepMessage(steps[currentStep]);

                currentStep++;
                setTimeout(processStep, 2000);
            } else {
                this.onInstallationComplete();
            }
        };

        processStep();
    }

    updateStepStatus(stepId, status) {
        const step = document.getElementById(`step-${stepId}`);
        if (step) {
            const statusEl = step.querySelector('.update-step-status');
            statusEl.textContent = status;
            statusEl.className = `update-step-status ${status}`;
        }
    }

    getStepMessage(step) {
        const messages = {
            backup: 'Creating backup of current installation...',
            extract: 'Extracting update files...',
            install: 'Installing new version...',
            restart: 'Preparing to restart application...'
        };
        return messages[step] || 'Processing...';
    }

    onInstallationComplete() {
        this.showView('updateCompleteView');
        console.log('✅ Installation completed!');
    }

    onUpdateError(error) {
        document.getElementById('updateErrorMessage').textContent = error.message;
        document.getElementById('updateErrorDetails').textContent = error.stack || error.toString();
        this.showView('updateErrorView');
        console.error('❌ Update error:', error);
    }

    // ============= USER ACTIONS =============

    remindLater() {
        // Set reminder for later (e.g., 24 hours)
        localStorage.setItem('updateReminder', Date.now() + (24 * 60 * 60 * 1000));
        this.hideModal();

        this.showToast('You will be reminded about this update tomorrow', 'info');
    }

    cancelDownload() {
        // Cancel the current download
        console.log('🛑 Download cancelled by user');
        this.showView('updateAvailableView');
    }

    retryUpdate() {
        // Retry the update process
        console.log('🔄 Retrying update...');
        this.showView('updateAvailableView');
    }

    restartApplication() {
        this.showToast('Restarting application...', 'info');

        // In a real application, this would trigger the restart
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    toggleErrorDetails() {
        const details = document.getElementById('updateErrorDetails');
        const toggle = document.getElementById('updateErrorToggle');

        if (details.classList.contains('hidden')) {
            details.classList.remove('hidden');
            toggle.textContent = 'Hide Details';
        } else {
            details.classList.add('hidden');
            toggle.textContent = 'Show Details';
        }
    }

    // ============= UTILITY METHODS =============

    showView(viewId) {
        // Hide all views
        const views = document.querySelectorAll('.update-view');
        views.forEach(view => view.classList.add('hidden'));

        // Show target view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `update-toast update-toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto-hide toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, duration);
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatSpeed(bytesPerSecond) {
        const speed = this.formatBytes(bytesPerSecond);
        return speed.replace(' ', ' ') + '/s';
    }

    formatTime(seconds) {
        if (!seconds || !isFinite(seconds)) return 'Unknown';

        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        } else if (seconds < 3600) {
            return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.round((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }

    getMockReleaseNotes() {
        return `
            <div class="release-section">
                <h4>✨ Fitur Baru</h4>
                <ul>
                    <li>Auto-update system yang seamless</li>
                    <li>Enhanced backup dan restore mechanism</li>
                    <li>Improved error handling dan recovery</li>
                    <li>Better progress tracking untuk operations</li>
                </ul>
            </div>

            <div class="release-section">
                <h4>🔧 Perbaikan</h4>
                <ul>
                    <li>Fixed memory leaks dalam data processing</li>
                    <li>Resolved UI responsiveness issues</li>
                    <li>Enhanced security untuk file operations</li>
                    <li>Improved database connection stability</li>
                </ul>
            </div>

            <div class="release-section">
                <h4>🚀 Peningkatan</h4>
                <ul>
                    <li>Faster startup time</li>
                    <li>Reduced memory usage</li>
                    <li>Better error messages</li>
                    <li>Enhanced logging system</li>
                </ul>
            </div>
        `;
    }
}

// Initialize Update UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.updateUI = new UpdateUI();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UpdateUI;
}