// Manager untuk auto-backup dan recovery data
const BackupManager = {
    // Interval backup otomatis (15 menit) - reduced frequency to prevent storage issues
    BACKUP_INTERVAL: 15 * 60 * 1000,
    backupTimer: null,
    
    // Storage monitoring
    lastStorageCheck: 0,
    storageWarningShown: false,

    // Inisialisasi auto-backup
    init: function() {
        console.log('Backup Manager initialized');
        this.startAutoBackup();
        
        // Backup saat ada perubahan data penting
        window.addEventListener('beforeunload', () => {
            this.createBackup('exit');
        });
    },

    // Mulai auto-backup
    startAutoBackup: function() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
        }
        
        this.backupTimer = setInterval(() => {
            if (currentUser && currentUser.isLoggedIn) {
                // Check storage before creating auto backup
                const storageInfo = this.checkStorageQuota();
                
                // Only create auto backup if storage is not too full
                if (storageInfo.percentage < 70) {
                    this.createBackup('auto');
                } else {
                    // Clean old backups and try once
                    console.log('Storage getting full, cleaning before auto backup...');
                    this.cleanOldBackups();
                    
                    const newStorageInfo = this.checkStorageQuota();
                    if (newStorageInfo.percentage < 70) {
                        this.createBackup('auto');
                    } else {
                        console.warn('Skipping auto backup - storage too full');
                        this.showStorageWarning();
                    }
                }
            }
        }, this.BACKUP_INTERVAL);
    },

    // Stop auto-backup
    stopAutoBackup: function() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
            this.backupTimer = null;
        }
    },

    // Show storage warning to user
    showStorageWarning: function() {
        // Only show warning once per session
        if (!this.storageWarningShown) {
            this.storageWarningShown = true;
            
            if (typeof showNotification === 'function') {
                showNotification(
                    '⚠️ Storage browser hampir penuh. Auto-backup dinonaktifkan sementara. ' +
                    'Gunakan fitur Backup & Restore untuk export manual ke file.',
                    'warning',
                    10000
                );
            }
            
            console.warn('Storage warning shown to user');
        }
    },

    // Get storage usage info for display
    getStorageInfo: function() {
        const storageInfo = this.checkStorageQuota();
        const backupList = JSON.parse(localStorage.getItem('backupList') || '[]');
        
        return {
            ...storageInfo,
            usedMB: (storageInfo.used / (1024 * 1024)).toFixed(2),
            availableMB: (storageInfo.available / (1024 * 1024)).toFixed(2),
            backupCount: backupList.length,
            autoBackups: backupList.filter(b => b.type === 'auto').length,
            manualBackups: backupList.filter(b => b.type === 'manual').length
        };
    },

    // Manual cleanup function for users
    clearAllBackups: function() {
        try {
            const backupList = JSON.parse(localStorage.getItem('backupList') || '[]');
            let removedCount = 0;
            
            backupList.forEach(backup => {
                try {
                    localStorage.removeItem(backup.key);
                    removedCount++;
                } catch (e) {
                    console.error('Error removing backup:', backup.key, e);
                }
            });
            
            localStorage.removeItem('backupList');
            
            if (typeof showNotification === 'function') {
                showNotification(`✅ Berhasil menghapus ${removedCount} backup dan membersihkan storage.`, 'success');
            }
            
            // Reset warning flag
            this.storageWarningShown = false;
            
            console.log(`Cleared ${removedCount} backups from storage`);
            return removedCount;
            
        } catch (error) {
            console.error('Error clearing backups:', error);
            if (typeof showNotification === 'function') {
                showNotification('❌ Gagal membersihkan backup: ' + error.message, 'error');
            }
            return 0;
        }
    },

    // Buat backup
    createBackup: function(type = 'manual') {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                type: type,
                version: '2.0.0',
                user: currentUser?.schoolData?.[0] || 'unknown',
                data: {
                    sekolah: database?.sekolah || [],
                    siswa: database?.siswa || [],
                    nilaiSiswa: database?.nilaiSiswa || [],
                    semester: database?.semester || []
                },
                settings: {
                    paginationState: window.paginationState || {},
                    currentUser: currentUser
                }
            };

            // Compress data
            const compressed = this.compressData(JSON.stringify(backupData));
            
            // Simpan ke localStorage dengan rotation
            this.saveBackupToStorage(compressed, type);
            
            // Log backup
            console.log(`Backup created: ${type} at ${backupData.timestamp}`);
            
            if (type === 'manual') {
                showNotification('Backup berhasil dibuat!', 'success');
            }
            
            return true;
        } catch (error) {
            console.error('Backup failed:', error);
            if (type === 'manual') {
                showNotification('Backup gagal dibuat: ' + error.message, 'error');
            }
            return false;
        }
    },

    // Check available storage space
    checkStorageQuota: function() {
        let usedSpace = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                usedSpace += localStorage[key].length;
            }
        }
        
        // Estimate available space (5MB is typical localStorage limit)
        const maxSpace = 5 * 1024 * 1024; // 5MB
        const availableSpace = maxSpace - usedSpace;
        
        return {
            used: usedSpace,
            available: availableSpace,
            percentage: (usedSpace / maxSpace) * 100
        };
    },

    // Clean old backups to free space
    cleanOldBackups: function(requiredSpace = 0) {
        const backupList = JSON.parse(localStorage.getItem('backupList') || '[]');
        let freedSpace = 0;
        
        // Sort by timestamp (oldest first)
        const sortedBackups = backupList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Remove old auto backups first, keep at least 2 recent ones per type
        const backupsByType = {};
        sortedBackups.forEach(backup => {
            if (!backupsByType[backup.type]) {
                backupsByType[backup.type] = [];
            }
            backupsByType[backup.type].push(backup);
        });
        
        const backupsToRemove = [];
        
        // For auto backups, keep only 3 most recent
        if (backupsByType.auto && backupsByType.auto.length > 3) {
            backupsToRemove.push(...backupsByType.auto.slice(0, -3));
        }
        
        // For manual backups, keep only 5 most recent
        if (backupsByType.manual && backupsByType.manual.length > 5) {
            backupsToRemove.push(...backupsByType.manual.slice(0, -5));
        }
        
        // Remove oldest backups until we have enough space
        for (const backup of backupsToRemove) {
            try {
                localStorage.removeItem(backup.key);
                freedSpace += backup.size || 0;
                console.log(`Removed old backup: ${backup.key}`);
                
                if (requiredSpace > 0 && freedSpace >= requiredSpace) {
                    break;
                }
            } catch (e) {
                console.error('Error removing backup:', e);
            }
        }
        
        // Update backup list
        const remainingBackups = backupList.filter(b => !backupsToRemove.some(r => r.key === b.key));
        localStorage.setItem('backupList', JSON.stringify(remainingBackups));
        
        return freedSpace;
    },

    // Simpan backup ke storage dengan quota management
    saveBackupToStorage: function(compressedData, type) {
        const backupKey = `backup_${type}_${Date.now()}`;
        const dataSize = compressedData.length;
        
        try {
            // Check storage quota first
            const storageInfo = this.checkStorageQuota();
            
            // If storage is over 80% full or not enough space, clean old backups
            if (storageInfo.percentage > 80 || storageInfo.available < dataSize * 1.5) {
                console.log(`Storage is ${storageInfo.percentage.toFixed(1)}% full, cleaning old backups...`);
                this.cleanOldBackups(dataSize * 2);
            }
            
            // Try to save the backup
            localStorage.setItem(backupKey, compressedData);
            
            // Update backup list
            const backupList = JSON.parse(localStorage.getItem('backupList') || '[]');
            
            // Add new backup info
            backupList.push({
                key: backupKey,
                type: type,
                timestamp: new Date().toISOString(),
                size: dataSize
            });
            
            // Limit backup list size - keep only recent entries
            const maxBackups = type === 'auto' ? 3 : 5;
            const typeBackups = backupList.filter(b => b.type === type);
            
            if (typeBackups.length > maxBackups) {
                const oldBackups = typeBackups.slice(0, -maxBackups);
                oldBackups.forEach(backup => {
                    try {
                        localStorage.removeItem(backup.key);
                    } catch (e) {
                        console.error('Error removing old backup:', e);
                    }
                });
            }
            
            // Keep only recent backups in the list
            const filteredBackupList = backupList.filter(b => 
                b.type !== type || typeBackups.slice(-maxBackups).some(tb => tb.key === b.key)
            );
            
            localStorage.setItem('backupList', JSON.stringify(filteredBackupList));
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded, attempting emergency cleanup...');
                
                // Emergency cleanup - remove more backups
                this.cleanOldBackups(dataSize * 3);
                
                try {
                    // Try again after cleanup
                    localStorage.setItem(backupKey, compressedData);
                    
                    // Update backup list with minimal info
                    const backupList = JSON.parse(localStorage.getItem('backupList') || '[]');
                    backupList.push({
                        key: backupKey,
                        type: type,
                        timestamp: new Date().toISOString(),
                        size: dataSize
                    });
                    
                    // Keep only essential backups
                    const recentBackups = backupList.slice(-2); // Keep only 2 most recent
                    localStorage.setItem('backupList', JSON.stringify(recentBackups));
                    
                } catch (secondError) {
                    console.error('Even after cleanup, backup still failed:', secondError);
                    throw new Error('Storage penuh. Tidak dapat membuat backup. Coba hapus data browser atau gunakan backup manual ke file.');
                }
            } else {
                throw error;
            }
        }
    },

    // Restore dari backup
    restoreBackup: function(backupKey) {
        try {
            const compressedData = localStorage.getItem(backupKey);
            if (!compressedData) {
                throw new Error('Backup tidak ditemukan');
            }
            
            const decompressed = this.decompressData(compressedData);
            const backupData = JSON.parse(decompressed);
            
            // Validate backup data
            if (!backupData.data || !backupData.timestamp) {
                throw new Error('Format backup tidak valid');
            }
            
            // Confirm restore
            const confirmMessage = `Restore backup dari ${new Date(backupData.timestamp).toLocaleString()}?\n\nSemua data saat ini akan diganti!`;
            
            if (!confirm(confirmMessage)) {
                return false;
            }
            
            // Backup current data before restore
            this.createBackup('pre_restore');
            
            // Restore data
            database.sekolah = backupData.data.sekolah || [];
            database.siswa = backupData.data.siswa || [];
            database.nilaiSiswa = backupData.data.nilaiSiswa || [];
            database.semester = backupData.data.semester || [];
            
            // Restore settings if available
            if (backupData.settings) {
                window.paginationState = backupData.settings.paginationState || {};
            }
            
            // Refresh UI
            if (typeof renderProfilSiswa === 'function') renderProfilSiswa();
            if (typeof renderIsiNilaiPage === 'function') {
                const currentSemester = paginationState.isiNilai?.currentSemester;
                if (currentSemester) {
                    renderIsiNilaiPage(currentSemester);
                }
            }
            
            showNotification('Data berhasil direstore!', 'success');
            SecurityUtils.logActivity('DATA_RESTORED', `From backup: ${backupData.timestamp}`);
            
            return true;
        } catch (error) {
            console.error('Restore failed:', error);
            showNotification('Restore gagal: ' + error.message, 'error');
            return false;
        }
    },

    // Dapatkan daftar backup
    getBackupList: function() {
        const backupList = JSON.parse(localStorage.getItem('backupList') || '[]');
        return backupList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    // Hapus backup
    deleteBackup: function(backupKey) {
        try {
            localStorage.removeItem(backupKey);
            
            const backupList = JSON.parse(localStorage.getItem('backupList') || '[]');
            const updatedList = backupList.filter(b => b.key !== backupKey);
            localStorage.setItem('backupList', JSON.stringify(updatedList));
            
            showNotification('Backup berhasil dihapus', 'success');
            return true;
        } catch (error) {
            showNotification('Gagal menghapus backup: ' + error.message, 'error');
            return false;
        }
    },

    // Simple compression
    compressData: function(data) {
        // Basic LZ-string like compression
        const dict = {};
        let dictSize = 256;
        let result = [];
        let w = '';
        
        for (let i = 0; i < data.length; i++) {
            const c = data[i];
            const wc = w + c;
            
            if (dict[wc]) {
                w = wc;
            } else {
                result.push(dict[w] ? dict[w] : w.charCodeAt(0));
                dict[wc] = dictSize++;
                w = String(c);
            }
        }
        
        if (w !== '') {
            result.push(dict[w] ? dict[w] : w.charCodeAt(0));
        }
        
        return btoa(JSON.stringify(result));
    },

    // Simple decompression
    decompressData: function(compressed) {
        try {
            const data = JSON.parse(atob(compressed));
            const dict = {};
            let dictSize = 256;
            let result = '';
            let w = String.fromCharCode(data[0]);
            result += w;
            
            for (let i = 1; i < data.length; i++) {
                const k = data[i];
                const entry = dict[k] ? dict[k] : (k === dictSize ? w + w[0] : String.fromCharCode(k));
                result += entry;
                dict[dictSize++] = w + entry[0];
                w = entry;
            }
            
            return result;
        } catch (e) {
            // Fallback for non-compressed data
            return atob(compressed);
        }
    },

    // Export backup untuk download
    exportBackup: function() {
        this.createBackup('export');
        
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            user: currentUser?.schoolData?.[0] || 'unknown',
            data: {
                sekolah: database?.sekolah || [],
                siswa: database?.siswa || [],
                nilaiSiswa: database?.nilaiSiswa || [],
                semester: database?.semester || []
            }
        };
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `e-ijazah-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Backup berhasil diunduh!', 'success');
    }
};

// Auto-initialize saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    BackupManager.init();
});

window.BackupManager = BackupManager;