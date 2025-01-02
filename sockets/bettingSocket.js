const bettingService = require('../services/bettingService');
const User = require('../models/user');

class BettingSocket {
    constructor(io) {
        this.io = io;
        this.namespace = io.of('/betting');
        this.setupEventHandlers();
        this.setupServiceListeners();
    }

    setupEventHandlers() {
        this.namespace.on('connection', (socket) => {
            console.log('Client connected to betting namespace');

            // Join betting room
            socket.on('joinRoom', async (data) => {
                try {
                    const { roomId, userId } = data;
                    
                    // Leave previous rooms
                    Object.keys(socket.rooms).forEach(room => {
                        if (room !== socket.id) {
                            socket.leave(room);
                        }
                    });

                    // Join new room
                    socket.join(roomId);
                    socket.userId = userId;
                    socket.roomId = roomId;

                    // Get user info
                    const user = await User.findById(userId);
                    socket.username = user ? user.username : 'Anonymous';

                    // Send initial market data
                    const market = bettingService.getMarketStatus(roomId);
                    if (market) {
                        socket.emit('marketUpdate', market);
                    }

                    // Notify room of new user
                    this.namespace.to(roomId).emit('userJoined', {
                        username: socket.username,
                        timestamp: Date.now()
                    });

                } catch (error) {
                    console.error('Error joining betting room:', error);
                    socket.emit('error', { message: 'Failed to join betting room' });
                }
            });

            // Handle chat messages
            socket.on('chatMessage', (data) => {
                if (!socket.roomId || !socket.username) return;

                const message = {
                    username: socket.username,
                    message: data.message,
                    timestamp: Date.now()
                };

                this.namespace.to(socket.roomId).emit('chatMessage', message);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                if (socket.roomId && socket.username) {
                    this.namespace.to(socket.roomId).emit('userLeft', {
                        username: socket.username,
                        timestamp: Date.now()
                    });
                }
            });
        });
    }

    setupServiceListeners() {
        // Listen for market initialization
        bettingService.on('marketInitialized', (data) => {
            this.namespace.to(data.gameId).emit('marketInitialized', {
                odds: data.market.odds,
                totalVolume: data.market.totalVolume
            });
        });

        // Listen for bet placements
        bettingService.on('betPlaced', (data) => {
            this.namespace.to(data.gameId).emit('betPlaced', {
                type: data.bet.type,
                choice: data.bet.choice,
                amount: data.bet.amount,
                odds: data.bet.odds,
                timestamp: data.bet.timestamp
            });
        });

        // Listen for bet cancellations
        bettingService.on('betCancelled', (data) => {
            this.namespace.to(data.gameId).emit('betCancelled', {
                betId: data.bet.id,
                timestamp: Date.now()
            });
        });

        // Listen for odds updates
        bettingService.on('oddsUpdated', (data) => {
            this.namespace.to(data.gameId).emit('oddsUpdate', {
                odds: data.odds,
                timestamp: Date.now()
            });
        });

        // Listen for bet resolutions
        bettingService.on('betResolved', (data) => {
            this.namespace.to(data.gameId).emit('betResolved', {
                betId: data.bet.id,
                status: data.bet.status,
                payout: data.bet.payout,
                timestamp: Date.now()
            });
        });

        // Listen for market closure
        bettingService.on('marketClosed', (data) => {
            this.namespace.to(data.gameId).emit('marketClosed', {
                result: data.result,
                timestamp: Date.now()
            });
        });
    }

    // Broadcast game state update to betting room
    broadcastGameState(gameId, state) {
        this.namespace.to(gameId).emit('gameState', {
            fen: state.fen,
            timeLeft: state.timeLeft,
            players: state.players,
            timestamp: Date.now()
        });
    }

    // Broadcast market statistics
    broadcastMarketStats(gameId) {
        const market = bettingService.getMarketStatus(gameId);
        if (market) {
            this.namespace.to(gameId).emit('marketStats', {
                totalBets: market.bets.length,
                totalVolume: market.totalVolume,
                timestamp: Date.now()
            });
        }
    }

    // Send personal bet update to user
    sendPersonalBetUpdate(userId, gameId, bet) {
        const sockets = this.namespace.adapter.rooms.get(gameId);
        if (sockets) {
            for (const socketId of sockets) {
                const socket = this.namespace.sockets.get(socketId);
                if (socket && socket.userId === userId) {
                    socket.emit('personalBetUpdate', {
                        bet,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }

    // Send error message to user
    sendError(userId, gameId, error) {
        const sockets = this.namespace.adapter.rooms.get(gameId);
        if (sockets) {
            for (const socketId of sockets) {
                const socket = this.namespace.sockets.get(socketId);
                if (socket && socket.userId === userId) {
                    socket.emit('error', {
                        message: error.message,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }

    // Broadcast system message to room
    broadcastSystemMessage(gameId, message) {
        this.namespace.to(gameId).emit('systemMessage', {
            message,
            timestamp: Date.now()
        });
    }
}

module.exports = BettingSocket; 