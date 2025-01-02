document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    
    // Friend system functionality
    function challengeFriend(friendId) {
        socket.emit('game-challenge', { friendId });
        showNotification('Challenge sent!');
    }

    function spectateGame(friendId) {
        socket.emit('spectate-request', { friendId });
        showNotification('Spectate request sent!');
    }

    // Game replay functionality
    function loadGame(gameId) {
        window.location.href = `/game/replay/${gameId}`;
    }

    // Game analysis functionality
    function analyzeGame(gameId) {
        window.location.href = `/game/analyze/${gameId}`;
    }

    // Settings form handling
    const settingsForm = document.querySelector('.settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(settingsForm);
            const settings = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/settings/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(settings)
                });
                
                if (response.ok) {
                    showNotification('Settings saved successfully!');
                } else {
                    showNotification('Error saving settings');
                }
            } catch (err) {
                showNotification('Error saving settings');
            }
        });
    }

    // Friend management
    const addFriendForm = document.getElementById('addFriendForm');
    if (addFriendForm) {
        addFriendForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('friendUsername').value;
            try {
                const response = await fetch('/friend/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username })
                });
                
                if (response.ok) {
                    showNotification('Friend added successfully!');
                    location.reload();
                } else {
                    const data = await response.json();
                    showNotification(data.error || 'Error adding friend');
                }
            } catch (err) {
                showNotification('Error adding friend');
            }
        });
    }

    // Notification system
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Socket event handlers
    socket.on('game-challenge', (data) => {
        const accept = confirm(`${data.challenger} has challenged you to a game. Accept?`);
        if (accept) {
            socket.emit('challenge-accepted', { challengerId: data.challengerId });
            window.location.href = `/game/${data.gameId}`;
        } else {
            socket.emit('challenge-declined', { challengerId: data.challengerId });
        }
    });

    socket.on('spectate-approved', (data) => {
        window.location.href = `/game/spectate/${data.gameId}`;
    });

    // Make functions globally available
    window.challengeFriend = challengeFriend;
    window.spectateGame = spectateGame;
    window.loadGame = loadGame;
    window.analyzeGame = analyzeGame;
}); 