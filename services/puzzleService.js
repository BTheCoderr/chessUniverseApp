const Puzzle = require('../models/puzzle');
const User = require('../models/user');
const stockfish = require('./stockfishService');

class PuzzleService {
    async getDailyPuzzle() {
        // For now, return a simple puzzle
        return {
            id: 'daily_1',
            fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
            moves: ['d2d4'],
            rating: 1500,
            themes: ['opening', 'development'],
            description: 'Find the best developing move for White.'
        };
    }

    async getNextPuzzle(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // For now, return a simple puzzle based on user's rating
        const rating = user.statistics.puzzles.rating;
        return {
            id: 'puzzle_1',
            fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
            moves: ['d2d4'],
            rating: rating,
            themes: ['opening', 'development'],
            description: 'Find the best developing move for White.'
        };
    }

    async getPuzzlesByTheme(theme, difficulty = 5, limit = 10) {
        // For now, return an array of simple puzzles
        return Array(limit).fill({
            id: 'puzzle_theme_1',
            fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
            moves: ['d2d4'],
            rating: 1500,
            themes: [theme],
            description: 'Find the best developing move for White.'
        });
    }

    async validateMove(puzzleId, move, position, previousMoves) {
        // For demonstration, accept d2d4 as correct move
        const isCorrect = move === 'd2d4';
        return {
            correct: isCorrect,
            completed: isCorrect,
            nextMove: isCorrect ? null : 'd2d4',
            message: isCorrect ? 'Correct!' : 'Try again.'
        };
    }

    async getHint(puzzleId, moveCount = 0) {
        // For now, return a simple hint
        return {
            text: 'Consider developing your pieces and controlling the center.',
            highlightSquares: ['d2', 'd4']
        };
    }

    async updateRatings(userId, puzzleId, solved, timeSpent) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Update puzzle statistics
        if (solved) {
            user.statistics.puzzles.solved++;
            user.statistics.puzzles.streak++;
            user.statistics.puzzles.bestStreak = Math.max(
                user.statistics.puzzles.streak,
                user.statistics.puzzles.bestStreak
            );
        } else {
            user.statistics.puzzles.failed++;
            user.statistics.puzzles.streak = 0;
        }

        // Update puzzle rating (simple implementation)
        const ratingChange = solved ? 10 : -5;
        user.statistics.puzzles.rating += ratingChange;
        user.statistics.puzzles.bestRating = Math.max(
            user.statistics.puzzles.rating,
            user.statistics.puzzles.bestRating
        );

        // Add to completed puzzles
        user.progress.completedPuzzles.push({
            puzzleId,
            completedAt: new Date(),
            attempts: solved ? 1 : 0,
            timeSpent
        });

        await user.save();
    }
}

module.exports = new PuzzleService(); 