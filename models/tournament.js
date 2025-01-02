const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tournamentSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    format: {
        type: String,
        required: true,
        enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss'],
        default: 'single_elimination'
    },
    settings: {
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
        maxPlayers: {
            type: Number,
            required: true,
            min: 2
        },
        prizePool: {
            currency: {
                type: String,
                required: true,
                default: 'USD'
            },
            total: {
                type: Number,
                required: true,
                min: 0
            }
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['registration', 'in_progress', 'completed'],
        default: 'registration'
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    currentRound: {
        type: Number,
        min: 1
    },
    rounds: [{
        number: Number,
        matches: [{
            players: [{
                type: Schema.Types.ObjectId,
                ref: 'User'
            }],
            status: {
                type: String,
                enum: ['pending', 'in_progress', 'completed'],
                default: 'pending'
            },
            gameId: {
                type: Schema.Types.ObjectId,
                ref: 'Game'
            },
            result: {
                score: String,
                winner: {
                    type: Schema.Types.ObjectId,
                    ref: 'User'
                }
            }
        }]
    }],
    winner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    runnerUp: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    created: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to check if tournament should start
tournamentSchema.pre('save', async function(next) {
    if (this.status === 'registration' && 
        this.participants.length >= this.settings.maxPlayers) {
        this.status = 'in_progress';
        this.currentRound = 1;
        this.rounds = [{ number: 1, matches: [] }];

        // Create matches for the first round
        const players = this.participants;
        for (let i = 0; i < players.length; i += 2) {
            const match = {
                players: [players[i]],
                status: 'pending'
            };
            if (i + 1 < players.length) {
                match.players.push(players[i + 1]);
            }
            this.rounds[0].matches.push(match);
        }
    }
    next();
});

// Method to advance tournament to next round
tournamentSchema.methods.advanceToNextRound = async function() {
    const currentRound = this.rounds[this.currentRound - 1];
    
    // Check if all matches in current round are completed
    if (!currentRound.matches.every(match => match.status === 'completed')) {
        throw new Error('Cannot advance round - not all matches are completed');
    }

    // Get winners from current round
    const winners = currentRound.matches
        .map(match => match.result.winner)
        .filter(winner => winner); // Filter out any null/undefined winners

    // If only one winner, tournament is complete
    if (winners.length === 1) {
        this.status = 'completed';
        this.winner = winners[0];
        
        // Find runner-up from last match
        const finalMatch = currentRound.matches[0];
        this.runnerUp = finalMatch.players.find(p => !p.equals(winners[0]));
    } else {
        // Create next round
        this.currentRound++;
        const nextRound = {
            number: this.currentRound,
            matches: []
        };

        // Create matches for next round
        for (let i = 0; i < winners.length; i += 2) {
            const match = {
                players: [winners[i]],
                status: 'pending'
            };
            if (i + 1 < winners.length) {
                match.players.push(winners[i + 1]);
            }
            nextRound.matches.push(match);
        }

        this.rounds.push(nextRound);
    }

    await this.save();
};

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament; 