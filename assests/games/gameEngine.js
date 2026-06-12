// Sound System (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol=0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sounds = {
    playSpin: () => playTone(300, 'sine', 0.1, 0.05),
    playWin: () => {
        playTone(400, 'sine', 0.1, 0.1);
        setTimeout(() => playTone(600, 'sine', 0.2, 0.1), 100);
        setTimeout(() => playTone(800, 'sine', 0.4, 0.1), 200);
    },
    playLose: () => {
        playTone(300, 'sawtooth', 0.2, 0.1);
        setTimeout(() => playTone(200, 'sawtooth', 0.4, 0.1), 200);
    }
};

// Base Game Engine with animation, sounds, and improved logic
class GameEngine {
    constructor(gameId, gameName, options = {}) {
        this.gameId = gameId;
        this.gameName = gameName;
        this.minBet = options.minBet || CONFIG.MIN_BET;
        this.maxBet = options.maxBet || CONFIG.MAX_BET;
        this.rake = options.rake || CONFIG.HOUSE_RAKE;
        
        this.currentBet = 0;
        this.isPlaying = false;
        this.result = null;
        this.onResult = null;
    }

    /**
     * Place a bet
     */
    placeBet(amount) {
        if (amount < this.minBet) {
            throw new Error(`Minimum bet is $${this.minBet}`);
        }
        if (amount > this.maxBet) {
            throw new Error(`Maximum bet is $${this.maxBet}`);
        }

        const balance = api.getLocalBalance();
        if (amount > balance) {
            throw new Error('Insufficient balance');
        }

        this.currentBet = amount;
        api.deductMoney(amount);
        this.isPlaying = true;
        this.result = null;

        sounds.playSpin();

        return true;
    }

    /**
     * Handle win with animated display
     */
    win(multiplier) {
        const winAmount = this.currentBet * multiplier;
        const rakeAmount = winAmount * this.rake;
        const netWin = winAmount - rakeAmount;

        this.recordBet(this.currentBet, multiplier, netWin, true);
        api.addMoney(this.currentBet + netWin);

        this.result = {
            type: 'win',
            betAmount: this.currentBet,
            multiplier: multiplier,
            winAmount: netWin,
            totalPayout: this.currentBet + netWin,
            rakeAmount: rakeAmount
        };

        this.isPlaying = false;
        this.showRewardAnimation(this.currentBet + netWin, 'win');
        sounds.playWin();
        return this.result;
    }

    /**
     * Handle loss with animated display
     */
    lose() {
        this.recordBet(this.currentBet, 0, -this.currentBet, false);

        this.result = {
            type: 'lose',
            betAmount: this.currentBet,
            multiplier: 0,
            winAmount: 0,
            totalPayout: 0,
            rakeAmount: 0
        };

        this.isPlaying = false;
        this.showRewardAnimation(this.currentBet, 'loss');
        sounds.playLose();
        return this.result;
    }

    /**
     * Show animated reward counter
     */
    showRewardAnimation(amount, type) {
        const counter = document.createElement('div');
        counter.className = `reward-counter ${type}`;
        counter.textContent = type === 'win' ? `+$${Math.floor(amount).toLocaleString()}` : `-$${Math.floor(amount).toLocaleString()}`;
        
        // Position at balance display
        const balanceDisplay = document.getElementById('balanceAmount');
        if (balanceDisplay) {
            const rect = balanceDisplay.getBoundingClientRect();
            counter.style.left = (rect.left + rect.width / 2) + 'px';
            counter.style.top = rect.top + 'px';
            document.body.appendChild(counter);
            
            // Remove after animation
            setTimeout(() => counter.remove(), 2000);
        }
    }

    /**
     * Record bet in history
     */
    recordBet(betAmount, multiplier, netWin, isWin) {
        api.addBet({
            game: this.gameName,
            betAmount: betAmount,
            multiplier: multiplier,
            netWin: netWin,
            isWin: isWin
        });
    }

    /**
     * Better RNG with optional seed
     */
    getRandomNumber() {
        // Cryptographically better random if available
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return (array[0] / 0xffffffff);
        }
        // Fallback
        return Math.random();
    }

    /**
     * Get seeded random number for testing
     */
    getSeededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Generate multiple weighted random picks
     */
    getWeightedRandom(options) {
        const random = this.getRandomNumber();
        let cumulative = 0;

        for (let option of options) {
            cumulative += option.weight;
            if (random <= cumulative) {
                return option;
            }
        }

        return options[options.length - 1];
    }
}

// Global game registry
const gameRegistry = {};

function registerGame(gameId, gameClass) {
    gameRegistry[gameId] = gameClass;
}

function getGame(gameId) {
    return gameRegistry[gameId];
}
