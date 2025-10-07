# Logging Migration Guide

## 🎯 Objective

Replace 500+ `console.log` statements with production-safe Winston logger to prevent sensitive data exposure.

---

## ⚠️ Why This Matters

### Security Risks with console.log:
- ❌ Exposes sensitive data in production (NISN, nama, nilai, passwords)
- ❌ No control over what gets logged
- ❌ Logs go to stdout (not saved/rotated)
- ❌ Can't disable in production
- ❌ No sanitization of sensitive fields

### Benefits of Winston Logger:
- ✅ Automatic sensitive data sanitization
- ✅ Log rotation (5MB per file, max 5 files)
- ✅ Environment-based logging (dev vs production)
- ✅ Structured logging with metadata
- ✅ Logs saved to files for debugging
- ✅ Different log levels (info, warn, error, debug)

---

## 🚀 Quick Start

### 1. Import Logger

Replace `console` with `logger`:

```javascript
// ❌ OLD - UNSAFE
console.log('User logged in:', userData);
console.error('Failed to save:', error);

// ✅ NEW - SAFE
const logger = require('./utils/logger');
logger.info('User logged in', { userId: userData.id }); // Auto-sanitizes
logger.error('Failed to save', error);
```

### 2. Available Methods

| Method | Use Case | Example |
|--------|----------|---------|
| `logger.info(msg, meta)` | General information | `logger.info('Server started', { port: 3000 })` |
| `logger.warn(msg, meta)` | Warnings | `logger.warn('Rate limit approaching', { ip })` |
| `logger.error(msg, error)` | Errors | `logger.error('DB connection failed', err)` |
| `logger.debug(msg, meta)` | Debugging (dev only) | `logger.debug('Processing request', { data })` |
| `logger.http(req)` | HTTP requests | `logger.http(req)` |
| `logger.unsafe(msg, data)` | Dev debugging only | `logger.unsafe('Raw data', obj)` |

---

## 📋 Migration Examples

### Example 1: Simple Logs

```javascript
// ❌ OLD
console.log('User logged in');

// ✅ NEW
logger.info('User logged in');
```

### Example 2: Logs with Data

```javascript
// ❌ OLD - EXPOSES SENSITIVE DATA
console.log('Login successful:', {
    nisn: '1234567890',
    nama: 'Budi Santoso',
    nilai: [85, 90, 78]
});

// ✅ NEW - AUTO-SANITIZED
logger.info('Login successful', {
    nisn: '1234567890',  // → Will be [REDACTED]
    nama: 'Budi Santoso', // → Will be [REDACTED]
    nilai: [85, 90, 78]   // → Will be [REDACTED]
});

// Output in logs:
// { nisn: '[REDACTED]', nama: '[REDACTED]', nilai: '[REDACTED]' }
```

### Example 3: Error Logging

```javascript
// ❌ OLD
console.error('Database error:', error);

// ✅ NEW
logger.error('Database error occurred', error);
// Automatically logs error.message and error.stack
```

### Example 4: Conditional Logging

```javascript
// ❌ OLD
if (process.env.NODE_ENV !== 'production') {
    console.log('Debug info:', data);
}

// ✅ NEW - Automatically disabled in production
logger.debug('Debug info', data);
```

### Example 5: HTTP Request Logging

```javascript
// ❌ OLD
console.log(`${req.method} ${req.url}`, req.body);

// ✅ NEW - Safe HTTP logging
logger.http(req); // Logs method, url, ip - NO body/params
```

---

## 🔒 Sensitive Fields (Auto-Redacted)

These fields are automatically sanitized:

### Authentication & Security
- `password`, `token`, `jwt`, `secret`, `apiKey`, `adminKey`

### Personal Identifiers
- `nisn`, `nik`, `npsn`

### Personal Information
- `nama`, `namaPeserta`, `namaLengkap`, `namaSekolah`

### Academic Data
- `nilai`, `score`, `grade`

### Contact Information
- `phone`, `email`, `alamat`, `address`

### Custom Sanitization

If you need to log these fields for debugging:

```javascript
// ❌ DON'T DO THIS IN PRODUCTION
logger.unsafe('Full user data', userData); // Disabled in production

// ✅ DO THIS - Log only non-sensitive parts
logger.info('User updated', {
    userId: user.id, // Safe
    action: 'profile_update', // Safe
    timestamp: new Date() // Safe
    // nama, nisn are NOT logged
});
```

---

## 📂 Where Logs Are Saved

```
logs/
├── combined.log      # All logs (info, warn, error)
├── error.log         # Only errors
├── exceptions.log    # Uncaught exceptions
└── rejections.log    # Unhandled promise rejections
```

### Log Rotation
- Max size: 5MB per file
- Max files: 5 old files kept
- Old logs auto-deleted

---

## 🔧 Migration Checklist

### Step 1: Find All console.log Statements

```bash
# Count console.log statements
grep -r "console\." src/ --include="*.js" | wc -l

# List all files with console statements
grep -r "console\." src/ --include="*.js" -l
```

### Step 2: Replace by File Type

#### Controllers (src/controllers/*.js)
```javascript
// Import logger at top
const logger = require('../utils/logger');

// Replace console.log
exports.someFunction = async (req, res) => {
    // ❌ console.log('Processing request', req.body);
    logger.info('Processing request', { endpoint: req.path });

    try {
        // ... code
        // ❌ console.log('Success:', result);
        logger.info('Operation successful', { resultId: result.id });

    } catch (error) {
        // ❌ console.error('Error:', error);
        logger.error('Operation failed', error);
    }
};
```

#### Routes (src/routes/*.js)
```javascript
const logger = require('../utils/logger');

// ❌ console.log('Route accessed');
logger.debug('Route accessed', { route: '/api/auth/login' });
```

#### Middleware (src/middleware/*.js)
```javascript
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
    // ❌ console.log('Middleware executed');
    logger.debug('Middleware executed', { middleware: 'auth' });
    next();
};
```

---

## ⚙️ Configuration

### Change Log Level

Set in `.env`:

```bash
# Development: See all logs (debug, info, warn, error)
LOG_LEVEL=debug
NODE_ENV=development

# Production: Only important logs (info, warn, error)
LOG_LEVEL=info
NODE_ENV=production
```

### Console Output

- **Development**: Logs appear in console (colored, readable)
- **Production**: Logs only to files (no console output)

---

## 🧪 Testing

### Test in Development

```javascript
const logger = require('./src/utils/logger');

// Test different levels
logger.debug('Debug message', { data: 'test' });
logger.info('Info message', { data: 'test' });
logger.warn('Warning message', { data: 'test' });
logger.error('Error message', new Error('Test error'));

// Test sanitization
logger.info('User data', {
    nisn: '1234567890',  // Should be [REDACTED]
    nama: 'Test User',    // Should be [REDACTED]
    userId: 123           // Should be visible
});
```

### Verify Logs

```bash
# Check combined.log
cat logs/combined.log | tail -20

# Check error.log
cat logs/error.log | tail -10

# Monitor logs in real-time
tail -f logs/combined.log
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Logging Entire Request Body

```javascript
// ❌ DON'T
logger.info('Request received', { body: req.body });

// ✅ DO
logger.info('Request received', {
    endpoint: req.path,
    method: req.method
});
```

### ❌ Mistake 2: Logging Passwords

```javascript
// ❌ DON'T - Even though it will be redacted, don't try
logger.debug('Login attempt', {
    username: req.body.username,
    password: req.body.password // NO!
});

// ✅ DO
logger.info('Login attempt', {
    username: req.body.username
    // Never log password
});
```

### ❌ Mistake 3: Not Using Error Objects

```javascript
// ❌ DON'T
logger.error('Error occurred: ' + error.message);

// ✅ DO - Preserves stack trace
logger.error('Error occurred', error);
```

### ❌ Mistake 4: Excessive Debug Logging

```javascript
// ❌ DON'T - Too much noise
logger.debug('Variable a:', a);
logger.debug('Variable b:', b);
logger.debug('Variable c:', c);

// ✅ DO - Meaningful debug logs
logger.debug('Processing calculation', {
    inputCount: data.length,
    stage: 'validation'
});
```

---

## 📊 Migration Progress Tracking

### Files to Migrate (Priority Order)

1. **HIGH PRIORITY** (Contains sensitive data):
   - ✅ `server.js` - COMPLETED
   - ⏳ `src/controllers/authController.js`
   - ⏳ `src/controllers/dataController.js`
   - ⏳ `src/routes/authRoutes.js`
   - ⏳ `src/routes/dataRoutes.js`

2. **MEDIUM PRIORITY**:
   - ⏳ `public/script.js` (frontend - different approach needed)
   - ⏳ `src/middleware/*.js`
   - ⏳ `src/utils/*.js`

3. **LOW PRIORITY**:
   - ⏳ Migration scripts
   - ⏳ Test files

### Track Progress

```bash
# Before migration
BEFORE_COUNT=$(grep -r "console\." src/ --include="*.js" | wc -l)

# After each file
CURRENT_COUNT=$(grep -r "console\." src/ --include="*.js" | wc -l)
echo "Remaining: $CURRENT_COUNT / $BEFORE_COUNT"
```

---

## 🔄 For Frontend (public/script.js)

Frontend logging requires a different approach:

### Option 1: Keep console.log (with guards)

```javascript
// Development only
if (window.location.hostname === 'localhost') {
    console.log('Debug info');
}
```

### Option 2: Send Logs to Backend

```javascript
// Create frontend logger
const frontendLogger = {
    error: (message, data) => {
        fetch('/api/logs/frontend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level: 'error', message, data })
        });
    }
};
```

---

## ✅ Completion Checklist

- [ ] All backend files migrated from console.log to logger
- [ ] Sensitive data no longer logged in raw form
- [ ] Error logging includes proper error objects
- [ ] Debug logs use logger.debug (auto-disabled in production)
- [ ] Log files rotating properly (check logs/ directory)
- [ ] No console.log in production code
- [ ] Team trained on new logging practices

---

## 📚 Additional Resources

### Child Logger (for modules)

```javascript
// Create logger with context
const logger = require('./utils/logger');
const moduleLogger = logger.child({ module: 'auth' });

// All logs will include { module: 'auth' }
moduleLogger.info('User authenticated');
// Output: { module: 'auth', message: 'User authenticated', ... }
```

### Environment Variables

```bash
# .env
LOG_LEVEL=debug          # debug | info | warn | error
NODE_ENV=development     # development | production
```

---

## 🆘 Troubleshooting

### Issue: Logs not appearing

**Solution**: Check NODE_ENV and LOG_LEVEL

```javascript
// Add at top of file temporarily
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('LOG_LEVEL:', process.env.LOG_LEVEL);
```

### Issue: Sensitive data still visible

**Solution**: Check field name matches SENSITIVE_FIELDS array in logger.js

```javascript
// If your field is not auto-sanitized, add it to logger.js:
const SENSITIVE_FIELDS = [
    // ... existing fields
    'yourCustomField'  // Add here
];
```

### Issue: Logs directory not created

**Solution**: Logger auto-creates it, but check permissions

```bash
# Create manually if needed
mkdir logs
chmod 755 logs
```

---

## 🎯 Success Metrics

After migration:

- ✅ Zero console.log in backend code
- ✅ Zero sensitive data in log files
- ✅ All errors properly logged with stack traces
- ✅ Log files rotating (no files > 5MB)
- ✅ Production logs clean and actionable

---

**Last Updated**: 2025-01-05
**Status**: Migration in progress
**Contact**: Development Team
