class HistoricalGamePlayer {
    constructor() {
        this.socket = io();
        this.board = document.getElementById('chessboard');
        this.movesList = document.getElementById('movesList');
        this.gameInfo = document.getElementById('gameInfo');
        this.controlsContainer = document.getElementById('controls');
        this.analysisPanel = document.getElementById('analysisPanel');
        
        this.currentPosition = 0;
        this.isPlayingAlternative = false;
        
        this.initializeControls();
        this.initializeEventListeners();
    }

    initializeControls() {
        const controls = `
            <div class="control-group">
                <button id="startBtn" class="control-btn">
                    <i class="fas fa-fast-backward"></i>
                </button>
                <button id="prevBtn" class="control-btn">
                    <i class="fas fa-step-backward"></i>
                </button>
                <button id="playPauseBtn" class="control-btn">
                    <i class="fas fa-play"></i>
                </button>
                <button id="nextBtn" class="control-btn">
                    <i class="fas fa-step-forward"></i>
                </button>
                <button id="endBtn" class="control-btn">
                    <i class="fas fa-fast-forward"></i>
                </button>
            </div>
            <div class="control-group">
                <button id="analyzeBtn" class="control-btn">
                    <i class="fas fa-microscope"></i> Analyze
                </button>
                <button id="saveLineBtn" class="control-btn" disabled>
                    <i class="fas fa-save"></i> Save Line
                </button>
            </div>
        `;
        this.controlsContainer.innerHTML = controls;
    }

    initializeEventListeners() {
        // Playback controls
        document.getElementById('startBtn').addEventListener('click', () => this.jumpToStart());
        document.getElementById('prevBtn').addEventListener('click', () => this.prevMove());
        document.getElementById('playPauseBtn').addEventListener('click', () => this.toggleAutoPlay());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextMove());
        document.getElementById('endBtn').addEventListener('click', () => this.jumpToEnd());
        
        // Analysis controls
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzePosition());
        document.getElementById('saveLineBtn').addEventListener('click', () => this.saveAlternativeLine());
        
        // Board click handler for alternative moves
        this.board.addEventListener('click', (e) => this.handleBoardClick(e));
        
        // Socket events
        this.socket.on('historical-position-update', (position) => this.updatePosition(position));
        this.socket.on('historical-analysis', (analysis) => this.showAnalysis(analysis));
    }

    async loadGame(gameId) {
        try {
            const response = await fetch(`/api/historical-games/${gameId}`);
            const game = await response.json();
            
            this.displayGameInfo(game);
            this.socket.emit('load-historical-game', gameId);
            
            // Reset state
            this.currentPosition = 0;
            this.isPlayingAlternative = false;
            document.getElementById('saveLineBtn').disabled = true;
            
            this.updatePosition(game.initialPosition);
        } catch (error) {
            console.error('Error loading historical game:', error);
            this.showNotification('Error loading game', 'error');
        }
    }

    updatePosition(position) {
        // Update board
        this.updateBoard(position.fen);
        
        // Update moves list
        this.updateMovesList(position.moves, position.currentMove);
        
        // Update controls state
        this.currentPosition = position.currentMove;
        document.getElementById('saveLineBtn').disabled = !position.isAlternativeLine;
        
        // Highlight current move
        this.highlightMove(position.currentMove);
    }

    updateBoard(fen) {
        // Convert FEN to board position and update the display
        const pieces = this.fenToPosition(fen);
        this.board.innerHTML = '';
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = document.createElement('div');
                square.className = `square ${(i + j) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = i;
                square.dataset.col = j;
                
                const piece = pieces[i][j];
                if (piece) {
                    square.textContent = piece;
                    square.dataset.pieceColor = piece.charCodeAt(0) < 9817 ? 'white' : 'black';
                }
                
                this.board.appendChild(square);
            }
        }
    }

    updateMovesList(moves, currentMove) {
        this.movesList.innerHTML = '';
        moves.forEach((move, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = 'move' + (index === currentMove ? ' current' : '');
            moveElement.textContent = `${Math.floor(index/2) + 1}. ${move.from}${move.to}`;
            moveElement.addEventListener('click', () => this.jumpToMove(index));
            this.movesList.appendChild(moveElement);
        });
    }

    displayGameInfo(game) {
        const info = `
            <h2>${game.title}</h2>
            <div class="game-details">
                <p><strong>Event:</strong> ${game.event}</p>
                <p><strong>Date:</strong> ${new Date(game.date).toLocaleDateString()}</p>
                <p><strong>White:</strong> ${game.white.title} ${game.white.name} (${game.white.rating})</p>
                <p><strong>Black:</strong> ${game.black.title} ${game.black.name} (${game.black.rating})</p>
                <p><strong>Result:</strong> ${game.result}</p>
                <p><strong>Opening:</strong> ${game.opening.name} (${game.opening.eco})</p>
            </div>
            <div class="game-description">
                <h3>Historical Significance</h3>
                <p>${game.historicalSignificance}</p>
                <h3>Description</h3>
                <p>${game.description}</p>
            </div>
        `;
        this.gameInfo.innerHTML = info;
    }

    async analyzePosition() {
        try {
            const response = await fetch(`/api/historical-games/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: this.currentPosition })
            });
            const analysis = await response.json();
            this.showAnalysis(analysis);
        } catch (error) {
            console.error('Error analyzing position:', error);
            this.showNotification('Error analyzing position', 'error');
        }
    }

    showAnalysis(analysis) {
        const panel = `
            <div class="analysis-header">
                <h3>Position Analysis</h3>
                <span class="evaluation">${analysis.evaluation}</span>
            </div>
            <div class="best-line">
                <h4>Best Line:</h4>
                <p>${analysis.bestLine.join(' ')}</p>
            </div>
        `;
        this.analysisPanel.innerHTML = panel;
        this.analysisPanel.classList.remove('hidden');
    }

    async saveAlternativeLine() {
        try {
            const response = await fetch('/api/historical-games/save-variation', {
                method: 'POST'
            });
            const result = await response.json();
            this.showNotification('Alternative line saved successfully', 'success');
        } catch (error) {
            console.error('Error saving alternative line:', error);
            this.showNotification('Error saving alternative line', 'error');
        }
    }

    // Helper methods
    fenToPosition(fen) {
        // Convert FEN string to 2D array of pieces
        const [position] = fen.split(' ');
        const rows = position.split('/');
        const board = [];
        
        for (const row of rows) {
            const boardRow = [];
            for (const char of row) {
                if (isNaN(char)) {
                    boardRow.push(char);
                } else {
                    for (let i = 0; i < parseInt(char); i++) {
                        boardRow.push('');
                    }
                }
            }
            board.push(boardRow);
        }
        
        return board;
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Playback controls
    jumpToStart() {
        this.socket.emit('historical-jump-to', 0);
    }

    prevMove() {
        this.socket.emit('historical-prev-move');
    }

    nextMove() {
        this.socket.emit('historical-next-move');
    }

    jumpToEnd() {
        this.socket.emit('historical-jump-to-end');
    }

    toggleAutoPlay() {
        const button = document.getElementById('playPauseBtn');
        const icon = button.querySelector('i');
        
        if (icon.classList.contains('fa-play')) {
            icon.classList.replace('fa-play', 'fa-pause');
            this.startAutoPlay();
        } else {
            icon.classList.replace('fa-pause', 'fa-play');
            this.stopAutoPlay();
        }
    }

    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            if (this.currentPosition >= this.totalMoves - 1) {
                this.stopAutoPlay();
                return;
            }
            this.nextMove();
        }, 2000);
    }

    stopAutoPlay() {
        clearInterval(this.autoPlayInterval);
        const button = document.getElementById('playPauseBtn');
        button.querySelector('i').classList.replace('fa-pause', 'fa-play');
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.historicalPlayer = new HistoricalGamePlayer();
    
    // Load game if ID is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');
    if (gameId) {
        window.historicalPlayer.loadGame(gameId);
    }
}); 