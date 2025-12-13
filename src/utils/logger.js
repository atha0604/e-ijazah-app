// src/utils/logger.js
// Serverless-compatible logger (no file writes in production)

const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// In serverless (Vercel), only /tmp is writable
const LOG_DIR = isVercel ? '/tmp/logs' : path.join(__dirname, '../../logs');

// Only try to create log directory if NOT in Vercel
if (!isVercel) {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
    } catch (err) {
        console.warn('Could not create logs directory:', err.message);
    }
}

/**
 * Simple logger that works in both local and serverless environments
 */
class Logger {
    constructor(name = 'app') {
        this.name = name;
    }

    log(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            name: this.name,
            message,
            ...meta
        };

        // Always log to console (visible in Vercel logs)
        const consoleMsg = `[${timestamp}] [${level.toUpperCase()}] ${this.name}: ${message}`;

        switch(level) {
            case 'error':
                console.error(consoleMsg, meta);
                break;
            case 'warn':
                console.warn(consoleMsg, meta);
                break;
            case 'info':
                console.info(consoleMsg, meta);
                break;
            default:
                console.log(consoleMsg, meta);
        }

        // Only write to file in development (not in Vercel)
        if (!isVercel && !isProduction) {
            try {
                const logFile = path.join(LOG_DIR, `${this.name}.log`);
                const logLine = JSON.stringify(logEntry) + '\n';
                fs.appendFileSync(logFile, logLine);
            } catch (err) {
                // Silently fail - console logs are enough
            }
        }
    }

    info(message, meta) {
        this.log('info', message, meta);
    }

    error(message, meta) {
        this.log('error', message, meta);
    }

    warn(message, meta) {
        this.log('warn', message, meta);
    }

    debug(message, meta) {
        if (!isProduction) {
            this.log('debug', message, meta);
        }
    }
}

// Export singleton instance
const logger = new Logger('e-ijazah');

module.exports = logger;
module.exports.Logger = Logger;
module.exports.createLogger = (name) => new Logger(name);
