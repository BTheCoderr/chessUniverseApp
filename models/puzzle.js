const mongoose = require('mongoose');

const puzzleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    rating: {
        type: Number,
        required: true,
        default: 1500
    },
    themes: [{
        type: String,
        required: true,
        enum: ['mate', 'fork', 'pin', 'discovery', 'skewer', 'sacrifice', 'trap', 'endgame', 'tactics']
    }],
    initialPosition: {
        fen: {
            type: String,
            required: true
        },
        turn: {
            type: String,
            required: true,
            enum: ['w', 'b']
        }
    },
    solution: {
        moves: [{
            from: String,
            to: String,
            promotion: String,
            san: String
        }],
        explanation: String,
        hints: [{
            moveIndex: Number,
            text: String
        }]
    },
    statistics: {
        attempts: {
            type: Number,
            default: 0
        },
        solves: {
            type: Number,
            default: 0
        },
        averageTime: {
            type: Number,
            default: 0
        },
        successRate: {
            type: Number,
            default: 0
        }
    },
    source: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Methods
puzzleSchema.methods.updateStats = async function(solved, timeSpent) {
    this.statistics.attempts += 1;
    
    if (solved) {
        this.statistics.solves += 1;
    }
    
    // Update average time
    const totalTime = (this.statistics.averageTime * (this.statistics.attempts - 1)) + timeSpent;
    this.statistics.averageTime = totalTime / this.statistics.attempts;
    
    // Update success rate
    this.statistics.successRate = (this.statistics.solves / this.statistics.attempts) * 100;
    
    // Update rating based on success rate
    const expectedSuccessRate = 50;
    const ratingAdjustment = Math.round((this.statistics.successRate - expectedSuccessRate) / 10);
    this.rating += ratingAdjustment;
    
    await this.save();
};

puzzleSchema.methods.getHint = function(moveIndex) {
    if (!this.solution.hints || !this.solution.hints.length) {
        return null;
    }
    
    return this.solution.hints.find(hint => hint.moveIndex === moveIndex) || null;
};

// Statics
puzzleSchema.statics.findByTheme = function(theme) {
    return this.find({ themes: theme }).sort({ rating: 1 });
};

puzzleSchema.statics.findByDifficulty = function(difficulty) {
    return this.find({ 
        difficulty: { 
            $gte: difficulty - 1, 
            $lte: difficulty + 1 
        } 
    }).sort({ rating: 1 });
};

// Indexes
puzzleSchema.index({ rating: 1 });
puzzleSchema.index({ themes: 1 });
puzzleSchema.index({ difficulty: 1 });
puzzleSchema.index({ createdAt: -1 });

const Puzzle = mongoose.model('Puzzle', puzzleSchema);

module.exports = Puzzle; 