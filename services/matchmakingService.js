class MatchmakingService {
    constructor() {
        this.queues = {
            blitz: new Map(),
            rapid: new Map(),
            classical: new Map()
        };
        this.ratingRange = 200; // Initial rating range for matching
        this.maxRatingRange = 400; // Maximum rating range for matching
        this.ratingRangeIncrement = 50; // How much to increase range after each check
        this.queueTimeout = 60000; // 1 minute timeout
    }

    addToQueue(playerId, rating, preferences) {
        const { mode = 'rapid', type = 'casual' } = preferences;
        const queue = this.queues[mode];

        // Remove player from other queues if present
        Object.values(this.queues).forEach(q => q.delete(playerId));

        // Add to queue with timestamp
        queue.set(playerId, {
            rating,
            type,
            timestamp: Date.now(),
            preferences
        });

        // Try to find a match
        return this.findMatch(playerId, mode);
    }

    findMatch(playerId, mode) {
        const queue = this.queues[mode];
        const player = queue.get(playerId);
        if (!player) return null;

        let ratingRange = this.ratingRange;
        const playerRating = player.rating;
        const playerType = player.type;

        while (ratingRange <= this.maxRatingRange) {
            for (const [otherId, other] of queue) {
                if (otherId === playerId) continue;

                // Check if players can be matched
                if (this.canMatch(player, other, ratingRange)) {
                    // Remove both players from queue
                    queue.delete(playerId);
                    queue.delete(otherId);

                    // Determine colors randomly
                    const isWhite = Math.random() < 0.5;
                    return {
                        players: isWhite ? 
                            [{ _id: playerId, rating: playerRating }, { _id: otherId, rating: other.rating }] :
                            [{ _id: otherId, rating: other.rating }, { _id: playerId, rating: playerRating }],
                        type: playerType === other.type ? playerType : 'casual' // If either player wants casual, make it casual
                    };
                }
            }
            ratingRange += this.ratingRangeIncrement;
        }

        // Clean up old entries
        this.cleanQueue(queue);
        return null;
    }

    canMatch(player1, player2, ratingRange) {
        // Check rating difference
        const ratingDiff = Math.abs(player1.rating - player2.rating);
        if (ratingDiff > ratingRange) return false;

        // Check if either player has timed out
        const now = Date.now();
        if (now - player1.timestamp > this.queueTimeout || 
            now - player2.timestamp > this.queueTimeout) {
            return false;
        }

        // Additional matching criteria can be added here
        // For example, checking specific preferences like time control

        return true;
    }

    cleanQueue(queue) {
        const now = Date.now();
        for (const [playerId, data] of queue) {
            if (now - data.timestamp > this.queueTimeout) {
                queue.delete(playerId);
            }
        }
    }

    removeFromQueue(playerId) {
        Object.values(this.queues).forEach(queue => queue.delete(playerId));
    }

    getQueueStatus(playerId) {
        for (const [mode, queue] of Object.entries(this.queues)) {
            if (queue.has(playerId)) {
                const player = queue.get(playerId);
                return {
                    mode,
                    waitTime: Date.now() - player.timestamp,
                    preferences: player.preferences
                };
            }
        }
        return null;
    }

    getQueueLength(mode) {
        return this.queues[mode]?.size || 0;
    }
}

module.exports = new MatchmakingService(); 