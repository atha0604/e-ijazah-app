/**
 * Jest Test Setup
 *
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-not-production';
process.env.PORT = '3999'; // Use different port for testing

// Increase timeout for slower machines
jest.setTimeout(10000);

// Suppress console output during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

console.log('🧪 Jest test environment initialized');