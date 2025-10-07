// Automated Database Backup Scheduler
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');
const backupDir = path.join(__dirname, '..', 'database', 'backups');

class BackupScheduler {
    constructor() {
        this.isRunning = false;
        this.schedule = null;
        this.lastBackupTime = null;

        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
            console.log('✅ Created backup directory:', backupDir);
        }
    }

    /**
     * Create a database backup
     */
    async createBackup() {
        return new Promise((resolve, reject) => {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFileName = `db_backup_${timestamp}.sqlite`;
                const backupPath = path.join(backupDir, backupFileName);

                // Copy database file
                fs.copyFile(dbPath, backupPath, (err) => {
                    if (err) {
                        console.error('❌ Backup failed:', err);
                        reject(err);
                        return;
                    }

                    this.lastBackupTime = new Date();
                    console.log(`✅ Backup created: ${backupFileName}`);

                    // Clean old backups (keep only last 30 days)
                    this.cleanOldBackups();

                    resolve({
                        success: true,
                        fileName: backupFileName,
                        path: backupPath,
                        timestamp: this.lastBackupTime,
                        size: fs.statSync(backupPath).size
                    });
                });
            } catch (error) {
                console.error('❌ Backup creation error:', error);
                reject(error);
            }
        });
    }

    /**
     * Clean backups older than retention period (default 30 days)
     */
    cleanOldBackups(retentionDays = 30) {
        try {
            const files = fs.readdirSync(backupDir);
            const now = Date.now();
            const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

            let deletedCount = 0;

            files.forEach(file => {
                if (!file.startsWith('db_backup_')) return;

                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                const fileAge = now - stats.mtimeMs;

                if (fileAge > retentionMs) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`🗑️  Deleted old backup: ${file}`);
                }
            });

            if (deletedCount > 0) {
                console.log(`✅ Cleaned ${deletedCount} old backup(s)`);
            }
        } catch (error) {
            console.error('❌ Error cleaning old backups:', error);
        }
    }

    /**
     * Start automated backup schedule
     * Default: Daily at 2:00 AM
     */
    start(cronExpression = '0 2 * * *') {
        if (this.isRunning) {
            console.log('⚠️  Backup scheduler already running');
            return;
        }

        // Validate cron expression
        if (!cron.validate(cronExpression)) {
            console.error('❌ Invalid cron expression:', cronExpression);
            return;
        }

        this.schedule = cron.schedule(cronExpression, async () => {
            console.log('🔄 Running scheduled backup...');
            try {
                const result = await this.createBackup();
                console.log('✅ Scheduled backup completed:', result.fileName);
            } catch (error) {
                console.error('❌ Scheduled backup failed:', error);
            }
        });

        this.isRunning = true;
        console.log(`✅ Backup scheduler started (${cronExpression})`);
        console.log('   Schedule: Daily at 2:00 AM');
        console.log('   Retention: 30 days');

        // Create initial backup
        this.createBackup()
            .then(result => {
                console.log('✅ Initial backup created:', result.fileName);
            })
            .catch(err => {
                console.error('⚠️  Initial backup failed:', err.message);
            });
    }

    /**
     * Stop the backup scheduler
     */
    stop() {
        if (this.schedule) {
            this.schedule.stop();
            this.isRunning = false;
            console.log('✅ Backup scheduler stopped');
        }
    }

    /**
     * Get list of all backups
     */
    listBackups() {
        try {
            const files = fs.readdirSync(backupDir);
            const backups = files
                .filter(file => file.startsWith('db_backup_'))
                .map(file => {
                    const filePath = path.join(backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        fileName: file,
                        path: filePath,
                        size: stats.size,
                        created: stats.mtime,
                        age: Math.floor((Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24)) + ' days'
                    };
                })
                .sort((a, b) => b.created - a.created);

            return backups;
        } catch (error) {
            console.error('❌ Error listing backups:', error);
            return [];
        }
    }

    /**
     * Get backup status
     */
    getStatus() {
        const backups = this.listBackups();
        return {
            isRunning: this.isRunning,
            lastBackupTime: this.lastBackupTime,
            totalBackups: backups.length,
            oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
            newestBackup: backups.length > 0 ? backups[0].created : null,
            totalSize: backups.reduce((sum, b) => sum + b.size, 0)
        };
    }

    /**
     * Restore from backup
     */
    async restoreBackup(backupFileName) {
        return new Promise((resolve, reject) => {
            try {
                const backupPath = path.join(backupDir, backupFileName);

                if (!fs.existsSync(backupPath)) {
                    reject(new Error('Backup file not found'));
                    return;
                }

                // Create a safety backup of current database
                const safetyBackupName = `db_before_restore_${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
                const safetyBackupPath = path.join(backupDir, safetyBackupName);

                fs.copyFileSync(dbPath, safetyBackupPath);
                console.log('✅ Created safety backup before restore');

                // Restore backup
                fs.copyFile(backupPath, dbPath, (err) => {
                    if (err) {
                        console.error('❌ Restore failed:', err);
                        reject(err);
                        return;
                    }

                    console.log(`✅ Database restored from: ${backupFileName}`);
                    resolve({
                        success: true,
                        restoredFrom: backupFileName,
                        safetyBackup: safetyBackupName
                    });
                });
            } catch (error) {
                console.error('❌ Restore error:', error);
                reject(error);
            }
        });
    }
}

// Singleton instance
let backupSchedulerInstance = null;

function getBackupScheduler() {
    if (!backupSchedulerInstance) {
        backupSchedulerInstance = new BackupScheduler();
    }
    return backupSchedulerInstance;
}

module.exports = {
    BackupScheduler,
    getBackupScheduler
};
