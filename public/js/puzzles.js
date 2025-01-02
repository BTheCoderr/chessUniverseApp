document.addEventListener('DOMContentLoaded', () => {
    // Initialize variables
    let currentPuzzle = null;
    let puzzleBoard = null;
    let game = new Chess();

    // DOM elements
    const themeFilter = document.getElementById('themeFilter');
    const difficultyFilter = document.getElementById('difficultyFilter');
    const puzzleGrid = document.getElementById('puzzleGrid');
    const dailyPuzzlePreview = document.getElementById('dailyPuzzlePreview');

    // Stats elements
    const puzzleRating = document.getElementById('puzzleRating');
    const puzzlesSolved = document.getElementById('puzzlesSolved');
    const puzzleStreak = document.getElementById('puzzleStreak');

    // Load user stats
    async function loadUserStats() {
        try {
            const response = await fetch('/api/puzzles/stats');
            if (response.ok) {
                const stats = await response.json();
                puzzleRating.textContent = stats.rating || 1500;
                puzzlesSolved.textContent = stats.solved || 0;
                puzzleStreak.textContent = stats.streak || 0;
            }
        } catch (error) {
            console.error('Failed to load user stats:', error);
        }
    }

    // Load daily puzzle
    async function loadDailyPuzzle() {
        try {
            const response = await fetch('/api/puzzles/daily');
            if (response.ok) {
                const puzzle = await response.json();
                displayDailyPuzzle(puzzle);
            }
        } catch (error) {
            console.error('Failed to load daily puzzle:', error);
        }
    }

    // Display daily puzzle preview
    function displayDailyPuzzle(puzzle) {
        dailyPuzzlePreview.innerHTML = `
            <div class="puzzle-card" data-puzzle-id="${puzzle.id}">
                <div class="puzzle-board" id="dailyBoard"></div>
                <div class="puzzle-info">
                    <h4>Daily Challenge</h4>
                    <p>${puzzle.description}</p>
                    <button class="solve-btn" onclick="window.location.href='/puzzles/${puzzle.id}'">
                        Solve Puzzle
                    </button>
                </div>
            </div>
        `;

        // Initialize mini board for daily puzzle
        const config = {
            position: puzzle.fen,
            showNotation: true,
            draggable: false,
            pieceTheme: '/img/pieces/{piece}.png'
        };
        const dailyBoard = Chessboard('dailyBoard', config);

        // Resize board to fit container
        window.addEventListener('resize', dailyBoard.resize);
    }

    // Load puzzles by theme and difficulty
    async function loadPuzzles() {
        const theme = themeFilter.value;
        const difficulty = difficultyFilter.value;

        try {
            const response = await fetch(`/api/puzzles/theme/${theme}?difficulty=${difficulty}`);
            if (response.ok) {
                const puzzles = await response.json();
                displayPuzzles(puzzles);
            }
        } catch (error) {
            console.error('Failed to load puzzles:', error);
        }
    }

    // Display puzzles in grid
    function displayPuzzles(puzzles) {
        puzzleGrid.innerHTML = puzzles.map(puzzle => `
            <div class="puzzle-card" data-puzzle-id="${puzzle.id}">
                <div class="puzzle-board" id="board-${puzzle.id}"></div>
                <div class="puzzle-info">
                    <p class="puzzle-theme">${puzzle.themes.join(', ')}</p>
                    <p class="puzzle-rating">Rating: ${puzzle.rating}</p>
                    <button class="solve-btn" onclick="window.location.href='/puzzles/${puzzle.id}'">
                        Solve Puzzle
                    </button>
                </div>
            </div>
        `).join('');

        // Initialize mini boards for each puzzle
        puzzles.forEach(puzzle => {
            const config = {
                position: puzzle.fen,
                showNotation: true,
                draggable: false,
                pieceTheme: '/img/pieces/{piece}.png'
            };
            const board = Chessboard(`board-${puzzle.id}`, config);

            // Resize board to fit container
            window.addEventListener('resize', board.resize);
        });
    }

    // Event listeners for filters
    themeFilter.addEventListener('change', loadPuzzles);
    difficultyFilter.addEventListener('change', loadPuzzles);

    // Initialize page
    loadUserStats();
    loadDailyPuzzle();
    loadPuzzles();
}); 