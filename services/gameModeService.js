const Chess = require('chess.js');
const EventEmitter = require('events');

class GameModeService extends EventEmitter {
    constructor() {
        super();
        this.activeGames = new Map();
        this.timeControls = {
            bullet: { initial: 60, increment: 0 },      // 1 minute
            blitz1: { initial: 180, increment: 0 },     // 3 minutes
            blitz3: { initial: 300, increment: 0 },     // 5 minutes
            blitz5: { initial: 600, increment: 0 },     // 10 minutes
            rapid: { initial: 900, increment: 10 },     // 15+10
            classical: { initial: 1800, increment: 30 }, // 30+30
            custom: null
        };
        
        this.gameTypes = {
            standard: {
                name: 'Standard Chess',
                description: 'Traditional chess game',
                rated: true,
                variants: false
            },
            crazyhouse: {
                name: 'Crazyhouse',
                description: 'Captured pieces can be dropped back on the board',
                rated: true,
                variants: true
            },
            threeCheck: {
                name: 'Three-Check Chess',
                description: 'Win by checking the opponent three times',
                rated: true,
                variants: true
            },
            kingOfTheHill: {
                name: 'King of the Hill',
                description: 'Win by reaching the center squares',
                rated: true,
                variants: true
            },
            fourPlayer: {
                name: '4 Player Chess',
                description: 'Chess with four players',
                rated: false,
                variants: true
            }
        };
    }

    // Initialize a new game
    createGame(gameType, timeControl, options = {}) {
        const gameId = Date.now().toString();
        const game = {
            id: gameId,
            type: gameType,
            timeControl: this.timeControls[timeControl] || options.customTime,
            players: {},
            spectators: new Set(),
            state: new Chess(),
            status: 'waiting',
            moves: [],
            clocks: {},
            checks: { white: 0, black: 0 }, // for three-check variant
            capturedPieces: { white: [], black: [] }, // for crazyhouse variant
            created: Date.now(),
            options: {
                rated: this.gameTypes[gameType].rated && !options.unrated,
                ...options
            }
        };

        this.activeGames.set(gameId, game);
        this.emit('gameCreated', { gameId, game });
        return game;
    }

    // Join a game
    joinGame(gameId, userId, color = null) {
        const game = this.activeGames.get(gameId);
        if (!game) throw new Error('Game not found');
        if (game.status !== 'waiting') throw new Error('Game already started');

        // Assign color if not specified
        if (!color) {
            color = Object.keys(game.players).length === 0 ? 'white' : 'black';
        }

        if (game.players[color]) throw new Error('Color already taken');

        game.players[color] = {
            id: userId,
            color,
            timeLeft: game.timeControl.initial,
            connected: true
        };

        // Initialize clock for the player
        game.clocks[color] = {
            timeLeft: game.timeControl.initial * 1000,
            running: false
        };

        // Start game if all players joined
        if (Object.keys(game.players).length === 2) {
            game.status = 'active';
            this.startGame(gameId);
        }

        this.emit('playerJoined', { gameId, userId, color });
        return game;
    }

    // Start the game
    startGame(gameId) {
        const game = this.activeGames.get(gameId);
        if (!game) throw new Error('Game not found');

        game.status = 'active';
        game.startTime = Date.now();
        
        // Start clock for white
        game.clocks.white.running = true;
        game.clocks.white.lastUpdate = Date.now();

        this.emit('gameStarted', { gameId, game });
    }

    // Make a move
    makeMove(gameId, userId, move) {
        const game = this.activeGames.get(gameId);
        if (!game) throw new Error('Game not found');
        if (game.status !== 'active') throw new Error('Game not active');

        const player = Object.values(game.players).find(p => p.id === userId);
        if (!player) throw new Error('Player not in game');
        if (game.state.turn() !== player.color.charAt(0)) throw new Error('Not your turn');

        try {
            // Validate and make the move
            const moveResult = game.state.move(move);
            if (!moveResult) throw new Error('Invalid move');

            // Record the move
            game.moves.push({
                move: moveResult,
                fen: game.state.fen(),
                timestamp: Date.now()
            });

            // Update clocks
            this.updateClocks(game, player.color);

            // Check for variant-specific rules
            this.handleVariantRules(game, moveResult);

            // Check game end conditions
            this.checkGameEnd(game);

            this.emit('moveMade', { gameId, move: moveResult, game });
            return moveResult;
        } catch (error) {
            throw new Error('Invalid move: ' + error.message);
        }
    }

    // Handle variant-specific rules
    handleVariantRules(game, move) {
        switch (game.type) {
            case 'threeCheck':
                if (move.san.includes('+')) {
                    const color = game.state.turn() === 'w' ? 'black' : 'white';
                    game.checks[color]++;
                    if (game.checks[color] >= 3) {
                        game.status = 'finished';
                        game.result = color === 'white' ? '1-0' : '0-1';
                    }
                }
                break;

            case 'crazyhouse':
                if (move.captured) {
                    const capturer = game.state.turn() === 'w' ? 'black' : 'white';
                    game.capturedPieces[capturer].push(move.captured);
                }
                break;

            case 'kingOfTheHill':
                const king = game.state.turn() === 'w' ? 'k' : 'K';
                const centerSquares = ['d4', 'd5', 'e4', 'e5'];
                const kingPos = this.findKing(game.state, king);
                if (centerSquares.includes(kingPos)) {
                    game.status = 'finished';
                    game.result = game.state.turn() === 'w' ? '0-1' : '1-0';
                }
                break;
        }
    }

    // Find king position (helper for King of the Hill variant)
    findKing(chess, king) {
        const board = chess.board();
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.type === 'k' && piece.color === (king === 'k' ? 'b' : 'w')) {
                    return String.fromCharCode(97 + j) + (8 - i);
                }
            }
        }
        return null;
    }

    // Update game clocks
    updateClocks(game, lastMoveColor) {
        const now = Date.now();
        
        // Stop clock for player who just moved
        game.clocks[lastMoveColor].running = false;
        game.clocks[lastMoveColor].timeLeft -= (now - game.clocks[lastMoveColor].lastUpdate);

        // Start clock for other player
        const nextColor = lastMoveColor === 'white' ? 'black' : 'white';
        game.clocks[nextColor].running = true;
        game.clocks[nextColor].lastUpdate = now;

        // Add increment for player who just moved
        if (game.timeControl.increment) {
            game.clocks[lastMoveColor].timeLeft += game.timeControl.increment * 1000;
        }

        // Check for time out
        if (game.clocks[lastMoveColor].timeLeft <= 0) {
            game.status = 'finished';
            game.result = lastMoveColor === 'white' ? '0-1' : '1-0';
            game.endReason = 'timeout';
        }
    }

    // Check for game end conditions
    checkGameEnd(game) {
        if (game.state.isCheckmate()) {
            game.status = 'finished';
            game.result = game.state.turn() === 'w' ? '0-1' : '1-0';
            game.endReason = 'checkmate';
        } else if (game.state.isDraw()) {
            game.status = 'finished';
            game.result = '1/2-1/2';
            game.endReason = 'draw';
            if (game.state.isStalemate()) game.endReason = 'stalemate';
            if (game.state.isThreefoldRepetition()) game.endReason = 'repetition';
            if (game.state.isInsufficientMaterial()) game.endReason = 'insufficient';
        }

        if (game.status === 'finished') {
            this.emit('gameEnded', {
                gameId: game.id,
                result: game.result,
                reason: game.endReason
            });
        }
    }

    // Resign game
    resignGame(gameId, userId) {
        const game = this.activeGames.get(gameId);
        if (!game) throw new Error('Game not found');
        if (game.status !== 'active') throw new Error('Game not active');

        const player = Object.values(game.players).find(p => p.id === userId);
        if (!player) throw new Error('Player not in game');

        game.status = 'finished';
        game.result = player.color === 'white' ? '0-1' : '1-0';
        game.endReason = 'resignation';

        this.emit('gameEnded', {
            gameId,
            result: game.result,
            reason: game.endReason
        });

        return game;
    }

    // Offer/accept draw
    handleDrawOffer(gameId, userId, action) {
        const game = this.activeGames.get(gameId);
        if (!game) throw new Error('Game not found');
        if (game.status !== 'active') throw new Error('Game not active');

        const player = Object.values(game.players).find(p => p.id === userId);
        if (!player) throw new Error('Player not in game');

        if (action === 'offer') {
            game.drawOffer = player.color;
            this.emit('drawOffered', { gameId, color: player.color });
        } else if (action === 'accept' && game.drawOffer && game.drawOffer !== player.color) {
            game.status = 'finished';
            game.result = '1/2-1/2';
            game.endReason = 'agreement';
            this.emit('gameEnded', {
                gameId,
                result: game.result,
                reason: game.endReason
            });
        }

        return game;
    }

    // Add spectator to game
    addSpectator(gameId, userId) {
        const game = this.activeGames.get(gameId);
        if (!game) throw new Error('Game not found');

        game.spectators.add(userId);
        this.emit('spectatorJoined', { gameId, userId });
        return game;
    }

    // Remove spectator from game
    removeSpectator(gameId, userId) {
        const game = this.activeGames.get(gameId);
        if (!game) throw new Error('Game not found');

        game.spectators.delete(userId);
        this.emit('spectatorLeft', { gameId, userId });
    }

    // Get game state
    getGame(gameId) {
        return this.activeGames.get(gameId);
    }

    // Clean up finished games
    cleanupGames() {
        const now = Date.now();
        for (const [gameId, game] of this.activeGames) {
            if (game.status === 'finished' && now - game.created > 24 * 60 * 60 * 1000) {
                this.activeGames.delete(gameId);
            }
        }
    }
}

module.exports = new GameModeService(); 