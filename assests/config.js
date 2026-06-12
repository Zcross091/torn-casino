// Configuration
const CONFIG = {
    // Torn City API
    API_BASE: 'https://api.torn.com',
    
    // Game Configuration
    GAMES: {
        DICE: { name: 'Dice', rake: 0.05 },
        WHEEL: { name: 'Wheel', rake: 0.05 },
        CRASH: { name: 'Crash', rake: 0.02 },
        MINES: { name: 'Mines', rake: 0.05 },
        HILO: { name: 'Hi-Lo', rake: 0.05 },
        BLACKJACK: { name: 'Blackjack', rake: 0.05 },
        TOWER: { name: 'Tower', rake: 0.05 },
        MOLES: { name: 'Moles', rake: 0.05 },
        CHICKEN: { name: 'Chicken', rake: 0.05 },
        PLINKO: { name: 'Plinko', rake: 0.05 },
        KENO: { name: 'Keno', rake: 0.05 },
    },

    // Min/Max bets
    MIN_BET: 1,
    MAX_BET: 1000000,

    // House rake percentage
    HOUSE_RAKE: 0.05,

    // Local storage keys
    STORAGE_KEY_USER: 'casino_user',
    STORAGE_KEY_BALANCE: 'casino_balance',
    STORAGE_KEY_BETS: 'casino_bets',
    STORAGE_KEY_API_KEY: 'torn_api_key'
};

// Optional backend proxy (set to your backend URL to avoid CORS and hide API calls)
// Example: 'http://localhost:3000'
CONFIG.BACKEND_URL = 'http://localhost:3000';

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
