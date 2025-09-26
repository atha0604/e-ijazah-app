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
        // Create status indicator element
        const indicator = document.createElement('div');
        indicator.id = 'connection-status';
        indicator.className = 'connection-status';
        indicator.innerHTML = `
            <div class="status-icon">
                <i class="fas fa-circle"></i>
            </div>
            <div class="status-text">
                <span class="mode">Checking...</span>
                <span class="details">Mendeteksi koneksi</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(indicator);
        this.statusIndicator = indicator;

        // Add click handler for details
        indicator.addEventListener('click', () => this.showDetailModal());
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
        if (!this.statusIndicator) return;

        const icon = this.statusIndicator.querySelector('.status-icon i');
        const modeText = this.statusIndicator.querySelector('.mode');
        const detailsText = this.statusIndicator.querySelector('.details');

        // Remove all status classes
        this.statusIndicator.classList.remove('online', 'offline', 'error', 'checking');

        // Add current status class
        this.statusIndicator.classList.add(status);

        // Update text content
        switch (status) {
            case 'online':
                modeText.textContent = 'ONLINE';
                icon.className = 'fas fa-cloud';
                break;
            case 'offline':
                modeText.textContent = 'OFFLINE';
                icon.className = 'fas fa-laptop';
                break;
            case 'error':
                modeText.textContent = 'ERROR';
                icon.className = 'fas fa-exclamation-triangle';
                break;
            default:
                modeText.textContent = 'CHECKING';
                icon.className = 'fas fa-spinner fa-spin';
        }

        detailsText.textContent = message;

        // Show notification for status changes
        this.showStatusNotification(status, message);
    }

    showStatusNotification(status, message) {
        // Only show notification if status actually changed
        if (this.lastStatus === status) return;
        this.lastStatus = status;

        // Create notification
        const notification = document.createElement('div');
        notification.className = `status-notification ${status}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${status === 'online' ? 'fa-cloud' : status === 'offline' ? 'fa-laptop' : 'fa-exclamation-triangle'}"></i>
                <span>${message}</span>
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
        if (this.statusIndicator && this.statusIndicator.parentNode) {
            this.statusIndicator.parentNode.removeChild(this.statusIndicator);
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.connectionStatus = new ConnectionStatusManager();
});

// Export for manual usage
window.ConnectionStatusManager = ConnectionStatusManager;