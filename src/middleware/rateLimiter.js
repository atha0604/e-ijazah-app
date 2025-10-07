// Rate Limiting Middleware
const rateLimit = require('express-rate-limit');

// General rate limiter for login endpoints (prevent brute force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false // Count successful requests
    // Use default key generator (IPv6 compatible)
});

// Strict rate limiter for admin login (more restrictive)
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: {
        success: false,
        message: 'Terlalu banyak percobaan login admin. Silakan coba lagi dalam 15 menit.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
    // Use default key generator (IPv6 compatible)
});

// General API rate limiter (prevent API abuse)
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: {
        success: false,
        message: 'Terlalu banyak request. Silakan tunggu sebentar.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful requests
});

// Data import rate limiter (heavy operations)
const importLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit to 10 imports per 5 minutes
    message: {
        success: false,
        message: 'Terlalu banyak import data. Silakan tunggu 5 menit.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    loginLimiter,
    adminLoginLimiter,
    apiLimiter,
    importLimiter
};
