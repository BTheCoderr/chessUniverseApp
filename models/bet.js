const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    marketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Market',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['winner', 'next-move', 'material']
    },
    choice: {
        type: String,
        required: true
    },
    stake: {
        type: Number,
        required: true,
        min: 1
    },
    odds: {
        type: Number,
        required: true,
        min: 1.01
    },
    potential: {
        type: Number,
        required: true
    },
    settled: {
        type: Boolean,
        default: false
    },
    result: {
        type: String,
        enum: ['won', 'lost', null],
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    settledAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
betSchema.index({ userId: 1, settled: 1 });
betSchema.index({ marketId: 1, settled: 1 });
betSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Bet', betSchema); 