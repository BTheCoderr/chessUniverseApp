const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class UserService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User and token
   */
  async register(userData) {
    try {
      const { username, email, password } = userData;

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      // Create new user
      const user = new User({
        username,
        email,
        password: await bcrypt.hash(password, 10),
      });

      await user.save();

      // Generate token
      const token = this.generateToken(user);

      return { user: this.sanitizeUser(user), token };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Authenticate user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} User and token
   */
  async login(username, password) {
    try {
      const user = await User.findOne({ username });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid username or password');
      }

      const token = this.generateToken(user);

      return { user: this.sanitizeUser(user), token };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updates) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {string} JWT token
   * @private
   */
  generateToken(user) {
    return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  }

  /**
   * Remove sensitive information from user object
   * @param {Object} user - User object
   * @returns {Object} Sanitized user object
   * @private
   */
  sanitizeUser(user) {
    const { password, __v, ...sanitizedUser } = user.toObject();
    return sanitizedUser;
  }
}

module.exports = new UserService();
