// src/database/database.js
// Smart database loader - auto-switch between SQLite and PostgreSQL

// Export database connection from db-config
// This will automatically use:
// - PostgreSQL (Supabase) in production
// - SQLite in development
module.exports = require('./db-config');