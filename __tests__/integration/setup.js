const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

module.exports = async () => {
  // Create an instance of MongoMemoryServer
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Store the server instance so we can stop it in teardown
  global.__MONGO_SERVER__ = mongoServer;

  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Set up any test data or configurations needed
  console.log('Setting up integration test environment...');

  // Add any additional setup logic here
  // For example, creating test users, setting up test data, etc.
};
