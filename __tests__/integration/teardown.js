const mongoose = require('mongoose');

module.exports = async () => {
  // Disconnect from the database
  await mongoose.disconnect();

  // Stop the MongoDB Memory Server
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
  }

  // Clean up any resources
  console.log('Tearing down integration test environment...');

  // Add any additional cleanup logic here
  // For example, removing test files, cleaning up test data, etc.
};
