// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;  // Pastikan ini SAMA PERSIS dengan yang di authController.js

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Ambil token dari "Bearer <token>"

    if (token == null) {
        return res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token tidak valid atau kedaluwarsa.' });
        }
        req.user = user; // Simpan payload token ke request untuk digunakan nanti jika perlu
        next(); // Lanjutkan ke fungsi controller jika token valid
    });
};

module.exports = verifyToken;