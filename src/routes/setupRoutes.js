// Setup route untuk create admin user pertama kali (Railway deployment)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');
const getDbConnection = () => new sqlite3.Database(dbPath);

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

// Endpoint untuk fix database schema
router.post('/fix-schema', async (req, res) => {
    const db = getDbConnection();
    const fixes = [];
    const errors = [];

    try {
        // Check and add nama_singkat column to sekolah table
        db.all("PRAGMA table_info(sekolah)", [], async (err, tableInfo) => {
            if (err) {
                db.close();
                return res.status(500).json({
                    success: false,
                    message: 'Failed to check schema',
                    error: err.message
                });
            }

            const hasNamaSingkat = tableInfo.some(col => col.name === 'nama_singkat');

            if (!hasNamaSingkat) {
                db.run('ALTER TABLE sekolah ADD COLUMN nama_singkat TEXT', (alterErr) => {
                    if (alterErr) {
                        errors.push(`Failed to add nama_singkat: ${alterErr.message}`);
                    } else {
                        fixes.push('Added nama_singkat column to sekolah table');
                    }

                    db.close();

                    res.json({
                        success: errors.length === 0,
                        message: errors.length === 0 ? 'Schema fixed successfully' : 'Some fixes failed',
                        fixes: fixes,
                        errors: errors.length > 0 ? errors : undefined
                    });
                });
            } else {
                fixes.push('nama_singkat column already exists');
                db.close();

                res.json({
                    success: true,
                    message: 'Schema is already up to date',
                    fixes: fixes
                });
            }
        });
    } catch (error) {
        db.close();
        res.status(500).json({
            success: false,
            message: 'Fix schema failed',
            error: error.message
        });
    }
});

module.exports = router;
