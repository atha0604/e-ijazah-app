# 🗄️ Database Guide

## Aplikasi Nilai E-Ijazah - Database Documentation

SQLite database dengan migrations dan optimization.

---

## 🚀 Quick Start

### Initial Setup
```bash
# 1. Create database and tables
node src/setup.js

# 2. Run migrations (indexes, optimizations)
node run-migrations.js

# 3. Verify setup
node analyze-db.js
```

---

## 📊 Database Structure

### Tables

#### 1. sekolah
```sql
CREATE TABLE sekolah (
  kodeBiasa TEXT PRIMARY KEY,
  kodePro TEXT,
  kecamatan TEXT,
  npsn TEXT UNIQUE,
  namaSekolahLengkap TEXT,
  namaSekolahSingkat TEXT
);
```

**Indexes**:
- `idx_sekolah_kecamatan` - Filter by kecamatan
- `idx_sekolah_npsn` - Lookup by NPSN
- `idx_sekolah_nama` - Search by name

#### 2. siswa
```sql
CREATE TABLE siswa (
  nisn TEXT PRIMARY KEY,
  kodeBiasa TEXT,
  kodePro TEXT,
  namaSekolah TEXT,
  kecamatan TEXT,
  noUrut INTEGER,
  noInduk TEXT,
  noPeserta TEXT,
  namaPeserta TEXT,
  ttl TEXT,
  namaOrtu TEXT,
  noIjazah TEXT,
  foto TEXT,
  FOREIGN KEY (kodeBiasa) REFERENCES sekolah(kodeBiasa)
);
```

**Indexes**:
- `idx_siswa_kode_biasa` - Filter by school
- `idx_siswa_kecamatan` - Filter by kecamatan
- `idx_siswa_nama` - Search by name
- `idx_siswa_no_induk` - Search by student number
- `idx_siswa_sekolah_kecamatan` - Composite index

#### 3. nilai
```sql
CREATE TABLE nilai (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nisn TEXT,
  semester TEXT,
  subject TEXT,
  type TEXT,
  value TEXT,
  FOREIGN KEY (nisn) REFERENCES siswa(nisn)
);
```

**Indexes**:
- `idx_nilai_nisn_semester` - Student grades by semester
- `idx_nilai_semester_subject` - Reports by semester/subject
- `idx_nilai_type` - Filter by type (UTS/UAS)
- `idx_nilai_complete` - Composite index

#### 4. settings
```sql
CREATE TABLE settings (
  kodeBiasa TEXT PRIMARY KEY,
  settings_json TEXT,
  FOREIGN KEY (kodeBiasa) REFERENCES sekolah(kodeBiasa)
);
```

#### 5. skl_photos
```sql
CREATE TABLE skl_photos (
  nisn TEXT PRIMARY KEY,
  photo_data TEXT,
  FOREIGN KEY (nisn) REFERENCES siswa(nisn)
);
```

#### 6. mulok_names
```sql
CREATE TABLE mulok_names (
  kodeBiasa TEXT,
  mulok_key TEXT,
  mulok_name TEXT,
  PRIMARY KEY (kodeBiasa, mulok_key),
  FOREIGN KEY (kodeBiasa) REFERENCES sekolah(kodeBiasa)
);
```

#### 7. users (admin)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  login_code TEXT
);
```

#### 8. notifications
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  target_audience TEXT,
  title TEXT,
  message TEXT,
  priority TEXT,
  created_at DATETIME,
  created_by TEXT,
  expires_at DATETIME
);
```

#### 9. notification_reads
```sql
CREATE TABLE notification_reads (
  notification_id INTEGER,
  user_type TEXT,
  user_identifier TEXT,
  read_at DATETIME,
  PRIMARY KEY (notification_id, user_type, user_identifier),
  FOREIGN KEY (notification_id) REFERENCES notifications(id)
);
```

#### 10. audit_logs (optional)
```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME,
  user_type TEXT,
  user_identifier TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  changes TEXT,
  ip_address TEXT
);
```

**Indexes**:
- `idx_audit_logs_timestamp` - Query by time
- `idx_audit_logs_user` - Query by user
- `idx_audit_logs_action` - Query by action

---

## 🔄 Migrations

### Available Migrations

1. **optimize-database.js** - Add performance indexes
2. **create-audit-log.js** - Create audit logging table
3. **add-notifications-table.js** - Create notifications system

### Running Migrations

```bash
# Run all migrations
node run-migrations.js

# Run specific migration
node src/migrations/optimize-database.js
```

### Migration Runner Features

- ✅ Idempotent (safe to run multiple times)
- ✅ Ordered execution
- ✅ Error handling continues with other migrations
- ✅ Detailed logging

---

## ⚡ Performance Optimizations

### Indexes Added (11 total)

**Siswa Table** (4 indexes):
- kodeBiasa - Most frequent filter
- kecamatan - Region filtering
- namaPeserta - Name search
- noInduk - Student ID lookup

**Nilai Table** (4 indexes):
- (nisn, semester) - Student grades
- (semester, subject) - Reports
- type - Grade type filtering
- (nisn, semester, subject, type) - Complete composite

**Sekolah Table** (3 indexes):
- kecamatan - Region filtering
- npsn - NPSN lookup
- namaSekolahLengkap - Name search

### Expected Performance Gains

| Query Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| Filter by school | 100ms | 5ms | 95% faster |
| Search student name | 200ms | 10ms | 95% faster |
| Grade lookup | 150ms | 8ms | 95% faster |
| Region reports | 300ms | 15ms | 95% faster |

---

## 🔍 Database Queries

### Common Query Patterns

#### 1. Get All Students for a School
```javascript
const students = await queryAll(
  db,
  'SELECT * FROM siswa WHERE kodeBiasa = ?',
  [schoolCode]
);
```
**Uses index**: `idx_siswa_kode_biasa`

#### 2. Get Grades for Student
```javascript
const grades = await queryAll(
  db,
  'SELECT * FROM nilai WHERE nisn = ? AND semester = ?',
  [nisn, semester]
);
```
**Uses index**: `idx_nilai_nisn_semester`

#### 3. Search Students
```javascript
const results = await queryAll(
  db,
  'SELECT * FROM siswa WHERE namaPeserta LIKE ?',
  [`%${searchTerm}%`]
);
```
**Uses index**: `idx_siswa_nama`

#### 4. Region Reports
```javascript
const schools = await queryAll(
  db,
  'SELECT * FROM sekolah WHERE kecamatan = ?',
  [kecamatan]
);
```
**Uses index**: `idx_sekolah_kecamatan`

---

## 🛠️ Database Tools

### 1. Setup Database
```bash
node src/setup.js
```

Creates all tables with foreign keys.

### 2. Run Migrations
```bash
node run-migrations.js
```

Applies all performance optimizations.

### 3. Analyze Database
```bash
node analyze-db.js
```

Shows:
- Table statistics
- Index usage
- Query performance

### 4. Backup Database
```bash
# Manual backup
cp src/database/db.sqlite src/database/db.sqlite.backup

# Or use built-in backup API
# POST /api/data/backup/save
```

---

## 🔒 Security

### SQL Injection Prevention

✅ **ALWAYS use parameterized queries**:

```javascript
// ✅ GOOD - Parameterized
db.run('SELECT * FROM users WHERE username = ?', [username]);

// ❌ BAD - Vulnerable to SQL injection
db.run(`SELECT * FROM users WHERE username = '${username}'`);
```

### Foreign Keys

✅ **Enabled by default**:

```javascript
db.run('PRAGMA foreign_keys = ON');
```

Ensures referential integrity.

---

## 📈 Monitoring

### Check Index Usage

```sql
-- Show all indexes
SELECT * FROM sqlite_master WHERE type = 'index';

-- Analyze query plan
EXPLAIN QUERY PLAN
SELECT * FROM siswa WHERE kodeBiasa = 'ABC';
```

### Update Statistics

```bash
# After major data changes
sqlite3 src/database/db.sqlite "ANALYZE;"
```

---

## 🚨 Troubleshooting

### Database Locked Error

**Cause**: Multiple connections trying to write

**Solution**:
```javascript
// Use serialize for sequential operations
db.serialize(() => {
  db.run('BEGIN TRANSACTION');
  // ... operations
  db.run('COMMIT');
});
```

### Slow Queries

**Diagnosis**:
```sql
EXPLAIN QUERY PLAN <your-query>;
```

**Solutions**:
1. Add missing indexes
2. Run ANALYZE
3. Optimize query structure

### Corrupted Database

**Recovery**:
```bash
# Check integrity
sqlite3 src/database/db.sqlite "PRAGMA integrity_check;"

# If corrupted, restore from backup
cp src/database/db.sqlite.backup src/database/db.sqlite
```

---

## 📝 Maintenance Tasks

### Regular Tasks

**Weekly**:
- Backup database
- Check database size

**Monthly**:
- Run ANALYZE
- Vacuum database
- Review slow query log

**Quarterly**:
- Review indexes
- Optimize schema if needed
- Test backup restore

---

## 🔄 Schema Migrations (Future)

### Creating a Migration

1. **Create migration file**:
```javascript
// src/migrations/add-new-feature.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function migrate() {
  // Your migration code
}

module.exports = migrate;
```

2. **Add to migration runner**:
```javascript
// run-migrations.js
const migrationOrder = [
  'optimize-database.js',
  'create-audit-log.js',
  'add-notifications-table.js',
  'add-new-feature.js', // Add here
];
```

3. **Test migration**:
```bash
node run-migrations.js
```

---

## 📚 Resources

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQLite Performance Guide](https://www.sqlite.org/speed.html)
- [SQL Index Guide](https://use-the-index-luke.com/)

---

**Last Updated**: 2025-09-30
**Database Version**: 1.0
**Total Tables**: 10
**Total Indexes**: 11+