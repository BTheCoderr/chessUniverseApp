const HistoricalGame = require('../models/historicalGame');
const stockfishService = require('./stockfishService');

class HistoricalGameService {
    constructor() {
        this.currentGame = null;
        this.currentPosition = 0;
        this.alternativeMoves = [];
    }

    async loadGame(gameId) {
        try {
            this.currentGame = await HistoricalGame.findById(gameId);
            this.currentPosition = 0;
            this.alternativeMoves = [];
            return this.currentGame;
        } catch (error) {
            console.error('Error loading historical game:', error);
            throw error;
        }
    }

    getCurrentPosition() {
        if (!this.currentGame) return null;
        
        // Return the board state after applying moves up to currentPosition
        const position = {
            moves: this.currentGame.moves.slice(0, this.currentPosition),
            fen: this.calculateFEN(this.currentPosition),
            currentMove: this.currentPosition,
            totalMoves: this.currentGame.moves.length,
            isOriginalLine: this.alternativeMoves.length === 0
        };

        return position;
    }

    async makeAlternativeMove(from, to) {
        if (!this.currentGame) return null;

        // Get current FEN position
        const currentFEN = this.calculateFEN(this.currentPosition);

        // Analyze the alternative move using Stockfish
        const analysis = await stockfishService.analyzeMoves([`${from}${to}`], 2000);
        
        // Create a new branch from this position
        this.alternativeMoves.push({
            position: this.currentPosition,
            move: {
                from,
                to,
                analysis: analysis[0] || null
            }
        });

        this.currentPosition++;
        return this.getCurrentPosition();
    }

    moveForward() {
        if (!this.currentGame || this.currentPosition >= this.currentGame.moves.length) {
            return null;
        }
        this.currentPosition++;
        return this.getCurrentPosition();
    }

    moveBackward() {
        if (!this.currentGame || this.currentPosition <= 0) {
            return null;
        }
        this.currentPosition--;
        // Remove any alternative moves from this position
        this.alternativeMoves = this.alternativeMoves.filter(
            move => move.position < this.currentPosition
        );
        return this.getCurrentPosition();
    }

    jumpToPosition(position) {
        if (!this.currentGame || position < 0 || position > this.currentGame.moves.length) {
            return null;
        }
        this.currentPosition = position;
        // Remove any alternative moves after this position
        this.alternativeMoves = this.alternativeMoves.filter(
            move => move.position < position
        );
        return this.getCurrentPosition();
    }

    async analyzePosition() {
        if (!this.currentGame) return null;

        const currentFEN = this.calculateFEN(this.currentPosition);
        const analysis = await stockfishService.analyzeMoves([], 3000);
        
        return {
            position: this.currentPosition,
            evaluation: analysis[0]?.evaluation || null,
            bestLine: analysis[0]?.line || [],
            fen: currentFEN
        };
    }

    getGameInfo() {
        if (!this.currentGame) return null;

        return {
            title: this.currentGame.title,
            event: this.currentGame.event,
            white: this.currentGame.white,
            black: this.currentGame.black,
            date: this.currentGame.date,
            result: this.currentGame.result,
            opening: this.currentGame.opening,
            description: this.currentGame.description,
            historicalSignificance: this.currentGame.historicalSignificance
        };
    }

    calculateFEN(position) {
        // This is a placeholder - you'll need to implement the actual FEN calculation
        // based on the moves up to the given position
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }

    async saveAlternativeLine() {
        if (!this.currentGame || this.alternativeMoves.length === 0) return null;

        // Create a new variation of the historical game
        const variation = {
            ...this.currentGame.toObject(),
            _id: undefined,
            title: `${this.currentGame.title} (Alternative Line)`,
            moves: [
                ...this.currentGame.moves.slice(0, this.alternativeMoves[0].position),
                ...this.alternativeMoves.map(alt => ({
                    from: alt.move.from,
                    to: alt.move.to,
                    analysis: alt.move.analysis
                }))
            ],
            isVariation: true,
            originalGameId: this.currentGame._id
        };

        try {
            const newVariation = new HistoricalGame(variation);
            await newVariation.save();
            return newVariation;
        } catch (error) {
            console.error('Error saving alternative line:', error);
            throw error;
        }
    }
}

module.exports = new HistoricalGameService(); 