// Torn City API Integration
class TornAPI {
    constructor() {
        this.apiKey = localStorage.getItem(CONFIG.STORAGE_KEY_API_KEY);
        this.sessionToken = localStorage.getItem('casino_session_token');
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem(CONFIG.STORAGE_KEY_API_KEY, key);
    }

    clearApiKey() {
        this.apiKey = null;
        this.sessionToken = null;
        localStorage.removeItem(CONFIG.STORAGE_KEY_API_KEY);
        localStorage.removeItem('casino_session_token');
    }

    async getUserInfo() {
        if (!this.apiKey) {
            throw new Error('No API key set');
        }
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: this.apiKey })
            });
            if (!res.ok) throw new Error('Backend auth failed');
            const json = await res.json();
            
            this.sessionToken = json.sessionToken;
            localStorage.setItem('casino_session_token', this.sessionToken);
            this.setLocalBalance(json.balance);

            return {
                id: json.userId,
                name: json.username,
                money: json.balance,
                vip_tier: json.vip_tier
            };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async getMoney() {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/user/balance`, {
            headers: { 'Authorization': `Bearer ${this.sessionToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch balance');
        const data = await res.json();
        this.setLocalBalance(data.balance);
        return data.balance;
    }

    getLocalBalance() {
        return parseInt(localStorage.getItem(CONFIG.STORAGE_KEY_BALANCE)) || 0;
    }

    setLocalBalance(amount) {
        localStorage.setItem(CONFIG.STORAGE_KEY_BALANCE, Math.max(0, amount).toString());
    }

    // UI instantly reflects bet deduction
    deductMoney(amount) {
        const currentBalance = this.getLocalBalance();
        if (currentBalance < amount) {
            throw new Error('Insufficient balance');
        }
        this.setLocalBalance(currentBalance - amount);
        return true;
    }

    // UI instantly reflects win
    addMoney(amount) {
        const currentBalance = this.getLocalBalance();
        this.setLocalBalance(currentBalance + amount);
        return true;
    }

    // Sync with backend when bet finishes
    addBet(bet) {
        const bets = this.getBets();
        bets.unshift({
            ...bet,
            timestamp: new Date().toISOString()
        });
        bets.splice(100);
        localStorage.setItem(CONFIG.STORAGE_KEY_BETS, JSON.stringify(bets));

        // Sync with backend
        this.syncBetWithServer(bet);
    }

    async syncBetWithServer(bet) {
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/bets/place`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionToken}`
                },
                body: JSON.stringify({ game: bet.game, amount: bet.betAmount, multiplier: bet.multiplier })
            });
            const data = await res.json();
            if (data.newBalance !== undefined) {
                this.setLocalBalance(data.newBalance);
                // Try to trigger a UI update safely if possible
                if (typeof ui !== 'undefined' && ui.updateBalance) {
                    ui.updateBalance();
                }
            }
        } catch (e) {
            console.error("Failed to sync bet with backend:", e);
        }
    }

    getBets() {
        const bets = localStorage.getItem(CONFIG.STORAGE_KEY_BETS);
        return bets ? JSON.parse(bets) : [];
    }

    clearAllData() {
        localStorage.removeItem(CONFIG.STORAGE_KEY_USER);
        localStorage.removeItem(CONFIG.STORAGE_KEY_BALANCE);
        localStorage.removeItem(CONFIG.STORAGE_KEY_BETS);
        this.clearApiKey();
    }

    restoreSession() {
        const savedApiKey = localStorage.getItem(CONFIG.STORAGE_KEY_API_KEY);
        if (savedApiKey) {
            this.apiKey = savedApiKey;
            return true;
        }
        return false;
    }

    async isSessionValid() {
        if (!this.apiKey) return false;
        try {
            await this.getUserInfo();
            return true;
        } catch (error) {
            return false;
        }
    }
}

const api = new TornAPI();
