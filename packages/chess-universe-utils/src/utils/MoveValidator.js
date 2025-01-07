/**
 * Utility class for validating chess moves
 */
export default class MoveValidator {
    /**
     * Check if a move is legal in the current position
     * @param {Object} game - The chess.js game instance
     * @param {string} from - Starting square (e.g., 'e2')
     * @param {string} to - Target square (e.g., 'e4')
     * @returns {boolean} - Whether the move is legal
     */
    static isLegalMove(game, from, to) {
        const moves = game.moves({ square: from, verbose: true });
        return moves.some(move => move.to === to);
    }

    /**
     * Get all legal moves for a piece
     * @param {Object} game - The chess.js game instance
     * @param {string} square - The square to get moves for (e.g., 'e2')
     * @returns {Array} - Array of legal moves in verbose format
     */
    static getLegalMoves(game, square) {
        return game.moves({ square, verbose: true });
    }

    /**
     * Check if a square is under attack
     * @param {Object} game - The chess.js game instance
     * @param {string} square - The square to check
     * @param {string} byColor - Color of the attacking side ('w' or 'b')
     * @returns {boolean} - Whether the square is under attack
     */
    static isSquareAttacked(game, square, byColor) {
        return game.isAttacked(square, byColor);
    }

    /**
     * Check if a move would result in check
     * @param {Object} game - The chess.js game instance
     * @param {string} from - Starting square
     * @param {string} to - Target square
     * @returns {boolean} - Whether the move results in check
     */
    static moveCausesCheck(game, from, to) {
        const testGame = { ...game }; // Create a copy
        const move = testGame.move({ from, to, verbose: true });
        if (!move) return false;
        return testGame.inCheck();
    }

    /**
     * Get all squares that are attacking a specific square
     * @param {Object} game - The chess.js game instance
     * @param {string} square - The square being attacked
     * @param {string} byColor - Color of the attacking side ('w' or 'b')
     * @returns {Array} - Array of squares that are attacking the target square
     */
    static getAttackingSquares(game, square, byColor) {
        const attackingSquares = [];
        const board = game.board();
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.color === byColor) {
                    const from = this._coordinatesToSquare(j, i);
                    if (this.isLegalMove(game, from, square)) {
                        attackingSquares.push(from);
                    }
                }
            }
        }
        
        return attackingSquares;
    }

    /**
     * Convert coordinates to chess square notation
     * @private
     */
    static _coordinatesToSquare(x, y) {
        return String.fromCharCode(97 + x) + (8 - y);
    }
} 