const express = require('express');
const router = express.Router();
const puzzleService = require('../services/puzzleService');
const { requireAuth } = require('../middleware/auth');

// For now, show the coming soon page
router.get('/', (req, res) => {
    res.render('puzzles/index', {
        title: 'Chess Puzzles',
        user: req.session.user,
        guestId: req.session.guestId,
        guestUsername: req.session.guestUsername
    });
});

// Original routes (currently inactive but preserved for future use)
/*
// Get daily puzzle
router.get('/daily', async (req, res) => {
    try {
        const puzzle = await puzzleService.getDailyPuzzle();
        res.json(puzzle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get next puzzle for user
router.get('/next', requireAuth, async (req, res) => {
    try {
        const puzzle = await puzzleService.getNextPuzzle(req.user._id);
        if (!puzzle) {
            return res.status(404).json({ message: 'No suitable puzzles found' });
        }
        res.json(puzzle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get puzzles by theme
router.get('/theme/:theme', async (req, res) => {
    try {
        const { theme } = req.params;
        const { difficulty = 5, limit = 10 } = req.query;
        
        const puzzles = await puzzleService.getPuzzlesByTheme(
            theme,
            parseInt(difficulty),
            parseInt(limit)
        );
        
        res.json(puzzles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Validate move
router.post('/:puzzleId/validate', requireAuth, async (req, res) => {
    try {
        const { puzzleId } = req.params;
        const { move, position, previousMoves } = req.body;
        
        const result = await puzzleService.validateMove(
            puzzleId,
            move,
            position,
            previousMoves
        );
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get hint
router.get('/:puzzleId/hint', requireAuth, async (req, res) => {
    try {
        const { puzzleId } = req.params;
        const { moveCount = 0 } = req.query;
        
        const hint = await puzzleService.getHint(puzzleId, parseInt(moveCount));
        if (!hint) {
            return res.status(404).json({ message: 'No hint available' });
        }
        
        res.json(hint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Submit puzzle solution
router.post('/:puzzleId/submit', requireAuth, async (req, res) => {
    try {
        const { puzzleId } = req.params;
        const { solved, timeSpent } = req.body;
        
        await puzzleService.updateRatings(
            req.user._id,
            puzzleId,
            solved,
            timeSpent
        );
        
        res.json({ message: 'Puzzle progress updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's puzzle statistics
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const stats = req.user.statistics.puzzles;
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
*/

module.exports = router; 