class CommunicationManager {
    constructor(socket) {
        this.socket = socket;
        this.localStream = null;
        this.peerConnection = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isChatVisible = true;

        // DOM Elements
        this.localVideo = document.querySelector('#localVideo video');
        this.remoteVideo = document.querySelector('#remoteVideo video');
        this.toggleVideoBtn = document.getElementById('toggleVideo');
        this.toggleAudioBtn = document.getElementById('toggleAudio');
        this.toggleChatBtn = document.getElementById('toggleChat');
        this.chatContainer = document.querySelector('.chat-container');
        this.messageInput = document.getElementById('messageInput');
        this.sendMessageBtn = document.getElementById('sendMessage');
        this.messagesContainer = document.getElementById('chatMessages');

        this.initializeEventListeners();
        this.setupWebRTC();
    }

    async setupWebRTC() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            this.localVideo.srcObject = this.localStream;

            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            };
            this.peerConnection = new RTCPeerConnection(configuration);

            // Add local tracks to the connection
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            // Handle incoming tracks
            this.peerConnection.ontrack = (event) => {
                this.remoteVideo.srcObject = event.streams[0];
            };

            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('ice-candidate', event.candidate);
                }
            };

            // Socket event handlers
            this.socket.on('offer', async (offer) => {
                await this.peerConnection.setRemoteDescription(offer);
                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);
                this.socket.emit('answer', answer);
            });

            this.socket.on('answer', async (answer) => {
                await this.peerConnection.setRemoteDescription(answer);
            });

            this.socket.on('ice-candidate', async (candidate) => {
                await this.peerConnection.addIceCandidate(candidate);
            });

        } catch (error) {
            console.error('Error setting up WebRTC:', error);
        }
    }

    initializeEventListeners() {
        // Video toggle
        this.toggleVideoBtn.addEventListener('click', () => {
            this.isVideoEnabled = !this.isVideoEnabled;
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = this.isVideoEnabled;
            });
            this.toggleVideoBtn.classList.toggle('active');
        });

        // Audio toggle
        this.toggleAudioBtn.addEventListener('click', () => {
            this.isAudioEnabled = !this.isAudioEnabled;
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = this.isAudioEnabled;
            });
            this.toggleAudioBtn.classList.toggle('active');
        });

        // Chat toggle
        this.toggleChatBtn.addEventListener('click', () => {
            this.isChatVisible = !this.isChatVisible;
            this.chatContainer.style.display = this.isChatVisible ? 'flex' : 'none';
            this.toggleChatBtn.classList.toggle('active');
        });

        // Send message
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Handle incoming messages
        this.socket.on('chat-message', (message) => {
            this.addMessageToChat(message, false);
        });
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (message) {
            this.socket.emit('chat-message', message);
            this.addMessageToChat(message, true);
            this.messageInput.value = '';
        }
    }

    addMessageToChat(message, isSent) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
        messageElement.textContent = message;
        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async startCall() {
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            this.socket.emit('offer', offer);
        } catch (error) {
            console.error('Error starting call:', error);
        }
    }

    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    window.communicationManager = new CommunicationManager(socket);
}); 