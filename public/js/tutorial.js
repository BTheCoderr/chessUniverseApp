class TutorialManager {
    constructor() {
        this.board = null;
        this.game = null;
        this.currentExercise = null;
        
        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        const config = {
            draggable: true,
            position: 'start',
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this)
        };
        
        this.board = Chessboard('board', config);
        this.game = new Chess();
    }

    setupEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetPosition();
        });

        document.getElementById('hint-btn').addEventListener('click', () => {
            this.getHint();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextExercise();
        });
    }

    loadExercise(exercise) {
        this.currentExercise = exercise;
        this.game.load(exercise.position.fen);
        this.board.position(exercise.position.fen);
        
        document.getElementById('exercise-description').textContent = exercise.position.description;
        document.getElementById('feedback').textContent = '';
    }

    onDragStart(source, piece) {
        // Allow moves only if it's the player's turn
        return !this.game.game_over() && 
               piece.search(/^b/) === -1; // Only allow white pieces
    }

    onDrop(source, target) {
        const move = this.game.move({
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen for simplicity
        });

        if (move === null) return 'snapback';

        this.validateMove(source + target);
    }

    onSnapEnd() {
        this.board.position(this.game.fen());
    }

    async validateMove(move) {
        try {
            const response = await fetch(`/tutorial/${this.currentExercise._id}/exercise/${this.currentExercise._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    move: move,
                    position: this.game.fen()
                })
            });

            const result = await response.json();
            this.showFeedback(result);
        } catch (error) {
            console.error('Error validating move:', error);
            this.showFeedback({ correct: false, explanation: 'Error validating move' });
        }
    }

    async getHint() {
        try {
            const response = await fetch(`/tutorial/${this.currentExercise._id}/exercise/${this.currentExercise._id}/hint?position=${encodeURIComponent(this.game.fen())}`);
            const result = await response.json();
            this.showFeedback({ hint: result.hint });
        } catch (error) {
            console.error('Error getting hint:', error);
            this.showFeedback({ hint: 'Error getting hint' });
        }
    }

    resetPosition() {
        this.game.load(this.currentExercise.position.fen);
        this.board.position(this.currentExercise.position.fen);
        document.getElementById('feedback').textContent = '';
    }

    showFeedback(result) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = result.correct ? 
            result.explanation : 
            (result.hint || 'Try again');
        feedback.className = result.correct ? 'text-success' : 'text-info';
    }

    nextExercise() {
        // This would typically load the next exercise
        // For now, just reset the current one
        this.resetPosition();
    }
}

// Initialize the tutorial manager when the page loads
window.tutorialManager = new TutorialManager(); 