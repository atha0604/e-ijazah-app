// Production-ready Logger with Winston
// Replaces console.log to prevent sensitive data exposure

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development (more readable)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Sensitive fields to sanitize
const SENSITIVE_FIELDS = [
    'password', 'token', 'jwt', 'secret', 'apiKey', 'adminKey',
    'nisn', 'nik', 'npsn', // Personal identifiers
    'nama', 'namaPeserta', 'namaLengkap', 'namaSekolah', // Names
    'nilai', 'score', 'grade', // Grades
    'phone', 'email', 'alamat', 'address' // Contact info
];

/**
 * Sanitize sensitive data from log objects
 * @param {any} data - Data to sanitize
 * @returns {any} - Sanitized data
 */
function sanitizeData(data) {
    if (!data) return data;

    // If it's a string, check if it looks like sensitive data
    if (typeof data === 'string') {
        // Don't log long strings that might contain sensitive data
        if (data.length > 200) {
            return `[STRING_TRUNCATED:${data.length}chars]`;
        }
        return data;
    }

    // If it's an array, sanitize each element
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    // If it's an object, sanitize each field
    if (typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();

            // Check if key is sensitive
            if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeData(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    return data;
}

// Create Winston logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: logFormat,
    transports: [
        // Write errors to error.log
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs to combined.log
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ],
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 5242880,
            maxFiles: 3
        })
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 5242880,
            maxFiles: 3
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Enhanced logging methods with sanitization
const enhancedLogger = {
    /**
     * Log info message (safe for production)
     * @param {string} message - Log message
     * @param {object} meta - Additional metadata (will be sanitized)
     */
    info: (message, meta = {}) => {
        logger.info(message, sanitizeData(meta));
    },

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {object} meta - Additional metadata (will be sanitized)
     */
    warn: (message, meta = {}) => {
        logger.warn(message, sanitizeData(meta));
    },

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Error|object} error - Error object or metadata
     */
    error: (message, error = {}) => {
        if (error instanceof Error) {
            logger.error(message, {
                error: error.message,
                stack: error.stack
            });
        } else {
            logger.error(message, sanitizeData(error));
        }
    },

    /**
     * Log debug message (only in development)
     * @param {string} message - Debug message
     * @param {object} meta - Additional metadata (will be sanitized)
     */
    debug: (message, meta = {}) => {
        logger.debug(message, sanitizeData(meta));
    },

    /**
     * Log HTTP request (use for request logging)
     * @param {object} req - Express request object
     */
    http: (req) => {
        logger.http('HTTP Request', {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent')
            // Don't log body/query params as they might contain sensitive data
        });
    },

    /**
     * Unsafe log - use only for debugging, never in production
     * This will be completely disabled in production
     * @param {string} message - Message
     * @param {any} data - Raw data (NOT sanitized)
     */
    unsafe: (message, data) => {
        if (process.env.NODE_ENV === 'production') {
            logger.warn('Unsafe log attempted in production', { message });
            return;
        }
        logger.debug(`[UNSAFE] ${message}`, data);
    }
};

// Helper to create child logger with context
enhancedLogger.child = (context) => {
    const childLogger = logger.child(sanitizeData(context));
    return {
        info: (message, meta = {}) => childLogger.info(message, sanitizeData(meta)),
        warn: (message, meta = {}) => childLogger.warn(message, sanitizeData(meta)),
        error: (message, error = {}) => {
            if (error instanceof Error) {
                childLogger.error(message, { error: error.message, stack: error.stack });
            } else {
                childLogger.error(message, sanitizeData(error));
            }
        },
        debug: (message, meta = {}) => childLogger.debug(message, sanitizeData(meta))
    };
};

module.exports = enhancedLogger;
