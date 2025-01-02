class BotGame {
    constructor() {
        this.board = null;
        this.game = new Chess();
        this.stockfish = null;
        this.currentBot = null;
        this.gameStarted = false;
        this.playerColor = 'white';
        this.timeControl = null;
        this.gameType = 'standard';
        
        this.initializeBoard();
        this.initializeStockfish();
        this.setupEventListeners();
    }
    
    initializeBoard() {
        const config = {
            position: 'start',
            orientation: this.playerColor,
            draggable: true,
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this)
        };
        
        this.board = Chessboard('board', config);
        $(window).resize(() => this.board.resize());
    }
    
    async initializeStockfish() {
        try {
            this.stockfish = await ChessAnalysisService.initStockfish();
            this.stockfish.onmessage = this.handleStockfishMessage.bind(this);
        } catch (error) {
            console.error('Failed to initialize Stockfish:', error);
        }
    }
    
    setupEventListeners() {
        $('#startGameBtn').on('click', () => this.startNewGame());
        $('#resignBtn').on('click', () => this.resignGame());
        $('#drawBtn').on('click', () => this.offerDraw());
        $('#newGameBtn').on('click', () => this.showBotSelectionModal());
        $('#playAgainBtn').on('click', () => this.showBotSelectionModal());
        
        // Game type and time control changes
        $('#gameType').on('change', (e) => {
            this.gameType = e.target.value;
        });
        
        $('#timeControl').on('change', (e) => {
            this.timeControl = e.target.value;
        });
    }
    
    startNewGame() {
        const selectedBot = $('.bot-profile-card.selected').data('bot');
        if (!selectedBot) {
            alert('Please select a bot opponent');
            return;
        }
        
        this.currentBot = selectedBot;
        this.gameStarted = true;
        this.game.reset();
        this.board.position('start');
        
        // Update UI with bot information
        $('.player-info.black .player-name').text(selectedBot.name);
        $('.player-info.black .player-rating').text(Elo: ${selectedBot.rating});
        $('.bot-info-panel .personality').text(selectedBot.personality);
        $('.bot-info-panel .style').text(selectedBot.style);
        $('.bot-info-panel .thinking-time').text(${selectedBot.thinkingTime}s);
        
        $('#botSelectionModal').modal('hide');
        
        if (this.playerColor === 'black') {
            this.makeBotMove();
        }
    }
    
    onDragStart(source, piece) {
        if (!this.gameStarted || this.game.game_over() || 
            piece.search(/^b/) !== -1 || 
            this.game.turn() !== this.playerColor[0]) {
            return false;
        }
        return true;
    }
    
    onDrop(source, target) {
        const move = {
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen for simplicity
        };
        
        const legalMove = this.game.move(move);
        if (legalMove === null) return 'snapback';
        
        this.updateGameState();
        this.makeBotMove();
    }
    
    onSnapEnd() {
        this.board.position(this.game.fen());
    }
    
    async makeBotMove() {
        if (this.game.game_over()) return;
        
        try {
            const fen = this.game.fen();
            const timeLimit = this.currentBot.thinkingTime * 1000; // Convert to milliseconds
            
            const bestMove = await ChessAnalysisService.getBestMove(fen, timeLimit, true);
            
            if (bestMove) {
                this.game.move(bestMove);
                this.board.position(this.game.fen());
                this.updateGameState();
            }
        } catch (error) {
            console.error('Error making bot move:', error);
        }
    }
    
    updateGameState() {
        // Update move list
        const moves = this.game.history({ verbose: true });
        this.updateMoveList(moves);
        
        // Update game statistics
        this.updateGameStats();
        
        // Check for game over
        if (this.game.game_over()) {
            this.handleGameOver();
        }
        
        // Request position evaluation
        this.requestEvaluation();
    }
    
    updateMoveList(moves) {
        const moveList = $('.move-list');
        moveList.empty();
        
        moves.forEach((move, index) => {
            if (index % 2 === 0) {
                moveList.append(`<div class="move-pair">${Math.floor(index/2 + 1)}. ${move.san}`);
            } else {
                moveList.find('.move-pair:last').append(` ${move.san}</div>`);
            }
        });
        
        moveList.scrollTop(moveList[0].scrollHeight);
    }
    
    updateGameStats() {
        const material = this.calculateMaterialBalance();
        $('.material-balance').text(material > 0 ? `+${material}` : material);
        
        const moves = this.game.history().length;
        $('.move-count').text(moves);
        
        // Update timers and average move time
        // Implementation depends on time control system
    }
    
    calculateMaterialBalance() {
        const pieceValues = {
            p: 1, n: 3, b: 3, r: 5, q: 9
        };
        
        let balance = 0;
        const position = this.game.board();
        
        position.forEach(row => {
            row.forEach(piece => {
                if (piece) {
                    const value = pieceValues[piece.type.toLowerCase()];
                    balance += piece.color === 'w' ? value : -value;
                }
            });
        });
        
        return balance;
    }
    
    requestEvaluation() {
        if (!this.stockfish) return;
        
        const fen = this.game.fen();
        this.stockfish.postMessage('position fen ' + fen);
        this.stockfish.postMessage('go depth 20');
    }
    
    handleStockfishMessage(event) {
        const message = event.data;
        
        if (message.startsWith('info')) {
            if (message.includes('score cp')) {
                const score = parseInt(message.split('score cp ')[1]) / 100;
                this.updateEvaluation(score);
            }
            if (message.includes('pv')) {
                const bestMove = message.split('pv ')[1].split(' ')[0];
                $('.best-move .move').text(bestMove);
            }
        }
    }
    
    updateEvaluation(score) {
        $('.eval-score').text(score.toFixed(1));
        
        // Update evaluation bar
        const normalizedScore = Math.max(-5, Math.min(5, score)); // Clamp between -5 and 5
        const percentage = ((normalizedScore + 5) / 10) * 100;
        $('.eval-fill').css('height', `${percentage}%`);
    }
    
    handleGameOver() {
        let result = '';
        if (this.game.in_checkmate()) {
            result = this.game.turn() === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
        } else if (this.game.in_draw()) {
            if (this.game.in_stalemate()) {
                result = 'Draw by stalemate';
            } else if (this.game.in_threefold_repetition()) {
                result = 'Draw by repetition';
            } else if (this.game.insufficient_material()) {
                result = 'Draw by insufficient material';
            } else {
                result = 'Draw';
            }
        }
        
        $('.result-message').text(result);
        $('#gameOverModal').modal('show');
    }
    
    resignGame() {
        if (!this.gameStarted) return;
        
        this.gameStarted = false;
        $('.result-message').text('Game resigned - ' + 
            (this.playerColor === 'white' ? 'Black' : 'White') + ' wins');
        $('#gameOverModal').modal('show');
    }
    
    offerDraw() {
        // Implement draw offer logic based on bot personality
        // For now, always reject
        alert('Draw offer declined by ' + this.currentBot.name);
    }
    
    showBotSelectionModal() {
        // Load bot profiles
        const bots = [
            {
                name: 'Rookie Bot',
                rating: 1200,
                personality: 'Beginner',
                style: 'Standard',
                thinkingTime: 1
            },
            {
                name: 'Advanced Bot',
                rating: 1800,
                personality: 'Aggressive',
                style: 'Tactical',
                thinkingTime: 2
            },
            {
                name: 'Master Bot',
                rating: 2200,
                personality: 'Positional',
                style: 'Strategic',
                thinkingTime: 3
            }
        ];
        
        const botProfiles = $('.bot-profiles');
        botProfiles.empty();
        
        bots.forEach(bot => {
            const card = $(`
                <div class="bot-profile-card" data-bot='${JSON.stringify(bot)}'>
                    <h6>${bot.name}</h6>
                    <div>Rating: ${bot.rating}</div>
                    <div>Style: ${bot.style}</div>
                </div>
            `);
            
            card.on('click', function() {
                $('.bot-profile-card').removeClass('selected');
                $(this).addClass('selected');
            });
            
            botProfiles.append(card);
        });
        
        $('#botSelectionModal').modal('show');
    }
}

// Initialize the game when the document is ready
$(document).ready(() => {
    window.botGame = new BotGame();
}); 