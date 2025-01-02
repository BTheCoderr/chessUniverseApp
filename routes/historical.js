const express = require('express');
const router = express.Router();
const HistoricalGame = require('../models/historicalGame');
const historicalGameService = require('../services/historicalGameService');
const { requireAuth } = require('../middleware/auth');

// For now, show the coming soon page
router.get('/', (req, res) => {
    res.render('historical/index', {
        title: 'Game History',
        user: req.session.user,
        guestId: req.session.guestId,
        guestUsername: req.session.guestUsername
    });
});

// Original routes (currently inactive but preserved for future use)
/*
router.get('/list', requireAuth, async (req, res) => {
    try {
        const games = await HistoricalGame.find()
            .select('title event date white.name black.name result')
            .sort('-yearPlayed');
        
        res.render('historical-list', { games });
    } catch (error) {
        console.error('Error fetching historical games:', error);
        res.status(500).send('Error fetching historical games');
    }
});

router.get('/:id', requireAuth, async (req, res) => {
    try {
        const game = await HistoricalGame.findById(req.params.id);
        if (!game) {
            return res.status(404).send('Game not found');
        }
        res.render('historical', { gameId: req.params.id });
    } catch (error) {
        console.error('Error fetching historical game:', error);
        res.status(500).send('Error fetching historical game');
    }
});

// API Routes
router.get('/api/games', requireAuth, async (req, res) => {
    try {
        const games = await HistoricalGame.find()
            .select('title event date white black result opening yearPlayed tags')
            .sort('-yearPlayed');
        res.json(games);
    } catch (error) {
        console.error('Error fetching historical games:', error);
        res.status(500).json({ error: 'Error fetching historical games' });
    }
});

router.get('/api/games/:id', requireAuth, async (req, res) => {
    try {
        const game = await HistoricalGame.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json(game);
    } catch (error) {
        console.error('Error fetching historical game:', error);
        res.status(500).json({ error: 'Error fetching historical game' });
    }
});

router.post('/api/games/analyze', requireAuth, async (req, res) => {
    try {
        const { position } = req.body;
        const analysis = await historicalGameService.analyzePosition(position);
        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing position:', error);
        res.status(500).json({ error: 'Error analyzing position' });
    }
});

router.post('/api/games/save-variation', requireAuth, async (req, res) => {
    try {
        const variation = await historicalGameService.saveAlternativeLine();
        res.json(variation);
    } catch (error) {
        console.error('Error saving variation:', error);
        res.status(500).json({ error: 'Error saving variation' });
    }
});
*/

// Socket.io event handlers
const setupHistoricalGameSocket = (io) => {
    io.on('connection', (socket) => {
        socket.on('load-historical-game', async (gameId) => {
            try {
                const game = await historicalGameService.loadGame(gameId);
                socket.emit('historical-position-update', game.initialPosition);
            } catch (error) {
                console.error('Error loading historical game:', error);
                socket.emit('error', 'Error loading historical game');
            }
        });

        socket.on('historical-next-move', () => {
            const position = historicalGameService.moveForward();
            if (position) {
                socket.emit('historical-position-update', position);
            }
        });

        socket.on('historical-prev-move', () => {
            const position = historicalGameService.moveBackward();
            if (position) {
                socket.emit('historical-position-update', position);
            }
        });

        socket.on('historical-jump-to', (moveNumber) => {
            const position = historicalGameService.jumpToPosition(moveNumber);
            if (position) {
                socket.emit('historical-position-update', position);
            }
        });

        socket.on('historical-jump-to-end', () => {
            const position = historicalGameService.jumpToEnd();
            if (position) {
                socket.emit('historical-position-update', position);
            }
        });
    });
};

module.exports = { router, setupHistoricalGameSocket }; 