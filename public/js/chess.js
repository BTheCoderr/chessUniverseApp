document.addEventListener('DOMContentLoaded', function() {
    const socket = io()
    const board = document.getElementById('chessboard')
    const resetButton = document.getElementById('resetButton')
    const saveButton = document.getElementById('saveButton')
    const loadButton = document.getElementById('loadButton')
    const gameIdInput = document.getElementById('gameId')
    const movesList = document.getElementById('movesList')
    const timerElement = document.getElementById('timer')
    const wagerForm = document.getElementById('wagerForm')
    const wagerStatus = document.getElementById('wagerStatus')
    let currentPlayer = 'black' // Start with black
    const initialRows = ["♖♘♗♕♔♗♘♖", "♙♙♙♙♙♙♙♙", "", "", "", "", "♟♟♟♟♟♟♟♟", "♜♞♝♛♚♝♞♜"]
    let squares = []
    let timeRemaining = 600 // 10 minutes in seconds
    let timer

    function createSquare(i, j, piece) {
        const square = document.createElement('div')
        square.className = `square ${(i + j) % 2 === 0 ? 'white' : 'black'}`
        square.textContent = piece || ''
        square.draggable = !!square.textContent
        square.id = `square-${i}-${j}`

        square.addEventListener('dragstart', function(e) {
            if (isValidPiece(square.textContent, currentPlayer)) {
                e.dataTransfer.setData('piece', e.target.textContent)
                e.dataTransfer.setData('sourceId', e.target.id)
                e.dataTransfer.effectAllowed = 'move'
                e.target.classList.add('dragging')
                console.log(`Drag start: ${e.target.textContent} from ${e.target.id}`)
                highlightPossibleMoves(square)
            } else {
                e.preventDefault()
            }
        })

        square.addEventListener('dragover', function(e) {
            e.preventDefault()
            const piece = e.dataTransfer.getData('piece')
            const sourceId = e.dataTransfer.getData('sourceId')
            const sourceSquare = document.getElementById(sourceId)
            if (sourceSquare && isValidDropTarget(sourceSquare, square, piece, currentPlayer)) {
                e.dataTransfer.dropEffect = 'move'
                e.target.classList.add('valid-drop')
                console.log(`Drag over: valid drop target ${square.id}`)
            } else {
                console.log(`Drag over: invalid drop target ${square.id}`)
            }
        })

        square.addEventListener('dragleave', function(e) {
            e.target.classList.remove('valid-drop')
            console.log(`Drag leave: ${square.id}`)
        })

        square.addEventListener('drop', function(e) {
            e.preventDefault()
            e.target.classList.remove('valid-drop')
            const piece = e.dataTransfer.getData('piece')
            const sourceId = e.dataTransfer.getData('sourceId')
            const sourceSquare = document.getElementById(sourceId)
            console.log(`Drop: ${piece} to ${square.id} from ${sourceId}`)

            if (sourceSquare !== e.target && (!e.target.textContent || isOpponentPiece(piece, e.target.textContent))) {
                e.target.textContent = piece
                e.target.draggable = true
                sourceSquare.textContent = ''
                sourceSquare.draggable = false

                recordMove(sourceSquare.id, e.target.id, piece)
                clearHighlights()

                if (isInCheck(currentPlayer)) {
                    alert(`${currentPlayer} is in check!`)
                }

                if (isCheckmate(currentPlayer)) {
                    alert(`${currentPlayer} is in checkmate! Game over.`)
                }

                // Emit the move to the server
                socket.emit('move', {
                    piece: piece,
                    sourceId: sourceId,
                    targetId: e.target.id
                })

                currentPlayer = currentPlayer === 'white' ? 'black' : 'white'
            } else {
                console.log(`Drop rejected: invalid move`)
                clearHighlights()
            }
        })

        square.addEventListener('dragend', function(e) {
            e.target.classList.remove('dragging')
            clearHighlights()
            console.log(`Drag end: ${e.target.textContent}`)
        })

        return square
    }

    function isValidPiece(piece, player) {
        const isWhitePiece = piece.charCodeAt(0) >= 9812 && piece.charCodeAt(0) <= 9817
        return (player === 'white' && isWhitePiece) || (player === 'black' && !isWhitePiece)
    }

    function isValidDropTarget(sourceSquare, targetSquare, piece, player) {
        if (!targetSquare.textContent || isOpponentPiece(piece, targetSquare.textContent)) {
            const sourceCoords = getSquareCoords(sourceSquare.id)
            const targetCoords = getSquareCoords(targetSquare.id)
            return isValidMove(piece, sourceCoords, targetCoords)
        }
        return false
    }

    function isOpponentPiece(piece, targetPiece) {
        const isWhitePiece = piece.charCodeAt(0) >= 9812 && piece.charCodeAt(0) <= 9823
        const isTargetWhitePiece = targetPiece.charCodeAt(0) >= 9812 && targetPiece.charCodeAt(0) <= 9823
        return isWhitePiece !== isTargetWhitePiece
    }

    function getSquareCoords(squareId) {
        const parts = squareId.split('-')
        return [parseInt(parts[1]), parseInt(parts[2])]
    }

    function isValidMove(piece, sourceCoords, targetCoords) {
        const [sourceRow, sourceCol] = sourceCoords
        const [targetRow, targetCol] = targetCoords
        const rowDiff = Math.abs(targetRow - sourceRow)
        const colDiff = Math.abs(targetCol - sourceCol)

        switch (piece) {
            case '♙': // White pawn
                return (sourceRow === 6 && targetRow === 4 && colDiff === 0 && !squares[5][sourceCol].textContent && !squares[4][sourceCol].textContent) || // two squares forward from initial position
                    (rowDiff === 1 && colDiff === 0 && targetRow < sourceRow && !squares[targetRow][targetCol].textContent) || // one square forward
                    (rowDiff === 1 && colDiff === 1 && targetRow < sourceRow && isOpponentPiece(piece, squares[targetRow][targetCol].textContent)) // capture diagonally
            case '♟': // Black pawn
                return (sourceRow === 1 && targetRow === 3 && colDiff === 0 && !squares[2][sourceCol].textContent && !squares[3][sourceCol].textContent) || // two squares forward from initial position
                    (rowDiff === 1 && colDiff === 0 && targetRow > sourceRow && !squares[targetRow][targetCol].textContent) || // one square forward
                    (rowDiff === 1 && colDiff === 1 && targetRow > sourceRow && isOpponentPiece(piece, squares[targetRow][targetCol].textContent)) // capture diagonally
            case '♜': // Rook
            case '♖':
                return (rowDiff === 0 || colDiff === 0) && isPathClear(sourceCoords, targetCoords)
            case '♞': // Knight
            case '♘':
                return rowDiff * colDiff === 2
            case '♝': // Bishop
            case '♗':
                return rowDiff === colDiff && isPathClear(sourceCoords, targetCoords)
            case '♛': // Queen
            case '♕':
                return (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) && isPathClear(sourceCoords, targetCoords)
            case '♚': // King
            case '♔':
                return rowDiff <= 1 && colDiff <= 1
            default:
                return false
        }
    }

    function isPathClear(sourceCoords, targetCoords) {
        const [sourceRow, sourceCol] = sourceCoords
        const [targetRow, targetCol] = targetCoords
        const rowStep = targetRow > sourceRow ? 1 : (targetRow < sourceRow ? -1 : 0)
        const colStep = targetCol > sourceCol ? 1 : (targetCol < sourceCol ? -1 : 0)
        let row = sourceRow + rowStep
        let col = sourceCol + colStep
        while (row !== targetRow || col !== targetCol) {
            if (squares[row][col].textContent) return false
            row += rowStep
            col += colStep
        }
        return true
    }

    function recordMove(sourceId, targetId, piece) {
        const move = `${piece} from ${getSquareLabel(sourceId)} to ${getSquareLabel(targetId)}`
        const listItem = document.createElement('li')
        listItem.textContent = move
        movesList.appendChild(listItem)
    }

    function getSquareLabel(squareId) {
        const parts = squareId.split('-')
        const row = parseInt(parts[1])
        const col = parseInt(parts[2])
        const columns = 'abcdefgh'
        return `${columns[col]}${8 - row}`
    }

    function isInCheck(player) {
        const king = player === 'white' ? '♔' : '♚'
        let kingCoords
        outerLoop:
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (squares[i][j].textContent === king) {
                    kingCoords = [i, j]
                    break outerLoop
                }
            }
        }
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = squares[i][j].textContent
                if (piece && isOpponentPiece(king, piece) && isValidMove(piece, [i, j], kingCoords)) {
                    return true
                }
            }
        }
        return false
    }

    function isCheckmate(player) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = squares[i][j].textContent
                if (piece && isValidPiece(piece, player)) {
                    for (let x = 0; x < 8; x++) {
                        for (let y = 0; y < 8; y++) {
                            if (isValidDropTarget(squares[i][j], squares[x][y], piece, player)) {
                                const originalTargetPiece = squares[x][y].textContent
                                squares[x][y].textContent = piece
                                squares[i][j].textContent = ''
                                if (!isInCheck(player)) {
                                    squares[i][j].textContent = piece
                                    squares[x][y].textContent = originalTargetPiece
                                    return false
                                }
                                squares[i][j].textContent = piece
                                squares[x][y].textContent = originalTargetPiece
                            }
                        }
                    }
                }
            }
        }
        return true
    }

    function highlightPossibleMoves(square) {
        const piece = square.textContent
        const [sourceRow, sourceCol] = getSquareCoords(square.id)
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (isValidMove(piece, [sourceRow, sourceCol], [i, j])) {
                    squares[i][j].classList.add('highlight')
                }
            }
        }
    }

    function clearHighlights() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                squares[i][j].classList.remove('highlight')
            }
        }
    }

    function resetBoard() {
        board.innerHTML = ''
        movesList.innerHTML = ''
        for (let i = 0; i < 8; i++) {
            squares[i] = []
            for (let j = 0; j < 8; j++) {
                const square = createSquare(i, j, initialRows[i][j])
                squares[i][j] = square
                board.appendChild(square)
            }
        }
        currentPlayer = 'black' // Start with black
        resetTimer()
    }

    function resetTimer() {
        clearInterval(timer)
        timeRemaining = 600 // 10 minutes in seconds
        updateTimerDisplay()
        startTimer()
    }

    function startTimer() {
        timer = setInterval(() => {
            timeRemaining--
            updateTimerDisplay()
            if (timeRemaining <= 0) {
                clearInterval(timer)
                alert('Time\'s up! Game over.')
            }
        }, 1000)
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60)
        const seconds = timeRemaining % 60
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    resetButton.addEventListener('click', resetBoard)

    saveButton.addEventListener('click', () => {
        const gameState = squares.map(row => row.map(square => square.textContent)).flat().join(',')
        fetch('/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ state: gameState })
        })
        .then(response => response.json())
        .then(data => {
            alert(`Game saved with ID: ${data.id}`)
        })
        .catch(error => {
            console.error('Error saving game state:', error)
        })
    })

    loadButton.addEventListener('click', () => {
        const gameId = gameIdInput.value
        fetch(`/load/${gameId}`)
        .then(response => response.json())
        .then(data => {
            const gameState = data.state.split(',')
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    squares[i][j].textContent = gameState[i * 8 + j]
                    squares[i][j].draggable = !!squares[i][j].textContent
                }
            }
        })
        .catch(error => {
            console.error('Error loading game state:', error)
        })
    })

    wagerForm.addEventListener('submit', function(event) {
        event.preventDefault()
        const wagerAmount = document.getElementById('wagerAmount').value
        wagerStatus.textContent = `Wager placed: ${wagerAmount}`
        // Emit wager event to the server
        socket.emit('wager', { amount: wagerAmount })
    })

    socket.on('move', (data) => {
        const { piece, sourceId, targetId } = data
        const sourceSquare = document.getElementById(sourceId)
        const targetSquare = document.getElementById(targetId)

        targetSquare.textContent = piece
        targetSquare.draggable = true
        sourceSquare.textContent = ''
        sourceSquare.draggable = false

        recordMove(sourceId, targetId, piece)

        currentPlayer = currentPlayer === 'white' ? 'black' : 'white'
    })

    resetBoard()
})






/*document.addEventListener('DOMContentLoaded', function() {
    const board = document.getElementById('chessboard')
    const resetButton = document.getElementById('resetButton')
    const movesList = document.getElementById('movesList')
    let currentPlayer = 'black' // Start with black
    const initialRows = ["♜♞♝♛♚♝♞♜", "♟♟♟♟♟♟♟♟", "", "", "", "", "♙♙♙♙♙♙♙♙", "♖♘♗♕♔♗♘♖"]
    let squares = []

    function createSquare(i, j, piece) {
        const square = document.createElement('div')
        square.className = `square ${(i + j) % 2 === 0 ? 'white' : 'black'}`
        square.textContent = piece || ''
        square.draggable = !!square.textContent
        square.id = `square-${i}-${j}`

        square.addEventListener('dragstart', function(e) {
            if (isValidPiece(square.textContent, currentPlayer)) {
                e.dataTransfer.setData('piece', e.target.textContent)
                e.dataTransfer.setData('sourceId', e.target.id)
                e.dataTransfer.effectAllowed = 'move'
                e.target.classList.add('dragging')
                console.log(`Drag start: ${e.target.textContent} from ${e.target.id}`)
                highlightPossibleMoves(square)
            } else {
                e.preventDefault()
            }
        })

        square.addEventListener('dragover', function(e) {
            e.preventDefault()
            const piece = e.dataTransfer.getData('piece')
            const sourceId = e.dataTransfer.getData('sourceId')
            const sourceSquare = document.getElementById(sourceId)
            if (sourceSquare && isValidDropTarget(sourceSquare, square, piece, currentPlayer)) {
                e.dataTransfer.dropEffect = 'move'
                e.target.classList.add('valid-drop')
                console.log(`Drag over: valid drop target ${square.id}`)
            } else {
                console.log(`Drag over: invalid drop target ${square.id}`)
            }
        })

        square.addEventListener('dragleave', function(e) {
            e.target.classList.remove('valid-drop')
            console.log(`Drag leave: ${square.id}`)
        })

        square.addEventListener('drop', function(e) {
            e.preventDefault()
            e.target.classList.remove('valid-drop')
            const piece = e.dataTransfer.getData('piece')
            const sourceId = e.dataTransfer.getData('sourceId')
            const sourceSquare = document.getElementById(sourceId)
            console.log(`Drop: ${piece} to ${square.id} from ${sourceId}`)

            if (sourceSquare !== e.target && (!e.target.textContent || isOpponentPiece(piece, e.target.textContent))) {
                e.target.textContent = piece
                e.target.draggable = true
                sourceSquare.textContent = ''
                sourceSquare.draggable = false

                recordMove(sourceSquare.id, e.target.id, piece)
                clearHighlights()

                if (isInCheck(currentPlayer)) {
                    alert(`${currentPlayer} is in check!`)
                }

                if (isCheckmate(currentPlayer)) {
                    alert(`${currentPlayer} is in checkmate! Game over.`)
                }

                currentPlayer = currentPlayer === 'white' ? 'black' : 'white'
            } else {
                console.log(`Drop rejected: invalid move`)
                clearHighlights()
            }
        })

        square.addEventListener('dragend', function(e) {
            e.target.classList.remove('dragging')
            clearHighlights()
            console.log(`Drag end: ${e.target.textContent}`)
        })

        return square
    }

    function isValidPiece(piece, player) {
        const isWhitePiece = piece.charCodeAt(0) >= 9812 && piece.charCodeAt(0) <= 9817
        return (player === 'white' && isWhitePiece) || (player === 'black' && !isWhitePiece)
    }

    function isValidDropTarget(sourceSquare, targetSquare, piece, player) {
        if (!targetSquare.textContent || isOpponentPiece(piece, targetSquare.textContent)) {
            const sourceCoords = getSquareCoords(sourceSquare.id)
            const targetCoords = getSquareCoords(targetSquare.id)
            return isValidMove(piece, sourceCoords, targetCoords)
        }
        return false
    }

    function isOpponentPiece(piece, targetPiece) {
        const isWhitePiece = piece.charCodeAt(0) >= 9812 && piece.charCodeAt(0) <= 9823
        const isTargetWhitePiece = targetPiece.charCodeAt(0) >= 9812 && targetPiece.charCodeAt(0) <= 9823
        return isWhitePiece !== isTargetWhitePiece
    }

    function getSquareCoords(squareId) {
        const parts = squareId.split('-')
        return [parseInt(parts[1]), parseInt(parts[2])]
    }

    function isValidMove(piece, sourceCoords, targetCoords) {
        const [sourceRow, sourceCol] = sourceCoords;
        const [targetRow, targetCol] = targetCoords;
        const rowDiff = Math.abs(targetRow - sourceRow);
        const colDiff = Math.abs(targetCol - sourceCol);
    
        switch (piece) {
            case '♙': // White pawn
                if ((sourceRow === 3) && (sourceCol !== targetCol) && (targetRow === 2) && (Math.abs(targetCol - sourceCol) === 1)) {
                    // En passant capture
                    const lastMove = getLastMove();
                    if (lastMove && (lastMove.piece === '♟') && (lastMove.sourceRow === 1) && (lastMove.targetRow === 3) &&
                        (lastMove.targetCol === targetCol)) {
                        return true;
                    }
                }
                return (sourceRow === 6 && targetRow === 4 && colDiff === 0 && !squares[5][sourceCol].textContent && !squares[4][sourceCol].textContent) || // two squares forward from initial position
                    (rowDiff === 1 && colDiff === 0 && targetRow < sourceRow && !squares[targetRow][targetCol].textContent) || // one square forward
                    (rowDiff === 1 && colDiff === 1 && targetRow < sourceRow && isOpponentPiece(piece, squares[targetRow][targetCol].textContent)); // capture diagonally
            case '♟': // Black pawn
                if ((sourceRow === 4) && (sourceCol !== targetCol) && (targetRow === 5) && (Math.abs(targetCol - sourceCol) === 1)) {
                    // En passant capture
                    const lastMove = getLastMove();
                    if (lastMove && (lastMove.piece === '♙') && (lastMove.sourceRow === 6) && (lastMove.targetRow === 4) &&
                        (lastMove.targetCol === targetCol)) {
                        return true;
                    }
                }
                return (sourceRow === 1 && targetRow === 3 && colDiff === 0 && !squares[2][sourceCol].textContent && !squares[3][sourceCol].textContent) || // two squares forward from initial position
                    (rowDiff === 1 && colDiff === 0 && targetRow > sourceRow && !squares[targetRow][targetCol].textContent) || // one square forward
                    (rowDiff === 1 && colDiff === 1 && targetRow > sourceRow && isOpponentPiece(piece, squares[targetRow][targetCol].textContent)); // capture diagonally
            case '♜': // Rook
            case '♖':
                return (rowDiff === 0 || colDiff === 0) && isPathClear(sourceCoords, targetCoords);
            case '♞': // Knight
            case '♘':
                return rowDiff * colDiff === 2;
            case '♝': // Bishop
            case '♗':
                return rowDiff === colDiff && isPathClear(sourceCoords, targetCoords);
            case '♛': // Queen
            case '♕':
                return (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) && isPathClear(sourceCoords, targetCoords);
            case '♚': // King
            case '♔':
                return rowDiff <= 1 && colDiff <= 1;
            default:
                return false;
        }
    }
    

    function isPathClear(sourceCoords, targetCoords) {
        const [sourceRow, sourceCol] = sourceCoords
        const [targetRow, targetCol] = targetCoords
        const rowStep = targetRow > sourceRow ? 1 : (targetRow < sourceRow ? -1 : 0)
        const colStep = targetCol > sourceCol ? 1 : (targetCol < sourceCol ? -1 : 0)
        let row = sourceRow + rowStep
        let col = sourceCol + colStep
        while (row !== targetRow || col !== targetCol) {
            if (squares[row][col].textContent) return false
            row += rowStep
            col += colStep
        }
        return true
    }

    function recordMove(sourceId, targetId, piece) {
        const move = `${piece} from ${getSquareLabel(sourceId)} to ${getSquareLabel(targetId)}`
        const listItem = document.createElement('li')
        listItem.textContent = move
        movesList.appendChild(listItem)
    }

    function getSquareLabel(squareId) {
        const parts = squareId.split('-')
        const row = parseInt(parts[1])
        const col = parseInt(parts[2])
        const columns = 'abcdefgh'
        return `${columns[col]}${8 - row}`
    }

    function isInCheck(player) {
        const king = player === 'white' ? '♔' : '♚'
        let kingCoords
        outerLoop:
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (squares[i][j].textContent === king) {
                    kingCoords = [i, j]
                    break outerLoop
                }
            }
        }
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = squares[i][j].textContent
                if (piece && isOpponentPiece(king, piece) && isValidMove(piece, [i, j], kingCoords)) {
                    return true
                }
            }
        }
        return false
    }

    function isCheckmate(player) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = squares[i][j].textContent
                if (piece && isValidPiece(piece, player)) {
                    for (let x = 0; x < 8; x++) {
                        for (let y = 0; y < 8; y++) {
                            if (isValidDropTarget(squares[i][j], squares[x][y], piece, player)) {
                                const originalTargetPiece = squares[x][y].textContent
                                squares[x][y].textContent = piece
                                squares[i][j].textContent = ''
                                if (!isInCheck(player)) {
                                    squares[i][j].textContent = piece
                                    squares[x][y].textContent = originalTargetPiece
                                    return false
                                }
                                squares[i][j].textContent = piece
                                squares[x][y].textContent = originalTargetPiece
                            }
                        }
                    }
                }
            }
        }
        return true
    }

    function highlightPossibleMoves(square) {
        const piece = square.textContent
        const [sourceRow, sourceCol] = getSquareCoords(square.id)
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (isValidMove(piece, [sourceRow, sourceCol], [i, j])) {
                    squares[i][j].classList.add('highlight')
                }
            }
        }
    }

    function clearHighlights() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                squares[i][j].classList.remove('highlight')
            }
        }
    }

    function resetBoard() {
        board.innerHTML = ''
        movesList.innerHTML = ''
        for (let i = 0; i < 8; i++) {
            squares[i] = []
            for (let j = 0; j < 8; j++) {
                const square = createSquare(i, j, initialRows[i][j])
                squares[i][j] = square
                board.appendChild(square)
            }
        }
        currentPlayer = 'black' // Start with black
    }

    resetButton.addEventListener('click', resetBoard)
    resetBoard()
})

*/