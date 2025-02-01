const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    rating: {
        type: Number,
        default: 1200
    },
    // Location information
    country: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        required: true,
        uppercase: true
    },
    region: {
        type: String,
        enum: ['NA', 'SA', 'EU', 'AS', 'AF', 'OC'], // North America, South America, Europe, Asia, Africa, Oceania
        required: true
    },
    city: String,
    timezone: String,
    // Game statistics
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
    winRate: {
        type: Number,
        default: 0
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    bestStreak: {
        type: Number,
        default: 0
    },
    // Title information
    title: {
        type: String,
        enum: [null, 'GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM'],
        default: null
    },
    // Rating history
    ratingHistory: [{
        rating: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    // Regional rankings
    regionalRank: {
        type: Number,
        default: null
    },
    countryRank: {
        type: Number,
        default: null
    },
    // Last location update
    lastLocationUpdate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate win rate before saving
playerSchema.pre('save', function(next) {
    if (this.gamesPlayed > 0) {
        this.winRate = (this.wins / this.gamesPlayed) * 100;
    }
    next();
});

// Method to update location based on IP
playerSchema.methods.updateLocation = async function(ip) {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        
        this.country = data.country_name;
        this.countryCode = data.country_code;
        this.city = data.city;
        this.timezone = data.timezone;
        
        // Map country to region
        this.region = this.getRegionFromCountry(data.country_code);
        this.lastLocationUpdate = new Date();
        
        await this.save();
    } catch (error) {
        console.error('Error updating location:', error);
    }
};

// Helper method to map country codes to regions
playerSchema.methods.getRegionFromCountry = function(countryCode) {
    const regionMappings = {
        // North America
        'US': 'NA', 'CA': 'NA', 'MX': 'NA',
        // South America
        'BR': 'SA', 'AR': 'SA', 'CL': 'SA', 'CO': 'SA', 'PE': 'SA',
        // Europe
        'GB': 'EU', 'FR': 'EU', 'DE': 'EU', 'IT': 'EU', 'ES': 'EU',
        // Asia
        'CN': 'AS', 'JP': 'AS', 'KR': 'AS', 'IN': 'AS',
        // Africa
        'ZA': 'AF', 'NG': 'AF', 'EG': 'AF',
        // Oceania
        'AU': 'OC', 'NZ': 'OC'
    };
    
    return regionMappings[countryCode] || 'EU'; // Default to EU if unknown
};

// Static method to update regional rankings
playerSchema.statics.updateRegionalRankings = async function() {
    const regions = ['NA', 'SA', 'EU', 'AS', 'AF', 'OC'];
    
    for (const region of regions) {
        const players = await this.find({ region })
            .sort({ rating: -1 });
        
        for (let i = 0; i < players.length; i++) {
            players[i].regionalRank = i + 1;
            await players[i].save();
        }
    }
};

// Static method to update country rankings
playerSchema.statics.updateCountryRankings = async function() {
    const countries = await this.distinct('countryCode');
    
    for (const countryCode of countries) {
        const players = await this.find({ countryCode })
            .sort({ rating: -1 });
        
        for (let i = 0; i < players.length; i++) {
            players[i].countryRank = i + 1;
            await players[i].save();
        }
    }
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player; 