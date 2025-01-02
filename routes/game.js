const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Game = require('../models/game');

// Helper function to generate guest username
const generateGuestUsername = () => {
    return `Guest${Math.floor(Math.random() * 10000)}`;
};

// Middleware to ensure guest session
const ensureGuestSession = (req, res, next) => {
    if (!req.session.guestId) {
        req.session.guestId = uuidv4();
        req.session.guestUsername = generateGuestUsername();
    }
    next();
};

// Play vs Human route
router.get('/play-human', ensureGuestSession, async (req, res) => {
    const mode = req.query.mode || 'quick';
    const timeControls = {
        quick: { initial: 600, increment: 0 }, // 10 minutes
        custom: req.query.timeControl || { initial: 1800, increment: 0 } // 30 minutes default for custom
    };

    try {
        res.render('game', {
            type: 'human',
            mode: mode,
            timeControl: timeControls[mode],
            guestId: req.session.guestId,
            guestUsername: req.session.guestUsername,
            isRated: mode === 'custom' && req.session.user
        });
    } catch (error) {
        console.error('Error setting up human game:', error);
        res.status(500).send('Error setting up game');
    }
});

// Route to create a new game as guest
router.get('/new', ensureGuestSession, async (req, res) => {
    try {
        res.render('game', {
            type: 'guest',
            mode: 'casual',
            timeControl: { initial: 600, increment: 0 }, // 10 minutes
            guestId: req.session.guestId,
            guestUsername: req.session.guestUsername
        });
    } catch (error) {
        console.error('Error creating new game:', error);
        res.status(500).send('Error creating new game');
    }
});

// Route to join an existing game
router.get('/:gameId', ensureGuestSession, async (req, res) => {
    try {
        const game = await Game.findById(req.params.gameId);
        if (!game) {
            return res.status(404).send('Game not found');
        }

        res.render('game', {
            type: 'guest',
            mode: game.mode,
            timeControl: game.timeControl,
            guestId: req.session.guestId,
            guestUsername: req.session.guestUsername,
            game: game
        });
    } catch (error) {
        console.error('Error joining game:', error);
        res.status(500).send('Error joining game');
    }
});

module.exports = router; 