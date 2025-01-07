"use strict";

var _MoveValidator = _interopRequireDefault(require("../MoveValidator"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
describe('MoveValidator', () => {
  let mockGame;
  beforeEach(() => {
    // Create a mock chess.js game instance
    mockGame = {
      moves: jest.fn(),
      isAttacked: jest.fn(),
      inCheck: jest.fn(),
      board: jest.fn(),
      move: jest.fn()
    };
  });
  test('should validate legal moves correctly', () => {
    mockGame.moves.mockReturnValue([{
      from: 'e2',
      to: 'e4'
    }, {
      from: 'e2',
      to: 'e3'
    }]);
    expect(_MoveValidator.default.isLegalMove(mockGame, 'e2', 'e4')).toBe(true);
    expect(_MoveValidator.default.isLegalMove(mockGame, 'e2', 'e5')).toBe(false);
    expect(mockGame.moves).toHaveBeenCalledWith({
      square: 'e2',
      verbose: true
    });
  });
  test('should get legal moves for a square', () => {
    const expectedMoves = [{
      from: 'e2',
      to: 'e4'
    }, {
      from: 'e2',
      to: 'e3'
    }];
    mockGame.moves.mockReturnValue(expectedMoves);
    const moves = _MoveValidator.default.getLegalMoves(mockGame, 'e2');
    expect(moves).toEqual(expectedMoves);
    expect(mockGame.moves).toHaveBeenCalledWith({
      square: 'e2',
      verbose: true
    });
  });
  test('should check if square is under attack', () => {
    mockGame.isAttacked.mockReturnValue(true);
    expect(_MoveValidator.default.isSquareAttacked(mockGame, 'e4', 'b')).toBe(true);
    expect(mockGame.isAttacked).toHaveBeenCalledWith('e4', 'b');
  });
  test('should check if move causes check', () => {
    mockGame.move.mockReturnValue({
      from: 'e2',
      to: 'e4'
    });
    mockGame.inCheck.mockReturnValue(true);
    expect(_MoveValidator.default.moveCausesCheck(mockGame, 'e2', 'e4')).toBe(true);
    expect(mockGame.move).toHaveBeenCalledWith({
      from: 'e2',
      to: 'e4',
      verbose: true
    });
  });
  test('should get attacking squares', () => {
    mockGame.board.mockReturnValue(Array(8).fill(Array(8).fill(null)));
    mockGame.moves.mockReturnValue([{
      from: 'd4',
      to: 'e5'
    }]);
    const attackingSquares = _MoveValidator.default.getAttackingSquares(mockGame, 'e5', 'w');
    expect(Array.isArray(attackingSquares)).toBe(true);
  });
  test('should convert coordinates to square notation', () => {
    expect(_MoveValidator.default._coordinatesToSquare(0, 0)).toBe('a8');
    expect(_MoveValidator.default._coordinatesToSquare(4, 4)).toBe('e4');
    expect(_MoveValidator.default._coordinatesToSquare(7, 7)).toBe('h1');
  });
});