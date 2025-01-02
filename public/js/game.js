let board = null;
let game = new Chess();
let socket = null;
let playerColor = 'white';
let currentTurn = 'white';
let moveHistory = [];
let timers = {
    white: null,
    black: null
};

// Initialize the game board
function initializeBoard() {
    const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: '/img/pieces/{piece}.png'
    };

    board = Chessboard('board', config);
    window.addEventListener('resize', board.resize);
}

// Handle piece drag start
function onDragStart(source, piece) {
    if (game.game_over()) return false;
    if (currentTurn !== playerColor) return false;
    if ((playerColor === 'white' && piece.search(/^b/) !== -1) ||
        (playerColor === 'black' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

// Handle piece drop
function onDrop(source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    updateStatus();
    
    if (socket) {
        socket.emit('move', {
            from: source,
            to: target,
            promotion: 'q'
        });
    }
}

// Handle piece snap end
function onSnapEnd() {
    board.position(game.fen());
}

// Update game status
function updateStatus() {
    let status = '';
    let moveColor = game.turn() === 'w' ? 'White' : 'Black';

    if (game.in_checkmate()) {
        status = `Game over, ${moveColor} is in checkmate.`;
    } else if (game.in_draw()) {
        status = 'Game over, drawn position';
    } else {
        status = `${moveColor} to move`;
        if (game.in_check()) {
            status += `, ${moveColor} is in check`;
        }
    }

    document.getElementById('gameStatus').textContent = status;
    updateMoveList();
}

// Update move list
function updateMoveList() {
    const moves = game.history({ verbose: true });
    const movesList = document.getElementById('movesList');
    movesList.innerHTML = '';

    for (let i = 0; i < moves.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = moves[i];
        const blackMove = moves[i + 1];

        const moveElement = document.createElement('div');
        moveElement.className = 'move-pair';
        moveElement.innerHTML = `
            ${moveNumber}. ${whiteMove.san}
            ${blackMove ? ' ' + blackMove.san : ''}
        `;
        movesList.appendChild(moveElement);
    }

    movesList.scrollTop = movesList.scrollHeight;
}

// Initialize timers
function initializeTimers() {
    const initialTime = gameConfig.timeControl.initial;
    timers = {
        white: initialTime,
        black: initialTime
    };

    updateTimerDisplay('white');
    updateTimerDisplay('black');
}

// Update timer display
function updateTimerDisplay(color) {
    const minutes = Math.floor(timers[color] / 60);
    const seconds = timers[color] % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.querySelector(`.${color}-timer`).textContent = display;
}

// Initialize socket connection
function initializeSocket() {
    socket = io();

    socket.on('connect', () => {
        socket.emit('join', {
            type: gameConfig.type,
            mode: gameConfig.mode,
            guestId: gameConfig.guestId,
            guestUsername: gameConfig.guestUsername
        });
    });

    socket.on('gameStart', (data) => {
        playerColor = data.color;
        document.getElementById('whiteUsername').textContent = data.white;
        document.getElementById('blackUsername').textContent = data.black;
        
        if (playerColor === 'black') {
            board.orientation('black');
        }

        document.getElementById('resignBtn').disabled = false;
        document.getElementById('drawBtn').disabled = false;
        initializeTimers();
    });

    socket.on('move', (move) => {
        game.move(move);
        board.position(game.fen());
        currentTurn = game.turn() === 'w' ? 'white' : 'black';
        updateStatus();
    });

    socket.on('gameOver', (data) => {
        alert(data.message);
        document.getElementById('resignBtn').disabled = true;
        document.getElementById('drawBtn').disabled = true;
    });
}

// Initialize analysis panel
function initializeAnalysis() {
    const analysisBtn = document.getElementById('analysisBtn');
    const closeAnalysisBtn = document.getElementById('closeAnalysisBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const getBestMoveBtn = document.getElementById('getBestMoveBtn');
    const analysisPanel = document.getElementById('analysisPanel');

    analysisBtn.addEventListener('click', () => {
        analysisPanel.classList.toggle('hidden');
    });

    closeAnalysisBtn.addEventListener('click', () => {
        analysisPanel.classList.add('hidden');
    });

    analyzeBtn.addEventListener('click', () => {
        socket.emit('analyze', { fen: game.fen() });
    });

    getBestMoveBtn.addEventListener('click', () => {
        socket.emit('getBestMove', { fen: game.fen() });
    });

    socket.on('analysis', (data) => {
        document.getElementById('evaluation').textContent = `Evaluation: ${data.evaluation}`;
        document.getElementById('bestLine').textContent = `Best line: ${data.bestLine}`;
    });
}

// Initialize game controls
function initializeControls() {
    const resignBtn = document.getElementById('resignBtn');
    const drawBtn = document.getElementById('drawBtn');
    const flipBoardBtn = document.getElementById('flipBoardBtn');
    const findOpponentBtn = document.getElementById('findOpponentBtn');

    resignBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to resign?')) {
            socket.emit('resign');
        }
    });

    drawBtn.addEventListener('click', () => {
        socket.emit('offerDraw');
    });

    flipBoardBtn.addEventListener('click', () => {
        board.flip();
    });

    if (findOpponentBtn) {
        findOpponentBtn.addEventListener('click', () => {
            socket.emit('findOpponent');
            findOpponentBtn.disabled = true;
            findOpponentBtn.textContent = 'Finding opponent...';
        });
    }
}

// Initialize move navigation
function initializeMoveNavigation() {
    const prevMove = document.getElementById('prevMove');
    const nextMove = document.getElementById('nextMove');

    prevMove.addEventListener('click', () => {
        game.undo();
        board.position(game.fen());
        updateStatus();
    });

    nextMove.addEventListener('click', () => {
        // TODO: Implement move forward functionality
    });
}

// Start the game
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    initializeSocket();
    initializeControls();
    initializeMoveNavigation();
    updateStatus();
}); 