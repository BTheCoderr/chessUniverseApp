// Game Analytics Tracking
class GameAnalytics {
    constructor() {
        this.gameStartTime = null;
        this.movesCount = 0;
        this.gameId = null;
        this.playerColor = null;
    }

    startGame(gameId, playerColor) {
        this.gameStartTime = Date.now();
        this.gameId = gameId;
        this.playerColor = playerColor;
        this.movesCount = 0;

        gtag('event', 'game_start', {
            'event_category': 'Game',
            'event_label': gameId,
            'game_id': gameId,
            'player_color': playerColor
        });
    }

    trackMove(move) {
        this.movesCount++;
        gtag('event', 'game_move', {
            'event_category': 'Game',
            'event_label': this.gameId,
            'game_id': this.gameId,
            'moves_count': this.movesCount,
            'move_notation': move
        });
    }

    endGame(result) {
        const duration = Math.round((Date.now() - this.gameStartTime) / 1000);
        gtag('event', 'game_end', {
            'event_category': 'Game',
            'event_label': this.gameId,
            'game_id': this.gameId,
            'game_duration': duration,
            'moves_count': this.movesCount,
            'result': result
        });
    }

    trackWager(amount) {
        gtag('event', 'place_wager', {
            'event_category': 'Wager',
            'event_label': this.gameId,
            'game_id': this.gameId,
            'value': amount
        });
    }

    trackError(errorType, errorMessage) {
        gtag('event', 'game_error', {
            'event_category': 'Error',
            'event_label': errorType,
            'game_id': this.gameId,
            'error_message': errorMessage
        });
    }
}

// Export for use in other files
window.gameAnalytics = new GameAnalytics(); 