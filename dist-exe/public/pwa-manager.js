// PWA Manager untuk instalasi dan offline functionality
const PWAManager = {
    deferredPrompt: null,
    isInstalled: false,
    isOnline: navigator.onLine,

    // Inisialisasi PWA Manager
    init: function() {
        console.log('PWA Manager initialized');
        
        // Register service worker
        this.registerServiceWorker();
        
        // Setup install prompt
        this.setupInstallPrompt();
        
        // Monitor online/offline status
        this.monitorNetworkStatus();
        
        // Handle service worker messages
        this.handleServiceWorkerMessages();
        
        // Add PWA controls to UI
        this.createPWAControls();
        
        // Check if already installed
        this.checkInstallStatus();
    },

    // Register service worker
    registerServiceWorker: function() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('./sw.js');
                    console.log('Service Worker registered successfully:', registration.scope);
                    
                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    });
                    
                } catch (error) {
                    console.error('Service Worker registration failed:', error);
                }
            });
        }
    },

    // Setup install prompt handling
    setupInstallPrompt: function() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA: Install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA: App installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstalledNotification();
        });
    },

    // Monitor network status
    monitorNetworkStatus: function() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNetworkStatus('online');
            console.log('PWA: Back online');
            
            // Trigger background sync if supported
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                navigator.serviceWorker.ready.then(registration => {
                    return registration.sync.register('backup-sync');
                });
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNetworkStatus('offline');
            console.log('PWA: Gone offline');
        });
    },

    // Handle service worker messages
    handleServiceWorkerMessages: function() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('PWA: Received message from service worker:', event.data);
                
                switch (event.data.type) {
                    case 'SYNC_BACKUP_DATA':
                        this.handleBackupSync();
                        break;
                    default:
                        console.log('PWA: Unknown message type:', event.data.type);
                }
            });
        }
    },

    // Create PWA controls in UI
    createPWAControls: function() {
        const settingsSection = document.getElementById('settingSection');
        if (!settingsSection) return;

        const pwaControlsHTML = `
            <div class="pwa-controls-container" style="margin: 20px 0; padding: 20px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color-new);">
                <h3 style="color: var(--text-primary); margin-bottom: 15px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <path d="M3 3h6l6 18 6-18h6"></path>
                        <path d="M14 3h7"></path>
                    </svg>
                    Progressive Web App
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <div id="pwaInstallSection" style="display: none;">
                        <p style="color: var(--text-secondary); margin-bottom: 10px;">Install E-Ijazah sebagai aplikasi di perangkat Anda:</p>
                        <button type="button" id="installPWABtn" style="padding: 10px 20px; border-radius: 4px; border: 1px solid var(--accent-primary); background: var(--accent-primary); color: white; cursor: pointer; font-weight: 500;">
                            📱 Install Aplikasi
                        </button>
                    </div>
                    
                    <div id="pwaInstalledSection" style="display: none;">
                        <p style="color: var(--success); font-weight: 500;">✅ Aplikasi sudah terinstall!</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: var(--text-secondary);">Status Koneksi:</span>
                        <span id="networkStatus" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                            ${navigator.onLine ? '🟢 Online' : '🔴 Offline'}
                        </span>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; color: var(--text-secondary); cursor: pointer;">
                        <input type="checkbox" id="enableNotifications" style="margin-right: 8px;">
                        Aktifkan notifikasi push (fitur masa depan)
                    </label>
                </div>
                
                <div>
                    <button type="button" id="clearPWACache" style="padding: 8px 16px; border-radius: 4px; border: 1px solid var(--warning); background: var(--warning); color: white; cursor: pointer; margin-right: 10px;">
                        🗑️ Bersihkan Cache
                    </button>
                    <button type="button" id="updatePWA" style="padding: 8px 16px; border-radius: 4px; border: 1px solid var(--info); background: var(--info); color: white; cursor: pointer;">
                        🔄 Periksa Update
                    </button>
                </div>
            </div>
        `;

        settingsSection.innerHTML += pwaControlsHTML;
        this.bindPWAControls();
    },

    // Bind PWA control events
    bindPWAControls: function() {
        const installBtn = document.getElementById('installPWABtn');
        const clearCacheBtn = document.getElementById('clearPWACache');
        const updateBtn = document.getElementById('updatePWA');
        const notificationsCheckbox = document.getElementById('enableNotifications');

        if (installBtn) {
            installBtn.addEventListener('click', () => {
                this.promptInstall();
            });
        }

        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.clearCache();
            });
        }

        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                this.checkForUpdate();
            });
        }

        if (notificationsCheckbox) {
            notificationsCheckbox.addEventListener('change', (e) => {
                this.toggleNotifications(e.target.checked);
            });
        }
    },

    // Show install button
    showInstallButton: function() {
        const installSection = document.getElementById('pwaInstallSection');
        if (installSection) {
            installSection.style.display = 'block';
        }
    },

    // Hide install button
    hideInstallButton: function() {
        const installSection = document.getElementById('pwaInstallSection');
        const installedSection = document.getElementById('pwaInstalledSection');
        
        if (installSection) {
            installSection.style.display = 'none';
        }
        if (installedSection) {
            installedSection.style.display = 'block';
        }
    },

    // Prompt install
    promptInstall: async function() {
        if (!this.deferredPrompt) {
            if (window.showNotification) {
                showNotification('Install prompt tidak tersedia atau sudah digunakan', 'warning');
            }
            return;
        }

        try {
            this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            
            if (result.outcome === 'accepted') {
                console.log('PWA: User accepted install prompt');
            } else {
                console.log('PWA: User dismissed install prompt');
            }
            
            this.deferredPrompt = null;
        } catch (error) {
            console.error('PWA: Install prompt error:', error);
        }
    },

    // Show network status
    showNetworkStatus: function(status) {
        const statusElement = document.getElementById('networkStatus');
        if (statusElement) {
            if (status === 'online') {
                statusElement.textContent = '🟢 Online';
                statusElement.style.backgroundColor = 'var(--success)';
                statusElement.style.color = 'white';
            } else {
                statusElement.textContent = '🔴 Offline';
                statusElement.style.backgroundColor = 'var(--danger)';
                statusElement.style.color = 'white';
            }
        }
    },

    // Clear PWA cache
    clearCache: async function() {
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                
                console.log('PWA: All caches cleared');
                if (window.showNotification) {
                    showNotification('Cache berhasil dibersihkan!', 'success');
                }
                
                // Reload page to re-cache
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('PWA: Error clearing cache:', error);
            if (window.showNotification) {
                showNotification('Gagal membersihkan cache', 'error');
            }
        }
    },

    // Check for updates
    checkForUpdate: async function() {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.update();
                    console.log('PWA: Checked for updates');
                    
                    if (window.showNotification) {
                        showNotification('Pemeriksaan update selesai', 'info');
                    }
                }
            }
        } catch (error) {
            console.error('PWA: Update check failed:', error);
            if (window.showNotification) {
                showNotification('Gagal memeriksa update', 'error');
            }
        }
    },

    // Toggle notifications
    toggleNotifications: function(enable) {
        if (enable) {
            this.requestNotificationPermission();
        } else {
            localStorage.setItem('notificationsEnabled', 'false');
        }
    },

    // Request notification permission
    requestNotificationPermission: async function() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                localStorage.setItem('notificationsEnabled', 'true');
                if (window.showNotification) {
                    showNotification('Notifikasi diaktifkan!', 'success');
                }
            } else {
                if (window.showNotification) {
                    showNotification('Izin notifikasi ditolak', 'warning');
                }
            }
        }
    },

    // Check install status
    checkInstallStatus: function() {
        // Check if running in standalone mode (installed)
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            this.isInstalled = true;
            this.hideInstallButton();
        }
    },

    // Show update notification
    showUpdateNotification: function() {
        if (window.showNotification) {
            showNotification('Update tersedia! Refresh halaman untuk mendapatkan versi terbaru.', 'info');
        }
    },

    // Show installed notification
    showInstalledNotification: function() {
        if (window.showNotification) {
            showNotification('E-Ijazah berhasil diinstall sebagai aplikasi!', 'success');
        }
    },

    // Handle backup sync
    handleBackupSync: function() {
        console.log('PWA: Handling background backup sync');
        
        // Trigger backup manager sync if available
        if (window.BackupManager) {
            BackupManager.createBackup('sync');
        }
        
        if (window.showNotification) {
            showNotification('Data disinkronisasi saat online', 'info');
        }
    },

    // Get PWA status
    getStatus: function() {
        return {
            isInstalled: this.isInstalled,
            isOnline: this.isOnline,
            hasInstallPrompt: !!this.deferredPrompt,
            serviceWorkerSupported: 'serviceWorker' in navigator,
            notificationSupported: 'Notification' in window,
            cacheSupported: 'caches' in window
        };
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        PWAManager.init();
    }, 200);
});

window.PWAManager = PWAManager;