const express = require('express');
const router = express.Router();
const bettingService = require('../services/bettingService');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/webm', 'video/webm', 'application/octet-stream'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Get betting page for a specific game
router.get('/:gameId', auth, async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const userId = req.user.id;
        
        // Get game and market data
        const gameData = await bettingService.getGameData(gameId);
        const marketData = await bettingService.getMarketData(gameId);
        
        res.render('betting', {
            title: 'Chess Betting',
            gameData,
            marketData,
            userId
        });
    } catch (error) {
        console.error('Error loading betting page:', error);
        res.status(500).send('Error loading betting page');
    }
});

// Get market data
router.get('/api/markets/:gameId', auth, async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const markets = await bettingService.getMarketData(gameId);
        res.json(markets);
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

// Place a bet
router.post('/api/place-bet', auth, async (req, res) => {
    try {
        const { bets } = req.body;
        const userId = req.user.id;

        // Validate bet data
        if (!Array.isArray(bets) || bets.length === 0) {
            return res.status(400).json({ error: 'Invalid bet data' });
        }

        // Validate user's balance
        const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
        const hasBalance = await bettingService.checkUserBalance(userId, totalStake);
        
        if (!hasBalance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Place bets
        const result = await bettingService.placeBets(userId, bets);
        res.json({ success: true, betId: result.betId });
    } catch (error) {
        console.error('Error placing bet:', error);
        res.status(500).json({ error: 'Failed to place bet' });
    }
});

// Get user's active bets
router.get('/api/active-bets', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const activeBets = await bettingService.getActiveBets(userId);
        res.json(activeBets);
    } catch (error) {
        console.error('Error fetching active bets:', error);
        res.status(500).json({ error: 'Failed to fetch active bets' });
    }
});

// Get user's betting history
router.get('/api/betting-history', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await bettingService.getBettingHistory(userId);
        res.json(history);
    } catch (error) {
        console.error('Error fetching betting history:', error);
        res.status(500).json({ error: 'Failed to fetch betting history' });
    }
});

// Get market statistics
router.get('/api/market-stats/:gameId', auth, async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const stats = await bettingService.getMarketStats(gameId);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching market stats:', error);
        res.status(500).json({ error: 'Failed to fetch market statistics' });
    }
});

// File upload route
router.post('/api/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            url: fileUrl,
            metadata: {
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

module.exports = router; 