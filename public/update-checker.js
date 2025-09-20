// ===== UPDATE CHECKER SYSTEM =====
// Auto-check for updates and show notifications

class UpdateChecker {
    constructor(options = {}) {
        this.options = {
            checkInterval: options.checkInterval || 30 * 60 * 1000, // 30 menit
            autoCheck: options.autoCheck !== false, // default true
            showNotifications: options.showNotifications !== false, // default true
            debugMode: options.debugMode || false,
            ...options
        };

        this.currentVersion = null;
        this.latestVersion = null;
        this.updateInfo = null;
        this.checkTimer = null;
        this.lastCheckTime = null;

        this.init();
    }

    async init() {
        this.log('UpdateChecker initialized');

        // Setup notification elements
        this.createNotificationElements();

        // Initial check
        if (this.options.autoCheck) {
            await this.checkForUpdates();
            this.startPeriodicCheck();
        }
    }

    createNotificationElements() {
        // Create update notification banner
        const notification = document.createElement('div');
        notification.id = 'updateNotification';
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-notification-content">
                <div class="update-info">
                    <div class="update-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <div class="update-text">
                        <div class="update-title" id="updateTitle">Update tersedia!</div>
                        <div class="update-subtitle" id="updateSubtitle">Versi terbaru siap digunakan</div>
                    </div>
                </div>
                <div class="update-actions">
                    <button class="update-btn update-btn-primary" onclick="updateChecker.showUpdateModal()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        Lihat Detail
                    </button>
                    <button class="update-btn update-btn-secondary" onclick="updateChecker.remindLater()">
                        Nanti Saja
                    </button>
                    <button class="update-close" onclick="updateChecker.hideNotification()" aria-label="Tutup">×</button>
                </div>
            </div>
        `;

        // Create update modal
        const modal = document.createElement('div');
        modal.id = 'updateModal';
        modal.className = 'update-modal';
        modal.innerHTML = `
            <div class="update-modal-content">
                <div class="update-modal-header">
                    <h3 class="update-modal-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9l-5 4.87 1.18 6.88L12 17.77l-6.18 2.98L7 14.87 2 9l6.91-1.74L12 2z"/>
                        </svg>
                        Update Tersedia
                        <span class="update-version-badge" id="modalVersionBadge">v2.6.0</span>
                    </h3>
                    <button class="update-close" onclick="updateChecker.hideUpdateModal()" aria-label="Tutup">×</button>
                </div>
                <div class="update-modal-body" id="updateModalBody">
                    <div class="update-section">
                        <h4 class="update-section-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#4caf50">
                                <path d="M12 2l3.09 6.26L22 9l-5 4.87 1.18 6.88L12 17.77l-6.18 2.98L7 14.87 2 9l6.91-1.74L12 2z"/>
                            </svg>
                            Fitur Baru
                        </h4>
                        <ul class="update-list" id="updateFeatures"></ul>
                    </div>
                    <div class="update-section">
                        <h4 class="update-section-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff9800">
                                <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                            </svg>
                            Perbaikan Bug
                        </h4>
                        <ul class="update-list bugfixes" id="updateBugfixes"></ul>
                    </div>
                    <div class="update-meta" id="updateMeta">
                        <div class="update-meta-item">
                            <span class="update-meta-label">Versi Saat Ini:</span>
                            <span class="update-meta-value" id="currentVersionText">-</span>
                        </div>
                        <div class="update-meta-item">
                            <span class="update-meta-label">Versi Terbaru:</span>
                            <span class="update-meta-value" id="latestVersionText">-</span>
                        </div>
                        <div class="update-meta-item">
                            <span class="update-meta-label">Tanggal Rilis:</span>
                            <span class="update-meta-value" id="releaseDateText">-</span>
                        </div>
                        <div class="update-meta-item">
                            <span class="update-meta-label">Tipe Update:</span>
                            <span class="update-meta-value" id="updateTypeText">-</span>
                        </div>
                    </div>
                </div>
                <div class="update-modal-footer">
                    <button class="update-btn update-btn-secondary" onclick="updateChecker.hideUpdateModal()">
                        Tutup
                    </button>
                    <a class="update-btn update-btn-primary" id="downloadUpdateBtn" href="#" target="_blank">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/>
                        </svg>
                        Download Update
                    </a>
                </div>
            </div>
        `;

        // Create status indicator
        const status = document.createElement('div');
        status.id = 'updateStatus';
        status.className = 'update-status';
        status.innerHTML = `
            <div class="update-status-icon">✓</div>
            <div class="update-status-text" id="updateStatusText">Aplikasi up-to-date</div>
        `;

        // Append to body
        document.body.appendChild(notification);
        document.body.appendChild(modal);
        document.body.appendChild(status);
    }

    async checkForUpdates(showStatus = false) {
        try {
            this.log('Checking for updates...');

            if (showStatus) {
                this.showStatus('Memeriksa update...', 'checking');
            }

            const response = await fetch('/api/updates/check');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Gagal memeriksa update');
            }

            this.currentVersion = data.currentVersion;
            this.latestVersion = data.latestVersion;
            this.updateInfo = data.updateInfo;
            this.lastCheckTime = new Date();

            this.log(`Current: ${this.currentVersion}, Latest: ${this.latestVersion}`);

            if (data.updateAvailable && this.options.showNotifications) {
                this.showNotification(data.updateInfo);
                if (showStatus) {
                    this.showStatus(`Update tersedia: v${this.latestVersion}`, 'update-available');
                }
            } else {
                if (showStatus) {
                    this.showStatus('Aplikasi sudah up-to-date', 'up-to-date');
                }
            }

            return data;

        } catch (error) {
            this.log('Error checking for updates:', error);
            if (showStatus) {
                this.showStatus('Gagal memeriksa update', 'error');
            }
            return null;
        }
    }

    showNotification(updateInfo) {
        const notification = document.getElementById('updateNotification');
        const title = document.getElementById('updateTitle');
        const subtitle = document.getElementById('updateSubtitle');

        if (notification && title && subtitle) {
            title.textContent = `Update v${updateInfo.version} Tersedia!`;
            subtitle.textContent = `${updateInfo.features.length} fitur baru dan ${updateInfo.bugfixes.length} perbaikan`;

            notification.classList.add('show');
        }
    }

    hideNotification() {
        const notification = document.getElementById('updateNotification');
        if (notification) {
            notification.classList.remove('show');
        }
    }

    showUpdateModal() {
        if (!this.updateInfo) return;

        const modal = document.getElementById('updateModal');
        const versionBadge = document.getElementById('modalVersionBadge');
        const features = document.getElementById('updateFeatures');
        const bugfixes = document.getElementById('updateBugfixes');
        const currentVersionText = document.getElementById('currentVersionText');
        const latestVersionText = document.getElementById('latestVersionText');
        const releaseDateText = document.getElementById('releaseDateText');
        const updateTypeText = document.getElementById('updateTypeText');
        const downloadBtn = document.getElementById('downloadUpdateBtn');

        // Populate modal content
        if (versionBadge) versionBadge.textContent = `v${this.updateInfo.version}`;
        if (currentVersionText) currentVersionText.textContent = `v${this.currentVersion}`;
        if (latestVersionText) latestVersionText.textContent = `v${this.latestVersion}`;
        if (releaseDateText) releaseDateText.textContent = this.formatDate(this.updateInfo.releaseDate);
        if (updateTypeText) updateTypeText.textContent = this.getUpdateTypeLabel(this.updateInfo.type);
        if (downloadBtn) downloadBtn.href = this.updateInfo.downloadUrl;

        // Populate features
        if (features) {
            features.innerHTML = '';
            this.updateInfo.features.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature;
                features.appendChild(li);
            });
        }

        // Populate bugfixes
        if (bugfixes) {
            bugfixes.innerHTML = '';
            this.updateInfo.bugfixes.forEach(bugfix => {
                const li = document.createElement('li');
                li.textContent = bugfix;
                bugfixes.appendChild(li);
            });
        }

        // Show modal
        if (modal) {
            modal.classList.add('show');
        }

        // Hide notification
        this.hideNotification();
    }

    hideUpdateModal() {
        const modal = document.getElementById('updateModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    remindLater() {
        this.hideNotification();
        // Set reminder untuk 1 jam kemudian
        setTimeout(() => {
            if (this.updateInfo && this.options.showNotifications) {
                this.showNotification(this.updateInfo);
            }
        }, 60 * 60 * 1000); // 1 jam
    }

    showStatus(message, type = 'info') {
        const status = document.getElementById('updateStatus');
        const statusText = document.getElementById('updateStatusText');
        const statusIcon = status?.querySelector('.update-status-icon');

        if (status && statusText) {
            statusText.textContent = message;

            // Update icon based on type
            if (statusIcon) {
                switch (type) {
                    case 'checking':
                        statusIcon.textContent = '🔄';
                        break;
                    case 'update-available':
                        statusIcon.textContent = '⬆️';
                        break;
                    case 'up-to-date':
                        statusIcon.textContent = '✓';
                        break;
                    case 'error':
                        statusIcon.textContent = '❌';
                        break;
                    default:
                        statusIcon.textContent = 'ℹ️';
                }
            }

            status.classList.add('show');

            // Auto hide after 3 seconds
            setTimeout(() => {
                status.classList.remove('show');
            }, 3000);
        }
    }

    startPeriodicCheck() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
        }

        this.checkTimer = setInterval(() => {
            this.checkForUpdates();
        }, this.options.checkInterval);
    }

    stopPeriodicCheck() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getUpdateTypeLabel(type) {
        const labels = {
            'major': 'Update Besar',
            'minor': 'Update Kecil',
            'patch': 'Perbaikan',
            'hotfix': 'Hotfix'
        };
        return labels[type] || 'Update';
    }

    log(...args) {
        if (this.options.debugMode) {
            console.log('[UpdateChecker]', ...args);
        }
    }

    // Public API methods
    async manualCheck() {
        return await this.checkForUpdates(true);
    }

    destroy() {
        this.stopPeriodicCheck();

        // Remove elements
        const elements = ['updateNotification', 'updateModal', 'updateStatus'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
    }
}

// Auto-initialize when DOM is ready
let updateChecker;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize update checker with default options
    updateChecker = new UpdateChecker({
        checkInterval: 30 * 60 * 1000, // 30 menit
        autoCheck: true,
        showNotifications: true,
        debugMode: false // Set true untuk debugging
    });

    // Add manual check button to admin menu if exists
    const adminMenu = document.querySelector('.sidebar');
    if (adminMenu) {
        // Will add manual check button later
    }
});

// Export for global access
window.updateChecker = updateChecker;