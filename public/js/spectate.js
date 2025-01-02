class SpectatorMode {
    constructor() {
        this.board = null;
        this.game = new Chess();
        this.selectedGameId = null;
        this.socket = io('/spectate');
        this.isFlipped = false;

        // DOM elements
        this.elements = {
            gamesList: document.getElementById('gamesList'),
            modeFilter: document.getElementById('modeFilter'),
            ratingFilter: document.getElementById('ratingFilter'),
            board: document.getElementById('board'),
            moveList: document.getElementById('moveList'),
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            viewerCount: document.getElementById('viewerCount'),
            flipBtn: document.getElementById('flipBtn'),
            analysisBtn: document.getElementById('analysisBtn'),
            blackPlayer: document.querySelector('.black-player'),
            whitePlayer: document.querySelector('.white-player'),
            gameStatus: document.querySelector('.game-status')
        };

        this.initializeBoard();
        this.setupEventListeners();
        this.loadLiveGames();
        this.setupSocketHandlers();
    }

    initializeBoard() {
        const config = {
            draggable: false,
            position: 'start',
            pieceTheme: '/img/pieces/{piece}.png'
        };

        this.board = Chessboard(this.elements.board, config);
        window.addEventListener('resize', () => this.board.resize());
    }

    setupEventListeners() {
        // Filter handlers
        this.elements.modeFilter.addEventListener('change', () => this.loadLiveGames());
        this.elements.ratingFilter.addEventListener('change', () => this.loadLiveGames());

        // Chat handlers
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());

        // Board control handlers
        this.elements.flipBtn.addEventListener('click', () => this.flipBoard());
        this.elements.analysisBtn.addEventListener('click', () => this.openAnalysis());
    }

    setupSocketHandlers() {
        this.socket.on('gameUpdate', (data) => {
            if (data.gameId === this.selectedGameId) {
                this.updateGameState(data);
            }
        });

        this.socket.on('gameEnded', (data) => {
            if (data.gameId === this.selectedGameId) {
                this.handleGameEnd(data);
            }
        });

        this.socket.on('chatMessage', (message) => {
            this.addChatMessage(message);
        });

        this.socket.on('viewerCount', (count) => {
            this.elements.viewerCount.textContent = `${count} viewers`;
        });
    }

    async loadLiveGames() {
        try {
            const mode = this.elements.modeFilter.value;
            const minRating = this.elements.ratingFilter.value;
            
            const response = await fetch(`/game/live?mode=${mode}&minRating=${minRating}`);
            if (!response.ok) throw new Error('Failed to load live games');
            
            const games = await response.json();
            this.displayGamesList(games);
        } catch (error) {
            console.error('Error loading live games:', error);
        }
    }

    displayGamesList(games) {
        this.elements.gamesList.innerHTML = games.map(game => `
            <div class="game-item ${game.gameId === this.selectedGameId ? 'active' : ''}"
                 data-game-id="${game.gameId}"
                 onclick="spectator.selectGame('${game.gameId}')">
                <div class="players">
                    <span class="white">${game.white.username} (${game.white.rating})</span>
                    <span class="vs">vs</span>
                    <span class="black">${game.black.username} (${game.black.rating})</span>
                </div>
                <div class="game-meta">
                    <span class="mode">${game.mode}</span>
                    <span class="time">${this.formatTime(game.startTime)}</span>
                </div>
            </div>
        `).join('');
    }

    async selectGame(gameId) {
        if (this.selectedGameId) {
            this.socket.emit('leaveGame', { gameId: this.selectedGameId });
        }

        this.selectedGameId = gameId;
        this.socket.emit('joinGame', { gameId });

        try {
            const response = await fetch(`/game/${gameId}/state`);
            if (!response.ok) throw new Error('Failed to load game state');
            
            const gameState = await response.json();
            this.updateGameState(gameState);
        } catch (error) {
            console.error('Error loading game state:', error);
        }

        // Update active game in list
        document.querySelectorAll('.game-item').forEach(item => {
            item.classList.toggle('active', item.dataset.gameId === gameId);
        });
    }

    updateGameState(state) {
        // Update game position
        this.game.load(state.position);
        this.board.position(state.position, false);

        // Update player info
        this.elements.whitePlayer.querySelector('.username').textContent = state.white.username;
        this.elements.whitePlayer.querySelector('.rating').textContent = state.white.rating;
        this.elements.whitePlayer.querySelector('.time').textContent = this.formatClock(state.timeControl.white);

        this.elements.blackPlayer.querySelector('.username').textContent = state.black.username;
        this.elements.blackPlayer.querySelector('.rating').textContent = state.black.rating;
        this.elements.blackPlayer.querySelector('.time').textContent = this.formatClock(state.timeControl.black);

        // Update game status
        this.elements.gameStatus.querySelector('.mode').textContent = state.mode;
        this.elements.gameStatus.querySelector('.move-count').textContent = `Move ${Math.floor(this.game.history().length / 2) + 1}`;

        // Update move list
        this.updateMoveList();
    }

    updateMoveList() {
        const moves = this.game.history();
        this.elements.moveList.innerHTML = moves.map((move, index) => {
            if (index % 2 === 0) {
                return `<div class="move">
                    ${Math.floor(index / 2) + 1}. ${move}
                    ${moves[index + 1] ? ' ' + moves[index + 1] : ''}
                </div>`;
            }
            return '';
        }).join('');

        this.elements.moveList.scrollTop = this.elements.moveList.scrollHeight;
    }

    handleGameEnd(data) {
        const { winner, method } = data;
        let message = '';

        switch (method) {
            case 'checkmate':
                message = `Game Over - ${winner} wins by checkmate!`;
                break;
            case 'resignation':
                message = `Game Over - ${winner} wins by resignation!`;
                break;
            case 'timeout':
                message = `Game Over - ${winner} wins on time!`;
                break;
            case 'draw':
                message = 'Game Over - Draw!';
                break;
            default:
                message = 'Game Over!';
        }

        this.addSystemMessage(message);
    }

    flipBoard() {
        this.isFlipped = !this.isFlipped;
        this.board.flip();
    }

    openAnalysis() {
        if (this.selectedGameId) {
            window.open(`/analysis/${this.selectedGameId}`, '_blank');
        }
    }

    sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (message && this.selectedGameId) {
            this.socket.emit('chatMessage', {
                gameId: this.selectedGameId,
                message
            });
            this.elements.messageInput.value = '';
        }
    }

    addChatMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
            <span class="username">${message.username}:</span>
            <span class="text">${this.escapeHtml(message.text)}</span>
        `;
        this.elements.chatMessages.appendChild(messageElement);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    addSystemMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.textContent = message;
        this.elements.chatMessages.appendChild(messageElement);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    formatClock(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize spectator mode when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.spectator = new SpectatorMode();
}); 