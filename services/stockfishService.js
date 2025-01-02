const { Chess } = require('chess.js');
const Worker = require('web-worker');
const path = require('path');

class ChessAnalysisService {
    constructor() {
        this.game = null;
        this.stockfish = null;
        this.initStockfish();
    }

    initGame(fen = null) {
        this.game = new Chess(fen);
    }

    initStockfish() {
        try {
            const stockfishPath = require.resolve('stockfish.js/stockfish.js');
            this.stockfish = new Worker(stockfishPath);
            this.stockfish.postMessage('uci');
            this.stockfish.postMessage('setoption name MultiPV value 3'); // Get top 3 moves
            this.stockfish.postMessage('isready');
            console.log('Stockfish initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Stockfish:', error);
        }
    }

    async analyzeMoves(moves, timePerMove = 1000, useStockfish = false) {
        if (useStockfish) {
            return this.analyzeWithStockfish(moves, timePerMove);
        } else {
            return this.analyzeWithJsEngine(moves);
        }
    }

    async analyzeWithStockfish(moves, timePerMove) {
        return new Promise((resolve) => {
            if (!this.stockfish) {
                console.error('Stockfish not initialized');
                resolve([]);
                return;
            }

            const analysis = [];
            let currentDepth = 0;

            this.stockfish.onmessage = (msg) => {
                if (msg.includes('bestmove')) {
                    resolve(analysis);
                } else if (msg.includes('info depth')) {
                    const info = this.parseStockfishInfo(msg);
                    if (info && info.depth > currentDepth) {
                        currentDepth = info.depth;
                        analysis.push(info);
                    }
                }
            };

            // Set position and start analysis
            if (moves && moves.length > 0) {
                this.stockfish.postMessage('position startpos moves ' + moves.join(' '));
            } else {
                this.stockfish.postMessage('position startpos');
            }
            this.stockfish.postMessage('go movetime ' + timePerMove);
        });
    }

    parseStockfishInfo(msg) {
        try {
            const depth = parseInt(msg.match(/depth (\d+)/)[1]);
            const score = msg.match(/score cp (-?\d+)/) || msg.match(/score mate (-?\d+)/);
            const pv = msg.match(/pv (.+)/);
            
            if (!score || !pv) return null;

            const scoreType = msg.includes('score mate') ? 'mate' : 'cp';
            const scoreValue = parseInt(score[1]);
            const moves = pv[1].split(' ');

            return {
                depth,
                evaluation: scoreType === 'cp' ? scoreValue / 100 : `Mate in ${Math.abs(scoreValue)}`,
                line: moves,
                move: moves[0]
            };
        } catch (error) {
            return null;
        }
    }

    async analyzeWithJsEngine(moves) {
        try {
            // Initialize game if not already initialized
            if (!this.game) {
                this.initGame();
            }

            // Apply moves to get to the position
            if (moves && moves.length > 0) {
                for (const move of moves) {
                    this.game.move(move);
                }
            }

            // Get all possible moves and their evaluations
            const analysis = [];
            const possibleMoves = this.game.moves();
            
            for (const move of possibleMoves) {
                // Make the move
                this.game.move(move);
                
                // Evaluate position (positive is good for white, negative for black)
                const evaluation = this.evaluatePosition();
                
                // Get best continuation
                const line = this.getBestLine(3); // Look 3 moves ahead
                
                analysis.push({
                    move,
                    evaluation,
                    line,
                    depth: 3
                });
                
                // Undo the move
                this.game.undo();
            }

            // Sort by evaluation
            analysis.sort((a, b) => b.evaluation - a.evaluation);
            
            return analysis;
        } catch (error) {
            console.error('Error analyzing moves:', error);
            return [];
        }
    }

    async getBestMove(fen, timeLimit = 1000, useStockfish = false) {
        if (useStockfish) {
            return this.getBestMoveStockfish(fen, timeLimit);
        } else {
            return this.getBestMoveJsEngine(fen);
        }
    }

    async getBestMoveStockfish(fen, timeLimit) {
        return new Promise((resolve) => {
            if (!this.stockfish) {
                console.error('Stockfish not initialized');
                resolve(null);
                return;
            }

            this.stockfish.onmessage = (msg) => {
                if (msg.includes('bestmove')) {
                    const bestMove = msg.split(' ')[1];
                    resolve(bestMove);
                }
            };

            this.stockfish.postMessage('position fen ' + fen);
            this.stockfish.postMessage('go movetime ' + timeLimit);
        });
    }

    async getBestMoveJsEngine(fen) {
        try {
            this.initGame(fen);
            const moves = this.game.moves();
            let bestMove = null;
            let bestEval = -Infinity;

            for (const move of moves) {
                this.game.move(move);
                const evaluation = this.evaluatePosition();
                if (evaluation > bestEval) {
                    bestEval = evaluation;
                    bestMove = move;
                }
                this.game.undo();
            }

            return bestMove;
        } catch (error) {
            console.error('Error getting best move:', error);
            return null;
        }
    }

    evaluatePosition() {
        const board = this.game.board();
        let evaluation = 0;

        // Material values
        const pieceValues = {
            p: 1,   // pawn
            n: 3,   // knight
            b: 3,   // bishop
            r: 5,   // rook
            q: 9,   // queen
            k: 0    // king (not counted in material evaluation)
        };

        // Position bonus/malus (center control, development, etc.)
        const positionBonus = {
            p: [
                [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
                [0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5],
                [0.1,  0.1,  0.2,  0.3,  0.3,  0.2,  0.1,  0.1],
                [0.05, 0.05, 0.1,  0.25, 0.25, 0.1,  0.05, 0.05],
                [0.0,  0.0,  0.0,  0.2,  0.2,  0.0,  0.0,  0.0],
                [0.05, -0.05, -0.1, 0.0, 0.0, -0.1, -0.05, 0.05],
                [0.05, 0.1,  0.1,  -0.2, -0.2, 0.1,  0.1,  0.05],
                [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
            ],
            n: [
                [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5],
                [-0.4, -0.2,  0.0,  0.0,  0.0,  0.0, -0.2, -0.4],
                [-0.3,  0.0,  0.1,  0.15, 0.15, 0.1,  0.0, -0.3],
                [-0.3,  0.05, 0.15, 0.2,  0.2,  0.15, 0.05, -0.3],
                [-0.3,  0.0,  0.15, 0.2,  0.2,  0.15, 0.0, -0.3],
                [-0.3,  0.05, 0.1,  0.15, 0.15, 0.1,  0.05, -0.3],
                [-0.4, -0.2,  0.0,  0.05, 0.05, 0.0, -0.2, -0.4],
                [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5]
            ]
        };

        // Evaluate material and position
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece) {
                    // Material evaluation
                    const value = pieceValues[piece.type.toLowerCase()] * (piece.color === 'white' ? 1 : -1);
                    evaluation += value;

                    // Position evaluation
                    if (piece.type.toLowerCase() === 'p') {
                        evaluation += positionBonus.p[piece.color === 'white' ? i : 7-i][j] * (piece.color === 'white' ? 1 : -1);
                    } else if (piece.type.toLowerCase() === 'n') {
                        evaluation += positionBonus.n[piece.color === 'white' ? i : 7-i][j] * (piece.color === 'white' ? 1 : -1);
                    }
                }
            }
        }

        // Additional factors
        if (this.game.isCheck()) {
            evaluation += this.game.turn() === 'white' ? -0.5 : 0.5;
        }

        if (this.game.isCheckmate()) {
            evaluation += this.game.turn() === 'white' ? -100 : 100;
        }

        if (this.game.isDraw()) {
            evaluation = 0;
        }

        return evaluation;
    }

    getBestLine(depth) {
        if (depth === 0 || this.game.isGameOver()) {
            return [];
        }

        const moves = this.game.moves();
        let bestMove = null;
        let bestEval = -Infinity;
        let bestLine = [];

        for (const move of moves) {
            this.game.move(move);
            const evaluation = -this.negamax(depth - 1, -Infinity, Infinity, -1);
            if (evaluation > bestEval) {
                bestEval = evaluation;
                bestMove = move;
                bestLine = [move, ...this.getBestLine(depth - 1)];
            }
            this.game.undo();
        }

        return bestLine;
    }

    negamax(depth, alpha, beta, color) {
        if (depth === 0 || this.game.isGameOver()) {
            return color * this.evaluatePosition();
        }

        let maxEval = -Infinity;
        const moves = this.game.moves();

        for (const move of moves) {
            this.game.move(move);
            const evaluation = -this.negamax(depth - 1, -beta, -alpha, -color);
            this.game.undo();
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (alpha >= beta) {
                break;
            }
        }

        return maxEval;
    }

    cleanup() {
        if (this.stockfish) {
            this.stockfish.postMessage('quit');
            this.stockfish = null;
        }
    }
}

module.exports = new ChessAnalysisService(); 