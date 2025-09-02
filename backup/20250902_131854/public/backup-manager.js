// Manager untuk auto-backup dan recovery data
const BackupManager = {
    // Interval backup otomatis (5 menit)
    BACKUP_INTERVAL: 5 * 60 * 1000,
    backupTimer: null,

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
                this.createBackup('auto');
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

    // Simpan backup ke storage
    saveBackupToStorage: function(compressedData, type) {
        const backupKey = `backup_${type}_${Date.now()}`;
        const backupList = JSON.parse(localStorage.getItem('backupList') || '[]');
        
        // Tambah backup baru
        backupList.push({
            key: backupKey,
            type: type,
            timestamp: new Date().toISOString(),
            size: compressedData.length
        });
        
        // Simpan data backup
        localStorage.setItem(backupKey, compressedData);
        
        // Rotation: keep only last 10 backups per type
        const typeBackups = backupList.filter(b => b.type === type);
        if (typeBackups.length > 10) {
            const oldBackups = typeBackups.slice(0, -10);
            oldBackups.forEach(backup => {
                localStorage.removeItem(backup.key);
            });
            
            // Update backup list
            const newBackupList = backupList.filter(b => b.type !== type || !oldBackups.includes(b));
            newBackupList.push(...typeBackups.slice(-10));
            localStorage.setItem('backupList', JSON.stringify(newBackupList));
        } else {
            localStorage.setItem('backupList', JSON.stringify(backupList));
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