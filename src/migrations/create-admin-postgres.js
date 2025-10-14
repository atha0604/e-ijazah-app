// PostgreSQL Migration: Create default admin account
// Run this after PostgreSQL schema initialization

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  // Only run if PostgreSQL is configured
  if (!process.env.DATABASE_URL) {
    console.log('⏭️  Skipping admin creation (DATABASE_URL not set)');
    return;
  }

  console.log('🔐 Creating default admin account for PostgreSQL...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : {
      rejectUnauthorized: false
    }
  });

  try {
    // Check if admin user already exists
    const checkAdmin = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      ['admin']
    );

    if (checkAdmin.rows.length > 0) {
      console.log('✅ Admin user already exists');
      await pool.end();
      return;
    }

    // Create admin user with default credentials
    const defaultUsername = 'admin';
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await pool.query(
      `INSERT INTO users (username, password, login_code, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [defaultUsername, hashedPassword, 'admin', 'admin']
    );

    console.log('✅ Created admin user with default credentials');
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  DEFAULT ADMIN CREDENTIALS                 ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log('║  Username: admin                           ║');
    console.log('║  Password: admin123                        ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log('║  ⚠️  CHANGE THESE IMMEDIATELY!             ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');

    await pool.end();
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    await pool.end();
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('✅ Admin creation complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin creation failed:', error);
      process.exit(1);
    });
}

module.exports = createAdminUser;
