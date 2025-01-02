const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'allTime', 'tournament'],
        required: true
    },
    category: {
        type: String,
        enum: ['blitz', 'rapid', 'classical', 'bullet', 'puzzle', 'tournament'],
        required: true
    },
    entries: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        rating: Number,
        rank: Number,
        score: Number,
        wins: Number,
        losses: Number,
        draws: Number,
        winStreak: Number,
        bestWinStreak: Number,
        tournamentPoints: Number,
        puzzlesSolved: Number,
        averagePuzzleRating: Number,
        achievements: [{
            type: String,
            dateAchieved: Date,
            description: String
        }]
    }],
    startDate: Date,
    endDate: Date,
    lastUpdated: { type: Date, default: Date.now }
});

// Indexes for efficient querying
leaderboardSchema.index({ type: 1, category: 1 });
leaderboardSchema.index({ 'entries.rating': -1 });
leaderboardSchema.index({ 'entries.score': -1 });

// Methods for leaderboard management
leaderboardSchema.methods.updateRanks = async function() {
    // Sort entries by score/rating and update ranks
    this.entries.sort((a, b) => b.score - a.score || b.rating - a.rating);
    this.entries.forEach((entry, index) => {
        entry.rank = index + 1;
    });
    this.lastUpdated = new Date();
    await this.save();
};

leaderboardSchema.methods.addEntry = async function(userData) {
    const existingEntry = this.entries.find(e => e.userId.equals(userData.userId));
    
    if (existingEntry) {
        Object.assign(existingEntry, userData);
        if (userData.winStreak > existingEntry.bestWinStreak) {
            existingEntry.bestWinStreak = userData.winStreak;
        }
    } else {
        this.entries.push(userData);
    }
    
    await this.updateRanks();
};

leaderboardSchema.methods.getTopPlayers = function(limit = 100) {
    return this.entries.slice(0, limit);
};

leaderboardSchema.methods.getPlayerRank = function(userId) {
    const entry = this.entries.find(e => e.userId.equals(userId));
    return entry ? entry.rank : null;
};

leaderboardSchema.methods.updateAchievements = async function(userId, achievement) {
    const entry = this.entries.find(e => e.userId.equals(userId));
    if (entry) {
        entry.achievements.push({
            type: achievement.type,
            dateAchieved: new Date(),
            description: achievement.description
        });
        await this.save();
    }
};

// Static methods for leaderboard management
leaderboardSchema.statics.createPeriodic = async function(type, category) {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch (type) {
        case 'daily':
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(0, 0, 0, 0);
            break;
        case 'weekly':
            startDate.setDate(startDate.getDate() - startDate.getDay());
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
            break;
        case 'monthly':
            startDate.setDate(1);
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            break;
    }
    
    return await this.create({
        type,
        category,
        startDate,
        endDate,
        entries: []
    });
};

leaderboardSchema.statics.getCurrentLeaderboard = async function(type, category) {
    const now = new Date();
    return await this.findOne({
        type,
        category,
        startDate: { $lte: now },
        endDate: { $gt: now }
    });
};

module.exports = mongoose.model('Leaderboard', leaderboardSchema); 