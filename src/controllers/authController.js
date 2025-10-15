// src/controllers/authController.js (Versi Baru dengan JWT)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

// SECURITY: JWT_SECRET must be set in environment variables
// This should never have a default fallback in production
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not configured. Server cannot start.');
    throw new Error('JWT_SECRET environment variable is required');
}

// Determine database type
const usePostgres = !!process.env.DATABASE_URL;

// PostgreSQL pool (lazy initialization)
let pgPool;
const getPgPool = () => {
    if (!pgPool && process.env.DATABASE_URL) {
        pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_SSL === 'false' ? false : {
                rejectUnauthorized: false
            }
        });
    }
    return pgPool;
};

const getDbConnection = () => {
    return new sqlite3.Database(dbPath);
};

// Unified database query function
async function dbQuery(sql, params = []) {
    if (usePostgres) {
        // PostgreSQL: Convert ? to $1, $2, etc.
        let pgSql = sql;
        let paramIndex = 1;
        pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

        const pool = getPgPool();
        const result = await pool.query(pgSql, params);
        return result.rows;
    } else {
        // SQLite
        const db = getDbConnection();
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Unified database get single row function
async function dbGet(sql, params = []) {
    if (usePostgres) {
        const pool = getPgPool();
        let pgSql = sql;
        let paramIndex = 1;
        pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

        const result = await pool.query(pgSql, params);
        return result.rows[0] || null;
    } else {
        const db = getDbConnection();
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }
}

// Unified database run function
async function dbRun(sql, params = []) {
    if (usePostgres) {
        const pool = getPgPool();
        let pgSql = sql;
        let paramIndex = 1;
        pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

        const result = await pool.query(pgSql, params);
        return { changes: result.rowCount };
    } else {
        const db = getDbConnection();
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
}

exports.login = (req, res) => {
    const { appCode, kurikulum } = req.body;
    if (!appCode || !kurikulum) {
        return res.status(400).json({ success: false, message: 'Kode Aplikasi dan Kurikulum harus diisi.' });
    }

    // Check for admin code first
    const ADMIN_CODE = '1q2w3e4r5t';
    if (appCode.trim() === ADMIN_CODE) {
        // Admin login with special code
        const token = jwt.sign({
            role: 'admin',
            userIdentifier: 'admin',
            userType: 'admin'
        }, JWT_SECRET, { expiresIn: '1d' });

        return res.json({
            success: true,
            message: 'Login admin berhasil!',
            role: 'admin',
            token,
            schoolData: null,
            kurikulum,
            loginType: null
        });
    }

    const db = getDbConnection();

    // School login logic
    const norm = v => (v ?? '').toString().trim().toLowerCase();
    const code = norm(appCode);

    const queryByBiasa = `SELECT * FROM sekolah WHERE LOWER(TRIM(kode_biasa)) = ?`;
    const queryByPro   = `SELECT * FROM sekolah WHERE LOWER(TRIM(kode_pro)) = ?`;

    db.get(queryByBiasa, [code], (err, sekolahBiasa) => {
            if (err) {
                db.close();
                console.error("Database error:", err.message);
                return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
            }
            if (sekolahBiasa) {
                // Update kurikulum di database
                db.run(`UPDATE sekolah SET kurikulum = ? WHERE npsn = ?`, [kurikulum, sekolahBiasa.npsn], (updateErr) => {
                    if (updateErr) {
                        console.error("Error updating kurikulum:", updateErr);
                    }

                    // Prioritaskan login sebagai biasa bila cocok kode_biasa
                    const tokenPayload = {
                        kodeBiasa: sekolahBiasa.kode_biasa,
                        kodePro: sekolahBiasa.kode_pro,
                        role: 'sekolah',
                        loginType: 'biasa'
                    };
                    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });
                    db.close();
                    // Return schoolData in correct order: [kode_biasa, kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat]
                    return res.json({
                        success: true,
                        message: 'Login berhasil!',
                        role: 'sekolah',
                        token,
                        schoolData: [
                            sekolahBiasa.kode_biasa,
                            sekolahBiasa.kode_pro,
                            sekolahBiasa.kecamatan,
                            sekolahBiasa.npsn,
                            sekolahBiasa.nama_lengkap,
                            sekolahBiasa.nama_singkat
                        ],
                        kurikulum,
                        loginType: 'biasa'
                    });
                });
                return; // Prevent fall-through
            }

            // Tidak cocok kodeBiasa, coba kodePro
            db.get(queryByPro, [code], (err2, sekolahPro) => {
                if (err2) {
                    db.close();
                    console.error("Database error:", err2.message);
                    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
                }
                if (!sekolahPro) {
                    db.close();
                    return res.status(401).json({ success: false, message: 'Kode Aplikasi tidak ditemukan.' });
                }

                // Update kurikulum di database
                db.run(`UPDATE sekolah SET kurikulum = ? WHERE npsn = ?`, [kurikulum, sekolahPro.npsn], (updateErr) => {
                    if (updateErr) {
                        console.error("Error updating kurikulum:", updateErr);
                    }

                    const tokenPayload = {
                        kodeBiasa: sekolahPro.kode_biasa,
                        kodePro: sekolahPro.kode_pro,
                        role: 'sekolah',
                        loginType: 'pro'
                    };
                    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });
                    db.close();
                    // Return schoolData in correct order: [kode_biasa, kode_pro, kecamatan, npsn, nama_lengkap, nama_singkat]
                    return res.json({
                        success: true,
                        message: 'Login berhasil!',
                        role: 'sekolah',
                        token,
                        schoolData: [
                            sekolahPro.kode_biasa,
                            sekolahPro.kode_pro,
                            sekolahPro.kecamatan,
                            sekolahPro.npsn,
                            sekolahPro.nama_lengkap,
                            sekolahPro.nama_singkat
                        ],
                        kurikulum,
                        loginType: 'pro'
                    });
                });
            });
        });
};

// New secure admin login with username and password (PostgreSQL & SQLite compatible)
exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username dan password harus diisi.'
        });
    }

    try {
        // Query admin user with password (works with both PostgreSQL and SQLite)
        const user = await dbGet("SELECT * FROM users WHERE username = ?", [username]);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah.'
            });
        }

        // Check if password exists in database
        if (!user.password) {
            return res.status(500).json({
                success: false,
                message: 'Akun admin belum dikonfigurasi dengan password. Hubungi administrator sistem.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah.'
            });
        }

        // Generate JWT token
        const token = jwt.sign({
            role: 'admin',
            userIdentifier: user.username,
            userType: 'admin',
            userId: user.id
        }, JWT_SECRET, { expiresIn: '1d' });

        return res.json({
            success: true,
            message: 'Login admin berhasil!',
            role: 'admin',
            token: token,
            username: user.username
        });

    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server.'
        });
    }
};

// Verify token endpoint
exports.verifyToken = (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({ valid: false });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.json({
            valid: true,
            role: decoded.role,
            userIdentifier: decoded.userIdentifier
        });
    } catch (error) {
        return res.json({ valid: false });
    }
};
