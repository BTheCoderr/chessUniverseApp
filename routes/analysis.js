const express = require('express');
const router = express.Router();
const analysisService = require('../services/analysisService');
const { requireAuth } = require('../middleware/auth');

// For now, show the coming soon page
router.get('/', (req, res) => {
    res.render('analysis/index', {
        title: 'Game Analysis',
        user: req.session.user,
        guestId: req.session.guestId,
        guestUsername: req.session.guestUsername
    });
});

// Original routes (currently inactive but preserved for future use)
/*
// Analyze position
router.post('/analyze', async (req, res) => {
    try {
        const { fen, depth = 20 } = req.body;
        const analysis = await analysisService.analyzePosition(fen, depth);
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get best move
router.post('/best-move', async (req, res) => {
    try {
        const { fen, depth = 20 } = req.body;
        const bestMove = await analysisService.getBestMove(fen, depth);
        res.json(bestMove);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Save analysis
router.post('/save', requireAuth, async (req, res) => {
    try {
        const { gameId, analysis } = req.body;
        await analysisService.saveAnalysis(gameId, analysis, req.user._id);
        res.json({ message: 'Analysis saved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get saved analysis
router.get('/saved/:gameId', requireAuth, async (req, res) => {
    try {
        const analysis = await analysisService.getSavedAnalysis(req.params.gameId, req.user._id);
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get opening information
router.post('/opening', async (req, res) => {
    try {
        const { moves } = req.body;
        const opening = await analysisService.getOpeningInfo(moves);
        res.json(opening);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get position statistics
router.post('/stats', async (req, res) => {
    try {
        const { fen } = req.body;
        const stats = await analysisService.getPositionStats(fen);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
*/

module.exports = router; 