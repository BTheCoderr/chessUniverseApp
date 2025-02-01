const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { generatePGN } = require('../utils/pgnGenerator');
const Game = require('../models/game');

// Get game history page
router.get('/', async (req, res) => {
    try {
        const games = await Game.find({ 
            $or: [
                { white: req.user._id },
                { black: req.user._id }
            ]
        })
        .populate('white black', 'username')
        .sort({ date: -1 });

        res.render('game-history', { games });
    } catch (error) {
        console.error('Error fetching game history:', error);
        res.status(500).send('Error fetching game history');
    }
});

// Download PGN for a specific game
router.get('/download-pgn/:gameId', async (req, res) => {
    try {
        const game = await Game.findById(req.params.gameId)
            .populate('white black', 'username');

        if (!game) {
            return res.status(404).send('Game not found');
        }

        // Check if user has permission to download this game
        if (game.white._id.toString() !== req.user._id.toString() && 
            game.black._id.toString() !== req.user._id.toString()) {
            return res.status(403).send('Unauthorized');
        }

        const gameData = {
            event: 'Chess Universe Game',
            date: game.date,
            white: game.white.username,
            black: game.black.username,
            result: game.result,
            timeControl: `${game.timeControl.initial}+${game.timeControl.increment}`,
            whiteElo: game.whiteElo,
            blackElo: game.blackElo,
            moves: game.moves
        };

        const pgn = generatePGN(gameData);
        const fileName = `game_${req.params.gameId}.pgn`;
        const filePath = path.join(__dirname, '..', 'temp', fileName);

        // Ensure temp directory exists
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        // Write PGN file
        fs.writeFileSync(filePath, pgn);

        // Send file and clean up
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error sending PGN file:', err);
            }
            // Clean up temp file
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error cleaning up temp PGN file:', unlinkErr);
                }
            });
        });
    } catch (error) {
        console.error('Error generating PGN:', error);
        res.status(500).send('Error generating PGN file');
    }
});

module.exports = router; 