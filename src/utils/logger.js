// src/utils/logger.js
// Super simple serverless-only logger - NO FILE OPERATIONS

/**
 * Console-only logger for Vercel serverless
 * All logs go to console (visible in Vercel logs)
 */
class Logger {
    constructor(name = 'app') {
        this.name = name;
    }

    log(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}`;

        // Only console logging - safe for serverless
        switch(level) {
            case 'error':
                console.error(logMsg, meta);
                break;
            case 'warn':
                console.warn(logMsg, meta);
                break;
            case 'info':
                console.info(logMsg, meta);
                break;
            default:
                console.log(logMsg, meta);
        }
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }
}

// Export singleton
const logger = new Logger('e-ijazah');

module.exports = logger;
module.exports.Logger = Logger;
module.exports.createLogger = (name) => new Logger(name);
