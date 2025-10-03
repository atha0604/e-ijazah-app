# 🔒 Security Configuration Guide

## Aplikasi Nilai E-Ijazah - Security Best Practices

Dokumen ini menjelaskan konfigurasi keamanan yang telah diterapkan dan langkah-langkah untuk setup production yang aman.

---

## ⚠️ CRITICAL SECURITY FIXES (2025-09-30)

### 1. JWT Secret Security ✅
- **FIXED**: JWT_SECRET tidak lagi hardcoded
- **FIXED**: Server akan otomatis exit jika JWT_SECRET tidak di-set
- **REQUIREMENT**: JWT_SECRET WAJIB di-set di environment variables

### 2. CORS Configuration ✅
- **FIXED**: CORS tidak lagi allow all origins (`origin: "*"`)
- **FIXED**: Whitelist-based CORS dengan konfigurasi via environment
- **REQUIREMENT**: Set allowed origins di CORS_ORIGINS environment variable

### 3. Sensitive Files Protection ✅
- **FIXED**: `.env` dan `*.sqlite` sekarang di-ignore oleh git
- **FIXED**: Database dan credentials tidak akan ter-commit lagi
- **REQUIREMENT**: NEVER commit `.env` atau database files

---

## 🚀 Quick Start Setup

### Step 1: Generate JWT Secret

```bash
node generate-jwt-secret.js
```

Script ini akan:
- Generate secure random 128-character JWT secret
- Membuat file `.env` dari template `.env.example`
- Backup `.env` lama jika sudah ada (gunakan flag `--force`)

### Step 2: Konfigurasi Environment Variables

Edit file `.env` yang telah di-generate:

```bash
# JWT Secret (sudah di-generate otomatis)
JWT_SECRET=<your_generated_secret_here>

# Port (optional)
PORT=3000

# CORS Allowed Origins (PENTING untuk production!)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Node Environment
NODE_ENV=production
```

### Step 3: Verify Security

Server akan otomatis melakukan validasi saat startup:
- ✓ JWT_SECRET harus di-set dan tidak boleh default value
- ✓ CORS akan hanya allow origins yang di whitelist
- ✓ Database tidak akan ter-commit ke git

---

## 🔐 Security Features

### JWT Authentication
- Token expiry: 24 jam (1 day)
- Secret key: Minimum 128 characters (64 bytes hex)
- Secure signing algorithm: HS256
- Automatic validation middleware

### CORS Protection
```javascript
// Default allowed origins (development)
- http://localhost:3000
- http://localhost:3001

// Production: Configure via CORS_ORIGINS environment variable
CORS_ORIGINS=https://example.com,https://api.example.com
```

**CORS Features:**
- Whitelist-based origin checking
- Credentials support enabled
- Custom headers: Authorization, Content-Type
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Development mode bypass (NODE_ENV=development)

### Database Security
- SQLite database dengan foreign key constraints
- Transaction support untuk data integrity
- Parameterized queries (SQL injection prevention)
- Database file ignored dari version control

---

## 📋 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **YES** | None | JWT signing secret (min 64 chars) |
| `PORT` | No | 3000 | Server port |
| `CORS_ORIGINS` | **Production YES** | localhost:3000,3001 | Comma-separated allowed origins |
| `NODE_ENV` | No | production | Environment: development/production/test |
| `DB_PATH` | No | src/database/db.sqlite | Database file path |

---

## 🛡️ Security Checklist

### Before Deployment

- [ ] Generate secure JWT_SECRET menggunakan `generate-jwt-secret.js`
- [ ] Configure CORS_ORIGINS dengan domain production Anda
- [ ] Set NODE_ENV=production
- [ ] Verify `.env` tidak ter-commit ke git
- [ ] Verify `*.sqlite` tidak ter-commit ke git
- [ ] Test CORS dengan domain production
- [ ] Test JWT authentication dengan token expiry

### During Development

- [ ] Gunakan `.env.example` sebagai template
- [ ] NEVER commit `.env` atau database files
- [ ] Use different JWT_SECRET untuk dev dan production
- [ ] Test dengan NODE_ENV=development untuk CORS bypass

### Production Maintenance

- [ ] Rotate JWT_SECRET setiap 3-6 bulan
- [ ] Monitor CORS blocked requests
- [ ] Backup database secara berkala
- [ ] Update dependencies untuk security patches
- [ ] Review logs untuk suspicious activities

---

## 🚨 What To Do If JWT Secret Is Compromised

1. **Generate New Secret Immediately**
   ```bash
   node generate-jwt-secret.js --force
   ```

2. **Restart Server**
   - All existing tokens will become invalid
   - Users will need to re-login

3. **Investigate Breach**
   - Check git history
   - Review server logs
   - Audit user activities

4. **Notify Users**
   - Force password reset if needed
   - Inform about security incident

---

## 📞 Security Contact

Jika menemukan security vulnerability, harap laporkan ke:
- Developer: [Your Contact]
- Email: [Your Security Email]

**JANGAN** publicly disclose security issues sebelum di-fix.

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)

---

**Last Updated**: 2025-09-30
**Security Version**: 1.0.0