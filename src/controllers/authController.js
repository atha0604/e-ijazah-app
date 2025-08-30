// src/controllers/authController.js (Versi Baru dengan JWT)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken'); // <-- Tambahkan ini

const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

// KUNCI RAHASIA: Ganti ini dengan teks acak yang panjang dan sulit ditebak
const JWT_SECRET = process.env.JWT_SECRET; 

const getDbConnection = () => {
    return new sqlite3.Database(dbPath);
};

exports.login = (req, res) => {
    const { appCode, kurikulum } = req.body;
    if (!appCode || !kurikulum) {
        return res.status(400).json({ success: false, message: 'Kode Aplikasi dan Kurikulum harus diisi.' });
    }

    const db = getDbConnection();

    if (appCode.toLowerCase() === 'admin') {
        // Logika login untuk Admin
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
        db.close();
        return res.json({
            success: true,
            message: 'Login Admin berhasil!',
            role: 'admin',
            token: token // Kirim token
        });
    }

    // Logika login untuk Sekolah
    const norm = v => (v ?? '').toString().trim().toLowerCase();
    const code = norm(appCode);

    const queryByBiasa = `SELECT * FROM sekolah WHERE LOWER(TRIM(kodeBiasa)) = ?`;
    const queryByPro   = `SELECT * FROM sekolah WHERE LOWER(TRIM(kodePro)) = ?`;

    db.get(queryByBiasa, [code], (err, sekolahBiasa) => {
        if (err) {
            db.close();
            console.error("Database error:", err.message);
            return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
        }
        if (sekolahBiasa) {
            // Prioritaskan login sebagai biasa bila cocok kodeBiasa
            const tokenPayload = {
                kodeBiasa: sekolahBiasa.kodeBiasa,
                kodePro: sekolahBiasa.kodePro,
                role: 'sekolah',
                loginType: 'biasa'
            };
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });
            db.close();
            return res.json({
                success: true,
                message: 'Login berhasil!',
                role: 'sekolah',
                token,
                schoolData: Object.values(sekolahBiasa),
                kurikulum,
                loginType: 'biasa'
            });
        }

        // Tidak cocok kodeBiasa, coba kodePro
        db.get(queryByPro, [code], (err2, sekolahPro) => {
            db.close();
            if (err2) {
                console.error("Database error:", err2.message);
                return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
            }
            if (!sekolahPro) {
                return res.status(401).json({ success: false, message: 'Kode Aplikasi tidak ditemukan.' });
            }
            const tokenPayload = {
                kodeBiasa: sekolahPro.kodeBiasa,
                kodePro: sekolahPro.kodePro,
                role: 'sekolah',
                loginType: 'pro'
            };
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });
            return res.json({
                success: true,
                message: 'Login berhasil!',
                role: 'sekolah',
                token,
                schoolData: Object.values(sekolahPro),
                kurikulum,
                loginType: 'pro'
            });
        });
    });
};
