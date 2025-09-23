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
        // Create a large modal for changelog
        const modal = document.createElement('div');
        modal.className = 'changelog-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'changelog-modal-content';
        modalContent.style.cssText = `
            background: #2c3e50;
            border-radius: 20px;
            max-width: 800px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            padding: 30px;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            position: relative;
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 25px;
            border-bottom: 2px solid #34495e;
            padding-bottom: 15px;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Changelog E-Ijazah';
        title.style.cssText = `
            margin: 0;
            color: #3498db;
            font-size: 1.8rem;
            font-weight: 600;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: #bdc3c7;
            font-size: 2rem;
            cursor: pointer;
            padding: 0;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = '#e74c3c';
        closeBtn.onmouseout = () => closeBtn.style.background = 'none';

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Create content
        const content = document.createElement('div');
        content.style.cssText = `
            line-height: 1.6;
            font-size: 14px;
        `;

        const changelogHTML = changelog.map(version => `
            <div style="margin-bottom: 30px; background: #34495e; padding: 20px; border-radius: 12px; border-left: 4px solid #3498db;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="background: #3498db; color: white; padding: 8px 15px; border-radius: 20px; font-weight: 600; font-size: 16px;">
                        v${version.version}
                    </div>
                    <div style="color: #bdc3c7; font-size: 14px;">
                        ${this.formatDate(version.releaseDate)}
                    </div>
                    <div style="background: #27ae60; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 600;">
                        ${this.getUpdateTypeLabel(version.type)}
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <h4 style="color: #f39c12; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        ✨ Fitur Baru:
                    </h4>
                    <ul style="margin: 0; padding-left: 20px; color: #ecf0f1;">
                        ${version.features.map(feature => `<li style="margin-bottom: 5px;">${feature}</li>`).join('')}
                    </ul>
                </div>

                ${version.bugfixes && version.bugfixes.length > 0 ? `
                <div>
                    <h4 style="color: #e74c3c; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        🔧 Perbaikan:
                    </h4>
                    <ul style="margin: 0; padding-left: 20px; color: #ecf0f1;">
                        ${version.bugfixes.map(fix => `<li style="margin-bottom: 5px;">${fix}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        `).join('');

        content.innerHTML = changelogHTML;

        // Create footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            margin-top: 25px;
            padding-top: 20px;
            border-top: 2px solid #34495e;
            text-align: center;
        `;

        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.style.cssText = `
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 100px;
        `;
        okButton.onmouseover = () => okButton.style.background = '#2980b9';
        okButton.onmouseout = () => okButton.style.background = '#3498db';

        footer.appendChild(okButton);

        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(content);
        modalContent.appendChild(footer);
        modal.appendChild(modalContent);

        // Close handlers
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.onclick = closeModal;
        okButton.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        // Add to page
        document.body.appendChild(modal);
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