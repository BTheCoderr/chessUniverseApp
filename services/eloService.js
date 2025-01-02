const K_FACTOR = {
    new: 40,      // For players < 30 games
    standard: 20,  // For players with rating 1200-2100
    master: 10    // For players with rating > 2100
};

function getKFactor(player) {
    if (!player.statistics || player.statistics.gamesPlayed < 30) {
        return K_FACTOR.new;
    }
    if (player.statistics.rating > 2100) {
        return K_FACTOR.master;
    }
    return K_FACTOR.standard;
}

function calculateExpectedScore(playerRating, opponentRating) {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

function calculateRatingChange(player, opponent, actualScore) {
    const expectedScore = calculateExpectedScore(
        player.statistics.rating,
        opponent ? opponent.statistics.rating : 1200
    );
    const kFactor = getKFactor(player);
    return Math.round(kFactor * (actualScore - expectedScore));
}

function calculateProvisionalRating(player, opponent, actualScore) {
    // For players with less than 5 games, use a more volatile rating system
    const gamesPlayed = player.statistics.gamesPlayed;
    if (gamesPlayed < 5) {
        const opponentRating = opponent ? opponent.statistics.rating : 1200;
        const performanceRating = opponentRating + (actualScore === 1 ? 400 : actualScore === 0 ? -400 : 0);
        const currentRating = player.statistics.rating;
        return Math.round((currentRating * gamesPlayed + performanceRating) / (gamesPlayed + 1));
    }
    return player.statistics.rating + calculateRatingChange(player, opponent, actualScore);
}

module.exports = {
    calculateRatingChange,
    calculateProvisionalRating
}; 