"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Utility class for calculating material balance in chess positions
 */
class MaterialCalculator {
  /**
   * Calculate material balance from a chess.js board position
   * @param {Array} position - The chess board position from chess.js
   * @returns {number} - The material balance (positive for white advantage)
   */
  static calculateBalance(position) {
    let balance = 0;
    for (let row = 0; row < position.length; row++) {
      for (let col = 0; col < position[row].length; col++) {
        const piece = position[row][col];
        if (piece && piece.type && piece.color) {
          const value = this.PIECE_VALUES[piece.type.toLowerCase()] || 0;
          balance += piece.color === 'w' ? value : -value;
        }
      }
    }
    return balance;
  }

  /**
   * Calculate material difference between two positions
   * @param {Array} position1 - The first chess board position
   * @param {Array} position2 - The second chess board position
   * @returns {number} - The material difference
   */
  static calculateDifference(position1, position2) {
    return this.calculateBalance(position1) - this.calculateBalance(position2);
  }

  /**
   * Get piece value
   * @param {string} pieceType - The type of piece (p, n, b, r, q)
   * @returns {number} - The value of the piece
   */
  static getPieceValue(pieceType) {
    return this.PIECE_VALUES[pieceType.toLowerCase()] || 0;
  }
}
exports.default = MaterialCalculator;
_defineProperty(MaterialCalculator, "PIECE_VALUES", {
  p: 1,
  // pawn
  n: 3,
  // knight
  b: 3,
  // bishop
  r: 5,
  // rook
  q: 9 // queen
});