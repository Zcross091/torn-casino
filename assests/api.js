// Torn City API Integration
class TornAPI {
    constructor() {
        this.apiKey = localStorage.getItem(CONFIG.STORAGE_KEY_API_KEY);
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem(CONFIG.STORAGE_KEY_API_KEY, key);
    }

    clearApiKey() {
        this.apiKey = null;
        localStorage.removeItem(CONFIG.STORAGE_KEY_API_KEY);
    }

    /**
     * Verify API key and get user info
     */
    async getUserInfo() {
        if (!this.apiKey) {
            throw new Error('No API key set');
        }

        try {
            // If a backend proxy is configured, use it to verify the API key
            if (CONFIG.BACKEND_URL) {
                const res = await fetch(`${CONFIG.BACKEND_URL.replace(/\/$/, '')}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey: this.apiKey })
                });

                if (!res.ok) {
                    const txt = await res.text().catch(() => '');
                    throw new Error(`Backend auth failed (status ${res.status}) ${txt}`);
                }

                const json = await res.json();
                // Backend returns { userId, username, balance }
                return {
                    id: json.userId || json.id,
                    name: json.username || json.name,
                    level: json.level || 0,
                    money: json.balance != null ? json.balance : (json.money || 0),
                    lastAction: json.lastAction || null
                };
            }

            // Use the Torn API /user endpoint and request JSON explicitly.
            const url = `${CONFIG.API_BASE}/user/?selections=profile&key=${this.apiKey}&format=json`;
            const response = await fetch(url);

            if (!response.ok) {
                const txt = await response.text().catch(() => '');
                throw new Error(`Failed to fetch user info (status ${response.status}) ${txt}`);
            }

            const data = await response.json().catch(err => {
                throw new Error('Invalid JSON response from API: ' + err.message);
            });

            if (data && data.error) {
                throw new Error(data.error.error || JSON.stringify(data.error));
            }

            return {
                id: data.player_id,
                name: data.name,
                level: data.level,
                money: data.money,
                lastAction: data.last_action
            };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Get user's money (for balance checking)
     */
    async getMoney() {
        const info = await this.getUserInfo();
        return info.money;
    }

    /**
     * Simulate a money deduction (in real scenario, this would go to backend)
     * For now, we use local storage to track casino tokens
     */
    async deductMoney(amount) {
        // This should be handled by your backend
        // For now, we'll use local balance
        const currentBalance = this.getLocalBalance();
        if (currentBalance < amount) {
            throw new Error('Insufficient balance');
        }
        this.setLocalBalance(currentBalance - amount);
        return true;
    }

    /**
     * Add winnings (in real scenario, this would go to backend)
     */
    async addMoney(amount) {
        // This should be handled by your backend
        // For now, we'll use local balance
        const currentBalance = this.getLocalBalance();
        this.setLocalBalance(currentBalance + amount);
        return true;
    }

    /**
     * Local balance management (until backend is set up)
     */
    getLocalBalance() {
        return parseInt(localStorage.getItem(CONFIG.STORAGE_KEY_BALANCE)) || 0;
    }

    setLocalBalance(amount) {
        localStorage.setItem(CONFIG.STORAGE_KEY_BALANCE, Math.max(0, amount).toString());
    }

    /**
     * Add bet to history
     */
    addBet(bet) {
        const bets = this.getBets();
        bets.unshift({
            ...bet,
            timestamp: new Date().toISOString()
        });
        // Keep only last 100 bets
        bets.splice(100);
        localStorage.setItem(CONFIG.STORAGE_KEY_BETS, JSON.stringify(bets));
    }

    /**
     * Get bet history
     */
    getBets() {
        const bets = localStorage.getItem(CONFIG.STORAGE_KEY_BETS);
        return bets ? JSON.parse(bets) : [];
    }

    /**
     * Clear all data
     */
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
            console.warn('Session validation failed:', error.message);
            return false;
        }
    }
}

const api = new TornAPI();
