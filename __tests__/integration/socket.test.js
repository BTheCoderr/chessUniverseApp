const io = require('socket.io-client');
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');

describe('WebSocket Integration', () => {
  let clientSocket;
  let serverSocket;
  let httpServer;
  let io;
  let app;

  beforeAll(done => {
    app = express();
    httpServer = http.createServer(app);
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new io(`http://localhost:${port}`);
      io.on('connection', socket => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  test('should handle game join', done => {
    const gameConfig = {
      type: 'standard',
      mode: 'ranked',
      guestId: '123',
      guestUsername: 'TestPlayer',
    };

    serverSocket.on('join', data => {
      expect(data).toEqual(gameConfig);
      done();
    });

    clientSocket.emit('join', gameConfig);
  });

  test('should handle move events', done => {
    const moveData = {
      from: 'e2',
      to: 'e4',
      promotion: 'q',
    };

    serverSocket.on('move', data => {
      expect(data).toEqual(moveData);
      // Simulate server responding with the move
      serverSocket.emit('move', moveData);
    });

    clientSocket.on('move', data => {
      expect(data).toEqual(moveData);
      done();
    });

    clientSocket.emit('move', moveData);
  });

  test('should handle game start', done => {
    const gameData = {
      color: 'white',
      white: 'Player1',
      black: 'Player2',
    };

    clientSocket.on('gameStart', data => {
      expect(data).toEqual(gameData);
      done();
    });

    serverSocket.emit('gameStart', gameData);
  });

  test('should handle resignation', done => {
    serverSocket.on('resign', () => {
      serverSocket.emit('gameOver', {
        message: 'Player resigned',
      });
    });

    clientSocket.on('gameOver', data => {
      expect(data.message).toBe('Player resigned');
      done();
    });

    clientSocket.emit('resign');
  });

  test('should handle draw offers', done => {
    serverSocket.on('offerDraw', () => {
      serverSocket.emit('drawOffered', {
        offeredBy: 'Player1',
      });
    });

    clientSocket.on('drawOffered', data => {
      expect(data.offeredBy).toBe('Player1');
      done();
    });

    clientSocket.emit('offerDraw');
  });

  test('should handle position analysis', done => {
    const position = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    const analysis = {
      evaluation: '+0.5',
      bestLine: 'e7e5',
    };

    serverSocket.on('analyze', data => {
      expect(data.fen).toBe(position);
      serverSocket.emit('analysis', analysis);
    });

    clientSocket.on('analysis', data => {
      expect(data).toEqual(analysis);
      done();
    });

    clientSocket.emit('analyze', { fen: position });
  });

  test('should handle opponent finding', done => {
    serverSocket.on('findOpponent', () => {
      serverSocket.emit('opponentFound', {
        opponent: 'Player2',
        rating: 1500,
      });
    });

    clientSocket.on('opponentFound', data => {
      expect(data.opponent).toBe('Player2');
      expect(data.rating).toBe(1500);
      done();
    });

    clientSocket.emit('findOpponent');
  });
});
