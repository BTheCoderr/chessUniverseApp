// Mock jQuery
const $ = require('jquery');
global.$ = global.jQuery = $;

// Add jQuery modal mock
$.fn.modal = function(action) {
    return this;
};

// Mock Chess.js
const Chess = jest.fn().mockImplementation(() => ({
    reset: jest.fn(),
    game_over: jest.fn().mockReturnValue(false),
    turn: jest.fn().mockReturnValue('w'),
    move: jest.fn(),
    fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    board: jest.fn().mockReturnValue([]),
    history: jest.fn().mockReturnValue([]),
    in_checkmate: jest.fn().mockReturnValue(false),
    in_draw: jest.fn().mockReturnValue(false)
}));

global.Chess = Chess;

// Mock Chessboard
global.Chessboard = jest.fn().mockImplementation(() => ({
    position: jest.fn(),
    resize: jest.fn()
}));

// Mock ChessAnalysisService
global.ChessAnalysisService = {
    initStockfish: jest.fn().mockResolvedValue({
        postMessage: jest.fn(),
        onmessage: null
    }),
    getBestMove: jest.fn().mockResolvedValue('e2e4')
};

const BotGame = require('../../public/js/botGame');

describe('BotGame', () => {
    let botGame;
    let mockJQuery;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Setup DOM elements that BotGame expects
        document.body.innerHTML = `
            <div id="board"></div>
            <div class="move-list"></div>
            <div class="material-balance"></div>
            <div class="move-count"></div>
            <div class="eval-score"></div>
            <div class="eval-fill"></div>
            <div class="best-move"><span class="move"></span></div>
            <div id="botSelectionModal"></div>
            <div id="gameOverModal"></div>
        `;
        
        // Initialize BotGame
        botGame = new BotGame();
    });

    test('should initialize with default values', () => {
        expect(botGame.gameStarted).toBe(false);
        expect(botGame.playerColor).toBe('white');
        expect(botGame.gameType).toBe('standard');
        expect(botGame.timeControl).toBeNull();
    });

    test('should handle game start correctly', async () => {
        // Mock bot selection
        document.body.innerHTML += `
            <div class="bot-profile-card selected" data-bot='{"name":"Test Bot","rating":1500,"personality":"Test","style":"Test","thinkingTime":1}'></div>
            <div class="player-info black">
                <div class="player-name"></div>
                <div class="player-rating"></div>
            </div>
            <div class="bot-info-panel">
                <div class="personality"></div>
                <div class="style"></div>
                <div class="thinking-time"></div>
            </div>
        `;

        // Mock jQuery data method
        $.fn.data = function(key) {
            if (key === 'bot') {
                return {
                    name: 'Test Bot',
                    rating: 1500,
                    personality: 'Test',
                    style: 'Test',
                    thinkingTime: 1
                };
            }
            return null;
        };

        await botGame.startNewGame();
        
        expect(botGame.gameStarted).toBe(true);
        expect(botGame.game.reset).toHaveBeenCalled();
        expect(botGame.board.position).toHaveBeenCalledWith('start');
    });

    test('should handle legal moves correctly', () => {
        botGame.gameStarted = true;
        botGame.currentBot = {
            name: 'Test Bot',
            rating: 1500,
            personality: 'Test',
            style: 'Test',
            thinkingTime: 1
        };
        
        const result = botGame.onDrop('e2', 'e4');
        
        expect(botGame.game.move).toHaveBeenCalled();
        expect(result).not.toBe('snapback');
    });

    test('should calculate material balance', () => {
        const balance = botGame.calculateMaterialBalance();
        expect(typeof balance).toBe('number');
    });
}); 