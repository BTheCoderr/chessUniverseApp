/**
 * Socket.IO game handler
 * Manages real-time game events and player interactions
 */
module.exports = function(io, defaultGameConfig) {
    const games = new Map(); // Store active games
    const playerQueue = new Map(); // Store players waiting for matches

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join', (data) => {
            console.log('Player joining:', data);
            
            if (data.mode === 'quick') {
                handleQuickMatch(socket, data);
            } else if (data.mode === 'custom') {
                handleCustomGame(socket, data);
            }
        });

        socket.on('move', (move) => {
            if (!socket.gameId) return;
            
            const game = games.get(socket.gameId);
            if (!game) return;

            // Broadcast move to opponent
            socket.to(socket.gameId).emit('move', move);
            
            // Update game state
            game.moves.push(move);
        });

        socket.on('resign', () => {
            if (!socket.gameId) return;
            
            const game = games.get(socket.gameId);
            if (!game) return;

            // Notify opponent of resignation
            socket.to(socket.gameId).emit('gameOver', {
                type: 'resignation',
                winner: game.players[socket.id === game.players.white ? 'black' : 'white']
            });

            endGame(socket.gameId);
        });

        socket.on('offerDraw', () => {
            if (!socket.gameId) return;
            socket.to(socket.gameId).emit('drawOffer');
        });

        socket.on('acceptDraw', () => {
            if (!socket.gameId) return;
            
            const game = games.get(socket.gameId);
            if (!game) return;

            io.to(socket.gameId).emit('gameOver', {
                type: 'draw',
                message: 'Game ended in a draw by agreement'
            });

            endGame(socket.gameId);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            
            // Remove from queue if waiting
            playerQueue.delete(socket.id);
            
            // Handle disconnection from active game
            if (socket.gameId) {
                const game = games.get(socket.gameId);
                if (game) {
                    socket.to(socket.gameId).emit('gameOver', {
                        type: 'disconnection',
                        message: 'Opponent disconnected'
                    });
                    endGame(socket.gameId);
                }
            }
        });
    });

    function handleQuickMatch(socket, data) {
        // Remove any existing queue entry for this socket
        playerQueue.delete(socket.id);

        // Find an opponent
        let opponent = null;
        for (const [id, player] of playerQueue) {
            if (player.mode === 'quick') {
                opponent = { id, ...player };
                playerQueue.delete(id);
                break;
            }
        }

        if (opponent) {
            // Create a new game with the matched players
            const gameId = generateGameId();
            const whitePlayer = Math.random() < 0.5 ? socket.id : opponent.id;
            
            const game = {
                id: gameId,
                players: {
                    white: whitePlayer,
                    black: whitePlayer === socket.id ? opponent.id : socket.id
                },
                timeControl: defaultGameConfig.timeControl,
                moves: [],
                startTime: Date.now()
            };

            games.set(gameId, game);

            // Join both players to the game room
            socket.join(gameId);
            io.sockets.sockets.get(opponent.id)?.join(gameId);

            // Set game ID on socket objects
            socket.gameId = gameId;
            io.sockets.sockets.get(opponent.id).gameId = gameId;

            // Notify players of game start
            socket.emit('gameStart', {
                color: whitePlayer === socket.id ? 'white' : 'black',
                white: whitePlayer === socket.id ? data.guestUsername : opponent.guestUsername,
                black: whitePlayer === socket.id ? opponent.guestUsername : data.guestUsername
            });

            io.sockets.sockets.get(opponent.id).emit('gameStart', {
                color: whitePlayer === opponent.id ? 'white' : 'black',
                white: whitePlayer === opponent.id ? opponent.guestUsername : data.guestUsername,
                black: whitePlayer === opponent.id ? data.guestUsername : opponent.guestUsername
            });
        } else {
            // Add player to queue
            playerQueue.set(socket.id, {
                mode: data.mode,
                guestUsername: data.guestUsername,
                joinTime: Date.now()
            });
        }
    }

    function handleCustomGame(socket, data) {
        // Implementation for custom game creation/joining
        // This would handle specific game IDs, invites, etc.
    }

    function endGame(gameId) {
        const game = games.get(gameId);
        if (!game) return;

        // Clean up game data
        games.delete(gameId);

        // Remove game ID from sockets
        const whiteSock = io.sockets.sockets.get(game.players.white);
        const blackSock = io.sockets.sockets.get(game.players.black);
        
        if (whiteSock) whiteSock.gameId = null;
        if (blackSock) blackSock.gameId = null;
    }

    function generateGameId() {
        return Math.random().toString(36).substring(2, 15);
    }
}; 