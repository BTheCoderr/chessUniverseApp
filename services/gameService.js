const Game = require('../models/game');
const User = require('../models/user');
const stockfishService = require('./stockfishService');
const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');

class GameService {
    constructor() {
        this.activeGames = new Map(); // gameId -> Chess instance
        this.timers = new Map();      // gameId -> timer interval
    }

    async createGame(options) {
        const {
            type = 'casual',
            mode = 'rapid',
            timeControl = { initial: 600, increment: 5 },
            whitePlayer,
            blackPlayer,
            tournament = null
        } = options;

        const gameId = uuidv4();
        const chess = new Chess();

        const game = new Game({
            gameId,
            type,
            mode,
            timeControl: {
                initial: timeControl.initial,
                increment: timeControl.increment,
                current: {
                    white: timeControl.initial,
                    black: timeControl.initial
                }
            },
            players: {
                white: {
                    userId: whitePlayer._id,
                    username: whitePlayer.username,
                    rating: whitePlayer.rating
                },
                black: {
                    userId: blackPlayer._id,
                    username: blackPlayer.username,
                    rating: blackPlayer.rating
                }
            },
            position: {
                fen: chess.fen()
            }
        });

        if (tournament) {
            game.tournament = {
                tournamentId: tournament._id,
                round: tournament.currentRound,
                match: tournament.currentMatch
            };
        }

        await game.save();
        this.activeGames.set(gameId, chess);
        
        return game;
    }

    async makeMove(gameId, userId, move) {
        const game = await Game.findOne({ gameId });
        if (!game) throw new Error('Game not found');

        const chess = this.activeGames.get(gameId) || new Chess(game.position.fen);
        
        // Validate it's the player's turn
        if (!game.isPlayerTurn(userId)) {
            throw new Error('Not your turn');
        }

        // Validate and make the move
        try {
            const moveResult = chess.move(move);
            if (!moveResult) throw new Error('Invalid move');

            // Update game state
            const moveData = {
                from: moveResult.from,
                to: moveResult.to,
                piece: moveResult.piece,
                capture: !!moveResult.captured,
                promotion: moveResult.promotion,
                check: chess.inCheck(),
                checkmate: chess.isCheckmate(),
                san: moveResult.san,
                fen: chess.fen(),
                timestamp: new Date(),
                timeRemaining: {
                    white: game.getTimeRemaining('white'),
                    black: game.getTimeRemaining('black')
                }
            };

            // Update time control
            const isWhite = game.players.white.userId.equals(userId);
            const color = isWhite ? 'white' : 'black';
            this.updateTime(game, color);

            // Add move to history
            game.moves.push(moveData);
            game.position.fen = chess.fen();
            game.position.lastMove = {
                from: moveResult.from,
                to: moveResult.to,
                piece: moveResult.piece,
                capture: !!moveResult.captured,
                promotion: moveResult.promotion
            };

            // Check game end conditions
            if (chess.isGameOver()) {
                await this.handleGameOver(game, chess);
            }

            // Save game state
            await game.save();
            this.activeGames.set(gameId, chess);

            // If analysis is enabled, analyze the position
            if (game.analysis.enabled) {
                const analysis = await stockfishService.analyzeMoves([moveResult.san], 1000);
                if (analysis.length > 0) {
                    moveData.evaluation = analysis[0].evaluation;
                    game.analysis.positions.push({
                        fen: chess.fen(),
                        evaluation: analysis[0].evaluation,
                        bestMove: analysis[0].bestMove,
                        bestLine: analysis[0].line,
                        depth: analysis[0].depth
                    });
                    await game.save();
                }
            }

            return { game, moveData };
        } catch (error) {
            throw new Error(`Invalid move: ${error.message}`);
        }
    }

    async handleGameOver(game, chess) {
        game.status = 'completed';
        game.endedAt = new Date();
        
        if (chess.isCheckmate()) {
            game.result = {
                winner: chess.turn() === 'w' ? 'black' : 'white',
                method: 'checkmate',
                score: chess.turn() === 'w' ? '0-1' : '1-0'
            };
        } else if (chess.isDraw()) {
            game.result = {
                winner: 'draw',
                method: this.getDrawReason(chess),
                score: '½-½'
            };
        }

        // Clear timer
        this.stopTimer(game.gameId);

        // Update ratings for rated games
        if (game.type === 'rated') {
            await game.updateRatings();
        }

        // Update tournament if applicable
        if (game.tournament?.tournamentId) {
            await this.updateTournament(game);
        }
    }

    getDrawReason(chess) {
        if (chess.isStalemate()) return 'stalemate';
        if (chess.isThreefoldRepetition()) return 'repetition';
        if (chess.isInsufficientMaterial()) return 'insufficient material';
        if (chess.isDraw()) return 'fifty-move rule';
        return 'agreement';
    }

    async updateTournament(game) {
        const Tournament = require('../models/tournament');
        const tournament = await Tournament.findById(game.tournament.tournamentId);
        if (!tournament) return;

        await tournament.updateMatchResult(
            game.tournament.round,
            game.tournament.match,
            game.result
        );
    }

    updateTime(game, color) {
        const now = Date.now();
        const elapsed = game.lastMoveAt ? (now - game.lastMoveAt) / 1000 : 0;
        
        // Update current time
        game.timeControl.current[color] = Math.max(
            0,
            game.timeControl.current[color] - elapsed + game.timeControl.increment
        );
        
        game.lastMoveAt = now;
        
        // Check for timeout
        if (game.timeControl.current[color] <= 0) {
            game.status = 'completed';
            game.result = {
                winner: color === 'white' ? 'black' : 'white',
                method: 'timeout',
                score: color === 'white' ? '0-1' : '1-0'
            };
        }
    }

    startTimer(gameId) {
        if (this.timers.has(gameId)) return;

        const interval = setInterval(async () => {
            const game = await Game.findOne({ gameId });
            if (!game || game.status !== 'active') {
                this.stopTimer(gameId);
                return;
            }

            const color = game.position.fen.split(' ')[1] === 'w' ? 'white' : 'black';
            const timeRemaining = game.getTimeRemaining(color);

            if (timeRemaining <= 0) {
                game.status = 'completed';
                game.result = {
                    winner: color === 'white' ? 'black' : 'white',
                    method: 'timeout',
                    score: color === 'white' ? '0-1' : '1-0'
                };
                await game.save();
                this.stopTimer(gameId);
            }
        }, 100); // Check every 100ms

        this.timers.set(gameId, interval);
    }

    stopTimer(gameId) {
        const interval = this.timers.get(gameId);
        if (interval) {
            clearInterval(interval);
            this.timers.delete(gameId);
        }
    }

    async resign(gameId, userId) {
        const game = await Game.findOne({ gameId });
        if (!game) throw new Error('Game not found');

        const isWhite = game.players.white.userId.equals(userId);
        game.status = 'completed';
        game.result = {
            winner: isWhite ? 'black' : 'white',
            method: 'resignation',
            score: isWhite ? '0-1' : '1-0'
        };
        game.endedAt = new Date();

        await game.save();
        this.stopTimer(gameId);
        
        if (game.type === 'rated') {
            await game.updateRatings();
        }

        if (game.tournament?.tournamentId) {
            await this.updateTournament(game);
        }

        return game;
    }

    async offerDraw(gameId, userId) {
        const game = await Game.findOne({ gameId });
        if (!game) throw new Error('Game not found');

        const isWhite = game.players.white.userId.equals(userId);
        game.drawOffer = isWhite ? 'white' : 'black';
        await game.save();

        return game;
    }

    async acceptDraw(gameId, userId) {
        const game = await Game.findOne({ gameId });
        if (!game) throw new Error('Game not found');

        const isWhite = game.players.white.userId.equals(userId);
        if ((isWhite && game.drawOffer !== 'black') || 
            (!isWhite && game.drawOffer !== 'white')) {
            throw new Error('No draw offer to accept');
        }

        game.status = 'completed';
        game.result = {
            winner: 'draw',
            method: 'agreement',
            score: '½-½'
        };
        game.endedAt = new Date();

        await game.save();
        this.stopTimer(gameId);
        
        if (game.type === 'rated') {
            await game.updateRatings();
        }

        if (game.tournament?.tournamentId) {
            await this.updateTournament(game);
        }

        return game;
    }

    async abortGame(gameId) {
        const game = await Game.findOne({ gameId });
        if (!game) throw new Error('Game not found');

        game.status = 'aborted';
        game.endedAt = new Date();
        await game.save();
        
        this.stopTimer(gameId);
        this.activeGames.delete(gameId);

        return game;
    }

    cleanup() {
        for (const interval of this.timers.values()) {
            clearInterval(interval);
        }
        this.timers.clear();
        this.activeGames.clear();
    }
}

module.exports = new GameService(); 