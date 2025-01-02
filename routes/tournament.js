const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const { requireAuth } = require('../middleware/auth');
const Game = require('../models/game');

// Get all tournaments
router.get('/', async (req, res) => {
    try {
        const tournaments = await Tournament.find()
            .populate('creator', 'username')
            .populate('winner', 'username')
            .populate('runnerUp', 'username')
            .sort('-created');
        
        res.render('tournaments/index', { tournaments });
    } catch (err) {
        console.error('Error fetching tournaments:', err);
        res.redirect('/');
    }
});

// Create tournament page
router.get('/create', requireAuth, (req, res) => {
    res.render('tournaments/create', {
        title: 'Create Tournament',
        user: req.user
    });
});

// Create new tournament
router.post('/create', requireAuth, async (req, res) => {
    try {
        const {
            title,
            format,
            timeControl,
            maxPlayers,
            prizePool
        } = req.body;

        const tournament = new Tournament({
            title,
            format,
            settings: {
                timeControl: {
                    initial: parseInt(timeControl.initial),
                    increment: parseInt(timeControl.increment)
                },
                maxPlayers: parseInt(maxPlayers),
                prizePool: {
                    currency: prizePool.currency,
                    total: parseFloat(prizePool.total)
                }
            },
            creator: req.session.userId,
            status: 'registration'
        });

        await tournament.save();
        res.redirect(`/tournament/${tournament._id}`);
    } catch (err) {
        console.error('Error creating tournament:', err);
        res.render('tournaments/create', { error: 'Error creating tournament' });
    }
});

// View tournament details
router.get('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('creator', 'username')
            .populate('participants', 'username rating')
            .populate('winner', 'username')
            .populate('runnerUp', 'username');
        
        if (!tournament) {
            return res.redirect('/tournaments');
        }

        res.render('tournaments/view', { tournament });
    } catch (err) {
        console.error('Error fetching tournament:', err);
        res.redirect('/tournaments');
    }
});

// Join tournament
router.post('/:id/join', requireAuth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.status !== 'registration') {
            return res.status(400).json({ error: 'Tournament is not open for registration' });
        }

        if (tournament.participants.length >= tournament.settings.maxPlayers) {
            return res.status(400).json({ error: 'Tournament is full' });
        }

        if (tournament.participants.some(p => p.equals(req.session.userId))) {
            return res.status(400).json({ error: 'Already registered for this tournament' });
        }

        tournament.participants.push(req.session.userId);
        await tournament.save();

        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start tournament (creator only)
router.post('/:id/start', requireAuth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (!tournament.creator.equals(req.session.userId)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (tournament.status !== 'registration') {
            return res.status(400).json({ error: 'Tournament cannot be started' });
        }

        tournament.status = 'in_progress';
        tournament.currentRound = 1;
        tournament.rounds = [{ number: 1, matches: [] }];

        // Create matches for the first round
        const players = tournament.participants;
        for (let i = 0; i < players.length; i += 2) {
            const match = {
                players: [players[i]],
                status: 'pending'
            };
            if (i + 1 < players.length) {
                match.players.push(players[i + 1]);
            }
            tournament.rounds[0].matches.push(match);
        }

        await tournament.save();
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update match result
router.post('/:id/match/:matchId/result', requireAuth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const { result } = req.body;
        const match = tournament.rounds[tournament.currentRound - 1].matches
            .find(m => m._id.equals(req.params.matchId));

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        match.status = 'completed';
        match.result = result;
        await tournament.save();

        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start a game for a tournament match
router.post('/:id/match/:matchId/start', requireAuth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('participants', 'username rating');

        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const match = tournament.rounds[tournament.currentRound - 1].matches
            .find(m => m._id.equals(req.params.matchId));

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        if (match.status !== 'pending') {
            return res.status(400).json({ error: 'Match already started or completed' });
        }

        if (match.players.length !== 2) {
            return res.status(400).json({ error: 'Match requires exactly two players' });
        }

        // Create a new game for the match
        const game = new Game({
            white: match.players[0],
            black: match.players[1],
            timeControl: tournament.settings.timeControl,
            tournament: tournament._id,
            tournamentRound: tournament.currentRound,
            tournamentMatch: match._id
        });

        await game.save();

        match.status = 'in_progress';
        match.gameId = game._id;
        await tournament.save();

        res.json({ success: true, gameId: game._id });
    } catch (err) {
        console.error('Error starting tournament game:', err);
        res.status(500).json({ error: 'Error starting tournament game' });
    }
});

module.exports = router; 