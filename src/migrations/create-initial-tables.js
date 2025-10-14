const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Creating initial database tables...');

db.serialize(() => {
    // Table: users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        login_code TEXT NOT NULL DEFAULT "admin",
        role TEXT NOT NULL DEFAULT "admin",
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('✓ Table "users" created');
    });

    // Table: sekolah
    db.run(`CREATE TABLE IF NOT EXISTS sekolah (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        npsn TEXT UNIQUE,
        kode_biasa TEXT UNIQUE NOT NULL,
        kode_pro TEXT UNIQUE,
        nama_lengkap TEXT NOT NULL,
        alamat TEXT,
        desa TEXT,
        kecamatan TEXT,
        kabupaten TEXT,
        kode_pos TEXT,
        telepon TEXT,
        email TEXT,
        website TEXT,
        akreditasi TEXT,
        kurikulum TEXT DEFAULT '2013',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating sekolah table:', err);
        else console.log('✓ Table "sekolah" created');
    });

    // Table: siswa
    db.run(`CREATE TABLE IF NOT EXISTS siswa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kode_biasa TEXT NOT NULL,
        kode_pro TEXT,
        namaSekolah TEXT,
        kecamatan TEXT,
        noUrut INTEGER,
        noInduk TEXT,
        noPeserta TEXT,
        nisn TEXT UNIQUE NOT NULL,
        namaPeserta TEXT,
        ttl TEXT,
        namaOrtu TEXT,
        noIjazah TEXT,
        foto TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(kode_biasa) REFERENCES sekolah(kode_biasa) ON DELETE CASCADE ON UPDATE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating siswa table:', err);
        else console.log('✓ Table "siswa" created');
    });

    // Table: nilai
    db.run(`CREATE TABLE IF NOT EXISTS nilai (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nisn TEXT NOT NULL,
        semester TEXT NOT NULL,
        subject TEXT NOT NULL,
        type TEXT NOT NULL,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(nisn, semester, subject, type),
        FOREIGN KEY(nisn) REFERENCES siswa(nisn) ON DELETE CASCADE ON UPDATE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating nilai table:', err);
        else console.log('✓ Table "nilai" created');
    });

    // Table: settings
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kode_biasa TEXT UNIQUE NOT NULL,
        settings_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(kode_biasa) REFERENCES sekolah(kode_biasa) ON DELETE CASCADE ON UPDATE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating settings table:', err);
        else console.log('✓ Table "settings" created');
    });

    // Table: skl_photos
    db.run(`CREATE TABLE IF NOT EXISTS skl_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nisn TEXT UNIQUE NOT NULL,
        photo_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(nisn) REFERENCES siswa(nisn) ON DELETE CASCADE ON UPDATE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating skl_photos table:', err);
        else console.log('✓ Table "skl_photos" created');
    });

    // Table: audit_logs
    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_type TEXT NOT NULL,
        user_identifier TEXT NOT NULL,
        action TEXT NOT NULL,
        target_table TEXT,
        target_id TEXT,
        old_data TEXT,
        new_data TEXT,
        ip_address TEXT,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        session_id TEXT,
        additional_info TEXT
    )`, (err) => {
        if (err) console.error('Error creating audit_logs table:', err);
        else console.log('✓ Table "audit_logs" created');
    });

    // Table: mulok_names
    db.run(`CREATE TABLE IF NOT EXISTS mulok_names (
        kode_biasa TEXT NOT NULL,
        mulok_key TEXT NOT NULL,
        mulok_name TEXT,
        PRIMARY KEY (kode_biasa, mulok_key),
        FOREIGN KEY(kode_biasa) REFERENCES sekolah(kode_biasa) ON DELETE CASCADE ON UPDATE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating mulok_names table:', err);
        else console.log('✓ Table "mulok_names" created');
    });
});

db.close((err) => {
    if (err) console.error('Error closing database:', err);
    else console.log('Initial tables migration completed!');
});
