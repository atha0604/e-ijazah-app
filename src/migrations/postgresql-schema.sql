-- PostgreSQL Schema Migration for E-Ijazah Application
-- Run this file on your PostgreSQL database to create all required tables

-- Enable UUID extension (optional, but useful)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Tabel Users (Admin & Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    login_code VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user (password akan diset via aplikasi)
INSERT INTO users (username, login_code, role)
VALUES ('admin', 'admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 2. Tabel Sekolah
-- ============================================
CREATE TABLE IF NOT EXISTS sekolah (
    kodeBiasa VARCHAR(255) PRIMARY KEY,
    kodePro VARCHAR(255),
    kecamatan TEXT,
    npsn VARCHAR(50),
    namaSekolahLengkap TEXT,
    namaSekolahSingkat TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk pencarian
CREATE INDEX IF NOT EXISTS idx_sekolah_kecamatan ON sekolah(kecamatan);
CREATE INDEX IF NOT EXISTS idx_sekolah_npsn ON sekolah(npsn);

-- ============================================
-- 3. Tabel Siswa
-- ============================================
CREATE TABLE IF NOT EXISTS siswa (
    nisn VARCHAR(50) PRIMARY KEY,
    kodeBiasa VARCHAR(255),
    kodePro VARCHAR(255),
    namaSekolah TEXT,
    kecamatan TEXT,
    noUrut INTEGER,
    noInduk VARCHAR(50),
    noPeserta VARCHAR(50),
    namaPeserta TEXT,
    ttl TEXT,
    namaOrtu TEXT,
    noIjazah VARCHAR(100),
    foto TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(kodeBiasa) REFERENCES sekolah(kodeBiasa) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index untuk pencarian
CREATE INDEX IF NOT EXISTS idx_siswa_kodeBiasa ON siswa(kodeBiasa);
CREATE INDEX IF NOT EXISTS idx_siswa_namaPeserta ON siswa(namaPeserta);
CREATE INDEX IF NOT EXISTS idx_siswa_noIjazah ON siswa(noIjazah);

-- ============================================
-- 4. Tabel Nilai
-- ============================================
CREATE TABLE IF NOT EXISTS nilai (
    id SERIAL PRIMARY KEY,
    nisn VARCHAR(50) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nisn, semester, subject, type),
    FOREIGN KEY(nisn) REFERENCES siswa(nisn) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_nilai_nisn ON nilai(nisn);
CREATE INDEX IF NOT EXISTS idx_nilai_semester ON nilai(semester);

-- ============================================
-- 5. Tabel Settings
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    kodeBiasa VARCHAR(255) PRIMARY KEY,
    settings_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(kodeBiasa) REFERENCES sekolah(kodeBiasa) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- 6. Tabel Foto SKL
-- ============================================
CREATE TABLE IF NOT EXISTS skl_photos (
    nisn VARCHAR(50) PRIMARY KEY,
    photo_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(nisn) REFERENCES siswa(nisn) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- 7. Tabel Nama Mulok
-- ============================================
CREATE TABLE IF NOT EXISTS mulok_names (
    kodeBiasa VARCHAR(255) NOT NULL,
    mulok_key VARCHAR(100) NOT NULL,
    mulok_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (kodeBiasa, mulok_key),
    FOREIGN KEY(kodeBiasa) REFERENCES sekolah(kodeBiasa) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- 8. Tabel Notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'broadcast', 'alert', 'reminder'
    sender_id VARCHAR(255) NOT NULL, -- 'system' atau ID admin
    recipient_scope VARCHAR(50) NOT NULL, -- 'all_schools', 'kecamatan', 'school', 'admin'
    recipient_id TEXT, -- ID spesifik untuk scope (nama kecamatan atau kodeBiasa sekolah)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_scope, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 9. Tabel Notification Reads
-- ============================================
CREATE TABLE IF NOT EXISTS notification_reads (
    id SERIAL PRIMARY KEY,
    notification_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL, -- kodeBiasa sekolah atau 'admin'
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    UNIQUE(notification_id, user_id)
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);

-- ============================================
-- 10. Tabel Audit Logs
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL,
    user_identifier VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(100),
    target_id VARCHAR(255),
    old_data TEXT,
    new_data TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    additional_info TEXT
);

-- Index untuk performa dan search
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_type, user_identifier);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_table, target_id);

-- ============================================
-- Trigger untuk auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_sekolah_updated_at BEFORE UPDATE ON sekolah FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_siswa_updated_at BEFORE UPDATE ON siswa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nilai_updated_at BEFORE UPDATE ON nilai FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skl_photos_updated_at BEFORE UPDATE ON skl_photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mulok_names_updated_at BEFORE UPDATE ON mulok_names FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Schema created successfully
-- ============================================
