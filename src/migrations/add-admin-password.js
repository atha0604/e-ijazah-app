// Migration: Add password field to users table for admin authentication
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

async function run(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.run(query, params, function(err) {
            db.close();
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function get(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.get(query, params, (err, row) => {
            db.close();
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function migrate() {
    console.log('🔐 Starting migration: Add admin password field...');

    try {
        // Check if password column already exists
        const tableInfo = await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath);
            db.all("PRAGMA table_info(users)", [], (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const hasPasswordColumn = tableInfo.some(col => col.name === 'password');

        if (!hasPasswordColumn) {
            // Add password column if it doesn't exist
            await run('ALTER TABLE users ADD COLUMN password TEXT');
            console.log('✅ Added password column to users table');
        } else {
            console.log('✅ Password column already exists in users table');
        }

        // Check if admin user exists (always check and create if needed)
        const adminUser = await get("SELECT * FROM users WHERE username = 'admin'");

        if (adminUser) {
            // Set default password for existing admin
            const defaultPassword = 'admin123'; // This should be changed immediately
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            await run(
                'UPDATE users SET password = ? WHERE username = ?',
                [hashedPassword, 'admin']
            );

            console.log('✅ Set default password for admin user');
            console.log('⚠️  WARNING: Default password is "admin123" - CHANGE THIS IMMEDIATELY!');
        } else {
            // Create new admin user with default password
            const defaultPassword = 'admin123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            await run(
                'INSERT INTO users (username, login_code, password) VALUES (?, ?, ?)',
                ['admin', 'admin', hashedPassword]
            );

            console.log('✅ Created admin user with default credentials');
            console.log('⚠️  WARNING: Default credentials - username: admin, password: admin123');
            console.log('⚠️  CHANGE THESE IMMEDIATELY!');
        }

        console.log('✅ Migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    migrate()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}

module.exports = migrate;
