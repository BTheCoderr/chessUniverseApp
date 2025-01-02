const gameModeService = require('../services/gameModeService');
const User = require('../models/user');

class GameSocket {
    constructor(io) {
        this.io = io;
        this.namespace = io.of('/game');
        this.setupEventHandlers();
        this.setupServiceListeners();
    }

    setupEventHandlers() {
        this.namespace.on('connection', (socket) => {
            console.log('Client connected to game namespace');

            // Join game room
            socket.on('joinGame', async (data) => {
                try {
                    const { gameId, userId } = data;
                    
                    // Leave previous rooms
                    Object.keys(socket.rooms).forEach(room => {
                        if (room !== socket.id) {
                            socket.leave(room);
                        }
                    });

                    // Join new room
                    socket.join(gameId);
                    socket.userId = userId;
                    socket.gameId = gameId;

                    // Get user info
                    const user = await User.findById(userId);
                    socket.username = user ? user.username : 'Anonymous';

                    // Send initial game state
                    const game = gameModeService.getGame(gameId);
                    if (game) {
                        socket.emit('gameState', this.formatGameState(game));
                    }

                    // Notify room of new player/spectator
                    const isPlayer = Object.values(game.players).some(p => p.id === userId);
                    this.namespace.to(gameId).emit(isPlayer ? 'playerJoined' : 'spectatorJoined', {
                        username: socket.username,
                        timestamp: Date.now()
                    });

                } catch (error) {
                    console.error('Error joining game room:', error);
                    socket.emit('error', { message: 'Failed to join game room' });
                }
            });

            // Handle premove
            socket.on('premove', (data) => {
                const game = gameModeService.getGame(socket.gameId);
                if (!game || game.status !== 'active') return;

                const player = Object.values(game.players).find(p => p.id === socket.userId);
                if (!player) return;

                // Store premove
                socket.premove = data.move;
                
                // Notify player that premove is set
                socket.emit('premoveSet', {
                    move: data.move,
                    timestamp: Date.now()
                });
            });

            // Cancel premove
            socket.on('cancelPremove', () => {
                delete socket.premove;
                socket.emit('premoveCancelled', {
                    timestamp: Date.now()
                });
            });

            // Handle chat messages
            socket.on('chatMessage', (data) => {
                if (!socket.gameId || !socket.username) return;

                const message = {
                    username: socket.username,
                    message: data.message,
                    timestamp: Date.now()
                };

                this.namespace.to(socket.gameId).emit('chatMessage', message);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                if (socket.gameId) {
                    const game = gameModeService.getGame(socket.gameId);
                    if (game) {
                        const player = Object.values(game.players).find(p => p.id === socket.userId);
                        if (player) {
                            player.connected = false;
                            this.namespace.to(socket.gameId).emit('playerDisconnected', {
                                username: socket.username,
                                color: player.color,
                                timestamp: Date.now()
                            });
                        } else {
                            this.namespace.to(socket.gameId).emit('spectatorLeft', {
                                username: socket.username,
                                timestamp: Date.now()
                            });
                        }
                    }
                }
            });
        });
    }

    setupServiceListeners() {
        // Listen for game creation
        gameModeService.on('gameCreated', (data) => {
            this.namespace.emit('gameCreated', {
                gameId: data.gameId,
                type: data.game.type,
                timeControl: data.game.timeControl,
                timestamp: Date.now()
            });
        });

        // Listen for player joins
        gameModeService.on('playerJoined', (data) => {
            this.namespace.to(data.gameId).emit('gameState', 
                this.formatGameState(gameModeService.getGame(data.gameId))
            );
        });

        // Listen for game starts
        gameModeService.on('gameStarted', (data) => {
            this.namespace.to(data.gameId).emit('gameState', 
                this.formatGameState(data.game)
            );
        });

        // Listen for moves
        gameModeService.on('moveMade', (data) => {
            this.namespace.to(data.gameId).emit('gameState', 
                this.formatGameState(data.game)
            );

            // Check for premoves
            this.handlePremoves(data.gameId);
        });

        // Listen for game ends
        gameModeService.on('gameEnded', (data) => {
            this.namespace.to(data.gameId).emit('gameEnded', {
                result: data.result,
                reason: data.reason,
                timestamp: Date.now()
            });
        });

        // Listen for draw offers
        gameModeService.on('drawOffered', (data) => {
            this.namespace.to(data.gameId).emit('drawOffered', {
                color: data.color,
                timestamp: Date.now()
            });
        });
    }

    // Handle premoves after a move is made
    handlePremoves(gameId) {
        const game = gameModeService.getGame(gameId);
        if (!game || game.status !== 'active') return;

        const sockets = this.namespace.adapter.rooms.get(gameId);
        if (!sockets) return;

        for (const socketId of sockets) {
            const socket = this.namespace.sockets.get(socketId);
            if (socket && socket.premove) {
                const player = Object.values(game.players).find(p => p.id === socket.userId);
                if (player && game.state.turn() === player.color.charAt(0)) {
                    try {
                        gameModeService.makeMove(gameId, socket.userId, socket.premove);
                    } catch (error) {
                        // Invalid premove, notify player
                        socket.emit('premoveInvalid', {
                            move: socket.premove,
                            timestamp: Date.now()
                        });
                    }
                    delete socket.premove;
                }
            }
        }
    }

    // Format game state for client
    formatGameState(game) {
        return {
            id: game.id,
            type: game.type,
            status: game.status,
            fen: game.state.fen(),
            lastMove: game.moves[game.moves.length - 1],
            players: game.players,
            clocks: game.clocks,
            checks: game.checks,
            capturedPieces: game.capturedPieces,
            drawOffer: game.drawOffer,
            result: game.result,
            endReason: game.endReason,
            timestamp: Date.now()
        };
    }

    // Broadcast clock updates
    broadcastClocks(gameId) {
        const game = gameModeService.getGame(gameId);
        if (game) {
            this.namespace.to(gameId).emit('clockUpdate', {
                clocks: game.clocks,
                timestamp: Date.now()
            });
        }
    }

    // Start clock update interval
    startClockUpdates() {
        setInterval(() => {
            for (const [gameId, game] of gameModeService.activeGames) {
                if (game.status === 'active') {
                    this.broadcastClocks(gameId);
                }
            }
        }, 1000);
    }
}

module.exports = GameSocket; 