/**
 * @jest-environment jsdom
 */

const { JSDOM } = require('jsdom');
const io = require('socket.io-client');
const Chess = require('chess.js');

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock chess.js
jest.mock('chess.js', () => {
  return jest.fn().mockImplementation(() => ({
    game_over: jest.fn().mockReturnValue(false),
    turn: jest.fn().mockReturnValue('w'),
    move: jest.fn(),
    fen: jest.fn().mockReturnValue('initial position'),
    in_checkmate: jest.fn().mockReturnValue(false),
    in_draw: jest.fn().mockReturnValue(false),
    in_check: jest.fn().mockReturnValue(false),
    history: jest.fn().mockReturnValue([]),
    undo: jest.fn(),
  }));
});

// Mock Chessboard
global.Chessboard = jest.fn().mockImplementation(() => ({
  position: jest.fn(),
  orientation: jest.fn(),
  resize: jest.fn(),
  flip: jest.fn(),
}));

describe('Chess Game', () => {
  let game;
  let board;
  let socket;
  let dom;

  beforeEach(() => {
    // Set up DOM environment
    dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <div id="board"></div>
                    <div id="gameStatus"></div>
                    <div id="movesList"></div>
                    <div id="whiteUsername"></div>
                    <div id="blackUsername"></div>
                    <button id="resignBtn"></button>
                    <button id="drawBtn"></button>
                    <button id="flipBoardBtn"></button>
                    <button id="findOpponentBtn"></button>
                    <button id="prevMove"></button>
                    <button id="nextMove"></button>
                    <div class="white-timer"></div>
                    <div class="black-timer"></div>
                </body>
            </html>
        `);

    global.document = dom.window.document;
    global.window = dom.window;

    // Reset all mocks
    jest.clearAllMocks();

    // Load game.js
    require('../../public/js/game.js');

    // Initialize mocked instances
    game = new Chess();
    board = Chessboard();
    socket = io();
  });

  describe('Game Initialization', () => {
    test('should initialize board with correct configuration', () => {
      expect(Chessboard).toHaveBeenCalledWith(
        'board',
        expect.objectContaining({
          draggable: true,
          position: 'start',
          pieceTheme: '/img/pieces/{piece}.png',
        })
      );
    });

    test('should set up window resize event listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Move Validation', () => {
    test('should prevent moves when game is over', () => {
      game.game_over.mockReturnValue(true);
      const result = window.onDragStart('e2', 'wP');
      expect(result).toBe(false);
    });

    test("should prevent moves when not player's turn", () => {
      window.currentTurn = 'black';
      window.playerColor = 'white';
      const result = window.onDragStart('e2', 'wP');
      expect(result).toBe(false);
    });

    test("should prevent moving opponent's pieces", () => {
      window.playerColor = 'white';
      const result = window.onDragStart('e7', 'bP');
      expect(result).toBe(false);
    });
  });

  describe('Game Status Updates', () => {
    test('should display checkmate status', () => {
      game.in_checkmate.mockReturnValue(true);
      game.turn.mockReturnValue('b');
      window.updateStatus();
      expect(document.getElementById('gameStatus').textContent).toBe(
        'Game over, Black is in checkmate.'
      );
    });

    test('should display draw status', () => {
      game.in_draw.mockReturnValue(true);
      window.updateStatus();
      expect(document.getElementById('gameStatus').textContent).toBe('Game over, drawn position');
    });

    test('should display check status', () => {
      game.in_check.mockReturnValue(true);
      game.turn.mockReturnValue('w');
      window.updateStatus();
      expect(document.getElementById('gameStatus').textContent).toBe(
        'White to move, White is in check'
      );
    });
  });

  describe('Socket Communication', () => {
    test('should emit move to opponent', () => {
      const socketEmitSpy = jest.spyOn(socket, 'emit');
      window.socket = socket;

      window.onDrop('e2', 'e4');

      expect(socketEmitSpy).toHaveBeenCalledWith('move', {
        from: 'e2',
        to: 'e4',
        promotion: 'q',
      });
    });

    test('should handle opponent moves', () => {
      const moveData = { from: 'e7', to: 'e5' };
      socket.on.mockImplementation((event, callback) => {
        if (event === 'move') {
          callback(moveData);
        }
      });

      window.socket = socket;
      window.initializeSocket();

      expect(game.move).toHaveBeenCalledWith(moveData);
      expect(board.position).toHaveBeenCalled();
    });
  });

  describe('Timer Management', () => {
    beforeEach(() => {
      global.gameConfig = {
        timeControl: {
          initial: 600, // 10 minutes
        },
      };
    });

    test('should initialize timers with correct values', () => {
      window.initializeTimers();
      expect(window.timers.white).toBe(600);
      expect(window.timers.black).toBe(600);
    });

    test('should format timer display correctly', () => {
      window.timers = { white: 125 }; // 2:05
      window.updateTimerDisplay('white');
      expect(document.querySelector('.white-timer').textContent).toBe('2:05');
    });
  });

  describe('Move Navigation', () => {
    test('should undo last move when clicking previous move button', () => {
      const prevMoveBtn = document.getElementById('prevMove');
      prevMoveBtn.click();

      expect(game.undo).toHaveBeenCalled();
      expect(board.position).toHaveBeenCalled();
    });
  });
});
