// Admin Broadcast Panel JavaScript
class AdminBroadcastPanel {
    constructor() {
        this.currentVersion = null;
        this.latestVersion = null;
        this.selectedVersion = null;
        this.previewData = null;
        this.channels = [];

        this.init();
    }

    async init() {
        console.log('🚀 Admin Broadcast Panel initialized');
        await this.loadCurrentStatus();
        await this.loadVersions();
        await this.loadChannels();
        this.loadBroadcastHistory();
    }

    // Load current status
    async loadCurrentStatus() {
        try {
            console.log('📊 Loading current status...');
            const response = await fetch('/api/updates/check');
            const data = await response.json();

            if (data.success) {
                this.currentVersion = data.currentVersion;
                this.latestVersion = data.latestVersion;

                this.renderStatus(data);
            } else {
                this.showError('Gagal memuat status versi');
            }
        } catch (error) {
            console.error('Error loading status:', error);
            this.showError('Error: ' + error.message);
        }
    }

    // Render status content
    renderStatus(data) {
        const statusContent = document.getElementById('statusContent');
        const updateAvailable = data.updateAvailable;

        statusContent.innerHTML = `
            <div class="status-item">
                <h3>📱 Versi Saat Ini</h3>
                <p><strong>v${data.currentVersion}</strong></p>
                <span class="status-badge current">Current</span>
            </div>
            <div class="status-item">
                <h3>🆕 Versi Terbaru</h3>
                <p><strong>v${data.latestVersion}</strong></p>
                <span class="status-badge ${updateAvailable ? 'available' : 'current'}">
                    ${updateAvailable ? 'Update Available' : 'Up to Date'}
                </span>
            </div>
            <div class="status-item">
                <h3>📊 Status Update</h3>
                <p>${updateAvailable ? 'Ada update baru tersedia untuk broadcast' : 'Semua versi sudah terbaru'}</p>
                <p><strong>Last Check:</strong> ${new Date().toLocaleString('id-ID')}</p>
            </div>
        `;
    }

    // Load available versions
    async loadVersions() {
        try {
            console.log('📋 Loading versions...');
            const response = await fetch('/api/updates/changelog');
            const data = await response.json();

            if (data.success) {
                this.renderVersionSelector(data.changelog);
            } else {
                this.showError('Gagal memuat daftar versi');
            }
        } catch (error) {
            console.error('Error loading versions:', error);
            this.showError('Error: ' + error.message);
        }
    }

    // Render version selector
    renderVersionSelector(versions) {
        const versionSelect = document.getElementById('versionSelect');
        versionSelect.innerHTML = '<option value="">-- Pilih Versi --</option>';

        versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version.version;
            option.textContent = `v${version.version} - ${version.type} (${version.releaseDate})`;
            versionSelect.appendChild(option);
        });
    }

    // Load version preview
    async loadVersionPreview() {
        const versionSelect = document.getElementById('versionSelect');
        const selectedVersion = versionSelect.value;

        if (!selectedVersion) {
            this.hidePreview();
            return;
        }

        this.selectedVersion = selectedVersion;

        try {
            console.log(`👀 Loading preview for v${selectedVersion}...`);

            // Load preview for all formats
            const [emailResponse, whatsappResponse, socialResponse, releaseResponse] = await Promise.all([
                fetch(`/api/updates/preview-message/${selectedVersion}?format=html`),
                fetch(`/api/updates/preview-message/${selectedVersion}?format=text`),
                fetch(`/api/updates/preview-message/${selectedVersion}?format=text`),
                fetch(`/api/updates/preview-message/${selectedVersion}?format=text`)
            ]);

            const emailData = await emailResponse.json();
            const textData = await whatsappResponse.json();

            if (emailData.success && textData.success) {
                this.previewData = {
                    email: emailData.previews.email,
                    whatsapp: textData.previews.whatsapp,
                    socialMedia: textData.previews.socialMedia,
                    releaseNotes: textData.previews.releaseNotes
                };

                this.renderPreviews();
                this.showPreview();
            } else {
                this.showError('Gagal memuat preview pesan');
            }
        } catch (error) {
            console.error('Error loading preview:', error);
            this.showError('Error: ' + error.message);
        }
    }

    // Render all previews
    renderPreviews() {
        if (!this.previewData) return;

        // Email preview
        document.getElementById('emailPreview').innerHTML = this.previewData.email || 'Email preview tidak tersedia';

        // WhatsApp preview
        document.getElementById('whatsappPreview').textContent = this.previewData.whatsapp || 'WhatsApp preview tidak tersedia';

        // Social media preview
        document.getElementById('socialPreview').textContent = this.previewData.socialMedia || 'Social media preview tidak tersedia';

        // Release notes preview
        const releasePreview = document.getElementById('releasePreview');
        if (this.previewData.releaseNotes) {
            releasePreview.textContent = JSON.stringify(this.previewData.releaseNotes, null, 2);
        } else {
            releasePreview.textContent = 'Release notes preview tidak tersedia';
        }
    }

    // Load communication channels
    async loadChannels() {
        try {
            console.log('📢 Loading communication channels...');
            const response = await fetch('/api/updates/communication-channels');
            const data = await response.json();

            if (data.success) {
                this.channels = data.channels;
                this.renderChannels(data.channels);
            } else {
                this.showError('Gagal memuat channel komunikasi');
            }
        } catch (error) {
            console.error('Error loading channels:', error);
            this.showError('Error: ' + error.message);
        }
    }

    // Render communication channels
    renderChannels(channels) {
        const channelsGrid = document.getElementById('channelsGrid');

        channelsGrid.innerHTML = channels.map(channel => `
            <div class="channel-item ${channel.automated ? 'automated' : 'manual'}">
                <div class="channel-header">
                    <div class="channel-name">${channel.name}</div>
                    <div class="channel-status ${channel.status}">${channel.status.toUpperCase()}</div>
                </div>
                <div class="channel-description">${channel.description}</div>
                <div class="channel-reach"><strong>Reach:</strong> ${channel.reach}</div>
                <div class="channel-automation">
                    <strong>Automation:</strong> ${channel.automated ? '✅ Automated' : '🔧 Manual'}
                </div>
            </div>
        `).join('');
    }

    // Show preview sections
    showPreview() {
        document.getElementById('previewSection').style.display = 'block';
        document.getElementById('channelsSection').style.display = 'block';
        document.getElementById('broadcastSection').style.display = 'block';
    }

    // Hide preview sections
    hidePreview() {
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('channelsSection').style.display = 'none';
        document.getElementById('broadcastSection').style.display = 'none';
    }

    // Switch preview tab
    switchPreviewTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.preview-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`preview-${tabName}`).classList.add('active');
    }

    // Test broadcast
    async testBroadcast() {
        if (!this.selectedVersion) {
            this.showError('Pilih versi terlebih dahulu');
            return;
        }

        const adminKey = document.getElementById('adminKey').value;
        if (!adminKey) {
            this.showError('Masukkan admin key');
            return;
        }

        this.showModal(
            'Test Broadcast',
            `Apakah Anda yakin ingin melakukan test broadcast untuk versi <strong>v${this.selectedVersion}</strong>?<br><br>
            <em>Test broadcast akan menggunakan data simulasi dan tidak akan mengirim notifikasi sesungguhnya.</em>`,
            () => this.executeTestBroadcast(adminKey)
        );
    }

    // Execute test broadcast
    async executeTestBroadcast(adminKey) {
        this.closeModal();
        this.showBroadcastResult('info', 'Menjalankan test broadcast...', true);

        try {
            // Simulate test broadcast
            console.log(`🧪 Testing broadcast for v${this.selectedVersion}...`);

            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

            const testResult = {
                success: true,
                message: `Test broadcast v${this.selectedVersion} berhasil`,
                details: {
                    emailsSent: 0,
                    whatsappGenerated: true,
                    socialMediaReady: true,
                    testMode: true
                }
            };

            this.showBroadcastResult('success',
                `✅ Test Broadcast Berhasil!<br>
                <strong>Versi:</strong> v${this.selectedVersion}<br>
                <strong>Status:</strong> Simulasi berhasil dijalankan<br>
                <strong>WhatsApp:</strong> Template siap<br>
                <strong>Social Media:</strong> Post siap<br>
                <strong>Mode:</strong> Test (tidak ada email dikirim)`
            );

            this.addToHistory('test', this.selectedVersion, 'Test broadcast berhasil');

        } catch (error) {
            console.error('Test broadcast error:', error);
            this.showBroadcastResult('error', `❌ Test Broadcast Gagal: ${error.message}`);
        }
    }

    // Send actual broadcast
    async sendBroadcast() {
        if (!this.selectedVersion) {
            this.showError('Pilih versi terlebih dahulu');
            return;
        }

        const adminKey = document.getElementById('adminKey').value;
        if (!adminKey) {
            this.showError('Masukkan admin key');
            return;
        }

        this.showModal(
            'Konfirmasi Broadcast',
            `<div style="color: #e74c3c; font-weight: bold; margin-bottom: 15px;">⚠️ PERHATIAN!</div>
            Anda akan mengirim broadcast update ke <strong>SEMUA SEKOLAH</strong> untuk versi <strong>v${this.selectedVersion}</strong>.<br><br>
            <strong>Tindakan ini:</strong><br>
            • Akan mengirim email notifikasi ke semua admin sekolah<br>
            • Akan membuat pesan WhatsApp siap broadcast<br>
            • Akan membuat post social media<br>
            • TIDAK DAPAT DIBATALKAN setelah dikirim<br><br>
            <em>Pastikan semua informasi sudah benar sebelum melanjutkan.</em>`,
            () => this.executeBroadcast(adminKey)
        );
    }

    // Execute actual broadcast
    async executeBroadcast(adminKey) {
        this.closeModal();
        this.showBroadcastResult('info', 'Mengirim broadcast...', true);

        try {
            console.log(`📤 Sending broadcast for v${this.selectedVersion}...`);

            const response = await fetch('/api/updates/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    version: this.selectedVersion,
                    adminKey: adminKey
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showBroadcastResult('success',
                    `✅ Broadcast Berhasil Dikirim!<br>
                    <strong>Versi:</strong> v${this.selectedVersion}<br>
                    <strong>Email Dikirim:</strong> ${result.details.emailsSent || 0} sekolah<br>
                    <strong>WhatsApp:</strong> ${result.details.whatsappGenerated ? 'Template siap' : 'Error'}<br>
                    <strong>Social Media:</strong> ${result.details.socialMediaReady ? 'Post siap' : 'Error'}<br>
                    <strong>Waktu:</strong> ${new Date().toLocaleString('id-ID')}`
                );

                this.addToHistory('broadcast', this.selectedVersion, 'Broadcast berhasil dikirim');

                // Clear form
                document.getElementById('adminKey').value = '';
                document.getElementById('versionSelect').value = '';
                this.hidePreview();

            } else {
                this.showBroadcastResult('error', `❌ Broadcast Gagal: ${result.message}`);
            }

        } catch (error) {
            console.error('Broadcast error:', error);
            this.showBroadcastResult('error', `❌ Broadcast Gagal: ${error.message}`);
        }
    }

    // Show broadcast result
    showBroadcastResult(type, message, isLoading = false) {
        const resultDiv = document.getElementById('broadcastResult');
        resultDiv.style.display = 'block';

        resultDiv.className = `broadcast-result result-${type}`;
        if (isLoading) {
            resultDiv.innerHTML = `<div class="loading">${message}</div>`;
        } else {
            resultDiv.innerHTML = message;
        }
    }

    // Show modal
    showModal(title, body, confirmCallback) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = body;
        document.getElementById('broadcastModal').style.display = 'block';

        // Store callback for confirm button
        this.modalConfirmCallback = confirmCallback;
    }

    // Close modal
    closeModal() {
        document.getElementById('broadcastModal').style.display = 'none';
        this.modalConfirmCallback = null;
    }

    // Confirm modal action
    confirmBroadcast() {
        if (this.modalConfirmCallback) {
            this.modalConfirmCallback();
        }
    }

    // Add to broadcast history
    addToHistory(type, version, message) {
        const historyContent = document.getElementById('historyContent');

        // Remove "no history" message if present
        const noHistory = historyContent.querySelector('.no-history');
        if (noHistory) {
            noHistory.remove();
        }

        // Add new history item
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-meta">
                <span class="history-version">${type === 'test' ? '🧪 TEST' : '📤 BROADCAST'} v${version}</span>
                <span class="history-date">${new Date().toLocaleString('id-ID')}</span>
            </div>
            <div class="history-message">${message}</div>
        `;

        historyContent.insertBefore(historyItem, historyContent.firstChild);
    }

    // Load broadcast history
    loadBroadcastHistory() {
        // For now, just show placeholder
        console.log('📜 Loading broadcast history...');
        // In real implementation, this would load from server/database
    }

    // Show error message
    showError(message) {
        console.error('❌ Error:', message);
        alert('Error: ' + message);
    }
}

// Global functions for HTML onclick handlers
function loadCurrentStatus() {
    if (window.broadcastPanel) {
        window.broadcastPanel.loadCurrentStatus();
    }
}

function loadVersions() {
    if (window.broadcastPanel) {
        window.broadcastPanel.loadVersions();
    }
}

function loadVersionPreview() {
    if (window.broadcastPanel) {
        window.broadcastPanel.loadVersionPreview();
    }
}

function switchPreviewTab(tabName) {
    if (window.broadcastPanel) {
        window.broadcastPanel.switchPreviewTab(tabName);
    }
}

function testBroadcast() {
    if (window.broadcastPanel) {
        window.broadcastPanel.testBroadcast();
    }
}

function sendBroadcast() {
    if (window.broadcastPanel) {
        window.broadcastPanel.sendBroadcast();
    }
}

function closeModal() {
    if (window.broadcastPanel) {
        window.broadcastPanel.closeModal();
    }
}

function confirmBroadcast() {
    if (window.broadcastPanel) {
        window.broadcastPanel.confirmBroadcast();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.broadcastPanel = new AdminBroadcastPanel();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('broadcastModal');
    if (event.target === modal) {
        closeModal();
    }
}