-- =====================================================
-- E-IJAZAH DATABASE SCHEMA FOR SUPABASE (PostgreSQL)
-- =====================================================

-- 1. Table: sekolah
CREATE TABLE IF NOT EXISTS sekolah (
    id SERIAL PRIMARY KEY,
    "kodeBiasa" VARCHAR(50) UNIQUE NOT NULL,
    "kodePro" VARCHAR(50) UNIQUE,
    "namaSekolahSingkat" VARCHAR(255),
    "namaSekolahLengkap" VARCHAR(500),
    kecamatan VARCHAR(100),
    npsn VARCHAR(20),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performance
CREATE INDEX IF NOT EXISTS idx_sekolah_kode_biasa ON sekolah("kodeBiasa");
CREATE INDEX IF NOT EXISTS idx_sekolah_kode_pro ON sekolah("kodePro");
CREATE INDEX IF NOT EXISTS idx_sekolah_kecamatan ON sekolah(kecamatan);
CREATE INDEX IF NOT EXISTS idx_sekolah_npsn ON sekolah(npsn);

-- 2. Table: siswa
CREATE TABLE IF NOT EXISTS siswa (
    id SERIAL PRIMARY KEY,
    "kodeBiasa" VARCHAR(50) NOT NULL,
    nisn VARCHAR(20),
    "noInduk" VARCHAR(50),
    "namaPeserta" VARCHAR(255),
    "tempatLahir" VARCHAR(100),
    "tanggalLahir" DATE,
    "jenisKelamin" VARCHAR(20),
    "namaAyah" VARCHAR(255),
    "namaIbu" VARCHAR(255),
    kecamatan VARCHAR(100),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("kodeBiasa") REFERENCES sekolah("kodeBiasa") ON DELETE CASCADE
);

-- Index untuk performance
CREATE INDEX IF NOT EXISTS idx_siswa_kode_biasa ON siswa("kodeBiasa");
CREATE INDEX IF NOT EXISTS idx_siswa_nisn ON siswa(nisn);
CREATE INDEX IF NOT EXISTS idx_siswa_no_induk ON siswa("noInduk");
CREATE INDEX IF NOT EXISTS idx_siswa_nama ON siswa("namaPeserta");
CREATE INDEX IF NOT EXISTS idx_siswa_kecamatan ON siswa(kecamatan);

-- 3. Table: nilai
CREATE TABLE IF NOT EXISTS nilai (
    id SERIAL PRIMARY KEY,
    nisn VARCHAR(20) NOT NULL,
    semester VARCHAR(10),
    subject VARCHAR(100),
    type VARCHAR(50),
    nilai DECIMAL(5,2),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performance
CREATE INDEX IF NOT EXISTS idx_nilai_nisn ON nilai(nisn);
CREATE INDEX IF NOT EXISTS idx_nilai_semester ON nilai(semester);
CREATE INDEX IF NOT EXISTS idx_nilai_nisn_semester ON nilai(nisn, semester);
CREATE INDEX IF NOT EXISTS idx_nilai_subject ON nilai(subject);

-- 4. Table: users (untuk admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255),
    login_code VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password akan di-hash di aplikasi)
INSERT INTO users (username, login_code, role)
VALUES ('admin', 'admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 5. Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    "userId" VARCHAR(50),
    "userType" VARCHAR(20),
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications("userId", "userType");
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications("isRead");

-- 6. Table: backups (untuk tracking backups)
CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    "backupName" VARCHAR(255) NOT NULL,
    "createdBy" VARCHAR(100),
    "fileSize" BIGINT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table: settings (untuk app settings per sekolah)
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    "kodeBiasa" VARCHAR(50) UNIQUE NOT NULL,
    "settingsData" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("kodeBiasa") REFERENCES sekolah("kodeBiasa") ON DELETE CASCADE
);

-- 8. Table: skl_photos (untuk foto SKL)
CREATE TABLE IF NOT EXISTS skl_photos (
    id SERIAL PRIMARY KEY,
    nisn VARCHAR(20) NOT NULL,
    "photoData" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skl_photos_nisn ON skl_photos(nisn);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update 'updatedAt' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers untuk auto-update 'updatedAt'
CREATE TRIGGER update_sekolah_updated_at BEFORE UPDATE ON sekolah
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_siswa_updated_at BEFORE UPDATE ON siswa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nilai_updated_at BEFORE UPDATE ON nilai
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PERMISSIONS (untuk Supabase RLS - optional)
-- =====================================================

-- Enable Row Level Security (optional, bisa diaktifkan nanti)
-- ALTER TABLE sekolah ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- INITIAL DATA SAMPLE (optional - comment out if not needed)
-- =====================================================

-- Uncomment untuk insert sample data
-- INSERT INTO sekolah ("kodeBiasa", "kodePro", "namaSekolahSingkat", "namaSekolahLengkap", kecamatan, npsn)
-- VALUES
-- ('TEST001', 'TESTPRO001', 'SD Test 1', 'SD Negeri 1 Test', 'Test Kecamatan', '12345678')
-- ON CONFLICT ("kodeBiasa") DO NOTHING;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
