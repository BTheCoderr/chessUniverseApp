const { Worker } = require('worker_threads');
const path = require('path');
const EventEmitter = require('events');
const gameModeService = require('./gameModeService');

class BotService extends EventEmitter {
    constructor() {
        super();
        this.activeGames = new Map();
        this.stockfishWorkers = new Map();
        
        // Bot personalities with different playing styles and strengths
        this.botProfiles = {
            beginner: {
                name: 'Rookie Bot',
                rating: 800,
                depth: 5,
                skill: 3,
                personality: 'aggressive',
                description: 'Perfect for beginners learning chess'
            },
            intermediate: {
                name: 'Club Player Bot',
                rating: 1500,
                depth: 12,
                skill: 10,
                personality: 'balanced',
                description: 'Plays like an average club player'
            },
            advanced: {
                name: 'Master Bot',
                rating: 2000,
                depth: 16,
                skill: 15,
                personality: 'positional',
                description: 'Challenging opponent with master-level play'
            },
            expert: {
                name: 'Grandmaster Bot',
                rating: 2500,
                depth: 20,
                skill: 20,
                personality: 'universal',
                description: 'Plays at a grandmaster level'
            },
            stockfish: {
                name: 'Stockfish Max',
                rating: 3000,
                depth: 24,
                skill: 20,
                personality: 'perfect',
                description: 'Maximum strength Stockfish engine'
            }
        };

        // Personality-based opening books
        this.openingStyles = {
            aggressive: ['Sicilian Defense', 'King\'s Gambit', 'Dutch Defense'],
            balanced: ['Ruy Lopez', 'Queen\'s Gambit', 'Caro-Kann'],
            positional: ['English Opening', 'Reti Opening', 'Catalan'],
            universal: ['any'], // Uses full opening book
            perfect: ['any']    // Uses full opening book
        };
    }

    // Initialize a bot game
    async createBotGame(userId, botLevel, gameType, timeControl) {
        const game = gameModeService.createGame(gameType, timeControl, {
            rated: false,
            isBot: true,
            botLevel
        });

        // Join as white (user always plays white against bot)
        await gameModeService.joinGame(game.id, userId, 'white');
        
        // Join as black (bot)
        const botProfile = this.botProfiles[botLevel];
        await gameModeService.joinGame(game.id, `bot_${botLevel}`, 'black');

        // Initialize Stockfish worker for this game
        this.initializeStockfish(game.id, botProfile);

        this.activeGames.set(game.id, {
            gameId: game.id,
            botLevel,
            botProfile,
            thinking: false
        });

        return game;
    }

    // Initialize Stockfish worker for a game
    initializeStockfish(gameId, botProfile) {
        const worker = new Worker(path.join(__dirname, 'stockfishWorker.js'));
        
        worker.on('message', (message) => {
            this.handleStockfishMessage(gameId, message);
        });

        worker.on('error', (error) => {
            console.error('Stockfish worker error:', error);
            this.emit('botError', { gameId, error: error.message });
        });

        // Configure Stockfish
        worker.postMessage({
            type: 'configure',
            options: {
                Skill: botProfile.skill,
                MultiPV: 1,
                Threads: 1,
                Hash: 128,
                Contempt: this.getContemptValue(botProfile.personality)
            }
        });

        this.stockfishWorkers.set(gameId, worker);
    }

    // Get contempt value based on bot personality
    getContemptValue(personality) {
        switch (personality) {
            case 'aggressive': return 50;   // More likely to play for a win
            case 'balanced': return 0;      // Neutral evaluation
            case 'positional': return -20;  // More likely to accept draws
            case 'perfect': return 0;       // Pure engine evaluation
            default: return 0;
        }
    }

    // Handle messages from Stockfish worker
    handleStockfishMessage(gameId, message) {
        const game = this.activeGames.get(gameId);
        if (!game) return;

        switch (message.type) {
            case 'bestmove':
                if (game.thinking) {
                    game.thinking = false;
                    this.makeMove(gameId, message.move);
                }
                break;

            case 'evaluation':
                this.emit('evaluation', {
                    gameId,
                    eval: message.eval,
                    depth: message.depth,
                    pv: message.pv
                });
                break;
        }
    }

    // Make a bot move
    async makeMove(gameId, move) {
        try {
            const game = gameModeService.getGame(gameId);
            if (!game || game.status !== 'active') return;

            // Add some randomization for lower-level bots
            const botGame = this.activeGames.get(gameId);
            if (botGame && this.shouldRandomizeMove(botGame.botProfile)) {
                move = this.randomizeMove(game, move);
            }

            // Make the move
            await gameModeService.makeMove(gameId, `bot_${botGame.botLevel}`, move);
        } catch (error) {
            console.error('Bot move error:', error);
            this.emit('botError', { gameId, error: error.message });
        }
    }

    // Decide if move should be randomized based on bot level
    shouldRandomizeMove(botProfile) {
        if (botProfile.rating >= 2500) return false;
        
        // Higher chance of randomization for lower-rated bots
        const randomThreshold = (3000 - botProfile.rating) / 3000;
        return Math.random() < randomThreshold;
    }

    // Randomize move for more human-like play
    randomizeMove(game, bestMove) {
        const legalMoves = game.state.moves({ verbose: true });
        
        // Sometimes play a different move
        if (Math.random() < 0.2) {
            const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
            return randomMove.from + randomMove.to;
        }

        return bestMove;
    }

    // Request bot move
    requestMove(gameId) {
        const game = gameModeService.getGame(gameId);
        const botGame = this.activeGames.get(gameId);
        if (!game || !botGame || game.status !== 'active') return;

        const worker = this.stockfishWorkers.get(gameId);
        if (!worker) return;

        // Add random delay for more human-like play
        const delay = this.calculateMoveDelay(botGame.botProfile);
        setTimeout(() => {
            botGame.thinking = true;
            worker.postMessage({
                type: 'getMove',
                fen: game.state.fen(),
                depth: botGame.botProfile.depth,
                timeLimit: this.calculateTimeLimit(game, botGame.botProfile)
            });
        }, delay);
    }

    // Calculate human-like move delay
    calculateMoveDelay(botProfile) {
        if (botProfile.rating >= 2500) return 0;

        const baseDelay = 1000;
        const randomFactor = Math.random() * 2000;
        return baseDelay + randomFactor;
    }

    // Calculate time limit for move based on game time control and position
    calculateTimeLimit(game, botProfile) {
        const baseTime = game.timeControl.initial;
        const increment = game.timeControl.increment || 0;
        const movesLeft = 40; // Assume 40 moves left in game

        let timeLimit = (baseTime / movesLeft) + (increment * 0.8);
        
        // Adjust time based on bot rating
        timeLimit *= (botProfile.rating / 2000);

        // Cap time limit
        return Math.min(timeLimit, 10000); // Max 10 seconds per move
    }

    // Handle game end
    handleGameEnd(gameId) {
        const worker = this.stockfishWorkers.get(gameId);
        if (worker) {
            worker.terminate();
            this.stockfishWorkers.delete(gameId);
        }
        this.activeGames.delete(gameId);
    }

    // Get bot profiles
    getBotProfiles() {
        return this.botProfiles;
    }

    // Get active bot games
    getActiveBotGames() {
        return Array.from(this.activeGames.values());
    }
}

module.exports = new BotService(); 