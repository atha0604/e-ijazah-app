// Database Path Helper for Tauri compatibility
// Handles different paths for development vs production (Tauri bundled app)

const path = require('path');
const fs = require('fs');

/**
 * Get the appropriate database path based on environment
 * @returns {string} Database file path
 */
function getDatabasePath() {
    const isDevelopment = process.env.NODE_ENV !== 'production' || !process.env.TAURI_ENV;

    if (isDevelopment) {
        // Development: Use project folder
        return path.join(__dirname, '..', 'database', 'db.sqlite');
    } else {
        // Production (Tauri): Use app data folder
        // APPDATA on Windows, ~/.local/share on Linux, ~/Library/Application Support on Mac
        const appDataDir = process.env.APPDATA
            || (process.platform === 'darwin'
                ? path.join(process.env.HOME, 'Library', 'Application Support')
                : path.join(process.env.HOME, '.local', 'share'));

        const dbDir = path.join(appDataDir, 'e-ijazah');

        // Create directory if it doesn't exist
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        return path.join(dbDir, 'db.sqlite');
    }
}

/**
 * Get backup directory path
 * @returns {string} Backup directory path
 */
function getBackupPath() {
    const dbPath = getDatabasePath();
    const dbDir = path.dirname(dbPath);
    const backupDir = path.join(dbDir, 'backups');

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    return backupDir;
}

module.exports = {
    getDatabasePath,
    getBackupPath
};
