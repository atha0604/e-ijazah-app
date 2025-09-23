
// src/controllers/notificationController.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

const getDbConnection = () => {
  const db = new sqlite3.Database(dbPath);
  db.run('PRAGMA foreign_keys = ON');
  return db;
};

// Helper untuk query
const queryAll = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

const run = (db, sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
    });
});

// [GET] /api/notifications
exports.getNotifications = async (req, res) => {
    const db = getDbConnection();
    try {
        const { role, kodeBiasa } = req.user; // Diambil dari token
        const userId = role === 'admin' ? 'admin' : kodeBiasa;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User tidak teridentifikasi.' });
        }

        let notifications = [];
        if (role === 'admin') {
            // Admin melihat semua broadcast dan notifikasi sistem
            notifications = await queryAll(db, `
                SELECT n.*, (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.user_id = ?) as is_read
                FROM notifications n 
                WHERE n.recipient_scope = 'all_schools' OR n.recipient_scope = 'admin'
                ORDER BY n.created_at DESC
                LIMIT 50
            `, [userId]);
        } else if (role === 'sekolah') {
            // Sekolah melihat broadcast umum dan notifikasi spesifik untuk mereka
            const school = await queryAll(db, 'SELECT kecamatan FROM sekolah WHERE kodeBiasa = ?', [userId]);
            const kecamatan = school.length > 0 ? school[0].kecamatan : '';

            notifications = await queryAll(db, `
                SELECT n.*, (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.user_id = ?) as is_read
                FROM notifications n 
                WHERE 
                    n.recipient_scope = 'all_schools' OR 
                    (n.recipient_scope = 'kecamatan' AND n.recipient_id = ?) OR
                    (n.recipient_scope = 'school' AND n.recipient_id = ?)
                ORDER BY n.created_at DESC
                LIMIT 50
            `, [userId, kecamatan, userId]);
        }

        res.json({ success: true, data: notifications });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil notifikasi: ' + error.message, error_stack: error.stack });
    } finally {
        db.close();
    }
};

// [POST] /api/notifications/read
exports.markAsRead = async (req, res) => {
    const db = getDbConnection();
    const { notification_ids } = req.body;
    const { role, kodeBiasa } = req.user;

    const userId = role === 'admin' ? 'admin' : kodeBiasa;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User tidak teridentifikasi.' });
    }

    if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'notification_ids harus berupa array.' });
    }

    try {
        await run(db, 'BEGIN TRANSACTION');
        const stmt = db.prepare('INSERT OR IGNORE INTO notification_reads (notification_id, user_id) VALUES (?, ?)');
        for (const id of notification_ids) {
            stmt.run(id, userId);
        }
        stmt.finalize();
        await run(db, 'COMMIT');
        res.json({ success: true, message: 'Notifikasi ditandai telah dibaca.' });
    } catch (error) {
        await run(db, 'ROLLBACK');
        res.status(500).json({ success: false, message: 'Gagal menandai notifikasi: ' + error.message });
    } finally {
        db.close();
    }
};

// [POST] /api/notifications/broadcast
exports.createBroadcast = async (req, res) => {
    const { message, recipient_scope, recipient_id } = req.body;
    const { role, kodeBiasa } = req.user; // Ambil role dan kodeBiasa dari token

    if (role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Hanya admin yang dapat mengirim broadcast.' });
    }

    // Tentukan senderId berdasarkan role
    const senderId = 'admin';

    if (!message || !recipient_scope) {
        return res.status(400).json({ success: false, message: 'Pesan dan scope penerima wajib diisi.' });
    }

    const db = getDbConnection();
    try {
        const result = await run(db,
            'INSERT INTO notifications (message, type, sender_id, recipient_scope, recipient_id) VALUES (?, ?, ?, ?, ?)',
            [message, 'broadcast', senderId, recipient_scope, recipient_id || null]
        );

        // Emit event ke semua klien
        const io = req.app.get('io');
        io.emit('new_notification', {
            id: result.lastID,
            message,
            recipient_scope,
            recipient_id: recipient_id || null
        });

        res.status(201).json({ success: true, message: 'Broadcast berhasil dikirim.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengirim broadcast: ' + error.message });
    } finally {
        db.close();
    }
};

// [PUT] /api/notifications/:id
exports.updateNotification = async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const { role } = req.user;

    if (role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Hanya admin yang dapat mengedit pengumuman.' });
    }

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Pesan wajib diisi.' });
    }

    const db = getDbConnection();
    try {
        const result = await run(db,
            'UPDATE notifications SET message = ? WHERE id = ?',
            [message.trim(), id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
        }

        res.json({ success: true, message: 'Pengumuman berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui pengumuman: ' + error.message });
    } finally {
        db.close();
    }
};

// [DELETE] /api/notifications/:id
exports.deleteNotification = async (req, res) => {
    const { id } = req.params;
    const { role } = req.user;

    if (role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Hanya admin yang dapat menghapus pengumuman.' });
    }

    const db = getDbConnection();
    try {
        // Hapus notification reads terlebih dahulu
        await run(db, 'DELETE FROM notification_reads WHERE notification_id = ?', [id]);

        // Hapus notifikasi
        const result = await run(db, 'DELETE FROM notifications WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
        }

        res.json({ success: true, message: 'Pengumuman berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus pengumuman: ' + error.message });
    } finally {
        db.close();
    }
};

