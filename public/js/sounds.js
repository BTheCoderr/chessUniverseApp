class SoundManager {
    constructor() {
        this.sounds = {
            move: new Audio('/sounds/move.mp3'),
            capture: new Audio('/sounds/capture.mp3'),
            check: new Audio('/sounds/check.mp3'),
            castle: new Audio('/sounds/castle.mp3'),
            gameStart: new Audio('/sounds/game-start.mp3'),
            gameEnd: new Audio('/sounds/game-end.mp3'),
            notification: new Audio('/sounds/notification.mp3')
        };
        
        // Preload all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.log('Sound play prevented:', e));
        }
    }

    setVolume(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume;
        });
    }
}

// Create global sound manager instance
const soundManager = new SoundManager();

// Default volume
soundManager.setVolume(0.5); 