const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    rating: {
        type: Number,
        default: 1200
    },
    gamesPlayed: {
        type: Number,
        default: 0
    },
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    draws: {
        type: Number,
        default: 0
    },
    tournaments: [{
        type: Schema.Types.ObjectId,
        ref: 'Tournament'
    }],
    tournamentsWon: [{
        type: Schema.Types.ObjectId,
        ref: 'Tournament'
    }],
    created: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: '/img/default-avatar.png'
    },
    settings: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'dark'
        },
        sound: {
            type: Boolean,
            default: true
        },
        notifications: {
            type: Boolean,
            default: true
        }
    }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (err) {
        throw err;
    }
};

// Method to update rating after a game
userSchema.methods.updateRating = async function(opponent, result) {
    const K = 32; // Rating coefficient
    const expectedScore = 1 / (1 + Math.pow(10, (opponent.rating - this.rating) / 400));
    const actualScore = result === 'win' ? 1 : result === 'loss' ? 0 : 0.5;
    
    const ratingChange = Math.round(K * (actualScore - expectedScore));
    this.rating += ratingChange;
    
    // Update game statistics
    this.gamesPlayed += 1;
    if (result === 'win') this.wins += 1;
    else if (result === 'loss') this.losses += 1;
    else this.draws += 1;
    
    await this.save();
    return ratingChange;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 