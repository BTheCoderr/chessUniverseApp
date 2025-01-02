const express = require('express');
const router = express.Router();
const gameModeService = require('../services/gameModeService');
const auth = require('../middleware/auth');

// Get available game types and time controls
router.get('/options', (req, res) => {
    res.json({
        gameTypes: gameModeService.gameTypes,
        timeControls: gameModeService.timeControls
    });
});

// Create a new game
router.post('/create', auth, async (req, res) => {
    try {
        const { gameType, timeControl, options } = req.body;
        const game = gameModeService.createGame(gameType, timeControl, options);
        res.json({ success: true, gameId: game.id });
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(400).json({ error: error.message });
    }
});

// Join a game
router.post('/join/:gameId', auth, async (req, res) => {
    try {
        const { color } = req.body;
        const game = gameModeService.joinGame(req.params.gameId, req.user.id, color);
        res.json({ success: true, game });
    } catch (error) {
        console.error('Error joining game:', error);
        res.status(400).json({ error: error.message });
    }
});

// Make a move
router.post('/move/:gameId', auth, async (req, res) => {
    try {
        const { move } = req.body;
        const result = gameModeService.makeMove(req.params.gameId, req.user.id, move);
        res.json({ success: true, move: result });
    } catch (error) {
        console.error('Error making move:', error);
        res.status(400).json({ error: error.message });
    }
});

// Resign game
router.post('/resign/:gameId', auth, async (req, res) => {
    try {
        const game = gameModeService.resignGame(req.params.gameId, req.user.id);
        res.json({ success: true, game });
    } catch (error) {
        console.error('Error resigning game:', error);
        res.status(400).json({ error: error.message });
    }
});

// Offer/accept draw
router.post('/draw/:gameId', auth, async (req, res) => {
    try {
        const { action } = req.body;
        const game = gameModeService.handleDrawOffer(req.params.gameId, req.user.id, action);
        res.json({ success: true, game });
    } catch (error) {
        console.error('Error handling draw:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get game state
router.get('/state/:gameId', auth, async (req, res) => {
    try {
        const game = gameModeService.getGame(req.params.gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json(game);
    } catch (error) {
        console.error('Error getting game state:', error);
        res.status(500).json({ error: error.message });
    }
});

// Watch a game
router.post('/watch/:gameId', auth, async (req, res) => {
    try {
        const game = gameModeService.addSpectator(req.params.gameId, req.user.id);
        res.json({ success: true, game });
    } catch (error) {
        console.error('Error watching game:', error);
        res.status(400).json({ error: error.message });
    }
});

// Stop watching a game
router.post('/unwatch/:gameId', auth, async (req, res) => {
    try {
        gameModeService.removeSpectator(req.params.gameId, req.user.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error unwatching game:', error);
        res.status(400).json({ error: error.message });
    }
});

// Handle Crazyhouse piece drops
router.post('/drop/:gameId', auth, async (req, res) => {
    try {
        const { piece, square } = req.body;
        const game = gameModeService.getGame(req.params.gameId);
        
        if (game.type !== 'crazyhouse') {
            return res.status(400).json({ error: 'Not a Crazyhouse game' });
        }

        const move = `${piece}@${square}`;
        const result = gameModeService.makeMove(req.params.gameId, req.user.id, move);
        res.json({ success: true, move: result });
    } catch (error) {
        console.error('Error dropping piece:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get active games list
router.get('/active', auth, async (req, res) => {
    try {
        const games = Array.from(gameModeService.activeGames.values())
            .filter(game => game.status === 'waiting' || game.status === 'active')
            .map(game => ({
                id: game.id,
                type: game.type,
                timeControl: game.timeControl,
                players: game.players,
                status: game.status,
                created: game.created
            }));
        res.json(games);
    } catch (error) {
        console.error('Error getting active games:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's games
router.get('/my-games', auth, async (req, res) => {
    try {
        const games = Array.from(gameModeService.activeGames.values())
            .filter(game => 
                Object.values(game.players).some(p => p.id === req.user.id)
            )
            .map(game => ({
                id: game.id,
                type: game.type,
                timeControl: game.timeControl,
                players: game.players,
                status: game.status,
                created: game.created,
                result: game.result,
                endReason: game.endReason
            }));
        res.json(games);
    } catch (error) {
        console.error('Error getting user games:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 