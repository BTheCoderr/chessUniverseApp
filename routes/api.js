const express = require('express');
const router = express.Router();
const ChessAnalysisService = require('../services/stockfishService');

// Game state endpoints
router.post('/game/move', async (req, res) => {
    try {
        const { fen, move } = req.body;
        // Validate move and update game state
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Analysis endpoints
router.post('/analysis/evaluate', async (req, res) => {
    try {
        const { fen, depth } = req.body;
        const evaluation = await ChessAnalysisService.analyzeMoves(fen, depth || 20);
        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 