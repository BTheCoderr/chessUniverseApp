"use strict";

var _MaterialCalculator = _interopRequireDefault(require("../MaterialCalculator"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
describe('MaterialCalculator', () => {
  const mockPosition = [[{
    type: 'r',
    color: 'b'
  }, {
    type: 'n',
    color: 'b'
  }, {
    type: 'b',
    color: 'b'
  }, {
    type: 'q',
    color: 'b'
  }, {
    type: 'k',
    color: 'b'
  }, {
    type: 'b',
    color: 'b'
  }, {
    type: 'n',
    color: 'b'
  }, {
    type: 'r',
    color: 'b'
  }], Array(8).fill({
    type: 'p',
    color: 'b'
  }),
  // Black pawns
  Array(8).fill(null),
  // Empty squares
  Array(8).fill(null),
  // Empty squares
  Array(8).fill(null),
  // Empty squares
  Array(8).fill(null),
  // Empty squares
  Array(8).fill({
    type: 'p',
    color: 'w'
  }),
  // White pawns
  [{
    type: 'r',
    color: 'w'
  }, {
    type: 'n',
    color: 'w'
  }, {
    type: 'b',
    color: 'w'
  }, {
    type: 'q',
    color: 'w'
  }, {
    type: 'k',
    color: 'w'
  }, {
    type: 'b',
    color: 'w'
  }, {
    type: 'n',
    color: 'w'
  }, {
    type: 'r',
    color: 'w'
  }]];
  test('should calculate correct material balance for equal position', () => {
    const balance = _MaterialCalculator.default.calculateBalance(mockPosition);
    expect(balance).toBe(0);
  });
  test('should calculate correct material balance for white advantage', () => {
    const modifiedPosition = JSON.parse(JSON.stringify(mockPosition));
    modifiedPosition[0][0] = null; // Remove black rook
    const balance = _MaterialCalculator.default.calculateBalance(modifiedPosition);
    expect(balance).toBe(5); // White is up a rook (+5)
  });
  test('should calculate correct material balance for black advantage', () => {
    const modifiedPosition = JSON.parse(JSON.stringify(mockPosition));
    modifiedPosition[7][3] = null; // Remove white queen
    const balance = _MaterialCalculator.default.calculateBalance(modifiedPosition);
    expect(balance).toBe(-9); // Black is up a queen (-9)
  });
  test('should calculate correct material difference between positions', () => {
    const position1 = JSON.parse(JSON.stringify(mockPosition));
    const position2 = JSON.parse(JSON.stringify(mockPosition));
    position2[0][0] = null; // Remove black rook in position2

    const difference = _MaterialCalculator.default.calculateDifference(position1, position2);
    expect(difference).toBe(-5); // Position1 has 5 more points of material
  });
  test('should return correct piece values', () => {
    expect(_MaterialCalculator.default.getPieceValue('p')).toBe(1);
    expect(_MaterialCalculator.default.getPieceValue('n')).toBe(3);
    expect(_MaterialCalculator.default.getPieceValue('b')).toBe(3);
    expect(_MaterialCalculator.default.getPieceValue('r')).toBe(5);
    expect(_MaterialCalculator.default.getPieceValue('q')).toBe(9);
    expect(_MaterialCalculator.default.getPieceValue('k')).toBe(0);
    expect(_MaterialCalculator.default.getPieceValue('x')).toBe(0);
  });
});