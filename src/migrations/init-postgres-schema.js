// PostgreSQL Schema Initialization for Railway
// Run this migration when DATABASE_URL is detected (PostgreSQL)

const { Pool } = require('pg');

async function initPostgresSchema() {
  // Only run if PostgreSQL is configured
  if (!process.env.DATABASE_URL) {
    console.log('⏭️  Skipping PostgreSQL schema init (DATABASE_URL not set)');
    return;
  }

  console.log('🔧 Initializing PostgreSQL schema for Railway...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : {
      rejectUnauthorized: false
    }
  });

  try {
    // Create sekolah table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sekolah (
        kode_biasa VARCHAR(50) PRIMARY KEY,
        kode_pro VARCHAR(50),
        kecamatan VARCHAR(100),
        npsn VARCHAR(50),
        nama_lengkap VARCHAR(255),
        nama_singkat VARCHAR(100),
        kurikulum VARCHAR(20) DEFAULT 'MERDEKA',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "sekolah" created');

    // Create siswa table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS siswa (
        nisn VARCHAR(20) PRIMARY KEY,
        kode_biasa VARCHAR(50) NOT NULL REFERENCES sekolah(kode_biasa) ON DELETE CASCADE,
        kode_pro VARCHAR(50),
        namaSekolah VARCHAR(255),
        kecamatan VARCHAR(100),
        noUrut INTEGER,
        noInduk VARCHAR(50),
        noPeserta VARCHAR(50),
        namaPeserta VARCHAR(255),
        ttl VARCHAR(255),
        namaOrtu VARCHAR(255),
        noIjazah VARCHAR(50),
        foto TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "siswa" created');

    // Create index on siswa.kode_biasa for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_siswa_kode_biasa ON siswa(kode_biasa)
    `);

    // Create nilai table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nilai (
        id SERIAL PRIMARY KEY,
        nisn VARCHAR(20) NOT NULL REFERENCES siswa(nisn) ON DELETE CASCADE,
        semester VARCHAR(10) NOT NULL,
        subject VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL,
        value VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(nisn, semester, subject, type)
      )
    `);
    console.log('✅ Table "nilai" created');

    // Create index on nilai for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_nilai_nisn ON nilai(nisn)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_nilai_semester ON nilai(semester)
    `);

    // Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        kode_biasa VARCHAR(50) PRIMARY KEY REFERENCES sekolah(kode_biasa) ON DELETE CASCADE,
        settings_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "settings" created');

    // Create mulok_names table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mulok_names (
        kode_biasa VARCHAR(50) NOT NULL REFERENCES sekolah(kode_biasa) ON DELETE CASCADE,
        mulok_key VARCHAR(20) NOT NULL,
        mulok_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (kode_biasa, mulok_key)
      )
    `);
    console.log('✅ Table "mulok_names" created');

    // Create skl_photos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skl_photos (
        nisn VARCHAR(20) PRIMARY KEY REFERENCES siswa(nisn) ON DELETE CASCADE,
        photo_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "skl_photos" created');

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        target_role VARCHAR(20) NOT NULL,
        target_identifier VARCHAR(100),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      )
    `);
    console.log('✅ Table "notifications" created');

    // Create index on notifications
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_role, target_identifier)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
    `);

    // Create users table for admin accounts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        login_code VARCHAR(50) NOT NULL DEFAULT 'admin',
        role VARCHAR(20) NOT NULL DEFAULT 'admin',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "users" created');

    // Create audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_type VARCHAR(20),
        user_identifier VARCHAR(100),
        action VARCHAR(50),
        target_table VARCHAR(50),
        target_id VARCHAR(100),
        old_data TEXT,
        new_data TEXT,
        metadata TEXT,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "audit_logs" created');

    // Create server_backups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS server_backups (
        id SERIAL PRIMARY KEY,
        backup_id VARCHAR(100) UNIQUE NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        data TEXT NOT NULL,
        timestamp VARCHAR(50) NOT NULL,
        size INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "server_backups" created');

    console.log('🎉 PostgreSQL schema initialization completed successfully!');

    await pool.end();
  } catch (error) {
    console.error('❌ PostgreSQL schema initialization failed:', error);
    await pool.end();
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  initPostgresSchema()
    .then(() => {
      console.log('✅ Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = initPostgresSchema;
