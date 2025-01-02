const express = require('express');
const router = express.Router();
const ChessAnalysisService = require('../services/stockfishService');
const { requireAuth, allowGuest } = require('../middleware/auth');

// Render bot game page
router.get('/', allowGuest, (req, res) => {
    res.render('bot', {
        title: 'Play Against Bots - Chess Universe',
        user: req.session && req.session.userId ? { id: req.session.userId } : null,
        guestId: req.session ? req.session.guestId : null,
        username: req.session ? req.session.username || 'Player' : 'Player',
        layout: 'layout',
        scripts: [
            '/socket.io/socket.io.js',
            '/js/chess.js',
            '/js/chessboard-1.0.0.min.js',
            '/js/botGame.js'
        ]
    });
});

// Get bot profiles
router.get('/profiles', allowGuest, (req, res) => {
    const bots = [
        {
            id: 1,
            name: 'Rookie Bot',
            rating: 1200,
            personality: 'Beginner',
            style: 'Standard',
            thinkingTime: 1,
            description: 'Perfect for beginners learning chess'
        },
        {
            id: 2,
            name: 'Advanced Bot',
            rating: 1800,
            personality: 'Aggressive',
            style: 'Tactical',
            thinkingTime: 2,
            description: 'Challenges players with tactical combinations'
        },
        {
            id: 3,
            name: 'Master Bot',
            rating: 2200,
            personality: 'Positional',
            style: 'Strategic',
            thinkingTime: 3,
            description: 'Tests your strategic understanding'
        }
    ];
    
    res.json(bots);
});

// Get bot move
router.post('/move', allowGuest, async (req, res) => {
    try {
        const { fen, timeLimit, botId } = req.body;
        
        if (!fen || !timeLimit || !botId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const bestMove = await ChessAnalysisService.getBestMove(fen, timeLimit, true);
        
        res.json({ move: bestMove });
    } catch (error) {
        console.error('Error getting bot move:', error);
        res.status(500).json({ error: 'Failed to calculate bot move' });
    }
});

// Get position evaluation
router.post('/evaluate', allowGuest, async (req, res) => {
    try {
        const { fen, depth } = req.body;
        
        if (!fen) {
            return res.status(400).json({ error: 'Missing FEN position' });
        }
        
        const evaluation = await ChessAnalysisService.analyzeMoves(fen, depth || 20, true);
        
        res.json(evaluation);
    } catch (error) {
        console.error('Error evaluating position:', error);
        res.status(500).json({ error: 'Failed to evaluate position' });
    }
});

module.exports = router; 