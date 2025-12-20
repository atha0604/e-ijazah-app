// src/database/supabase-db.js
// PostgreSQL connection for Supabase (Production)

const { Pool } = require('pg');

// Connection string dari Supabase
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString && process.env.NODE_ENV === 'production') {
    console.error('❌ DATABASE_URL not set in production!');
    process.exit(1);
}

// Create connection pool
const pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    max: 20, // Maximum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

// Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
function convertPlaceholders(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
}

// Wrapper functions untuk compatibility dengan SQLite code
const db = {
    // Execute query with callback (SQLite style)
    all: (sql, params, callback) => {
        const pgSql = convertPlaceholders(sql);
        pool.query(pgSql, params)
            .then(result => callback(null, result.rows))
            .catch(err => callback(err));
    },

    get: (sql, params, callback) => {
        const pgSql = convertPlaceholders(sql);
        pool.query(pgSql, params)
            .then(result => callback(null, result.rows[0]))
            .catch(err => callback(err));
    },

    run: (sql, params, callback) => {
        const pgSql = convertPlaceholders(sql);
        pool.query(pgSql, params)
            .then(result => {
                if (callback) callback(null, { changes: result.rowCount, lastID: result.rows[0]?.id });
            })
            .catch(err => {
                if (callback) callback(err);
            });
    },

    exec: (sql, callback) => {
        pool.query(sql)
            .then(() => {
                if (callback) callback(null);
            })
            .catch(err => {
                if (callback) callback(err);
            });
    },

    // Promise-based methods
    query: (sql, params) => {
        const pgSql = convertPlaceholders(sql);
        return pool.query(pgSql, params);
    },

    // Close connection (not needed for pool, but for compatibility)
    close: (callback) => {
        if (callback) callback(null);
    },

    // Get raw pool for advanced usage
    pool: pool
};

module.exports = db;
