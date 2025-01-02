const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['winner', 'next-move', 'material']
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'Suspended', 'Settled'],
        default: 'Open'
    },
    odds: [{
        choice: {
            type: String,
            required: true
        },
        value: {
            type: Number,
            required: true,
            min: 1.01
        },
        lastUpdate: {
            type: Date,
            default: Date.now
        }
    }],
    poolSize: {
        type: Number,
        default: 0,
        min: 0
    },
    totalBets: {
        type: Number,
        default: 0,
        min: 0
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    settledAt: {
        type: Date,
        default: null
    },
    result: {
        choice: {
            type: String,
            default: null
        },
        settledAt: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
});

// Indexes
marketSchema.index({ gameId: 1, type: 1 });
marketSchema.index({ active: 1 });
marketSchema.index({ createdAt: -1 });

// Virtual for total pool size
marketSchema.virtual('totalPoolSize').get(function() {
    return this.poolSize;
});

// Methods
marketSchema.methods.updateOdds = function(choice, newValue) {
    const oddIndex = this.odds.findIndex(odd => odd.choice === choice);
    if (oddIndex !== -1) {
        this.odds[oddIndex].value = newValue;
        this.odds[oddIndex].lastUpdate = new Date();
    }
};

marketSchema.methods.suspend = function() {
    this.status = 'Suspended';
    this.active = false;
};

marketSchema.methods.reopen = function() {
    this.status = 'Open';
    this.active = true;
};

marketSchema.methods.settle = function(winningChoice) {
    this.status = 'Settled';
    this.active = false;
    this.result.choice = winningChoice;
    this.result.settledAt = new Date();
    this.settledAt = new Date();
};

module.exports = mongoose.model('Market', marketSchema); 