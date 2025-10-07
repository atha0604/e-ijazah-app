/**
 * Sync Module
 * Handles data synchronization with central dinas server
 */

// Helper functions dengan fallback jika tidak ada di global scope
const _showLoading = window.showLoading || function(message) {
    console.log('⏳ Loading:', message);
    const existing = document.getElementById('syncLoadingIndicator');
    if (existing) existing.remove();

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'syncLoadingIndicator';
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(102, 126, 234, 0.95); color: white; padding: 20px 40px; border-radius: 10px; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3); font-family: system-ui;';
    loadingDiv.innerHTML = `<div style="text-align: center;"><div style="font-size: 24px; margin-bottom: 10px;">⏳</div><div style="font-size: 14px;">${message}</div></div>`;
    document.body.appendChild(loadingDiv);
};

const _hideLoading = window.hideLoading || function() {
    console.log('✅ Loading done');
    const loadingDiv = document.getElementById('syncLoadingIndicator');
    if (loadingDiv) loadingDiv.remove();
};

const _showNotification = window.showNotification || function(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    const iconMap = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    const icon = iconMap[type] || 'ℹ️';
    alert(`${icon} ${message}`);
};

const _showLoadingWithProgress = function(message) {
    console.log('⏳ Loading with progress:', message);
    const existing = document.getElementById('syncLoadingIndicator');
    if (existing) existing.remove();

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'syncLoadingIndicator';
    loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(102, 126, 234, 0.95); color: white; padding: 25px 45px; border-radius: 12px; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3); font-family: system-ui; min-width: 320px;';
    loadingDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 28px; margin-bottom: 15px;">⏳</div>
            <div id="syncProgressMessage" style="font-size: 14px; margin-bottom: 15px;">${message}</div>
            <div style="background: rgba(255,255,255,0.2); border-radius: 10px; height: 20px; overflow: hidden; margin-bottom: 10px;">
                <div id="syncProgressBar" style="background: linear-gradient(90deg, #4CAF50, #81C784); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <div id="syncProgressText" style="font-size: 12px; opacity: 0.9;">0%</div>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    return loadingDiv;
};

const _updateLoadingProgress = function(loadingDiv, current, total, message, percent) {
    if (!loadingDiv) return;

    const progressBar = loadingDiv.querySelector('#syncProgressBar');
    const progressText = loadingDiv.querySelector('#syncProgressText');
    const progressMessage = loadingDiv.querySelector('#syncProgressMessage');

    if (progressBar) {
        const calculatedPercent = percent !== undefined ? percent : Math.round((current / total) * 100);
        progressBar.style.width = calculatedPercent + '%';
    }

    if (progressText) {
        const calculatedPercent = percent !== undefined ? percent : Math.round((current / total) * 100);
        progressText.textContent = `${calculatedPercent}% (${current}/${total} batches)`;
    }

    if (progressMessage && message) {
        progressMessage.textContent = message;
    }
};

// Sync configuration
const SYNC_CONFIG = {
    serverUrl: localStorage.getItem('sync_server_url') || 'https://e-ijazah-app-test.up.railway.app',
    autoSyncEnabled: localStorage.getItem('auto_sync_enabled') === 'true',
    syncInterval: parseInt(localStorage.getItem('sync_interval') || '3600000'), // 1 hour default
    lastSyncTime: localStorage.getItem('last_sync_time') || null
};

// Set default URL if not configured or empty
const savedUrl = localStorage.getItem('sync_server_url');
if (!savedUrl || savedUrl.trim() === '') {
    localStorage.setItem('sync_server_url', 'https://e-ijazah-app-test.up.railway.app');
    SYNC_CONFIG.serverUrl = 'https://e-ijazah-app-test.up.railway.app';
}

console.log('🔄 Sync Config Loaded:', SYNC_CONFIG);

/**
 * Check if online
 */
function isOnline() {
    return navigator.onLine;
}

/**
 * Get unsynced data count
 */
async function getUnsyncedCount() {
    try {
        // Get NPSN from schoolData array (schoolData[3] is NPSN)
        const npsn = window.currentUser?.schoolData?.[3];
        if (!npsn) {
            // User belum login atau data sekolah belum dimuat
            console.warn('NPSN not found in schoolData:', window.currentUser?.schoolData);
            return 0;
        }

        console.log('Getting unsynced count for NPSN:', npsn);

        const response = await fetch(`/api/sync/unsynced?npsn=${npsn}`);
        const data = await response.json();

        if (data.success) {
            console.log('Unsynced data:', data);
            return data.totalRecords;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error getting unsynced count:', error);
        return 0;
    }
}

/**
 * Get sync status
 */
async function getSyncStatus() {
    try {
        const response = await fetch('/api/sync/status');
        const data = await response.json();

        if (data.success) {
            return {
                lastSyncTime: data.lastSyncTime,
                history: data.history
            };
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error getting sync status:', error);
        return null;
    }
}

/**
 * Test server connection
 */
async function testServerConnection(serverUrl) {
    try {
        const response = await fetch('/api/sync/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ serverUrl })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Sync data to server
 */
async function syncToServer() {
    console.log('🔄 Starting sync...');
    console.log('Current user:', window.currentUser);
    console.log('School data:', window.currentUser?.schoolData);
    console.log('Server URL:', SYNC_CONFIG.serverUrl);

    if (!isOnline()) {
        _showNotification('❌ Tidak ada koneksi internet. Pastikan Anda terhubung ke internet.', 'warning');
        return false;
    }

    if (!SYNC_CONFIG.serverUrl || SYNC_CONFIG.serverUrl.trim() === '') {
        _showNotification('⚙️ Silakan konfigurasi URL Server Dinas terlebih dahulu', 'info');
        setTimeout(() => {
            if (typeof showSyncSettingsModal === 'function') {
                showSyncSettingsModal();
            }
        }, 500);
        return false;
    }

    // Get NPSN from schoolData array (schoolData[3] is NPSN based on structure)
    const npsn = window.currentUser?.schoolData?.[3];
    console.log('NPSN:', npsn);

    if (!npsn) {
        console.error('❌ NPSN not found in schoolData:', window.currentUser?.schoolData);
        _showNotification('❌ Data sekolah tidak ditemukan. Silakan login ulang.', 'error');
        return false;
    }

    // Show loading with progress bar
    const loadingDiv = _showLoadingWithProgress('Memulai sinkronisasi...');

    try {
        console.log('📤 Sending sync request with progress...');

        // Use fetch with SSE stream
        return new Promise((resolve, reject) => {
            fetch('/api/sync/upload-with-progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    serverUrl: SYNC_CONFIG.serverUrl,
                    npsn: npsn,
                    batchSize: 100
                })
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                function processText(text) {
                    buffer += text;
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));
                                console.log('📥 Progress event:', data);

                                if (data.type === 'start') {
                                    _updateLoadingProgress(loadingDiv, 0, data.totalBatches,
                                        `Memulai sync ${data.totalRecords} records...`);
                                } else if (data.type === 'progress') {
                                    const percent = Math.round((data.currentBatch / data.totalBatches) * 100);
                                    _updateLoadingProgress(loadingDiv, data.currentBatch, data.totalBatches,
                                        data.message, percent);
                                } else if (data.type === 'complete') {
                                    _hideLoading();
                                    if (data.success) {
                                        SYNC_CONFIG.lastSyncTime = new Date().toISOString();
                                        localStorage.setItem('last_sync_time', SYNC_CONFIG.lastSyncTime);

                                        const syncedCount = data.synced || 0;
                                        _showNotification(`✅ Berhasil! ${syncedCount} data tersinkronisasi`, 'success');

                                        // Update UI
                                        updateSyncUI();
                                        resolve(true);
                                    } else {
                                        // Sync failed - show detailed error
                                        let errorMsg = data.message || 'Sync failed';
                                        if (data.errors && data.errors.length > 0) {
                                            // Show first 3 errors
                                            const errorList = data.errors.slice(0, 3).join('\n');
                                            errorMsg += '\n\nDetail error:\n' + errorList;
                                            if (data.errors.length > 3) {
                                                errorMsg += `\n... dan ${data.errors.length - 3} error lainnya`;
                                            }
                                        }
                                        _showNotification(`❌ ${errorMsg}`, 'error');
                                        resolve(false);
                                    }
                                } else if (data.type === 'error') {
                                    _hideLoading();
                                    _showNotification(`❌ ${data.error || 'Sync error'}`, 'error');
                                    resolve(false);
                                }
                            } catch (parseError) {
                                console.error('Parse error:', parseError);
                            }
                        }
                    }
                }

                function pump() {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            if (buffer.trim()) {
                                processText('');
                            }
                            return;
                        }
                        processText(decoder.decode(value, { stream: true }));
                        pump();
                    }).catch(err => {
                        console.error('Stream error:', err);
                        _hideLoading();
                        reject(err);
                    });
                }

                pump();
            }).catch(error => {
                console.error('❌ Sync error:', error);
                _hideLoading();
                _showNotification(`❌ Gagal sinkronisasi: ${error.message}`, 'error');
                reject(false);
            });

        });

    } catch (error) {
        console.error('❌ Sync error:', error);
        _hideLoading();
        _showNotification(`❌ Gagal sinkronisasi: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Update sync UI elements
 */
async function updateSyncUI() {
    // Update last sync time
    const lastSyncEl = document.getElementById('lastSyncTime');
    if (lastSyncEl) {
        if (SYNC_CONFIG.lastSyncTime) {
            const lastSync = new Date(SYNC_CONFIG.lastSyncTime);
            lastSyncEl.textContent = formatRelativeTime(lastSync);
        } else {
            lastSyncEl.textContent = 'Belum pernah';
        }
    }

    // Update unsynced count
    const unsyncedCount = await getUnsyncedCount();
    const unsyncedEl = document.getElementById('unsyncedCount');
    if (unsyncedEl) {
        unsyncedEl.textContent = unsyncedCount;

        // Add badge if there are unsynced records
        const syncBtn = document.getElementById('syncNowBtn');
        if (syncBtn) {
            if (unsyncedCount > 0) {
                syncBtn.classList.add('has-pending');
            } else {
                syncBtn.classList.remove('has-pending');
            }
        }
    }

    // Update online status
    const statusEl = document.getElementById('syncOnlineStatus');
    if (statusEl) {
        statusEl.textContent = isOnline() ? '🟢 Online' : '🔴 Offline';
        statusEl.className = isOnline() ? 'status-online' : 'status-offline';
    }
}

/**
 * Format relative time (e.g., "2 jam yang lalu")
 */
function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    if (days < 7) return `${days} hari yang lalu`;
    return date.toLocaleDateString('id-ID');
}

/**
 * Show sync settings modal
 */
function showSyncSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>⚙️ Pengaturan Sinkronisasi</h3>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>URL Server Dinas:</label>
                    <input type="text" id="syncServerUrl" class="form-control"
                           value="${SYNC_CONFIG.serverUrl}"
                           placeholder="https://e-ijazah-app-test.up.railway.app">
                    <small class="form-text">URL server pusat Dinas Pendidikan (Default: Railway)</small>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" id="autoSyncEnabled"
                               ${SYNC_CONFIG.autoSyncEnabled ? 'checked' : ''}>
                        Aktifkan sinkronisasi otomatis
                    </label>
                </div>

                <div class="form-group" id="syncIntervalGroup" style="${SYNC_CONFIG.autoSyncEnabled ? '' : 'display:none'}">
                    <label>Interval Sinkronisasi:</label>
                    <select id="syncInterval" class="form-control">
                        <option value="3600000" ${SYNC_CONFIG.syncInterval === 3600000 ? 'selected' : ''}>Setiap 1 jam</option>
                        <option value="7200000" ${SYNC_CONFIG.syncInterval === 7200000 ? 'selected' : ''}>Setiap 2 jam</option>
                        <option value="21600000" ${SYNC_CONFIG.syncInterval === 21600000 ? 'selected' : ''}>Setiap 6 jam</option>
                        <option value="43200000" ${SYNC_CONFIG.syncInterval === 43200000 ? 'selected' : ''}>Setiap 12 jam</option>
                        <option value="86400000" ${SYNC_CONFIG.syncInterval === 86400000 ? 'selected' : ''}>Setiap 24 jam</option>
                    </select>
                </div>

                <button class="btn btn-secondary" onclick="testServerConnectionUI()">
                    🔌 Test Koneksi
                </button>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                    Batal
                </button>
                <button class="btn btn-primary" onclick="saveSyncSettings()">
                    💾 Simpan
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Toggle interval input based on auto-sync checkbox
    document.getElementById('autoSyncEnabled').addEventListener('change', (e) => {
        document.getElementById('syncIntervalGroup').style.display = e.target.checked ? '' : 'none';
    });
}

/**
 * Test server connection from UI
 */
async function testServerConnectionUI() {
    const serverUrl = document.getElementById('syncServerUrl').value;

    if (!serverUrl) {
        _showNotification('❌ Masukkan URL server terlebih dahulu', 'error');
        return;
    }

    _showLoading('Menguji koneksi...');

    const result = await testServerConnection(serverUrl);
    _hideLoading();

    if (result.success) {
        _showNotification('✅ Koneksi berhasil!', 'success');
    } else {
        _showNotification(`❌ Koneksi gagal: ${result.error}`, 'error');
    }
}

/**
 * Save sync settings
 */
function saveSyncSettings() {
    const serverUrl = document.getElementById('syncServerUrl').value;
    const autoSyncEnabled = document.getElementById('autoSyncEnabled').checked;
    const syncInterval = parseInt(document.getElementById('syncInterval').value);

    if (!serverUrl) {
        _showNotification('❌ URL server harus diisi', 'error');
        return;
    }

    // Save to config and localStorage
    SYNC_CONFIG.serverUrl = serverUrl;
    SYNC_CONFIG.autoSyncEnabled = autoSyncEnabled;
    SYNC_CONFIG.syncInterval = syncInterval;

    localStorage.setItem('sync_server_url', serverUrl);
    localStorage.setItem('auto_sync_enabled', autoSyncEnabled);
    localStorage.setItem('sync_interval', syncInterval);

    _showNotification('✅ Pengaturan tersimpan', 'success');

    // Close modal
    document.querySelector('.modal-overlay').remove();

    // Restart auto-sync if enabled
    if (autoSyncEnabled) {
        startAutoSync();
    } else {
        stopAutoSync();
    }

    // Update UI
    updateSyncUI();
}

/**
 * Auto-sync timer
 */
let autoSyncTimer = null;

function startAutoSync() {
    stopAutoSync(); // Clear any existing timer

    if (SYNC_CONFIG.autoSyncEnabled && SYNC_CONFIG.serverUrl) {
        autoSyncTimer = setInterval(async () => {
            if (isOnline()) {
                console.log('Running auto-sync...');
                await syncToServer();
            }
        }, SYNC_CONFIG.syncInterval);

        console.log(`Auto-sync started (interval: ${SYNC_CONFIG.syncInterval}ms)`);
    }
}

function stopAutoSync() {
    if (autoSyncTimer) {
        clearInterval(autoSyncTimer);
        autoSyncTimer = null;
        console.log('Auto-sync stopped');
    }
}

/**
 * Render sync panel in dashboard
 */
function renderSyncPanel() {
    return `
        <div class="sync-panel card" style="margin: 20px 0;">
            <div class="card-header">
                <h3>🔄 Sinkronisasi Data</h3>
            </div>
            <div class="card-body">
                <div class="sync-info">
                    <div class="sync-stat">
                        <span class="label">Status:</span>
                        <span id="syncOnlineStatus" class="value">${isOnline() ? '🟢 Online' : '🔴 Offline'}</span>
                    </div>
                    <div class="sync-stat">
                        <span class="label">Terakhir sync:</span>
                        <span id="lastSyncTime" class="value">Memuat...</span>
                    </div>
                    <div class="sync-stat">
                        <span class="label">Data belum tersinkronisasi:</span>
                        <span id="unsyncedCount" class="value badge">0</span>
                    </div>
                </div>

                <div class="sync-actions" style="margin-top: 15px;">
                    <button id="syncNowBtn" class="btn btn-primary" onclick="syncToServer()">
                        🔄 Sinkronisasi Sekarang
                    </button>
                    <button class="btn btn-secondary" onclick="showSyncSettingsModal()">
                        ⚙️ Pengaturan
                    </button>
                    <button class="btn btn-secondary" onclick="showSyncHistory()">
                        📊 Riwayat
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Show sync history
 */
async function showSyncHistory() {
    _showLoading('Memuat riwayat sinkronisasi...');

    try {
        const response = await fetch('/api/sync/history?limit=20');
        const data = await response.json();

        _hideLoading();

        if (data.success) {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3>📊 Riwayat Sinkronisasi</h3>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Waktu</th>
                                    <th>Jenis</th>
                                    <th>Jumlah Data</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.history.map(h => `
                                    <tr>
                                        <td>${new Date(h.synced_at).toLocaleString('id-ID')}</td>
                                        <td>${h.sync_type}</td>
                                        <td>${h.records_synced}</td>
                                        <td>
                                            <span class="badge ${h.status === 'success' ? 'badge-success' : 'badge-danger'}">
                                                ${h.status}
                                            </span>
                                            ${h.error_message ? `<br><small>${h.error_message}</small>` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Tutup
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    } catch (error) {
        _hideLoading();
        _showNotification('❌ Gagal memuat riwayat: ' + error.message, 'error');
    }
}

/**
 * Initialize sync module
 */
function initSyncModule() {
    // Check if user is logged in
    if (!window.currentUser || !window.currentUser.schoolData) {
        return;
    }

    // Update UI on load
    updateSyncUI();

    // Update UI every minute
    setInterval(updateSyncUI, 60000);

    // Start auto-sync if enabled
    if (SYNC_CONFIG.autoSyncEnabled) {
        startAutoSync();
    }

    // Listen to online/offline events
    window.addEventListener('online', () => {
        updateSyncUI();
        if (typeof _showNotification === 'function') {
            _showNotification('🟢 Koneksi internet tersedia', 'info');
        }
    });

    window.addEventListener('offline', () => {
        updateSyncUI();
        if (typeof _showNotification === 'function') {
            _showNotification('🔴 Koneksi internet terputus', 'warning');
        }
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSyncModule);
} else {
    initSyncModule();
}

// Export semua function yang diperlukan ke window object
window.initSyncModule = initSyncModule;
window.renderSyncPanel = renderSyncPanel;
window.updateSyncUI = updateSyncUI;
window.syncToServer = syncToServer;
window.showSyncSettingsModal = showSyncSettingsModal;
window.showSyncHistory = showSyncHistory;
window.saveSyncSettings = saveSyncSettings;
window.testServerConnectionUI = testServerConnectionUI;
