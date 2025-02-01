const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
const app = express();

describe('API Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Game Routes', () => {
    test('GET /api/games should return list of games', async () => {
      const response = await request(app)
        .get('/api/games')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('POST /api/games should create a new game', async () => {
      const gameData = {
        type: 'standard',
        timeControl: {
          initial: 600,
          increment: 5,
        },
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe(gameData.type);
    });

    test('GET /api/games/:id should return game details', async () => {
      // First create a game
      const createResponse = await request(app)
        .post('/api/games')
        .send({
          type: 'standard',
          timeControl: { initial: 600, increment: 5 },
        });

      const gameId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/games/${gameId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.id).toBe(gameId);
    });
  });

  describe('User Routes', () => {
    test('POST /api/users/register should create new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe(userData.username);
      expect(response.body).not.toHaveProperty('password');
    });

    test('POST /api/users/login should authenticate user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(credentials)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    test('GET /api/users/profile should return user profile', async () => {
      // First login to get token
      const loginResponse = await request(app).post('/api/users/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('rating');
    });
  });

  describe('Analysis Routes', () => {
    test('POST /api/analysis should analyze position', async () => {
      const position = {
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      };

      const response = await request(app)
        .post('/api/analysis')
        .send(position)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('evaluation');
      expect(response.body).toHaveProperty('bestLine');
    });

    test('GET /api/analysis/history should return analysis history', async () => {
      const response = await request(app)
        .get('/api/analysis/history')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid game ID', async () => {
      await request(app).get('/api/games/invalid-id').expect(400);
    });

    test('should handle invalid login credentials', async () => {
      await request(app)
        .post('/api/users/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    test('should handle unauthorized access', async () => {
      await request(app).get('/api/users/profile').expect(401);
    });

    test('should handle invalid FEN string', async () => {
      await request(app)
        .post('/api/analysis')
        .send({
          fen: 'invalid-fen-string',
        })
        .expect(400);
    });
  });
});
