// PostgreSQL Database Adapter for Railway deployment
// This file provides PostgreSQL support while keeping SQLite for local development

const { Pool } = require('pg');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Determine which database to use based on environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;
const usePostgres = process.env.DATABASE_URL && isProduction;

console.log('🔧 Database Configuration:', {
  isProduction,
  usePostgres,
  hasPostgresUrl: !!process.env.DATABASE_URL
});

// PostgreSQL Pool (for Railway/Production)
let pgPool = null;
if (usePostgres) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pgPool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
  });

  console.log('✅ PostgreSQL pool initialized for production');
}

// SQLite Connection (for local development)
const dbPath = path.join(__dirname, 'db.sqlite');

function getSqliteConnection() {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('SQLite connection error:', err.message);
  });
}

// Unified Database Interface
class DatabaseAdapter {
  constructor() {
    this.type = usePostgres ? 'postgres' : 'sqlite';
    console.log(`📦 Using ${this.type.toUpperCase()} database`);
  }

  // Get connection (unified interface)
  getConnection() {
    if (usePostgres) {
      return {
        pool: pgPool,
        type: 'postgres'
      };
    } else {
      return {
        db: getSqliteConnection(),
        type: 'sqlite'
      };
    }
  }

  // Query ALL rows (unified interface)
  async queryAll(sql, params = []) {
    if (usePostgres) {
      // PostgreSQL: Convert SQLite-style placeholders (?) to PostgreSQL ($1, $2, etc.)
      let pgSql = sql;
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

      // Handle SQLite-specific syntax
      pgSql = pgSql.replace(/INSERT OR REPLACE/gi, 'INSERT ... ON CONFLICT ... DO UPDATE');
      pgSql = pgSql.replace(/AUTOINCREMENT/gi, 'SERIAL');

      try {
        const result = await pgPool.query(pgSql, params);
        return result.rows;
      } catch (error) {
        console.error('PostgreSQL queryAll error:', error);
        throw error;
      }
    } else {
      // SQLite
      const db = getSqliteConnection();
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
          db.close();
        });
      });
    }
  }

  // Run query (INSERT, UPDATE, DELETE) - unified interface
  async run(sql, params = []) {
    if (usePostgres) {
      // PostgreSQL
      let pgSql = sql;
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

      // Convert INSERT OR REPLACE to INSERT ... ON CONFLICT
      if (pgSql.match(/INSERT OR REPLACE INTO (\w+)/i)) {
        // This requires knowledge of the table's primary key
        // For now, we'll handle this case-by-case in the controller
        console.warn('INSERT OR REPLACE detected, may need manual conversion');
      }

      try {
        const result = await pgPool.query(pgSql, params);
        return {
          changes: result.rowCount || 0,
          lastID: result.rows?.[0]?.id || null
        };
      } catch (error) {
        console.error('PostgreSQL run error:', error);
        throw error;
      }
    } else {
      // SQLite
      const db = getSqliteConnection();
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes, lastID: this.lastID });
          db.close();
        });
      });
    }
  }

  // Transaction support
  async withTransaction(operation) {
    if (usePostgres) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        const result = await operation({
          query: async (sql, params) => {
            let pgSql = sql;
            let paramIndex = 1;
            pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
            return await client.query(pgSql, params);
          },
          type: 'postgres'
        });
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // SQLite transaction
      const db = getSqliteConnection();
      try {
        await new Promise((resolve, reject) => {
          db.run('BEGIN TRANSACTION', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        const result = await operation({
          query: (sql, params) => new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
              if (err) reject(err);
              else resolve({ rows });
            });
          }),
          run: (sql, params) => new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
              if (err) reject(err);
              else resolve({ changes: this.changes, lastID: this.lastID });
            });
          }),
          type: 'sqlite'
        });

        await new Promise((resolve, reject) => {
          db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        db.close();
        return result;
      } catch (error) {
        await new Promise((resolve) => {
          db.run('ROLLBACK', () => resolve());
        });
        db.close();
        throw error;
      }
    }
  }

  // Close connection
  async close() {
    if (usePostgres && pgPool) {
      await pgPool.end();
      console.log('PostgreSQL pool closed');
    }
    // SQLite connections are closed after each query
  }
}

// Export singleton instance
const dbAdapter = new DatabaseAdapter();

module.exports = {
  dbAdapter,
  usePostgres,
  isProduction
};
