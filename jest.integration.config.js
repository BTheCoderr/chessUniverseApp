module.exports = {
  // Use node environment for API tests
  testEnvironment: 'node',

  // Look for test files in the integration directory
  testMatch: ['**/__tests__/integration/**/*.test.js'],

  // Setup files to run before tests
  setupFiles: ['<rootDir>/jest.setup.js'],

  // Configure coverage collection
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**',
  ],

  // Coverage thresholds for integration tests
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Timeout for async operations (20 seconds)
  testTimeout: 20000,

  // Verbose output
  verbose: true,

  // Display individual test results
  displayName: {
    name: 'Integration Tests',
    color: 'blue',
  },

  // Global setup/teardown
  globalSetup: '<rootDir>/__tests__/integration/setup.js',
  globalTeardown: '<rootDir>/__tests__/integration/teardown.js',
};
