const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');

router.get('/', async (req, res) => {
    try {
        // Get active tournaments
        const tournaments = await Tournament.find({
            status: { $in: ['pending', 'in-progress'] }
        })
        .populate('creator', 'username')
        .sort('-created')
        .limit(3);

        res.render('index', { tournaments });
    } catch (err) {
        console.error('Error fetching tournaments:', err);
        res.render('index', { error: 'Error loading tournaments' });
    }
});

module.exports = router; 