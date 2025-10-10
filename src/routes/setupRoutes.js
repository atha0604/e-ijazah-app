// Setup route untuk create admin user pertama kali (Railway deployment)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDbConnection } = require('../database/connection');

// Endpoint untuk setup admin user (hanya jalan sekali)
router.post('/create-admin', async (req, res) => {
    const db = getDbConnection();

    try {
        // Check if admin already exists
        db.get("SELECT * FROM users WHERE username = 'admin'", async (err, existingAdmin) => {
            if (err) {
                db.close();
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (existingAdmin) {
                db.close();
                return res.json({
                    success: true,
                    message: 'Admin user already exists',
                    username: 'admin'
                });
            }

            // Create admin user
            const defaultPassword = 'admin123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            db.run(
                'INSERT INTO users (username, login_code, password, role) VALUES (?, ?, ?, ?)',
                ['admin', 'admin', hashedPassword, 'admin'],
                function(insertErr) {
                    db.close();

                    if (insertErr) {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to create admin user',
                            error: insertErr.message
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Admin user created successfully',
                        username: 'admin',
                        password: 'admin123',
                        warning: 'Please change this password immediately!'
                    });
                }
            );
        });
    } catch (error) {
        db.close();
        res.status(500).json({
            success: false,
            message: 'Setup failed',
            error: error.message
        });
    }
});

module.exports = router;
