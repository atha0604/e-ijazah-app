const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/db.sqlite');

class AuditLogger {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    async log(auditData) {
        return new Promise((resolve, reject) => {
            const {
                userType,
                userIdentifier,
                action,
                targetTable = null,
                targetId = null,
                oldData = null,
                newData = null,
                ipAddress = null,
                userAgent = null,
                sessionId = null,
                additionalInfo = null
            } = auditData;

            const sql = `
                INSERT INTO audit_logs (
                    user_type, user_identifier, action, target_table, target_id,
                    old_data, new_data, ip_address, user_agent, session_id, additional_info
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                userType,
                userIdentifier,
                action,
                targetTable,
                targetId,
                oldData ? JSON.stringify(oldData) : null,
                newData ? JSON.stringify(newData) : null,
                ipAddress,
                userAgent,
                sessionId,
                additionalInfo ? JSON.stringify(additionalInfo) : null
            ];

            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Audit log error:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async getAuditLogs(filters = {}) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT * FROM audit_logs 
                WHERE 1=1
            `;
            let params = [];

            if (filters.userType) {
                sql += ' AND user_type = ?';
                params.push(filters.userType);
            }

            if (filters.userIdentifier) {
                sql += ' AND user_identifier = ?';
                params.push(filters.userIdentifier);
            }

            if (filters.action) {
                sql += ' AND action LIKE ?';
                params.push(`%${filters.action}%`);
            }

            if (filters.targetTable) {
                sql += ' AND target_table = ?';
                params.push(filters.targetTable);
            }

            if (filters.dateFrom) {
                sql += ' AND timestamp >= ?';
                params.push(filters.dateFrom);
            }

            if (filters.dateTo) {
                sql += ' AND timestamp <= ?';
                params.push(filters.dateTo);
            }

            sql += ' ORDER BY timestamp DESC';

            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Parse JSON data back
                    const processedRows = rows.map(row => ({
                        ...row,
                        old_data: row.old_data ? JSON.parse(row.old_data) : null,
                        new_data: row.new_data ? JSON.parse(row.new_data) : null,
                        additional_info: row.additional_info ? JSON.parse(row.additional_info) : null
                    }));
                    resolve(processedRows);
                }
            });
        });
    }

    async getAuditStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    action,
                    user_type,
                    COUNT(*) as count,
                    DATE(timestamp) as date
                FROM audit_logs 
                WHERE timestamp >= date('now', '-30 days')
                GROUP BY action, user_type, DATE(timestamp)
                ORDER BY date DESC, count DESC
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Middleware function untuk Express
    auditMiddleware() {
        return (req, res, next) => {
            // Store original res.json to intercept response
            const originalJson = res.json;
            
            res.json = function(data) {
                // Extract user info from request
                const userType = req.user?.role || req.headers['user-type'] || 'anonymous';
                const userIdentifier = req.user?.kodeBiasa || req.user?.id || req.ip;
                const action = `${req.method} ${req.path}`;
                const ipAddress = req.ip || req.connection.remoteAddress;
                const userAgent = req.headers['user-agent'];
                const sessionId = req.sessionID || req.headers['x-session-id'];

                // Only log successful operations and modifications
                if (res.statusCode < 400 && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                    const auditData = {
                        userType,
                        userIdentifier,
                        action,
                        targetTable: this.extractTableFromPath(req.path),
                        targetId: req.params.id || req.body.id,
                        newData: req.method !== 'DELETE' ? req.body : null,
                        ipAddress,
                        userAgent,
                        sessionId,
                        additionalInfo: {
                            endpoint: req.path,
                            method: req.method,
                            responseStatus: res.statusCode,
                            query: req.query
                        }
                    };

                    // Log asynchronously to not block response
                    setImmediate(() => {
                        const logger = new AuditLogger();
                        logger.log(auditData).catch(console.error);
                    });
                }

                return originalJson.call(this, data);
            }.bind(this);

            next();
        };
    }

    extractTableFromPath(path) {
        // Extract table name from API path
        const pathParts = path.split('/');
        if (pathParts.includes('api')) {
            const apiIndex = pathParts.indexOf('api');
            if (pathParts[apiIndex + 1]) {
                return pathParts[apiIndex + 1];
            }
        }
        return null;
    }

    async logUserAction(userIdentifier, action, details = {}) {
        try {
            const auditData = {
                userType: details.userType || 'unknown',
                userIdentifier,
                action,
                targetTable: details.targetTable || null,
                targetId: details.targetId || null,
                ipAddress: details.ipAddress || null,
                userAgent: details.userAgent || null,
                sessionId: details.sessionId || null,
                additionalInfo: details.details || details.additionalInfo || null
            };

            return await this.log(auditData);
        } catch (error) {
            console.error('Failed to log user action:', error);
            throw error;
        }
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Helper functions for common audit actions
const auditLogger = new AuditLogger();

const logUserAction = async (userType, userIdentifier, action, details = {}) => {
    try {
        await auditLogger.log({
            userType,
            userIdentifier,
            action,
            ...details
        });
    } catch (error) {
        console.error('Failed to log user action:', error);
    }
};

const logDataChange = async (userType, userIdentifier, action, table, id, oldData, newData, additionalInfo = {}) => {
    try {
        await auditLogger.log({
            userType,
            userIdentifier,
            action,
            targetTable: table,
            targetId: id,
            oldData,
            newData,
            additionalInfo
        });
    } catch (error) {
        console.error('Failed to log data change:', error);
    }
};

module.exports = {
    AuditLogger,
    auditLogger,
    logUserAction,
    logDataChange
};