// Connection Status Manager
class ConnectionStatusManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.serverMode = 'unknown'; // 'online', 'offline', 'unknown'
        this.statusIndicator = null;
        this.lastChecked = null;
        this.checkInterval = null;

        this.init();
    }

    init() {
        this.createStatusIndicator();
        this.setupEventListeners();
        this.startPeriodicCheck();
        this.checkServerStatus();
    }

    createStatusIndicator() {
        // Find existing sidebar connection status indicators
        this.adminIndicator = document.getElementById('admin-connection-status');
        this.sekolahIndicator = document.getElementById('sekolah-connection-status');

        // Use the first available indicator as the main one
        this.statusIndicator = this.adminIndicator || this.sekolahIndicator;

        // Add click handlers for details if indicators exist
        if (this.adminIndicator) {
            this.adminIndicator.addEventListener('click', () => this.showDetailModal());
        }
        if (this.sekolahIndicator) {
            this.sekolahIndicator.addEventListener('click', () => this.showDetailModal());
        }
    }

    setupEventListeners() {
        // Browser online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.checkServerStatus();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateStatus('offline', 'Tidak ada koneksi internet');
        });
    }

    startPeriodicCheck() {
        // Check server status every 30 seconds
        this.checkInterval = setInterval(() => {
            this.checkServerStatus();
        }, 30000);
    }

    async checkServerStatus() {
        if (!this.isOnline) {
            this.updateStatus('offline', 'Tidak ada koneksi internet');
            return;
        }

        try {
            // Check if we're running locally
            const currentHost = window.location.host;
            const isLocal = currentHost.includes('localhost') || currentHost.includes('127.0.0.1');

            if (isLocal) {
                // We're running on local server
                this.serverMode = 'offline';
                this.updateStatus('offline', 'Mode offline - Server lokal');
            } else {
                // We're on the online server
                this.serverMode = 'online';
                this.updateStatus('online', 'Mode online - Server cloud');
            }

            // Additional server health check
            await this.pingServer();

        } catch (error) {
            console.warn('Server status check failed:', error);
            this.updateStatus('error', 'Error koneksi server');
        }

        this.lastChecked = new Date();
    }

    async pingServer() {
        try {
            const response = await fetch('/api', {
                method: 'GET',
                cache: 'no-cache',
                timeout: 5000
            });

            if (response.ok) {
                const data = await response.json();

                if (data.mode === 'offline') {
                    this.serverMode = 'offline';
                    this.updateStatus('offline', 'Mode offline - Server lokal');
                } else {
                    this.serverMode = 'online';
                    this.updateStatus('online', 'Mode online - Server cloud');
                }
            } else {
                throw new Error(`Server responded with ${response.status}`);
            }
        } catch (error) {
            console.warn('Server ping failed:', error);
            this.updateStatus('error', 'Server tidak merespons');
        }
    }

    updateStatus(status, message) {
        // Update both admin and sekolah indicators
        const indicators = [this.adminIndicator, this.sekolahIndicator].filter(Boolean);

        indicators.forEach(indicator => {
            const icon = indicator.querySelector('svg');
            const modeText = indicator.querySelector('.mode');

            // Remove all status classes
            indicator.classList.remove('online', 'offline', 'error', 'checking');

            // Add current status class
            indicator.classList.add(status);

            // Update text content
            switch (status) {
                case 'online':
                    modeText.textContent = 'ONLINE';
                    // Update SVG path for cloud icon
                    icon.innerHTML = '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>';
                    break;
                case 'offline':
                    modeText.textContent = 'OFFLINE';
                    // Update SVG path for laptop icon
                    icon.innerHTML = '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>';
                    break;
                case 'error':
                    modeText.textContent = 'ERROR';
                    // Update SVG path for warning icon
                    icon.innerHTML = '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/>';
                    break;
                default:
                    modeText.textContent = 'CHECKING';
                    // Update SVG path for activity icon
                    icon.innerHTML = '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>';
            }
        });

        // Show notification for status changes (disabled)
        // this.showStatusNotification(status, message);
    }

    showStatusNotification(status, message) {
        // Only show notification if status actually changed
        if (this.lastStatus === status) return;
        this.lastStatus = status;

        // Create notification with simplified message
        const notification = document.createElement('div');
        notification.className = `status-notification ${status}`;

        let simpleMessage = status.toUpperCase();

        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${status === 'online' ? 'fa-cloud' : status === 'offline' ? 'fa-laptop' : 'fa-exclamation-triangle'}"></i>
                <span>${simpleMessage}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showDetailModal() {
        const modal = document.createElement('div');
        modal.className = 'connection-detail-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Status Koneksi</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="status-item">
                        <label>Mode Aplikasi:</label>
                        <span class="status-value ${this.serverMode}">${this.serverMode.toUpperCase()}</span>
                    </div>
                    <div class="status-item">
                        <label>Koneksi Internet:</label>
                        <span class="status-value ${this.isOnline ? 'online' : 'offline'}">${this.isOnline ? 'TERHUBUNG' : 'TERPUTUS'}</span>
                    </div>
                    <div class="status-item">
                        <label>Server:</label>
                        <span class="status-value">${window.location.host}</span>
                    </div>
                    <div class="status-item">
                        <label>Terakhir dicek:</label>
                        <span class="status-value">${this.lastChecked ? this.lastChecked.toLocaleString() : 'Belum pernah'}</span>
                    </div>
                    <div class="info-section">
                        <h4>Informasi Mode:</h4>
                        <div class="mode-info">
                            <div class="mode-item">
                                <strong>ONLINE MODE:</strong>
                                <ul>
                                    <li>Data tersimpan di server cloud</li>
                                    <li>Dapat diakses dari mana saja</li>
                                    <li>Memerlukan koneksi internet</li>
                                    <li>Selalu mendapat update terbaru</li>
                                </ul>
                            </div>
                            <div class="mode-item">
                                <strong>OFFLINE MODE:</strong>
                                <ul>
                                    <li>Data tersimpan di komputer lokal</li>
                                    <li>Dapat digunakan tanpa internet</li>
                                    <li>Akses lebih cepat</li>
                                    <li>Data hanya tersedia di komputer ini</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary refresh-btn">Refresh Status</button>
                    <button class="btn btn-secondary close-modal-btn">Tutup</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const closeModalBtn = modal.querySelector('.close-modal-btn');
        const refreshBtn = modal.querySelector('.refresh-btn');

        const closeModal = () => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        };

        closeBtn.addEventListener('click', closeModal);
        closeModalBtn.addEventListener('click', closeModal);
        refreshBtn.addEventListener('click', () => {
            this.checkServerStatus();
            closeModal();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        // Sidebar indicators are managed by HTML, no need to remove them
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.connectionStatus = new ConnectionStatusManager();
});

// Export for manual usage
window.ConnectionStatusManager = ConnectionStatusManager;