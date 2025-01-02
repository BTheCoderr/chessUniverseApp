class PuzzleSolver {
    constructor() {
        this.board = null;
        this.game = new Chess();
        this.currentPuzzle = null;
        this.previousMoves = [];
        this.startTime = null;
        this.isComplete = false;

        // DOM elements
        this.elements = {
            board: document.getElementById('board'),
            title: document.getElementById('puzzleTitle'),
            description: document.getElementById('puzzleDescription'),
            rating: document.getElementById('puzzleRating'),
            themes: document.getElementById('puzzleThemes'),
            moveList: document.getElementById('moveList'),
            status: document.getElementById('status'),
            resetBtn: document.getElementById('resetBtn'),
            hintBtn: document.getElementById('hintBtn'),
            nextBtn: document.getElementById('nextBtn')
        };

        this.initializeBoard();
        this.setupEventListeners();
        this.loadPuzzle();
    }

    initializeBoard() {
        const config = {
            draggable: true,
            position: 'start',
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            pieceTheme: '/img/pieces/{piece}.png'
        };

        this.board = Chessboard(this.elements.board, config);
        window.addEventListener('resize', () => this.board.resize());
    }

    setupEventListeners() {
        this.elements.resetBtn.addEventListener('click', () => this.resetPuzzle());
        this.elements.hintBtn.addEventListener('click', () => this.getHint());
        this.elements.nextBtn.addEventListener('click', () => this.loadNextPuzzle());
    }

    async loadPuzzle() {
        try {
            const puzzleId = window.location.pathname.split('/').pop();
            const response = await fetch(`/api/puzzles/${puzzleId}`);
            if (!response.ok) throw new Error('Failed to load puzzle');
            
            const puzzle = await response.json();
            this.setPuzzle(puzzle);
        } catch (error) {
            console.error('Error loading puzzle:', error);
            this.updateStatus('Failed to load puzzle', 'error');
        }
    }

    setPuzzle(puzzle) {
        this.currentPuzzle = puzzle;
        this.game.load(puzzle.fen);
        this.board.position(puzzle.fen);
        this.previousMoves = [];
        this.isComplete = false;
        this.startTime = Date.now();

        // Update UI
        this.elements.title.textContent = puzzle.title || 'Chess Puzzle';
        this.elements.description.textContent = puzzle.description;
        this.elements.rating.textContent = puzzle.rating;
        this.elements.themes.textContent = puzzle.themes.join(', ');
        this.elements.moveList.innerHTML = '';
        this.elements.nextBtn.style.display = 'none';

        this.updateStatus('Your turn to move');
    }

    async validateMove(move) {
        try {
            const response = await fetch(`/api/puzzles/${this.currentPuzzle.id}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    move: `${move.from}${move.to}${move.promotion || ''}`,
                    position: this.game.fen(),
                    previousMoves: this.previousMoves
                })
            });

            if (!response.ok) throw new Error('Failed to validate move');
            const result = await response.json();

            if (result.correct) {
                this.previousMoves.push(move);
                this.addMoveToHistory(move);

                if (result.completed) {
                    this.onPuzzleSolved();
                } else if (result.nextMove) {
                    // Make opponent's move after a short delay
                    setTimeout(() => {
                        const nextMove = this.parseMove(result.nextMove);
                        this.makeMove(nextMove);
                        this.previousMoves.push(nextMove);
                        this.addMoveToHistory(nextMove);
                    }, 500);
                }
            } else {
                this.updateStatus('Incorrect move. Try again.', 'error');
                return 'snapback';
            }
        } catch (error) {
            console.error('Error validating move:', error);
            this.updateStatus('Failed to validate move', 'error');
            return 'snapback';
        }
    }

    parseMove(moveString) {
        return {
            from: moveString.substring(0, 2),
            to: moveString.substring(2, 4),
            promotion: moveString.length > 4 ? moveString[4] : undefined
        };
    }

    async getHint() {
        try {
            const response = await fetch(
                `/api/puzzles/${this.currentPuzzle.id}/hint?moveCount=${this.previousMoves.length}`
            );
            if (!response.ok) throw new Error('Failed to get hint');
            
            const hint = await response.json();
            this.showHint(hint);
        } catch (error) {
            console.error('Error getting hint:', error);
            this.updateStatus('Failed to get hint', 'error');
        }
    }

    showHint(hint) {
        this.updateStatus(hint.text);
        if (hint.highlightSquares) {
            // TODO: Implement square highlighting
        }
    }

    async onPuzzleSolved() {
        this.isComplete = true;
        this.updateStatus('Puzzle solved! Well done!', 'success');
        this.elements.nextBtn.style.display = 'block';

        try {
            await fetch(`/api/puzzles/${this.currentPuzzle.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    solved: true,
                    timeSpent: Math.round((Date.now() - this.startTime) / 1000)
                })
            });
        } catch (error) {
            console.error('Error submitting solution:', error);
        }
    }

    makeMove(move) {
        const result = this.game.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion
        });

        if (result) {
            this.board.position(this.game.fen());
            return true;
        }
        return false;
    }

    addMoveToHistory(move) {
        const moveNumber = Math.floor((this.previousMoves.length + 1) / 2);
        const moveText = this.game.history().pop();
        
        const moveElement = document.createElement('div');
        moveElement.className = 'move';
        moveElement.textContent = `${moveNumber}. ${moveText}`;
        
        this.elements.moveList.appendChild(moveElement);
        this.elements.moveList.scrollTop = this.elements.moveList.scrollHeight;
    }

    resetPuzzle() {
        if (this.currentPuzzle) {
            this.setPuzzle(this.currentPuzzle);
        }
    }

    async loadNextPuzzle() {
        try {
            const response = await fetch('/api/puzzles/next');
            if (!response.ok) throw new Error('Failed to load next puzzle');
            
            const puzzle = await response.json();
            this.setPuzzle(puzzle);
        } catch (error) {
            console.error('Error loading next puzzle:', error);
            this.updateStatus('Failed to load next puzzle', 'error');
        }
    }

    updateStatus(message, type = 'info') {
        this.elements.status.textContent = message;
        this.elements.status.className = `status-message ${type}`;
    }

    onDragStart(source, piece) {
        // Don't allow moves if puzzle is complete
        if (this.isComplete) return false;

        // Only allow moves for the correct color
        const turn = this.game.turn();
        if ((turn === 'w' && piece.search(/^b/) !== -1) ||
            (turn === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }

        return true;
    }

    async onDrop(source, target, piece) {
        const move = {
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen for simplicity
        };

        // Check if move is legal
        if (!this.game.move(move)) {
            return 'snapback';
        }

        // Undo the move in the game (will be re-applied if valid)
        this.game.undo();

        // Validate the move against the puzzle solution
        return await this.validateMove(move);
    }

    onSnapEnd() {
        this.board.position(this.game.fen());
    }
}

// Initialize puzzle solver when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.puzzleSolver = new PuzzleSolver();
}); 