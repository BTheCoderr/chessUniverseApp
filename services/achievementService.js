const User = require('../models/user');
const Game = require('../models/game');
const Leaderboard = require('../models/leaderboard');

class AchievementService {
    constructor() {
        this.achievements = {
            gamePlay: [
                { id: 'first_win', name: 'First Victory', description: 'Win your first game', points: 10 },
                { id: 'win_streak_5', name: 'Winning Streak', description: 'Win 5 games in a row', points: 25 },
                { id: 'win_streak_10', name: 'Unstoppable', description: 'Win 10 games in a row', points: 50 },
                { id: 'games_100', name: 'Century', description: 'Play 100 games', points: 30 },
                { id: 'games_1000', name: 'Veteran', description: 'Play 1000 games', points: 100 }
            ],
            rating: [
                { id: 'rating_1200', name: 'Intermediate', description: 'Reach 1200 rating', points: 20 },
                { id: 'rating_1500', name: 'Advanced', description: 'Reach 1500 rating', points: 40 },
                { id: 'rating_1800', name: 'Expert', description: 'Reach 1800 rating', points: 60 },
                { id: 'rating_2000', name: 'Master', description: 'Reach 2000 rating', points: 100 }
            ],
            tournaments: [
                { id: 'tournament_win', name: 'Tournament Victor', description: 'Win a tournament', points: 50 },
                { id: 'tournament_3_wins', name: 'Tournament Master', description: 'Win 3 tournaments', points: 100 }
            ],
            puzzles: [
                { id: 'puzzle_streak_5', name: 'Tactical Vision', description: 'Solve 5 puzzles in a row', points: 15 },
                { id: 'puzzle_rating_1500', name: 'Puzzle Master', description: 'Reach 1500 puzzle rating', points: 30 }
            ],
            social: [
                { id: 'friend_games_10', name: 'Friendly Rival', description: 'Play 10 games with friends', points: 20 },
                { id: 'club_join', name: 'Club Member', description: 'Join a chess club', points: 10 },
                { id: 'tournament_organize', name: 'Tournament Organizer', description: 'Organize a tournament', points: 40 }
            ]
        };
    }

    async checkAndAwardAchievements(userId, context) {
        const user = await User.findById(userId);
        if (!user) return;

        const newAchievements = [];
        const userStats = user.statistics;

        // Check game-related achievements
        if (context.type === 'game') {
            if (context.result === 'win') {
                if (!user.achievements.includes('first_win')) {
                    newAchievements.push(this.achievements.gamePlay[0]);
                }
                
                if (userStats.currentWinStreak >= 5 && !user.achievements.includes('win_streak_5')) {
                    newAchievements.push(this.achievements.gamePlay[1]);
                }
                
                if (userStats.currentWinStreak >= 10 && !user.achievements.includes('win_streak_10')) {
                    newAchievements.push(this.achievements.gamePlay[2]);
                }
            }
            
            if (userStats.gamesPlayed >= 100 && !user.achievements.includes('games_100')) {
                newAchievements.push(this.achievements.gamePlay[3]);
            }
            
            if (userStats.gamesPlayed >= 1000 && !user.achievements.includes('games_1000')) {
                newAchievements.push(this.achievements.gamePlay[4]);
            }
        }

        // Check rating achievements
        if (context.type === 'rating_update') {
            const rating = context.newRating;
            if (rating >= 1200 && !user.achievements.includes('rating_1200')) {
                newAchievements.push(this.achievements.rating[0]);
            }
            if (rating >= 1500 && !user.achievements.includes('rating_1500')) {
                newAchievements.push(this.achievements.rating[1]);
            }
            if (rating >= 1800 && !user.achievements.includes('rating_1800')) {
                newAchievements.push(this.achievements.rating[2]);
            }
            if (rating >= 2000 && !user.achievements.includes('rating_2000')) {
                newAchievements.push(this.achievements.rating[3]);
            }
        }

        // Award new achievements
        if (newAchievements.length > 0) {
            const achievementIds = newAchievements.map(a => a.id);
            const totalPoints = newAchievements.reduce((sum, a) => sum + a.points, 0);

            await User.findByIdAndUpdate(userId, {
                $push: { achievements: { $each: achievementIds } },
                $inc: { achievementPoints: totalPoints }
            });

            // Update leaderboard
            const leaderboard = await Leaderboard.getCurrentLeaderboard('allTime', 'achievements');
            if (leaderboard) {
                await leaderboard.updateAchievements(userId, {
                    type: 'multiple',
                    description: `Earned ${newAchievements.length} new achievements`
                });
            }

            return newAchievements;
        }

        return [];
    }

    async getSocialRecommendations(userId) {
        const user = await User.findById(userId);
        if (!user) return [];

        // Get users with similar rating
        const ratingRange = 200;
        const similarPlayers = await User.find({
            _id: { $ne: userId },
            'statistics.rating': {
                $gte: user.statistics.rating - ratingRange,
                $lte: user.statistics.rating + ratingRange
            }
        }).limit(5);

        // Get active tournament players
        const activeTournamentPlayers = await User.find({
            _id: { $ne: userId },
            'statistics.tournamentsPlayed': { $gt: 0 }
        }).sort('-statistics.tournamentWins').limit(5);

        // Get club recommendations
        const recommendedClubs = await this.getRecommendedClubs(user);

        return {
            similarPlayers,
            activeTournamentPlayers,
            recommendedClubs
        };
    }

    async getRecommendedClubs(user) {
        // Implementation for club recommendations based on user's level and interests
        // This would be expanded based on the club system implementation
        return [];
    }

    async updateSocialStats(userId, action) {
        const updates = {};
        
        switch (action.type) {
            case 'friend_game':
                updates.$inc = { 'statistics.friendGamesPlayed': 1 };
                break;
            case 'club_activity':
                updates.$inc = { 'statistics.clubActivities': 1 };
                break;
            case 'tournament_organized':
                updates.$inc = { 'statistics.tournamentsOrganized': 1 };
                break;
        }

        if (Object.keys(updates).length > 0) {
            await User.findByIdAndUpdate(userId, updates);
            await this.checkAndAwardAchievements(userId, { type: action.type });
        }
    }
}

module.exports = new AchievementService(); 