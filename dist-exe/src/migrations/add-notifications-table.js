
// src/migrations/add-notifications-table.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Gagal koneksi ke database:', err.message);
    process.exit(1);
  }
});

const run = (sql) => new Promise((resolve, reject) => {
    db.run(sql, (err) => {
        if (err) return reject(err);
        resolve();
    });
});

async function migrate() {
    console.log('Menjalankan migrasi untuk tabel notifikasi...');
    try {
        // Tabel utama untuk menyimpan notifikasi
        await run(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'info', -- 'info', 'broadcast', 'alert', 'reminder'
                sender_id TEXT NOT NULL, -- 'system' atau ID admin
                recipient_scope TEXT NOT NULL, -- 'all_schools', 'kecamatan', 'school'
                recipient_id TEXT, -- ID spesifik untuk scope (nama kecamatan atau kodeBiasa sekolah)
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME
            )
        `);
        console.log('Tabel "notifications" berhasil dibuat atau sudah ada.');

        // Tabel untuk melacak status "dibaca" oleh pengguna (sekolah)
        await run(`
            CREATE TABLE IF NOT EXISTS notification_reads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                notification_id INTEGER NOT NULL,
                user_id TEXT NOT NULL, -- kodeBiasa sekolah
                read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
                UNIQUE(notification_id, user_id)
            )
        `);
        console.log('Tabel "notification_reads" berhasil dibuat atau sudah ada.');

        console.log('Migrasi berhasil.');
    } catch (error) {
        console.error('Gagal menjalankan migrasi:', error.message);
        process.exit(1);
    } finally {
        db.close();
    }
}

migrate();
