const io = require('../socket');

class BettingService {
    constructor() {
        this.markets = new Map();
        this.bets = new Map();
        this.balances = new Map();
        
        // Initialize with mock data
        this.initializeMockData();
    }

    initializeMockData() {
        // Mock market data
        this.markets.set('game123', {
            id: 'game123',
            markets: [
                {
                    id: 'market1',
                    name: 'Winner',
                    odds: { white: 1.95, black: 1.85, draw: 8.5 }
                },
                {
                    id: 'market2',
                    name: 'First to Capture',
                    odds: { white: 2.1, black: 1.75 }
                }
            ]
        });

        // Mock user balance
        this.balances.set('123', 1000); // User ID -> Balance
    }

    async getGameData(gameId) {
        // Mock game data
        return {
            id: gameId,
            white: 'Player 1',
            black: 'Player 2',
            status: 'in_progress'
        };
    }

    async getMarketData(gameId) {
        return this.markets.get(gameId) || { markets: [] };
    }

    async checkUserBalance(userId, amount) {
        const balance = this.balances.get(userId) || 0;
        return balance >= amount;
    }

    async placeBets(userId, bets) {
        const betId = 'bet_' + Math.random().toString(36).substr(2, 9);
        
        // Deduct balance
        const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
        const currentBalance = this.balances.get(userId);
        this.balances.set(userId, currentBalance - totalStake);

        // Store bet
        this.bets.set(betId, {
            id: betId,
            userId,
            bets,
            status: 'active',
            timestamp: new Date()
        });

        // Emit bet placed event
        io.getIO().emit('betPlaced', {
            userId,
            betId,
            totalStake
        });

        return { betId };
    }

    async getActiveBets(userId) {
        // Filter active bets for user
        const userBets = Array.from(this.bets.values())
            .filter(bet => bet.userId === userId && bet.status === 'active');
        
        return userBets;
    }

    async getBettingHistory(userId) {
        // Get all bets for user
        const userBets = Array.from(this.bets.values())
            .filter(bet => bet.userId === userId)
            .sort((a, b) => b.timestamp - a.timestamp);
        
        return userBets;
    }

    async getMarketStats(gameId) {
        // Mock market statistics
        return {
            totalBets: 150,
            totalVolume: 25000,
            popularMarkets: [
                { id: 'market1', name: 'Winner', volume: 15000 },
                { id: 'market2', name: 'First to Capture', volume: 10000 }
            ]
        };
    }

    // Socket event handlers
    setupSocketEvents(socket) {
        socket.on('subscribeToBets', (gameId) => {
            socket.join(`game_${gameId}`);
        });

        socket.on('unsubscribeFromBets', (gameId) => {
            socket.leave(`game_${gameId}`);
        });
    }
}

module.exports = new BettingService(); 