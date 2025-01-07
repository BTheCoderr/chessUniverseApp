"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Utility class for validating chess moves
 */
class MoveValidator {
  /**
   * Check if a move is legal in the current position
   * @param {Object} game - The chess.js game instance
   * @param {string} from - Starting square (e.g., 'e2')
   * @param {string} to - Target square (e.g., 'e4')
   * @returns {boolean} - Whether the move is legal
   */
  static isLegalMove(game, from, to) {
    const moves = game.moves({
      square: from,
      verbose: true
    });
    return moves.some(move => move.to === to);
  }

  /**
   * Get all legal moves for a piece
   * @param {Object} game - The chess.js game instance
   * @param {string} square - The square to get moves for (e.g., 'e2')
   * @returns {Array} - Array of legal moves in verbose format
   */
  static getLegalMoves(game, square) {
    return game.moves({
      square,
      verbose: true
    });
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
    const testGame = _objectSpread({}, game); // Create a copy
    const move = testGame.move({
      from,
      to,
      verbose: true
    });
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
exports.default = MoveValidator;