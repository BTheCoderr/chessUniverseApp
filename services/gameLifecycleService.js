const Game = require('../models/game');
const Tournament = require('../models/tournament');
const User = require('../models/user');
const gameService = require('./gameService');
const stockfish = require('./stockfishService');

class GameLifecycleService {
    async createGame(options) {
        const {
            type = 'casual',
            mode = 'rapid',
            timeControl = { initial: 600, increment: 5 },
            whitePlayer,
            blackPlayer,
            tournament = null
        } = options;

        // Create game using gameService
        const game = await gameService.createGame(options);

        // If it's a tournament game, update tournament state
        if (tournament) {
            await this.initializeTournamentGame(game, tournament);
        }

        return game;
    }

    async handleGameEnd(game, result) {
        game.status = 'completed';
        game.endedAt = new Date();
        game.result = result;

        // Stop the game timer
        gameService.stopTimer(game.gameId);

        // Update player statistics and ratings
        await this.updatePlayerStats(game);

        // If it's a tournament game, update tournament progress
        if (game.tournament?.tournamentId) {
            await this.updateTournamentProgress(game);
        }

        await game.save();
        return game;
    }

    async updatePlayerStats(game) {
        if (game.type !== 'rated') return;

        const whitePlayer = await User.findById(game.players.white.userId);
        const blackPlayer = await User.findById(game.players.black.userId);

        if (!whitePlayer || !blackPlayer) return;

        // Calculate rating changes
        const { whiteChange, blackChange } = this.calculateRatingChanges(
            whitePlayer.statistics.rating,
            blackPlayer.statistics.rating,
            game.result.winner
        );

        // Update white player stats
        await this.updatePlayerGameStats(whitePlayer, {
            result: game.result.winner === 'white' ? 'win' : game.result.winner === 'black' ? 'loss' : 'draw',
            ratingChange: whiteChange,
            gameMode: game.mode,
            opponentRating: blackPlayer.statistics.rating,
            timeControl: game.timeControl
        });

        // Update black player stats
        await this.updatePlayerGameStats(blackPlayer, {
            result: game.result.winner === 'black' ? 'win' : game.result.winner === 'white' ? 'loss' : 'draw',
            ratingChange: blackChange,
            gameMode: game.mode,
            opponentRating: whitePlayer.statistics.rating,
            timeControl: game.timeControl
        });

        // Save rating changes to game record
        game.players.white.ratingChange = whiteChange;
        game.players.black.ratingChange = blackChange;
    }

    async updatePlayerGameStats(player, gameData) {
        const { result, ratingChange, gameMode, opponentRating, timeControl } = gameData;

        // Update basic statistics
        player.statistics.gamesPlayed++;
        if (result === 'win') {
            player.statistics.wins++;
            player.statistics.currentStreak = Math.max(0, player.statistics.currentStreak) + 1;
            player.statistics.winStreak++;
            player.statistics.bestWinStreak = Math.max(
                player.statistics.bestWinStreak,
                player.statistics.winStreak
            );
        } else if (result === 'loss') {
            player.statistics.losses++;
            player.statistics.currentStreak = Math.min(0, player.statistics.currentStreak) - 1;
            player.statistics.winStreak = 0;
        } else {
            player.statistics.draws++;
            player.statistics.currentStreak = 0;
            player.statistics.winStreak = 0;
        }

        // Update rating
        player.statistics.rating += ratingChange;
        player.statistics.highestRating = Math.max(
            player.statistics.highestRating,
            player.statistics.rating
        );
        player.statistics.lowestRating = Math.min(
            player.statistics.lowestRating,
            player.statistics.rating
        );

        // Update mode-specific statistics
        const modeStats = player.statistics[`${gameMode}Games`] || {
            played: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            rating: 1200,
            bestRating: 1200
        };

        modeStats.played++;
        if (result === 'win') modeStats.wins++;
        else if (result === 'loss') modeStats.losses++;
        else modeStats.draws++;

        modeStats.rating += ratingChange;
        modeStats.bestRating = Math.max(modeStats.bestRating, modeStats.rating);

        player.statistics[`${gameMode}Games`] = modeStats;

        // Add game to recent games history
        player.recentGames.unshift({
            gameMode,
            result,
            ratingChange,
            opponentRating,
            timestamp: new Date()
        });

        // Keep only last 20 games
        player.recentGames = player.recentGames.slice(0, 20);

        await player.save();
    }

    calculateRatingChanges(whiteRating, blackRating, result) {
        const K = 32; // Rating adjustment factor
        const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
        const actualWhite = result === 'white' ? 1 : result === 'black' ? 0 : 0.5;

        const whiteChange = Math.round(K * (actualWhite - expectedWhite));
        const blackChange = -whiteChange;

        return { whiteChange, blackChange };
    }

    async initializeTournamentGame(game, tournament) {
        const round = tournament.rounds[tournament.currentRound - 1];
        const match = round.matches[tournament.currentMatch];

        game.tournament = {
            tournamentId: tournament._id,
            round: tournament.currentRound,
            match: tournament.currentMatch
        };

        match.games.push(game._id);
        await tournament.save();
    }

    async updateTournamentProgress(game) {
        const tournament = await Tournament.findById(game.tournament.tournamentId);
        if (!tournament) return;

        await tournament.updateMatchResult(
            game.tournament.round,
            game.tournament.match,
            game.result
        );
    }

    getTimeControlForMode(mode) {
        switch (mode) {
            case 'bullet':
                return { initial: 180, increment: 0 }; // 3+0
            case 'blitz':
                return { initial: 300, increment: 2 }; // 5+2
            case 'rapid':
                return { initial: 600, increment: 5 }; // 10+5
            case 'classical':
                return { initial: 1800, increment: 10 }; // 30+10
            case 'lightning':
                return { initial: 60, increment: 1 }; // 1+1
            case 'custom':
                return { initial: 600, increment: 0 }; // Configurable in UI
            default:
                return { initial: 600, increment: 5 }; // Default to rapid
        }
    }
}

module.exports = new GameLifecycleService(); 