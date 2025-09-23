const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/db.sqlite');
const db = new sqlite3.Database(dbPath);

function createAuditLogTable() {
    return new Promise((resolve, reject) => {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS audit_logs (
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
            )
        `;

        db.run(createTableSQL, function(err) {
            if (err) {
                console.error('Error creating audit_logs table:', err);
                reject(err);
            } else {
                console.log('Audit logs table created successfully');
                
                // Create index for better performance
                const createIndexSQL = `
                    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
                    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_type, user_identifier);
                    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
                `;
                
                db.exec(createIndexSQL, (indexErr) => {
                    if (indexErr) {
                        console.error('Error creating audit logs indexes:', indexErr);
                        reject(indexErr);
                    } else {
                        console.log('Audit logs indexes created successfully');
                        resolve();
                    }
                });
            }
        });
    });
}

// Run migration if called directly
if (require.main === module) {
    createAuditLogTable()
        .then(() => {
            console.log('Audit log migration completed successfully');
            db.close();
        })
        .catch((err) => {
            console.error('Audit log migration failed:', err);
            db.close();
            process.exit(1);
        });
}

module.exports = { createAuditLogTable };