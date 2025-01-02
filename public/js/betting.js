class BettingUI {
    constructor() {
        this.socket = io();
        this.selectedBets = new Map();
        this.board = null;
        this.game = new Chess();
        this.marketData = null;
        
        this.initializeSocket();
        this.initializeChessboard();
        this.initializeEventListeners();
    }

    initializeSocket() {
        // Connect to betting namespace
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.socket.emit('subscribeToBets', gameId);
        });

        // Listen for market updates
        this.socket.on('marketUpdate', (data) => {
            this.updateMarkets(data);
        });

        // Listen for bet confirmations
        this.socket.on('betPlaced', (data) => {
            this.handleBetPlaced(data);
        });

        // Listen for game state updates
        this.socket.on('gameState', (data) => {
            this.updateGameState(data);
        });
    }

    initializeChessboard() {
        const config = {
            position: 'start',
            orientation: playerColor,
            draggable: false,
            pieceTheme: '/img/chesspieces/{piece}.png'
        };

        this.board = Chessboard('game-board', config);
        $(window).resize(() => this.board.resize());
    }

    initializeEventListeners() {
        // Market selection
        $('.markets-grid').on('click', '.odds-button', (e) => {
            const button = $(e.currentTarget);
            const marketId = button.data('market-id');
            const choice = button.data('choice');
            const odds = button.data('odds');
            
            this.toggleBetSelection(marketId, choice, odds);
        });

        // Place bet
        $('.bet-slip .btn-success').on('click', () => {
            this.placeBet();
        });

        // Stake input
        $('.bet-slip input[type="number"]').on('input', (e) => {
            this.updatePotentialReturns(e.target.value);
        });

        // Chat controls
        $('.chat-input input').on('keypress', (e) => {
            if (e.which === 13) {
                this.sendChatMessage();
            }
        });

        $('.chat-controls .btn-primary').on('click', () => {
            this.sendChatMessage();
        });

        // Voice message
        $('.chat-controls .btn-secondary').on('click', () => {
            this.startVoiceRecording();
        });

        // Screen share
        $('.chat-controls .btn-info').on('click', () => {
            this.startScreenSharing();
        });
    }

    updateMarkets(data) {
        this.marketData = data;
        const marketsGrid = $('.markets-grid');
        marketsGrid.empty();

        data.markets.forEach(market => {
            const marketCard = this.createMarketCard(market);
            marketsGrid.append(marketCard);
        });
    }

    createMarketCard(market) {
        const card = $('<div>').addClass('market-card');
        
        const header = $('<h4>').text(market.name);
        card.append(header);

        const oddsContainer = $('<div>').addClass('odds-container');
        
        Object.entries(market.odds).forEach(([choice, odds]) => {
            const button = $('<button>')
                .addClass('odds-button')
                .attr({
                    'data-market-id': market.id,
                    'data-choice': choice,
                    'data-odds': odds
                })
                .text(`${choice} (${odds})`);

            if (this.selectedBets.has(`${market.id}-${choice}`)) {
                button.addClass('selected');
            }

            oddsContainer.append(button);
        });

        card.append(oddsContainer);
        return card;
    }

    toggleBetSelection(marketId, choice, odds) {
        const betKey = `${marketId}-${choice}`;
        
        if (this.selectedBets.has(betKey)) {
            this.selectedBets.delete(betKey);
            $(`.odds-button[data-market-id="${marketId}"][data-choice="${choice}"]`).removeClass('selected');
        } else {
            this.selectedBets.set(betKey, { marketId, choice, odds });
            $(`.odds-button[data-market-id="${marketId}"][data-choice="${choice}"]`).addClass('selected');
        }

        this.updateBetSlip();
    }

    updateBetSlip() {
        const selectedBets = $('.selected-bets');
        selectedBets.empty();

        this.selectedBets.forEach(bet => {
            const betElement = $('<div>').addClass('selected-bet')
                .append($('<span>').text(`${bet.choice} @ ${bet.odds}`))
                .append(
                    $('<button>').addClass('btn btn-sm btn-danger')
                        .text('Remove')
                        .on('click', () => this.toggleBetSelection(bet.marketId, bet.choice, bet.odds))
                );
            
            selectedBets.append(betElement);
        });

        this.updatePotentialReturns($('.bet-slip input[type="number"]').val());
    }

    updatePotentialReturns(stake) {
        if (!stake || this.selectedBets.size === 0) {
            $('.potential-returns').text('$0.00');
            return;
        }

        const totalOdds = Array.from(this.selectedBets.values())
            .reduce((acc, bet) => acc * parseFloat(bet.odds), 1);
        
        const potentialReturns = (parseFloat(stake) * totalOdds).toFixed(2);
        $('.potential-returns').text(`$${potentialReturns}`);
    }

    async placeBet() {
        const stake = parseFloat($('.bet-slip input[type="number"]').val());
        
        if (!stake || this.selectedBets.size === 0) {
            alert('Please select bets and enter a stake amount');
            return;
        }

        const bets = Array.from(this.selectedBets.values()).map(bet => ({
            marketId: bet.marketId,
            choice: bet.choice,
            odds: bet.odds,
            stake
        }));

        try {
            const response = await fetch('/betting/api/place-bet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bets })
            });

            const result = await response.json();
            
            if (result.success) {
                this.selectedBets.clear();
                this.updateBetSlip();
                alert('Bet placed successfully!');
            } else {
                alert(result.error || 'Failed to place bet');
            }
        } catch (error) {
            console.error('Error placing bet:', error);
            alert('Failed to place bet');
        }
    }

    updateGameState(data) {
        if (data.fen) {
            this.game.load(data.fen);
            this.board.position(data.fen);
        }

        // Update timers
        $('.player-info.white .player-time').text(this.formatTime(data.timeLeft.white));
        $('.player-info.black .player-time').text(this.formatTime(data.timeLeft.black));

        // Update game status
        $('.game-status .status-text').text(data.status);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    async sendChatMessage() {
        const input = $('.chat-input input');
        const message = input.val().trim();
        
        if (!message) return;

        try {
            await this.socket.emit('chatMessage', {
                roomId: gameId,
                message,
                type: 'text'
            });
            
            input.val('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    }

    async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                await this.uploadMedia(blob, 'audio');
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), 30000); // 30 second limit
        } catch (error) {
            console.error('Error starting voice recording:', error);
            alert('Failed to start voice recording');
        }
    }

    async startScreenSharing() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                await this.uploadMedia(blob, 'video');
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), 60000); // 1 minute limit
        } catch (error) {
            console.error('Error starting screen sharing:', error);
            alert('Failed to start screen sharing');
        }
    }

    async uploadMedia(blob, type) {
        const formData = new FormData();
        formData.append('file', blob);

        try {
            const response = await fetch('/betting/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                await this.socket.emit('chatMessage', {
                    roomId: gameId,
                    type,
                    content: result.url
                });
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            alert('Failed to upload media');
        }
    }
}

// Initialize betting UI when document is ready
$(document).ready(() => {
    window.bettingUI = new BettingUI();
}); 