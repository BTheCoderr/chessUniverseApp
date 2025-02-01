const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Get leaderboard page
router.get('/', async (req, res) => {
    try {
        const { timeControl, region } = req.query;
        
        // Build query based on filters
        const query = {};
        if (timeControl) {
            query['ratings.' + timeControl.toLowerCase()] = { $exists: true };
        }
        if (region) {
            query.region = region;
        }

        // Get users with their ratings
        const users = await User.find(query)
            .select('username region ratings')
            .lean();

        // Transform data for display
        const leaderboardData = users.map(user => ({
            username: user.username,
            region: user.region || 'Unknown',
            ratings: {
                blitz: user.ratings?.blitz?.rating || '-',
                rapid: user.ratings?.rapid?.rating || '-',
                classical: user.ratings?.classical?.rating || '-',
                bullet: user.ratings?.bullet?.rating || '-'
            },
            games: {
                blitz: user.ratings?.blitz?.gamesPlayed || 0,
                rapid: user.ratings?.rapid?.gamesPlayed || 0,
                classical: user.ratings?.classical?.gamesPlayed || 0,
                bullet: user.ratings?.bullet?.gamesPlayed || 0
            },
            winRates: {
                blitz: calculateWinRate(user.ratings?.blitz),
                rapid: calculateWinRate(user.ratings?.rapid),
                classical: calculateWinRate(user.ratings?.classical),
                bullet: calculateWinRate(user.ratings?.bullet)
            }
        }));

        // Sort based on the selected time control
        if (timeControl) {
            leaderboardData.sort((a, b) => {
                const ratingA = a.ratings[timeControl.toLowerCase()] || 0;
                const ratingB = b.ratings[timeControl.toLowerCase()] || 0;
                return ratingB - ratingA;
            });
        }

        if (req.xhr) {
            // If AJAX request, send JSON
            res.json(leaderboardData);
        } else {
            // If regular request, render page
            res.render('leaderboard', {
                leaderboard: leaderboardData,
                filters: { timeControl, region }
            });
        }
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        if (req.xhr) {
            res.status(500).json({ error: 'Failed to fetch leaderboard' });
        } else {
            res.status(500).render('error', { error: 'Failed to fetch leaderboard' });
        }
    }
});

function calculateWinRate(categoryRatings) {
    if (!categoryRatings || !categoryRatings.gamesPlayed) return '-';
    const winRate = (categoryRatings.wins / categoryRatings.gamesPlayed) * 100;
    return winRate.toFixed(1) + '%';
}

module.exports = router; 