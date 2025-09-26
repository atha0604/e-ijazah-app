
// src/utils/notificationHelper.js
const path = require('path');
const sqlite3 = require('sqlite3');
const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

// Fungsi ini berjalan secara independen untuk menghindari masalah koneksi
function createSystemNotification(message, recipient_scope, recipient_id = null, io) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) return reject(err);
        });

        const sql = 'INSERT INTO notifications (message, type, sender_id, recipient_scope, recipient_id) VALUES (?, ?, ?, ?, ?)';
        const params = [message, 'alert', 'system', recipient_scope, recipient_id];

        db.run(sql, params, function(err) {
            db.close(); // Selalu tutup koneksi
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
