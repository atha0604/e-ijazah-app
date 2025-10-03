module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    'server.js',
    '!src/migrations/**',
    '!src/setup.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/backup/**'
  ],

  // Coverage thresholds (optional - enforce minimum coverage)
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 40,
      lines: 50
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
};