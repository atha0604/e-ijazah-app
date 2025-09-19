// src/database/optimized-database.js
// Database connection dengan connection pooling dan optimasi

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');

// Connection pool configuration
const poolConfig = {
    max: 10,        // Maximum connections
    min: 2,         // Minimum connections
    idle: 30000,    // 30 seconds idle timeout
    acquire: 60000, // 60 seconds acquire timeout
};

// Simple connection pool implementation
class SQLitePool {
    constructor(config) {
        this.connections = [];
        this.activeConnections = new Set();
        this.max = config.max;
        this.min = config.min;
        this.idleTimeout = config.idle;
        this.acquireTimeout = config.acquire;

        // Initialize minimum connections
        this.initializePool();
    }

    initializePool() {
        for (let i = 0; i < this.min; i++) {
            this.createConnection();
        }
    }

    createConnection() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error('Failed to create database connection:', err.message);
                    reject(err);
                    return;
                }

                // Set optimizations for each connection
                db.serialize(() => {
                    db.run('PRAGMA foreign_keys = ON');
                    db.run('PRAGMA journal_mode = WAL');      // Write-Ahead Logging for better concurrency
                    db.run('PRAGMA synchronous = NORMAL');    // Balance between safety and speed
                    db.run('PRAGMA cache_size = 64000');      // 64MB cache
                    db.run('PRAGMA temp_store = memory');     // Store temp tables in memory
                    db.run('PRAGMA mmap_size = 134217728');   // 128MB memory-mapped I/O
                });

                db.createdAt = Date.now();
                db.lastUsed = Date.now();
                db.inUse = false;

                this.connections.push(db);
                resolve(db);
            });
        });
    }

    async acquire() {
        const startTime = Date.now();

        while (Date.now() - startTime < this.acquireTimeout) {
            // Look for available connection
            const availableConnection = this.connections.find(conn => !conn.inUse);

            if (availableConnection) {
                availableConnection.inUse = true;
                availableConnection.lastUsed = Date.now();
                this.activeConnections.add(availableConnection);
                return availableConnection;
            }

            // Create new connection if under max limit
            if (this.connections.length < this.max) {
                try {
                    const newConnection = await this.createConnection();
                    newConnection.inUse = true;
                    this.activeConnections.add(newConnection);
                    return newConnection;
                } catch (err) {
                    console.error('Failed to create new connection:', err.message);
                }
            }

            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        throw new Error('Connection pool timeout: Could not acquire connection');
    }

    release(connection) {
        if (this.activeConnections.has(connection)) {
            connection.inUse = false;
            connection.lastUsed = Date.now();
            this.activeConnections.delete(connection);
        }
    }

    // Clean up idle connections
    cleanup() {
        const now = Date.now();
        const toClose = this.connections.filter(conn =>
            !conn.inUse &&
            (now - conn.lastUsed) > this.idleTimeout &&
            this.connections.length > this.min
        );

        toClose.forEach(conn => {
            const index = this.connections.indexOf(conn);
            if (index > -1) {
                this.connections.splice(index, 1);
                conn.close();
            }
        });
    }

    async close() {
        const closePromises = this.connections.map(conn => {
            return new Promise((resolve) => {
                conn.close((err) => {
                    if (err) console.error('Error closing connection:', err.message);
                    resolve();
                });
            });
        });

        await Promise.all(closePromises);
        this.connections = [];
        this.activeConnections.clear();
    }
}

// Global pool instance
const pool = new SQLitePool(poolConfig);

// Cleanup idle connections every 5 minutes
setInterval(() => {
    pool.cleanup();
}, 5 * 60 * 1000);

// Enhanced database helpers with pooling
class OptimizedDatabase {
    static async query(sql, params = []) {
        const db = await pool.acquire();
        try {
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) {
                        console.error(`Query error: ${sql}`, err.message);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } finally {
            pool.release(db);
        }
    }

    static async get(sql, params = []) {
        const db = await pool.acquire();
        try {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) {
                        console.error(`Get query error: ${sql}`, err.message);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        } finally {
            pool.release(db);
        }
    }

    static async run(sql, params = []) {
        const db = await pool.acquire();
        try {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function(err) {
                    if (err) {
                        console.error(`Run query error: ${sql}`, err.message);
                        reject(err);
                    } else {
                        resolve({
                            lastID: this.lastID,
                            changes: this.changes
                        });
                    }
                });
            });
        } finally {
            pool.release(db);
        }
    }

    // Transaction with proper connection management
    static async transaction(operations) {
        const db = await pool.acquire();
        try {
            return new Promise(async (resolve, reject) => {
                db.serialize(async () => {
                    try {
                        await new Promise((res, rej) => {
                            db.run('BEGIN TRANSACTION', (err) => {
                                if (err) rej(err);
                                else res();
                            });
                        });

                        const result = await operations(db);

                        await new Promise((res, rej) => {
                            db.run('COMMIT', (err) => {
                                if (err) rej(err);
                                else res();
                            });
                        });

                        resolve(result);
                    } catch (error) {
                        await new Promise((res) => {
                            db.run('ROLLBACK', () => res());
                        });
                        reject(error);
                    }
                });
            });
        } finally {
            pool.release(db);
        }
    }

    // Optimized queries for common operations
    static async getSiswaBySekolah(kodeBiasa, limit = null, offset = 0) {
        let sql = `
            SELECT nisn, kodeBiasa, namaSekolah, kecamatan, noUrut, noInduk,
                   noPeserta, namaPeserta, ttl, namaOrtu, noIjazah, foto
            FROM siswa
            WHERE kodeBiasa = ?
            ORDER BY noUrut ASC
        `;

        const params = [kodeBiasa];

        if (limit) {
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }

        return this.query(sql, params);
    }

    static async getNilaiByNisn(nisn, semester = null) {
        let sql = `
            SELECT nisn, semester, subject, type, value
            FROM nilai
            WHERE nisn = ?
        `;

        const params = [nisn];

        if (semester) {
            sql += ' AND semester = ?';
            params.push(semester);
        }

        sql += ' ORDER BY semester, subject, type';

        return this.query(sql, params);
    }

    static async getSekolahByKecamatan(kecamatan) {
        const sql = `
            SELECT kodeBiasa, kodePro, kecamatan, npsn,
                   namaSekolahLengkap, namaSekolahSingkat
            FROM sekolah
            WHERE kecamatan = ?
            ORDER BY namaSekolahLengkap
        `;

        return this.query(sql, [kecamatan]);
    }

    // Bulk insert with prepared statements
    static async bulkInsertNilai(nilaiData) {
        return this.transaction(async (db) => {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO nilai (nisn, semester, subject, type, value)
                VALUES (?, ?, ?, ?, ?)
            `);

            for (const nilai of nilaiData) {
                await new Promise((resolve, reject) => {
                    stmt.run([nilai.nisn, nilai.semester, nilai.subject, nilai.type, nilai.value], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }

            stmt.finalize();
        });
    }

    // Get pool statistics
    static getPoolStats() {
        return {
            totalConnections: pool.connections.length,
            activeConnections: pool.activeConnections.size,
            availableConnections: pool.connections.filter(c => !c.inUse).length,
            maxConnections: pool.max,
            minConnections: pool.min
        };
    }

    // Close pool gracefully
    static async closePool() {
        await pool.close();
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Closing database pool...');
    await OptimizedDatabase.closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Closing database pool...');
    await OptimizedDatabase.closePool();
    process.exit(0);
});

module.exports = OptimizedDatabase;