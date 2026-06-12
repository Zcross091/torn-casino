// Crash Game
class CrashGame extends GameEngine {
    constructor() {
        super('crash', 'Crash', { rake: 0.02 });
        this.crashPoint = 1;
        this.currentMultiplier = 1;
        this.cashOutMultiplier = 0;
        this.gameRunning = false;
    }

    start() {
        if (!this.currentBet) {
            throw new Error('No bet placed');
        }

        this.gameRunning = true;
        this.crashPoint = 1 + this.getRandomNumber() * 20; // Crash between 1x and 21x
        this.currentMultiplier = 1;
        this.cashOutMultiplier = 0;
    }

    update() {
        if (!this.gameRunning) return null;

        this.currentMultiplier += 0.1;

        if (this.currentMultiplier >= this.crashPoint) {
            this.gameRunning = false;
            return this.lose();
        }

        return { type: 'update', multiplier: this.currentMultiplier };
    }

    cashOut() {
        if (!this.gameRunning) {
            throw new Error('Game not running');
        }

        this.gameRunning = false;
        this.cashOutMultiplier = this.currentMultiplier;
        return this.win(this.cashOutMultiplier);
    }

    getHTML() {
        return `
            <div class="game-controls">
                <div class="crash-display" style="text-align: center; margin: 30px 0;">
                    <div id="crashChart" style="font-size: 14px; color: var(--text-secondary); height: 200px; margin-bottom: 20px; border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        📈 Chart will appear here
                    </div>
                    <div id="crashMultiplier" style="font-size: 48px; font-weight: bold; color: var(--primary);">1.00x</div>
                </div>
                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="crashBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input" disabled id="crashBetInput">
                </div>
                <button id="playCrashBtn" class="btn btn-primary">Start Game</button>
                <button id="crashCashOutBtn" class="btn btn-small" style="display: none;">Cash Out</button>
                <div id="crashGameResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('crash', CrashGame);
