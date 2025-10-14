// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter, adminLoginLimiter } = require('../middleware/rateLimiter');
const { validateLogin, validateAdminLogin, sanitizeInput } = require('../middleware/validator');

// Apply sanitization to all routes
router.use(sanitizeInput);

// School login (with rate limiting and validation)
router.post('/login', loginLimiter, validateLogin, authController.login);

// Admin login with username and password (strict rate limiting)
router.post('/admin-login', adminLoginLimiter, validateAdminLogin, authController.adminLogin);

// First-time setup admin login (NO rate limiting - for Railway deployment setup)
router.post('/admin-login-setup', validateAdminLogin, authController.adminLogin);

// Verify JWT token
router.get('/verify', authController.verifyToken);

module.exports = router;