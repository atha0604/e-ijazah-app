# 🧪 Testing Guide

## Aplikasi Nilai E-Ijazah - Testing Documentation

Testing framework menggunakan **Jest** dan **Supertest**.

---

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Watch Mode (auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

---

## 📊 Current Test Status

**Test Results** (as of 2025-09-30):
```
Test Suites: 3 passed, 3 total
Tests:       19 passed, 19 total
Time:        ~1.8s
```

**Test Coverage**:
- Security tests: ✅ 7 tests
- Health check tests: ✅ 5 tests
- Auth tests: ✅ 7 tests (placeholders)

---

## 📁 Test Structure

```
tests/
├── setup.js                    # Jest setup & configuration
└── __tests__/
    └── api/
        ├── auth.test.js        # Authentication tests
        ├── security.test.js    # Security configuration tests
        └── healthcheck.test.js # Basic health check tests
```

---

## 🔧 Configuration

### jest.config.js

```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,

  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.js',
    'server.js',
    '!src/migrations/**',
    '!**/node_modules/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 40,
      lines: 50
    }
  }
}
```

### tests/setup.js

Environment setup:
- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret...`
- `PORT=3999`

---

## ✅ Existing Tests

### 1. Security Tests (`security.test.js`)

```javascript
✓ JWT_SECRET should be configured
✓ JWT_SECRET should not be default value
✓ JWT_SECRET should be reasonably long
✓ NODE_ENV should be set
✓ Should be in test mode
✓ CORS should not use wildcard
✓ SQL injection prevention placeholder
```

**Purpose**: Verify security configuration

### 2. Health Check Tests (`healthcheck.test.js`)

```javascript
✓ API root endpoint placeholder
✓ 404 handling placeholder
✓ PORT should be configured
✓ Should use different port for testing
✓ Database path should exist
```

**Purpose**: Basic system health checks

### 3. Auth Tests (`auth.test.js`)

```javascript
✓ Should reject login without credentials
✓ Should reject invalid credentials
✓ Should accept valid admin login
✓ Should return JWT token
✓ Should reject requests without token
✓ Should reject invalid token
✓ Should accept valid token
```

**Purpose**: Authentication flow testing

**Note**: Currently placeholder tests - need actual app integration

---

## 📝 Writing New Tests

### Example: Testing an API endpoint

```javascript
const request = require('supertest');
const app = require('../server'); // Your Express app

describe('Data API', () => {
  test('GET /api/data/sekolah should return schools', async () => {
    // 1. Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ appCode: 'admin', kurikulum: 'K13' });

    const token = loginResponse.body.token;

    // 2. Use token to access protected endpoint
    const response = await request(app)
      .get('/api/data/sekolah')
      .set('Authorization', `Bearer ${token}`);

    // 3. Assertions
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

### Test File Naming Convention

- `*.test.js` - Test files
- `*.spec.js` - Spec files
- `__tests__/` - Test directory

---

## 🎯 Testing Best Practices

### 1. Test Organization
```javascript
describe('Feature Name', () => {
  describe('Sub-feature', () => {
    test('should do something specific', () => {
      // Test code
    });
  });
});
```

### 2. Setup & Teardown
```javascript
beforeAll(() => {
  // Runs once before all tests
});

beforeEach(() => {
  // Runs before each test
});

afterEach(() => {
  // Runs after each test
});

afterAll(() => {
  // Runs once after all tests
});
```

### 3. Async Testing
```javascript
test('async operation', async () => {
  const result = await someAsyncFunction();
  expect(result).toBe(expected);
});
```

### 4. Mocking
```javascript
jest.mock('../src/database');

const db = require('../src/database');
db.query.mockResolvedValue({ rows: [] });
```

---

## 📊 Coverage Reports

### Generate Coverage
```bash
npm run test:coverage
```

### View Coverage
```bash
# Open in browser
open coverage/lcov-report/index.html

# Or check console output
```

### Coverage Thresholds

Minimum required:
- **Statements**: 50%
- **Branches**: 40%
- **Functions**: 40%
- **Lines**: 50%

**Note**: Tests will fail if coverage is below threshold

---

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'

    - run: npm install
    - run: npm test
    - run: npm run test:coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

---

## 🐛 Debugging Tests

### Run Single Test File
```bash
npm test -- tests/__tests__/api/auth.test.js
```

### Run Single Test
```bash
npm test -- -t "should accept valid admin login"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open: `chrome://inspect`

---

## 🚧 TODO - Future Test Improvements

### High Priority
- [ ] Implement actual API integration tests (remove placeholders)
- [ ] Add database seeding for tests
- [ ] Test CRUD operations for sekolah
- [ ] Test CRUD operations for siswa
- [ ] Test nilai/grades endpoints

### Medium Priority
- [ ] Add E2E tests with Puppeteer/Playwright
- [ ] Test file upload functionality (Excel import)
- [ ] Test real-time Socket.IO features
- [ ] Add performance/load tests

### Low Priority
- [ ] Test error handling edge cases
- [ ] Test input validation
- [ ] Test pagination
- [ ] Test search functionality

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)

---

## ⚠️ Important Notes

### Current Limitations

1. **Tests are placeholders**: Most tests currently just `expect(true).toBe(true)`
2. **No app integration**: Tests don't actually start the Express server
3. **No database**: Tests don't interact with actual database

### To Enable Full Testing

1. **Export Express app** (server.js):
   ```javascript
   module.exports = app; // Add this at end of server.js
   ```

2. **Use test database**:
   ```javascript
   const dbPath = process.env.NODE_ENV === 'test'
     ? ':memory:' // In-memory SQLite for tests
     : './src/database/db.sqlite';
   ```

3. **Seed test data**:
   ```javascript
   beforeAll(async () => {
     await seedTestData();
   });
   ```

---

**Last Updated**: 2025-09-30
**Status**: ✅ Framework ready, tests need implementation
**Next Steps**: Implement actual API integration tests