const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSchema = new Schema({
    white: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    black: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    result: {
        type: String,
        enum: ['1-0', '0-1', '1/2-1/2', '*'],
        default: '*'
    },
    pgn: {
        type: String,
        default: ''
    },
    timeControl: {
        initial: {
            type: Number,
            required: true,
            min: 1
        },
        increment: {
            type: Number,
            required: true,
            min: 0
        }
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'aborted'],
        default: 'pending'
    },
    tournament: {
        type: Schema.Types.ObjectId,
        ref: 'Tournament'
    },
    tournamentRound: {
        type: Number,
        min: 1
    },
    tournamentMatch: {
        type: Schema.Types.ObjectId
    },
    created: {
        type: Date,
        default: Date.now
    },
    lastMove: {
        type: Date
    },
    winner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Pre-save middleware to update lastMove timestamp
gameSchema.pre('save', function(next) {
    if (this.isModified('pgn')) {
        this.lastMove = new Date();
    }
    next();
});

// Method to check if a player's time has run out
gameSchema.methods.checkTimeControl = function(playerColor) {
    if (!this.lastMove) return false;
    
    const elapsed = (new Date() - this.lastMove) / 1000; // Convert to seconds
    const timeLeft = this.timeControl.initial * 60 - elapsed;
    
    return timeLeft <= 0;
};

// Method to update game result
gameSchema.methods.setResult = async function(result, winner = null) {
    this.result = result;
    this.status = 'completed';
    this.winner = winner;
    
    if (this.tournament && this.tournamentMatch) {
        // Update tournament match result
        const tournament = await mongoose.model('Tournament').findById(this.tournament);
        if (tournament) {
            const match = tournament.rounds[this.tournamentRound - 1].matches
                .id(this.tournamentMatch);
            
            if (match) {
                match.status = 'completed';
                match.result = {
                    score: result,
                    winner: winner
                };
                await tournament.save();
            }
        }
    }
    
    await this.save();
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game; 