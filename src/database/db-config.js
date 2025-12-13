// src/database/db-config.js
// Smart database connection - auto-switch between SQLite (dev) and PostgreSQL (production)

const path = require('path');

/**
 * Get database connection based on environment
 * - Production (Vercel/Supabase): PostgreSQL
 * - Development (Local): SQLite
 */
function getDatabaseConnection() {
    const isProduction = process.env.NODE_ENV === 'production';
    const hasSupabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

    if (isProduction || hasSupabaseUrl) {
        // Use PostgreSQL for production
        console.log('🐘 Using PostgreSQL (Supabase) database');
        return require('./supabase-db');
    } else {
        // Use SQLite for development
        console.log('💾 Using SQLite database (development mode)');
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = path.join(__dirname, 'db.sqlite');

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error connecting to SQLite:', err.message);
            } else {
                console.log('✅ Connected to SQLite database');
            }
        });

        return db;
    }
}

module.exports = getDatabaseConnection();
