const Player = require('../models/player');

class RankingService {
    // Update all rankings (should be called periodically)
    static async updateAllRankings() {
        try {
            await Promise.all([
                Player.updateRegionalRankings(),
                Player.updateCountryRankings()
            ]);
            console.log('Rankings updated successfully');
        } catch (error) {
            console.error('Error updating rankings:', error);
        }
    }

    // Get regional leaderboard
    static async getRegionalLeaderboard(region, options = {}) {
        const {
            timeControl = 'all',
            period = 'all',
            page = 1,
            limit = 20
        } = options;

        const query = { region };
        
        // Add time control filter
        if (timeControl !== 'all') {
            query.timeControl = timeControl;
        }

        // Add time period filter
        if (period !== 'all') {
            const now = new Date();
            let dateFilter;
            
            switch(period) {
                case 'day':
                    dateFilter = new Date(now.setDate(now.getDate() - 1));
                    break;
                case 'week':
                    dateFilter = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    dateFilter = new Date(now.setMonth(now.getMonth() - 1));
                    break;
            }
            
            if (dateFilter) {
                query.updatedAt = { $gte: dateFilter };
            }
        }

        const skip = (page - 1) * limit;

        const [players, total] = await Promise.all([
            Player.find(query)
                .sort({ rating: -1 })
                .skip(skip)
                .limit(limit)
                .select('username rating avatar title countryCode regionalRank countryRank gamesPlayed winRate currentStreak'),
            Player.countDocuments(query)
        ]);

        return {
            players,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        };
    }

    // Get country leaderboard
    static async getCountryLeaderboard(countryCode, options = {}) {
        const {
            timeControl = 'all',
            period = 'all',
            page = 1,
            limit = 20
        } = options;

        const query = { countryCode: countryCode.toUpperCase() };
        
        if (timeControl !== 'all') {
            query.timeControl = timeControl;
        }

        if (period !== 'all') {
            const now = new Date();
            let dateFilter;
            
            switch(period) {
                case 'day':
                    dateFilter = new Date(now.setDate(now.getDate() - 1));
                    break;
                case 'week':
                    dateFilter = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    dateFilter = new Date(now.setMonth(now.getMonth() - 1));
                    break;
            }
            
            if (dateFilter) {
                query.updatedAt = { $gte: dateFilter };
            }
        }

        const skip = (page - 1) * limit;

        const [players, total] = await Promise.all([
            Player.find(query)
                .sort({ rating: -1 })
                .skip(skip)
                .limit(limit)
                .select('username rating avatar title countryCode regionalRank countryRank gamesPlayed winRate currentStreak'),
            Player.countDocuments(query)
        ]);

        return {
            players,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        };
    }

    // Get player's regional rank
    static async getPlayerRegionalRank(playerId) {
        const player = await Player.findById(playerId);
        if (!player) return null;

        return {
            region: player.region,
            regionalRank: player.regionalRank,
            country: player.country,
            countryRank: player.countryRank
        };
    }

    // Get region statistics
    static async getRegionStats(region) {
        const stats = await Player.aggregate([
            { $match: { region } },
            {
                $group: {
                    _id: null,
                    totalPlayers: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    highestRating: { $max: '$rating' },
                    totalGames: { $sum: '$gamesPlayed' }
                }
            }
        ]);

        return stats[0] || null;
    }

    // Schedule periodic ranking updates
    static scheduleRankingUpdates() {
        // Update rankings every hour
        setInterval(async () => {
            await this.updateAllRankings();
        }, 60 * 60 * 1000);
    }
}

module.exports = RankingService; 