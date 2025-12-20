
// src/utils/notificationHelper.js
const db = require('../database/database'); // Smart database adapter (SQLite/PostgreSQL)

// Fungsi ini berjalan secara independen untuk menghindari masalah koneksi
function createSystemNotification(message, recipient_scope, recipient_id = null, io) {
    return new Promise((resolve, reject) => {

        const sql = 'INSERT INTO notifications (message, type, sender_id, recipient_scope, recipient_id) VALUES (?, ?, ?, ?, ?)';
        const params = [message, 'alert', 'system', recipient_scope, recipient_id];

        db.run(sql, params, function(err) {
            if (err) {
                console.error('Gagal membuat notifikasi sistem:', err.message);
                return reject(err);
            }
            console.log(`Notifikasi sistem dibuat: ${message}`);
            
            // Emit event jika io tersedia
            if (io) {
                io.emit('new_notification', {
                    id: this.lastID,
                    message,
                    recipient_scope,
                    recipient_id
                });
            }

            resolve(this.lastID);
        });
    });
}

module.exports = { createSystemNotification };
