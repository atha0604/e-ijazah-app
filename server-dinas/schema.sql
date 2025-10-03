-- Database Schema for Central Dinas Server
-- PostgreSQL

-- Drop tables if exist (for clean install)
DROP TABLE IF EXISTS sync_logs CASCADE;
DROP TABLE IF EXISTS nilai_pusat CASCADE;
DROP TABLE IF EXISTS siswa_pusat CASCADE;
DROP TABLE IF EXISTS sekolah_master CASCADE;

-- Table: sekolah_master
-- Stores information about all schools
CREATE TABLE sekolah_master (
    npsn TEXT PRIMARY KEY,
    kode_biasa TEXT,
    kode_pro TEXT,
    nama_lengkap TEXT NOT NULL,
    alamat TEXT,
    desa TEXT,
    kecamatan TEXT,
    kabupaten TEXT,
    last_sync TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: siswa_pusat
-- Stores aggregated student data from all schools
CREATE TABLE siswa_pusat (
    nisn TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    jk TEXT,
    tempat_lahir TEXT,
    tanggal_lahir TEXT,
    nama_ayah TEXT,
    nama_ibu TEXT,
    nik TEXT,
    no_kk TEXT,
    alamat TEXT,
    npsn TEXT REFERENCES sekolah_master(npsn) ON DELETE CASCADE,
    last_modified TEXT,
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: nilai_pusat
-- Stores aggregated grades from all schools
CREATE TABLE nilai_pusat (
    id SERIAL PRIMARY KEY,
    nisn TEXT REFERENCES siswa_pusat(nisn) ON DELETE CASCADE,
    jenis TEXT, -- 'pengetahuan', 'keterampilan', 'sikap'
    mata_pelajaran TEXT NOT NULL,
    nilai DECIMAL(5,2),
    predikat TEXT,
    last_modified TEXT,
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(nisn, jenis, mata_pelajaran)
);

-- Table: sync_logs
-- Tracks synchronization history from all schools
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    npsn TEXT REFERENCES sekolah_master(npsn),
    synced_records INTEGER DEFAULT 0,
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_siswa_npsn ON siswa_pusat(npsn);
CREATE INDEX idx_siswa_nama ON siswa_pusat(nama);
CREATE INDEX idx_nilai_nisn ON nilai_pusat(nisn);
CREATE INDEX idx_nilai_jenis ON nilai_pusat(jenis);
CREATE INDEX idx_sekolah_kecamatan ON sekolah_master(kecamatan);
CREATE INDEX idx_sekolah_kabupaten ON sekolah_master(kabupaten);
CREATE INDEX idx_sekolah_last_sync ON sekolah_master(last_sync);
CREATE INDEX idx_sync_logs_npsn ON sync_logs(npsn);
CREATE INDEX idx_sync_logs_synced_at ON sync_logs(synced_at);

-- Create views for easier querying
CREATE OR REPLACE VIEW v_sekolah_stats AS
SELECT
    sm.npsn,
    sm.nama_lengkap,
    sm.kecamatan,
    sm.kabupaten,
    sm.last_sync,
    COUNT(DISTINCT sp.nisn) as total_siswa,
    COUNT(np.id) as total_nilai,
    CASE
        WHEN sm.last_sync > NOW() - INTERVAL '7 days' THEN 'up-to-date'
        WHEN sm.last_sync > NOW() - INTERVAL '30 days' THEN 'outdated'
        ELSE 'critical'
    END as status
FROM sekolah_master sm
LEFT JOIN siswa_pusat sp ON sm.npsn = sp.npsn
LEFT JOIN nilai_pusat np ON sp.nisn = np.nisn
GROUP BY sm.npsn, sm.nama_lengkap, sm.kecamatan, sm.kabupaten, sm.last_sync;

-- Insert sample data (optional, for testing)
-- INSERT INTO sekolah_master (npsn, kode_biasa, kode_pro, nama_lengkap, kecamatan, kabupaten)
-- VALUES ('12345678', 'S001', 'PRO001', 'SD NEGERI 1 SAMPLE', 'Kecamatan Sample', 'Kabupaten Sample');

-- Grant permissions (adjust based on your PostgreSQL user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_database_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_database_user;

COMMENT ON TABLE sekolah_master IS 'Master data sekolah dari seluruh wilayah';
COMMENT ON TABLE siswa_pusat IS 'Data siswa teragregasi dari semua sekolah';
COMMENT ON TABLE nilai_pusat IS 'Data nilai siswa teragregasi dari semua sekolah';
COMMENT ON TABLE sync_logs IS 'Log riwayat sinkronisasi dari setiap sekolah';
