// Update Section JavaScript Functions
class UpdateSectionManager {
    constructor() {
        this.currentVersion = '2.6.0';
        this.lastCheckTime = null;
        this.checkInProgress = false;
        this.autoCheckEnabled = true;

        this.init();
    }

    async init() {
        console.log('🔄 Update Section Manager initialized');

        // Load current version info
        await this.loadCurrentVersion();

        // Update system info
        this.updateSystemInfo();

        // Set up auto-check if enabled
        this.setupAutoCheck();

        // Update last check time display
        this.updateLastCheckTime();
    }

    // Load current version from server
    async loadCurrentVersion() {
        try {
            const response = await fetch('/api/updates/check');
            const data = await response.json();

            if (data.success) {
                this.currentVersion = data.currentVersion;
                const currentVersionText = document.getElementById('currentVersionText');
                if (currentVersionText) {
                    currentVersionText.textContent = `v${data.currentVersion}`;
                }

                // Update app mode
                const appModeText = document.getElementById('appModeText');
                if (appModeText) {
                    const isElectron = window.electronAPI !== undefined;
                    appModeText.textContent = isElectron ? 'Desktop Application' : 'Web Application';
                }

                console.log(`📱 Current version: v${this.currentVersion}`);
            }
        } catch (error) {
            console.error('Error loading current version:', error);
            this.showUpdateResult('error', '❌ Gagal memuat informasi versi saat ini');
        }
    }

    // Update system information
    updateSystemInfo() {
        // Auto-check status
        const autoCheckStatus = document.getElementById('autoCheckStatus');
        if (autoCheckStatus) {
            autoCheckStatus.textContent = this.autoCheckEnabled ? 'Aktif (30 menit)' : 'Nonaktif';
        }
    }

    // Setup auto-check interval
    setupAutoCheck() {
        if (this.autoCheckEnabled) {
            // Check every 30 minutes
            setInterval(() => {
                if (!this.checkInProgress) {
                    this.performSilentCheck();
                }
            }, 30 * 60 * 1000);
        }
    }

    // Perform manual update check
    async performManualUpdate() {
        if (this.checkInProgress) return;

        this.checkInProgress = true;
        const checkBtn = document.getElementById('manualCheckBtn');
        const checkBtnText = document.getElementById('checkBtnText');

        // Update button state
        if (checkBtn) {
            checkBtn.disabled = true;
            checkBtn.classList.add('loading');
        }
        if (checkBtnText) {
            checkBtnText.textContent = 'Memeriksa...';
        }

        try {
            console.log('🔄 Performing manual update check...');

            const response = await fetch('/api/updates/check');
            const data = await response.json();

            if (data.success) {
                this.lastCheckTime = new Date();
                this.updateLastCheckTime();

                if (data.updateAvailable) {
                    this.showUpdateAvailable(data.updateInfo);
                    this.showUpdateResult('success',
                        `✅ Update tersedia! Versi terbaru: v${data.latestVersion}`
                    );
                } else {
                    this.hideUpdateAvailable();
                    this.showUpdateResult('info',
                        `ℹ️ Aplikasi sudah menggunakan versi terbaru (v${data.currentVersion})`
                    );
                }
            } else {
                this.showUpdateResult('error', '❌ Gagal memeriksa update: ' + data.message);
            }

        } catch (error) {
            console.error('Manual update check error:', error);
            this.showUpdateResult('error', '❌ Error: ' + error.message);
        } finally {
            // Reset button state
            this.checkInProgress = false;
            if (checkBtn) {
                checkBtn.disabled = false;
                checkBtn.classList.remove('loading');
            }
            if (checkBtnText) {
                checkBtnText.textContent = 'Cek Update Sekarang';
            }
        }
    }

    // Perform silent background check
    async performSilentCheck() {
        try {
            const response = await fetch('/api/updates/check');
            const data = await response.json();

            if (data.success && data.updateAvailable) {
                this.showUpdateAvailable(data.updateInfo);
            }
        } catch (error) {
            console.error('Silent update check error:', error);
        }
    }

    // Show update available section
    showUpdateAvailable(updateInfo) {
        const updateAvailableCard = document.getElementById('updateAvailableCard');
        const latestVersionText = document.getElementById('latestVersionText');
        const updateDetails = document.getElementById('updateDetails');

        if (latestVersionText) {
            latestVersionText.textContent = `v${updateInfo.version}`;
        }

        // Create update details HTML
        const detailsHTML = `
            <div class="update-info">
                <div class="detail-row">
                    <div class="detail-item">
                        <strong>📅 Tanggal Rilis:</strong>
                        <span>${this.formatDate(updateInfo.releaseDate)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>🆕 Tipe Update:</strong>
                        <span>${this.getUpdateTypeLabel(updateInfo.type)}</span>
                    </div>
                </div>
            </div>

            <div class="update-feature-list">
                <h4>✨ Fitur Baru:</h4>
                <ul>
                    ${updateInfo.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>

            <div class="update-bugfix-list">
                <h4>🔧 Perbaikan:</h4>
                <ul>
                    ${updateInfo.bugfixes.map(fix => `<li>${fix}</li>`).join('')}
                </ul>
            </div>
        `;

        if (updateDetails) {
            updateDetails.innerHTML = detailsHTML;
        }
        if (updateAvailableCard) {
            updateAvailableCard.style.display = 'block';
        }
    }

    // Hide update available section
    hideUpdateAvailable() {
        const updateAvailableCard = document.getElementById('updateAvailableCard');
        if (updateAvailableCard) {
            updateAvailableCard.style.display = 'none';
        }
    }

    // Show update result message
    showUpdateResult(type, message) {
        const updateResult = document.getElementById('updateResult');
        if (updateResult) {
            updateResult.className = `update-result ${type}`;
            updateResult.innerHTML = message;
            updateResult.style.display = 'block';

            // Auto-hide after 5 seconds
            setTimeout(() => {
                updateResult.style.display = 'none';
            }, 5000);
        }
    }

    // Update last check time display
    updateLastCheckTime() {
        const lastCheckText = document.getElementById('lastCheckText');
        if (lastCheckText) {
            if (this.lastCheckTime) {
                lastCheckText.textContent = this.lastCheckTime.toLocaleString('id-ID');
            } else {
                lastCheckText.textContent = 'Belum pernah dicek';
            }
        }
    }

    // Format date to Indonesian locale
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Get update type label
    getUpdateTypeLabel(type) {
        const labels = {
            'major': 'Update Besar',
            'minor': 'Fitur Baru',
            'patch': 'Perbaikan',
            'hotfix': 'Hotfix'
        };
        return labels[type] || 'Update';
    }

    // Download update
    downloadUpdate() {
        // For now, redirect to GitHub releases
        window.open('https://github.com/atha0604/e-ijazah-app/releases/latest', '_blank');
    }

    // View changelog
    async viewChangelog() {
        try {
            const response = await fetch('/api/updates/changelog');
            const data = await response.json();

            if (data.success) {
                this.showChangelogModal(data.changelog);
            } else {
                this.showUpdateResult('error', '❌ Gagal memuat changelog');
            }
        } catch (error) {
            console.error('Error loading changelog:', error);
            this.showUpdateResult('error', '❌ Error: ' + error.message);
        }
    }

    // Show changelog modal (reuse existing modal or create simple alert)
    showChangelogModal(changelog) {
        const changelogText = changelog.map(version => `
v${version.version} - ${this.formatDate(version.releaseDate)}
Tipe: ${this.getUpdateTypeLabel(version.type)}

✨ Fitur Baru:
${version.features.map(feature => `• ${feature}`).join('\n')}

🔧 Perbaikan:
${version.bugfixes.map(fix => `• ${fix}`).join('\n')}

----------------------------------------
        `).join('\n');

        // Use a simple alert for now (can be enhanced with a proper modal later)
        alert('Changelog E-Ijazah:\n\n' + changelogText);
    }
}

// Global functions for HTML handlers
function performManualUpdate() {
    if (window.updateSectionManager) {
        window.updateSectionManager.performManualUpdate();
    }
}

function downloadUpdate() {
    if (window.updateSectionManager) {
        window.updateSectionManager.downloadUpdate();
    }
}

function viewChangelog() {
    if (window.updateSectionManager) {
        window.updateSectionManager.viewChangelog();
    }
}

// Initialize when updateInfoSection becomes visible
function initUpdateSection() {
    if (!window.updateSectionManager) {
        window.updateSectionManager = new UpdateSectionManager();
    }
}

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if updateInfoSection exists
    const updateSection = document.getElementById('updateInfoSection');
    if (updateSection) {
        initUpdateSection();
    }
});

// Initialize when section becomes visible (for menu navigation)
function showSection(sectionId) {
    if (sectionId === 'updateInfoSection') {
        initUpdateSection();
    }
}