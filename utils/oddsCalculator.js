const Chess = require('chess.js');

class OddsCalculator {
    static calculateOdds(market, gameState) {
        switch (market.type) {
            case 'winner':
                return this.calculateWinnerOdds(market, gameState);
            case 'next-move':
                return this.calculateNextMoveOdds(market, gameState);
            case 'material':
                return this.calculateMaterialOdds(market, gameState);
            default:
                throw new Error('Invalid market type');
        }
    }

    static calculateWinnerOdds(market, gameState) {
        const game = new Chess(gameState.fen);
        const odds = {
            player1: 2.0,
            draw: 3.0,
            player2: 2.0
        };

        // Adjust based on material advantage
        const materialBalance = this.calculateMaterialBalance(game);
        const materialFactor = Math.abs(materialBalance) * 0.1;
        
        if (materialBalance > 0) {
            odds.player1 /= (1 + materialFactor);
            odds.player2 *= (1 + materialFactor);
        } else if (materialBalance < 0) {
            odds.player1 *= (1 + materialFactor);
            odds.player2 /= (1 + materialFactor);
        }

        // Adjust based on position evaluation
        const evaluation = this.evaluatePosition(game);
        const evalFactor = Math.abs(evaluation) * 0.05;
        
        if (evaluation > 0) {
            odds.player1 /= (1 + evalFactor);
            odds.player2 *= (1 + evalFactor);
        } else if (evaluation < 0) {
            odds.player1 *= (1 + evalFactor);
            odds.player2 /= (1 + evalFactor);
        }

        // Adjust draw odds based on game phase
        const gamePhase = this.calculateGamePhase(game);
        if (gamePhase === 'endgame') {
            odds.draw *= 0.8; // Higher draw probability in endgame
        } else if (gamePhase === 'opening') {
            odds.draw *= 1.2; // Lower draw probability in opening
        }

        // Adjust based on time remaining
        if (gameState.timeLeft) {
            const timeDiff = gameState.timeLeft.white - gameState.timeLeft.black;
            const timeFactor = Math.abs(timeDiff) * 0.001;
            if (timeDiff > 0) {
                odds.player1 /= (1 + timeFactor);
                odds.player2 *= (1 + timeFactor);
            } else if (timeDiff < 0) {
                odds.player1 *= (1 + timeFactor);
                odds.player2 /= (1 + timeFactor);
            }
        }

        // Ensure minimum odds
        return Object.fromEntries(
            Object.entries(odds).map(([key, value]) => [key, Math.max(1.01, value)])
        );
    }

    static calculateNextMoveOdds(market, gameState) {
        const game = new Chess(gameState.fen);
        const moves = game.moves({ verbose: true });
        const odds = {
            capture: 2.1,
            check: 3.5,
            castle: 4.2
        };

        // Adjust capture odds based on available captures
        const captures = moves.filter(move => move.captured);
        if (captures.length > 0) {
            odds.capture /= (1 + captures.length * 0.2);
        } else {
            odds.capture *= 1.5;
        }

        // Adjust check odds based on available checks
        const checks = moves.filter(move => move.san.includes('+'));
        if (checks.length > 0) {
            odds.check /= (1 + checks.length * 0.3);
        } else {
            odds.check *= 1.5;
        }

        // Adjust castle odds based on castling availability
        const canCastle = game.moves().some(move => move.includes('O-O'));
        if (!canCastle) {
            odds.castle = 10.0; // Very high odds if castling is not possible
        } else {
            odds.castle /= 1.5;
        }

        return Object.fromEntries(
            Object.entries(odds).map(([key, value]) => [key, Math.max(1.01, value)])
        );
    }

    static calculateMaterialOdds(market, gameState) {
        const game = new Chess(gameState.fen);
        const currentBalance = this.calculateMaterialBalance(game);
        const odds = {
            player1: 2.3,
            even: 2.1,
            player2: 2.4
        };

        // Adjust based on current material balance
        const balanceFactor = Math.abs(currentBalance) * 0.15;
        if (currentBalance > 0) {
            odds.player1 /= (1 + balanceFactor);
            odds.player2 *= (1 + balanceFactor);
            odds.even *= (1 + balanceFactor * 0.5);
        } else if (currentBalance < 0) {
            odds.player1 *= (1 + balanceFactor);
            odds.player2 /= (1 + balanceFactor);
            odds.even *= (1 + balanceFactor * 0.5);
        }

        // Adjust based on piece mobility
        const mobilityScore = this.calculateMobilityScore(game);
        const mobilityFactor = Math.abs(mobilityScore) * 0.1;
        if (mobilityScore > 0) {
            odds.player1 /= (1 + mobilityFactor);
            odds.player2 *= (1 + mobilityFactor);
        } else if (mobilityScore < 0) {
            odds.player1 *= (1 + mobilityFactor);
            odds.player2 /= (1 + mobilityFactor);
        }

        return Object.fromEntries(
            Object.entries(odds).map(([key, value]) => [key, Math.max(1.01, value)])
        );
    }

    // Helper methods
    static calculateMaterialBalance(game) {
        const pieceValues = {
            p: 1,  // pawn
            n: 3,  // knight
            b: 3,  // bishop
            r: 5,  // rook
            q: 9   // queen
        };

        let balance = 0;
        const board = game.board();

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece) {
                    const value = pieceValues[piece.type.toLowerCase()] || 0;
                    balance += piece.color === 'w' ? value : -value;
                }
            }
        }

        return balance;
    }

    static evaluatePosition(game) {
        let score = 0;

        // Center control
        const centerSquares = ['d4', 'd5', 'e4', 'e5'];
        centerSquares.forEach(square => {
            const piece = game.get(square);
            if (piece) {
                score += piece.color === 'w' ? 0.5 : -0.5;
            }
        });

        // Piece mobility
        const whiteMoves = game.moves().length;
        game.load(game.fen().replace(' w ', ' b '));
        const blackMoves = game.moves().length;
        score += (whiteMoves - blackMoves) * 0.1;

        // King safety
        const whiteKingSafety = this.evaluateKingSafety(game, 'w');
        const blackKingSafety = this.evaluateKingSafety(game, 'b');
        score += (whiteKingSafety - blackKingSafety) * 0.2;

        return score;
    }

    static evaluateKingSafety(game, color) {
        const board = game.board();
        let safety = 0;

        // Find king position
        let kingPos;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.type === 'k' && piece.color === color) {
                    kingPos = { i, j };
                    break;
                }
            }
            if (kingPos) break;
        }

        // Check pawn shield
        if (color === 'w' && kingPos.i < 7) {
            for (let j = Math.max(0, kingPos.j - 1); j <= Math.min(7, kingPos.j + 1); j++) {
                if (board[kingPos.i + 1][j]?.type === 'p' && board[kingPos.i + 1][j]?.color === color) {
                    safety += 1;
                }
            }
        } else if (color === 'b' && kingPos.i > 0) {
            for (let j = Math.max(0, kingPos.j - 1); j <= Math.min(7, kingPos.j + 1); j++) {
                if (board[kingPos.i - 1][j]?.type === 'p' && board[kingPos.i - 1][j]?.color === color) {
                    safety += 1;
                }
            }
        }

        return safety;
    }

    static calculateGamePhase(game) {
        const moves = game.history().length;
        const pieces = game.board().flat().filter(piece => piece !== null).length;

        if (moves < 10) return 'opening';
        if (pieces <= 12) return 'endgame';
        return 'middlegame';
    }

    static calculateMobilityScore(game) {
        const whiteMoves = game.moves().length;
        game.load(game.fen().replace(' w ', ' b '));
        const blackMoves = game.moves().length;
        return whiteMoves - blackMoves;
    }

    // Market adjustment methods
    static adjustForMarketActivity(odds, market) {
        const totalPool = market.poolSize;
        if (totalPool === 0) return odds;

        const adjustedOdds = { ...odds };
        const bets = market.bets || [];

        // Calculate betting distribution
        const distribution = {};
        Object.keys(odds).forEach(key => {
            distribution[key] = bets
                .filter(bet => bet.choice === key)
                .reduce((sum, bet) => sum + bet.stake, 0);
        });

        // Adjust odds based on betting distribution
        Object.keys(odds).forEach(key => {
            const betProportion = distribution[key] / totalPool;
            const adjustment = Math.pow(1.1, betProportion);
            adjustedOdds[key] *= adjustment;
        });

        return adjustedOdds;
    }

    static applyMargin(odds, margin = 0.05) {
        const fairSum = Object.values(odds).reduce((sum, odd) => sum + 1/odd, 0);
        const marginMultiplier = (1 - margin) / fairSum;
        
        return Object.fromEntries(
            Object.entries(odds).map(([key, value]) => [
                key,
                Math.max(1.01, 1 / (marginMultiplier / value))
            ])
        );
    }
}

module.exports = OddsCalculator; 