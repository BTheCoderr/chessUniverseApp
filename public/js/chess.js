document.addEventListener('DOMContentLoaded', function() {
    const socket = io()
    const board = document.getElementById('chessboard')
    const resetButton = document.getElementById('resetButton')
    const saveButton = document.getElementById('saveButton')
    const loadButton = document.getElementById('loadButton')
    const gameIdInput = document.getElementById('gameId')
    const movesList = document.getElementById('movesList')
    const wagerForm = document.getElementById('wagerForm')
    const wagerStatus = document.getElementById('wagerStatus')
    const gameStatus = document.getElementById('game-status')
    const notification = document.getElementById('notification')
    const playerTimer = document.getElementById('player-timer')
    const opponentTimer = document.getElementById('opponent-timer')
    const capturedByPlayer = document.getElementById('captured-by-player')
    const capturedByOpponent = document.getElementById('captured-by-opponent')
    const turnIndicator = document.querySelector('.turn-indicator')

    let currentPlayer = 'black'
    let selectedSquare = null
    let gameActive = true
    let capturedPieces = { white: [], black: [] }
    let moveHistory = []
    let playerTime = 600 // 10 minutes in seconds
    let opponentTime = 600
    let timerInterval

    const initialBoard = [
        ['♜', '♘', '♝', '♛', '♚', '♝', '♞', '♜'],  // Black pieces
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],  // Black pawns
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],  // White pawns
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']   // White pieces
    ]

    function updateTurnIndicator() {
        turnIndicator.textContent = `${currentPlayer === 'black' ? 'Black' : 'White'}'s Turn`
        turnIndicator.className = `turn-indicator ${currentPlayer}-turn`
    }

    function createBoard() {
        board.innerHTML = ''
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = document.createElement('div')
                square.className = `square ${(i + j) % 2 === 0 ? 'white' : 'black'}`
                square.dataset.row = i
                square.dataset.col = j
                
                const piece = initialBoard[i][j]
                if (piece) {
                    square.textContent = piece
                    // Set piece color based on the piece type
                    square.dataset.pieceColor = '♔♕♖♗♘♙'.includes(piece) ? 'white' : 'black'
                }
                
                square.addEventListener('click', handleSquareClick)
                board.appendChild(square)
            }
        }
        updateTurnIndicator()
        soundManager.play('gameStart')
        startTimer()
    }

    function handleSquareClick(e) {
        if (!gameActive) return

        const square = e.target
        const piece = square.textContent
        const row = parseInt(square.dataset.row)
        const col = parseInt(square.dataset.col)

        if (selectedSquare) {
            if (isValidMove(selectedSquare, square)) {
                const fromRow = parseInt(selectedSquare.dataset.row)
                const fromCol = parseInt(selectedSquare.dataset.col)
                
                // Create algebraic notation for the move
                const from = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}`
                const to = `${String.fromCharCode(97 + col)}${8 - row}`
                const moveText = `${from}-${to}`
                
                const capturedPiece = movePiece(selectedSquare, square)
                if (capturedPiece) {
                    soundManager.play('capture')
                } else {
                    soundManager.play('move')
                }
                
                addMoveToHistory(moveText)

                // Check for check/checkmate
                if (isCheck()) {
                    soundManager.play('check')
                    showNotification(`${currentPlayer === 'black' ? 'White' : 'Black'} is in check!`)
                    
                    if (isCheckmate()) {
                        soundManager.play('gameEnd')
                        endGame(`Checkmate! ${currentPlayer === 'black' ? 'Black' : 'White'} wins!`)
                    }
                }

                currentPlayer = currentPlayer === 'black' ? 'white' : 'black'
                updateTurnIndicator()

                // Auto-save after each move
                saveToLocalStorage()

                socket.emit('move', {
                    from: { row: fromRow, col: fromCol },
                    to: { row, col }
                })
            }
            clearSelection()
        } else if (piece && isPieceOwnedByCurrentPlayer(piece)) {
            selectSquare(square)
        }
    }

    function selectSquare(square) {
        selectedSquare = square
        square.classList.add('selected')
        highlightValidMoves(square)
    }

    function clearSelection() {
        if (selectedSquare) {
            selectedSquare.classList.remove('selected')
            clearHighlights()
            selectedSquare = null
        }
    }

    function highlightValidMoves(square) {
        clearHighlights()
        const piece = square.textContent
        const row = parseInt(square.dataset.row)
        const col = parseInt(square.dataset.col)

        getAllSquares().forEach(targetSquare => {
            const targetRow = parseInt(targetSquare.dataset.row)
            const targetCol = parseInt(targetSquare.dataset.col)
            
            if (isValidMove(square, targetSquare)) {
                if (targetSquare.textContent) {
                    targetSquare.classList.add('valid-capture')
                } else {
                    targetSquare.classList.add('valid-move')
                }
            }
        })
    }

    function clearHighlights() {
        getAllSquares().forEach(square => {
            square.classList.remove('valid-move', 'valid-capture')
        })
    }

    function getAllSquares() {
        return Array.from(board.getElementsByClassName('square'))
    }

    function handleCapture(piece) {
        if ('♔♕♖♗♘♙'.includes(piece)) {
            capturedPieces.white.push(piece);
            capturedByOpponent.textContent = capturedPieces.white.join(' ');
        } else {
            capturedPieces.black.push(piece);
            capturedByPlayer.textContent = capturedPieces.black.join(' ');
        }
    }

    function addMoveToHistory(moveText) {
        const li = document.createElement('li');
        li.textContent = `${moveHistory.length + 1}. ${moveText}`;
        movesList.insertBefore(li, movesList.firstChild); // Add new moves at the top
        moveHistory.push(moveText);
        
        // Ensure the move is visible by scrolling to it
        movesList.scrollTop = 0;
    }

    function showNotification(message) {
        notification.textContent = message
        notification.classList.add('show')
        setTimeout(() => {
            notification.classList.remove('show')
        }, 3000)
    }

    function endGame(message) {
        gameActive = false
        gameStatus.textContent = message
        gameStatus.classList.add('show')
        clearInterval(timerInterval)
        soundManager.play('gameEnd')
    }

    function startTimer() {
        clearInterval(timerInterval)
        timerInterval = setInterval(() => {
            if (currentPlayer === 'white') {
                playerTime--
                playerTimer.textContent = formatTime(playerTime)
            } else {
                opponentTime--
                opponentTimer.textContent = formatTime(opponentTime)
            }

            if (playerTime <= 0 || opponentTime <= 0) {
                endGame(`Time's up! ${playerTime <= 0 ? 'Black' : 'White'} wins!`)
            }
        }, 1000)
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    function isValidMove(fromSquare, toSquare) {
        const piece = fromSquare.textContent
        const fromRow = parseInt(fromSquare.dataset.row)
        const fromCol = parseInt(fromSquare.dataset.col)
        const toRow = parseInt(toSquare.dataset.row)
        const toCol = parseInt(toSquare.dataset.col)

        // Can't move to a square with our own piece
        if (isPieceOwnedByCurrentPlayer(toSquare.textContent)) {
            return false
        }

        const rowDiff = Math.abs(toRow - fromRow)
        const colDiff = Math.abs(toCol - fromCol)

        switch (piece) {
            case '♙': // White pawn
                if (fromRow === 6) { // First move
                    return (toRow === 4 && fromCol === toCol && !getPieceAt(5, fromCol) && !getPieceAt(4, fromCol)) ||
                           (toRow === 5 && fromCol === toCol && !getPieceAt(5, fromCol)) ||
                           (toRow === 5 && colDiff === 1 && getPieceAt(toRow, toCol) && !isPieceOwnedByCurrentPlayer(getPieceAt(toRow, toCol)))
                }
                return (toRow === fromRow - 1 && fromCol === toCol && !getPieceAt(toRow, toCol)) ||
                       (toRow === fromRow - 1 && colDiff === 1 && getPieceAt(toRow, toCol) && !isPieceOwnedByCurrentPlayer(getPieceAt(toRow, toCol)))
            
            case '♟': // Black pawn
                if (fromRow === 1) { // First move
                    return (toRow === 3 && fromCol === toCol && !getPieceAt(2, fromCol) && !getPieceAt(3, fromCol)) ||
                           (toRow === 2 && fromCol === toCol && !getPieceAt(2, fromCol)) ||
                           (toRow === 2 && colDiff === 1 && getPieceAt(toRow, toCol) && !isPieceOwnedByCurrentPlayer(getPieceAt(toRow, toCol)))
                }
                return (toRow === fromRow + 1 && fromCol === toCol && !getPieceAt(toRow, toCol)) ||
                       (toRow === fromRow + 1 && colDiff === 1 && getPieceAt(toRow, toCol) && !isPieceOwnedByCurrentPlayer(getPieceAt(toRow, toCol)))
            
            case '♖': case '♜': // Rook
                return (fromRow === toRow || fromCol === toCol) && isPathClear(fromRow, fromCol, toRow, toCol)
            
            case '♘': case '♞': // Knight
                return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
            
            case '♗': case '♝': // Bishop
                return rowDiff === colDiff && isPathClear(fromRow, fromCol, toRow, toCol)
            
            case '♕': case '♛': // Queen
                return (fromRow === toRow || fromCol === toCol || rowDiff === colDiff) && 
                       isPathClear(fromRow, fromCol, toRow, toCol)
            
            case '♔': case '♚': // King
                return rowDiff <= 1 && colDiff <= 1
        }
        return false
    }

    function isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0
        let currentRow = fromRow + rowStep
        let currentCol = fromCol + colStep

        while (currentRow !== toRow || currentCol !== toCol) {
            if (getPieceAt(currentRow, currentCol)) {
                return false
            }
            currentRow += rowStep
            currentCol += colStep
        }
        return true
    }

    function movePiece(fromSquare, toSquare) {
        const capturedPiece = toSquare.textContent;
        const movingPiece = fromSquare.textContent;
        
        // Transfer the piece and its color data
        toSquare.textContent = movingPiece;
        toSquare.dataset.pieceColor = fromSquare.dataset.pieceColor;
        
        // Clear the source square
        fromSquare.textContent = '';
        delete fromSquare.dataset.pieceColor;
        
        if (capturedPiece) {
            handleCapture(capturedPiece);
        }
        
        return capturedPiece || null;
    }

    function isPieceOwnedByCurrentPlayer(piece) {
        if (!piece) return false;
        const isWhitePiece = '♔♕♖♗♘♙'.includes(piece);
        const isBlackPiece = '♚♛♜♝♞♟'.includes(piece);
        return (currentPlayer === 'white' && isWhitePiece) || 
               (currentPlayer === 'black' && isBlackPiece);
    }

    function getPieceAt(row, col) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
        return square ? square.textContent : null
    }

    function getSquare(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
    }

    function getBoardState() {
        const state = []
        for (let i = 0; i < 8; i++) {
            const row = []
            for (let j = 0; j < 8; j++) {
                row.push(getPieceAt(i, j) || '')
            }
            state.push(row)
        }
        return state
    }

    function loadGameState(gameState) {
        // Clear the board first
        board.innerHTML = '';
        
        // Load the board state
        const boardState = gameState.board;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = document.createElement('div');
                square.className = `square ${(i + j) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = i;
                square.dataset.col = j;
                
                const piece = boardState[i][j];
                if (piece) {
                    square.textContent = piece;
                    // Set piece color based on the piece type, not position
                    square.dataset.pieceColor = '♔♕♖♗♘♙'.includes(piece) ? 'white' : 'black';
                }
                
                square.addEventListener('click', handleSquareClick);
                board.appendChild(square);
            }
        }
        
        // Restore game state
        currentPlayer = gameState.currentPlayer;
        moveHistory = gameState.moveHistory || [];
        capturedPieces = gameState.capturedPieces || { white: [], black: [] };
        playerTime = gameState.playerTime || 600;
        opponentTime = gameState.opponentTime || 600;
        
        // Update UI
        updateTurnIndicator();
        updateMoveHistory();
        updateCapturedPieces();
    }

    function isCheck() {
        // Find the current player's king
        const kingSymbol = currentPlayer === 'white' ? '♔' : '♚'
        let kingRow, kingCol

        // Find king's position
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (getPieceAt(i, j) === kingSymbol) {
                    kingRow = i
                    kingCol = j
                    break
                }
            }
            if (kingRow !== undefined) break
        }

        // Check if any opponent's piece can capture the king
        const currentPlayerBefore = currentPlayer
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white'

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = getPieceAt(i, j)
                if (piece && isPieceOwnedByCurrentPlayer(piece)) {
                    const fromSquare = getSquare(i, j)
                    const toSquare = getSquare(kingRow, kingCol)
                    if (isValidMove(fromSquare, toSquare)) {
                        currentPlayer = currentPlayerBefore
                        return true
                    }
                }
            }
        }

        currentPlayer = currentPlayerBefore
        return false
    }

    function isCheckmate() {
        if (!isCheck()) return false

        // Try all possible moves for the current player
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = getPieceAt(i, j)
                if (piece && isPieceOwnedByCurrentPlayer(piece)) {
                    const fromSquare = getSquare(i, j)
                    
                    // Try moving to every square
                    for (let x = 0; x < 8; x++) {
                        for (let y = 0; y < 8; y++) {
                            const toSquare = getSquare(x, y)
                            if (isValidMove(fromSquare, toSquare)) {
                                // Make the move temporarily
                                const capturedPiece = movePiece(fromSquare, toSquare)
                                
                                // Check if we're still in check
                                const stillInCheck = isCheck()
                                
                                // Undo the move
                                movePiece(toSquare, fromSquare)
                                if (capturedPiece) {
                                    toSquare.textContent = capturedPiece
                                }
                                
                                // If this move gets us out of check, it's not checkmate
                                if (!stillInCheck) {
                                    return false
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // If we haven't found any valid moves, it's checkmate
        return true
    }

    function updateMoveHistory() {
        movesList.innerHTML = '';
        moveHistory.forEach((move, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${move}`;
            movesList.appendChild(li);
        });
    }

    function updateCapturedPieces() {
        capturedByPlayer.textContent = capturedPieces.black.join(' ')
        capturedByOpponent.textContent = capturedPieces.white.join(' ')
    }

    function saveToLocalStorage() {
        const gameState = {
            board: getBoardState(),
            currentPlayer,
            moveHistory,
            capturedPieces,
            playerTime,
            opponentTime,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('chessGameState', JSON.stringify(gameState));
        showNotification('Game auto-saved locally');
    }

    function loadFromLocalStorage() {
        const savedState = localStorage.getItem('chessGameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            loadGameState(gameState);
            showNotification('Game restored from local storage');
            return true;
        }
        return false;
    }

    // Initialize game
    createBoard()

    // Event listeners
    resetButton.addEventListener('click', () => {
        if (confirm('Start new game? Current game will be lost.')) {
            // Clear local storage
            localStorage.removeItem('chessGameState');
            
            // Reset board
            createBoard();
            clearSelection();
            
            // Reset game state
            gameActive = true;
            currentPlayer = 'black';
            capturedPieces = { white: [], black: [] };
            moveHistory = [];
            playerTime = opponentTime = 600;
            
            // Clear UI elements
            gameStatus.classList.remove('show');
            capturedByPlayer.textContent = '';
            capturedByOpponent.textContent = '';
            movesList.innerHTML = ''; // Clear moves history display
            
            // Update UI
            updateTurnIndicator();
            soundManager.play('gameStart');
        }
    })

    saveButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state: JSON.stringify({
                        board: getBoardState(),
                        currentPlayer,
                        moveHistory,
                        capturedPieces,
                        playerTime,
                        opponentTime
                    })
                })
            })
            const data = await response.json()
            showNotification(`Game saved! ID: ${data.id}`)
            soundManager.play('notification')
        } catch (err) {
            showNotification('Error saving game')
        }
    })

    loadButton.addEventListener('click', async () => {
        const id = gameIdInput.value
        if (!id) return

        try {
            const response = await fetch(`/load/${id}`)
            const data = await response.json()
            const gameState = JSON.parse(data.state)
            loadGameState(gameState)
            showNotification('Game loaded successfully')
            soundManager.play('notification')
        } catch (err) {
            showNotification('Error loading game')
        }
    })

    wagerForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const amount = document.getElementById('wagerAmount').value
        if (amount) {
            socket.emit('wager', { amount, username: playerName })
            showNotification(`Wager placed: $${amount}`)
            soundManager.play('notification')
        }
    })

    // Socket events
    socket.on('move', (data) => {
        const fromSquare = getSquare(data.from.row, data.from.col)
        const toSquare = getSquare(data.to.row, data.to.col)
        if (fromSquare && toSquare) {
            const capturedPiece = movePiece(fromSquare, toSquare)
            if (capturedPiece) {
                handleCapture(capturedPiece)
                soundManager.play('capture')
            } else {
                soundManager.play('move')
            }
            currentPlayer = currentPlayer === 'black' ? 'white' : 'black'
            updateTurnIndicator()
        }
    })

    // Add auto-load on page load
    if (!loadFromLocalStorage()) {
        // If no saved game, start a new one
        createBoard();
    }
});
