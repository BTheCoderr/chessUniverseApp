const mongoose = require('mongoose');

const historicalGameSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    event: String,
    site: String,
    date: Date,
    white: {
        name: String,
        title: String,
        rating: Number
    },
    black: {
        name: String,
        title: String,
        rating: Number
    },
    result: String,
    pgn: {
        type: String,
        required: true
    },
    moves: [{
        from: String,
        to: String,
        piece: String,
        capture: Boolean,
        check: Boolean,
        mate: Boolean,
        promotion: String,
        annotation: String
    }],
    opening: {
        name: String,
        eco: String // Encyclopedia of Chess Openings code
    },
    description: String,
    historicalSignificance: String,
    yearPlayed: Number,
    tags: [String]
});

module.exports = mongoose.model('HistoricalGame', historicalGameSchema); 