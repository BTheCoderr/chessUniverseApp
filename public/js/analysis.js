class ChessAnalysis {
    constructor() {
        this.board = null;
        this.game = new Chess();
        this.engineRunning = false;
        this.currentDepth = 15;
        this.currentMultiPV = 3;
        this.moveHistory = [];
        this.activeBets = new Map();
        this.socket = io();

        this.initializeBoard();
        this.initializeEngine();
        this.setupEventListeners();
        this.setupWebSocket();
    }

    initializeBoard() {
        const config = {
            position: 'start',
            draggable: true,
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this)
        };

        this.board = Chessboard('board', config);
        $(window).resize(() => this.board.resize());
    }

    initializeEngine() {
        // Initialize engine settings
        document.getElementById('engineToggle').checked = false;
        document.getElementById('depthSelect').value = this.currentDepth;
        document.getElementById('multiPvSelect').value = this.currentMultiPV;
    }

    setupEventListeners() {
        // Board control buttons
        document.getElementById('newPositionBtn').addEventListener('click', () => this.newPosition());
        document.getElementById('flipBoardBtn').addEventListener('click', () => this.board.flip());
        document.getElementById('copyFenBtn').addEventListener('click', () => this.copyFEN());
        document.getElementById('pasteFenBtn').addEventListener('click', () => this.pasteFEN());

        // Engine controls
        document.getElementById('engineToggle').addEventListener('change', (e) => this.toggleEngine(e.target.checked));
        document.getElementById('depthSelect').addEventListener('change', (e) => {
            this.currentDepth = parseInt(e.target.value);
            if (this.engineRunning) this.analyzePosition();
        });
        document.getElementById('multiPvSelect').addEventListener('change', (e) => {
            this.currentMultiPV = parseInt(e.target.value);
            if (this.engineRunning) this.analyzePosition();
        });

        // Betting controls
        document.getElementById('placeBetBtn').addEventListener('click', () => this.placeBet());
    }

    setupWebSocket() {
        this.socket.on('analysisUpdate', (data) => {
            this.updateAnalysis(data);
        });

        this.socket.on('betUpdate', (data) => {
            this.updateBets(data);
        });
    }

    onDragStart(source, piece) {
        if (this.game.isGameOver()) return false;

        // Allow picking up pieces only for the side to move
        if ((this.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (this.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
        return true;
    }

    onDrop(source, target) {
        const move = this.game.move({
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen for simplicity
        });

        if (move === null) return 'snapback';

        this.moveHistory.push(move);
        this.updateMoveList();
        
        if (this.engineRunning) {
            this.analyzePosition();
        }
    }

    onSnapEnd() {
        this.board.position(this.game.fen());
    }

    async analyzePosition() {
        const fen = this.game.fen();
        
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fen,
                    depth: this.currentDepth,
                    multiPV: this.currentMultiPV
                })
            });

            const analysis = await response.json();
            this.updateAnalysisDisplay(analysis);
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Analysis failed');
        }
    }

    updateAnalysisDisplay(analysis) {
        const evalDiv = document.getElementById('positionEval');
        const bestLinesDiv = document.getElementById('bestLines');
        const moveStrengthDiv = document.getElementById('moveStrength');

        // Clear previous content
        evalDiv.innerHTML = '';
        bestLinesDiv.innerHTML = '';
        moveStrengthDiv.innerHTML = '';

        // Update evaluation
        const mainLine = analysis.lines[0];
        const evalBar = this.createEvalBar(mainLine.score);
        evalDiv.appendChild(evalBar);

        // Update best lines
        analysis.lines.forEach((line, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'analysis-line';
            lineDiv.innerHTML = `
                <span class="line-score">${this.formatScore(line.score)}</span>
                <span class="line-moves">${this.formatLine(line.pv)}</span>
            `;
            bestLinesDiv.appendChild(lineDiv);
        });

        // Update move strength indicator
        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory[this.moveHistory.length - 1];
            const strength = this.getMoveStrength(lastMove, mainLine.score);
            moveStrengthDiv.textContent = strength;
        }
    }

    createEvalBar(score) {
        const container = document.createElement('div');
        container.className = 'eval-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'eval-bar';
        
        const percentage = this.scoreToPercentage(score);
        bar.style.height = `${percentage}%`;
        
        container.appendChild(bar);
        return container;
    }

    scoreToPercentage(score) {
        if (typeof score === 'string' && score.startsWith('#')) {
            return score.startsWith('#-') ? 0 : 100;
        }
        
        const numScore = parseFloat(score);
        const percentage = 50 + (Math.atan(numScore / 3) / Math.PI * 100);
        return Math.max(0, Math.min(100, percentage));
    }

    formatScore(score) {
        if (typeof score === 'string' && score.startsWith('#')) {
            return score; // Mate score
        }
        return (score / 100).toFixed(2);
    }

    formatLine(moves) {
        return moves.slice(0, 5).join(' '); // Show first 5 moves only
    }

    getMoveStrength(move, evaluation) {
        const abs = Math.abs(evaluation);
        if (abs > 300) return '!!';
        if (abs > 150) return '!';
        if (abs > -50) return '⩲';
        if (abs > -150) return '?';
        return '??';
    }

    placeBet() {
        const type = document.getElementById('betType').value;
        const amount = parseInt(document.getElementById('betAmount').value);
        const choice = document.getElementById('betChoice').value;

        if (!amount || amount < 1) {
            this.showError('Please enter a valid bet amount');
            return;
        }

        const bet = {
            type,
            amount,
            choice,
            position: this.game.fen(),
            timestamp: new Date()
        };

        this.socket.emit('placeBet', bet);
    }

    updateBets(bets) {
        const betsListDiv = document.querySelector('.bets-list');
        betsListDiv.innerHTML = '';

        bets.forEach(bet => {
            const betDiv = document.createElement('div');
            betDiv.className = 'bet-item';
            betDiv.innerHTML = `
                <div class="bet-type">${bet.type}</div>
                <div class="bet-amount">$${bet.amount}</div>
                <div class="bet-choice">${bet.choice}</div>
            `;
            betsListDiv.appendChild(betDiv);
        });
    }

    newPosition() {
        this.game = new Chess();
        this.board.position('start');
        this.moveHistory = [];
        this.updateMoveList();
        if (this.engineRunning) {
            this.analyzePosition();
        }
    }

    copyFEN() {
        navigator.clipboard.writeText(this.game.fen())
            .then(() => this.showSuccess('FEN copied to clipboard'))
            .catch(() => this.showError('Failed to copy FEN'));
    }

    async pasteFEN() {
        try {
            const fen = await navigator.clipboard.readText();
            if (this.game.load(fen)) {
                this.board.position(fen);
                if (this.engineRunning) {
                    this.analyzePosition();
                }
            } else {
                this.showError('Invalid FEN string');
            }
        } catch (error) {
            this.showError('Failed to paste FEN');
        }
    }

    updateMoveList() {
        const movesDiv = document.getElementById('movesList');
        movesDiv.innerHTML = '';

        this.moveHistory.forEach((move, index) => {
            const moveNumber = Math.floor(index / 2) + 1;
            const moveElement = document.createElement('span');
            moveElement.className = 'move';
            
            if (index % 2 === 0) {
                moveElement.textContent = `${moveNumber}. ${move.san} `;
            } else {
                moveElement.textContent = `${move.san} `;
            }
            
            movesDiv.appendChild(moveElement);
        });
    }

    toggleEngine(enabled) {
        this.engineRunning = enabled;
        if (enabled) {
            this.analyzePosition();
        } else {
            document.getElementById('engineOutput').innerHTML = '';
        }
    }

    showError(message) {
        // Implement error notification
        console.error(message);
    }

    showSuccess(message) {
        // Implement success notification
        console.log(message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chessAnalysis = new ChessAnalysis();
}); 