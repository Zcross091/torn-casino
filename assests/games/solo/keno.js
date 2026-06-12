// Keno Game
class KenoGame extends GameEngine {
    constructor() {
        super('keno', 'Keno', { rake: 0.05 });
        this.selectedNumbers = [];
        this.drawnNumbers = [];
        this.maxPicks = 10;
    }

    pickNumbers(numbers) {
        if (numbers.length > this.maxPicks) {
            throw new Error(`Maximum ${this.maxPicks} numbers`);
        }
        if (numbers.some(n => n < 1 || n > 80)) {
            throw new Error('Numbers must be between 1 and 80');
        }
        this.selectedNumbers = numbers;
    }

    drawNumbers() {
        if (!this.currentBet) {
            throw new Error('No bet placed');
        }

        if (this.selectedNumbers.length === 0) {
            throw new Error('Pick numbers first');
        }

        this.drawnNumbers = [];
        const pool = Array.from({ length: 80 }, (_, i) => i + 1);

        // Draw 20 numbers
        for (let i = 0; i < 20; i++) {
            const idx = Math.floor(this.getRandomNumber() * pool.length);
            this.drawnNumbers.push(pool[idx]);
            pool.splice(idx, 1);
        }

        // Count matches
        const matches = this.selectedNumbers.filter(n => this.drawnNumbers.includes(n)).length;

        // Payout table
        const payouts = {
            1: 0,
            2: 1.5,
            3: 2,
            4: 4,
            5: 6,
            6: 10,
            7: 15,
            8: 20,
            9: 30,
            10: 50
        };

        const multiplier = payouts[matches] || 0;

        if (multiplier > 0) {
            return this.win(multiplier);
        } else {
            return this.lose();
        }
    }

    getHTML() {
        return `
            <div class="game-controls">
                <div style="text-align: center; margin: 20px 0;">
                    <div id="kenoNumbers" style="
                        display: grid;
                        grid-template-columns: repeat(8, 1fr);
                        gap: 8px;
                        margin-bottom: 20px;
                        padding: 20px;
                        background: var(--dark-bg);
                        border-radius: 8px;
                    ">
                        ${Array(80).fill(0).map((_, i) => `
                            <div id="keno-${i + 1}" class="keno-number" style="
                                padding: 10px;
                                background: var(--card-bg);
                                border: 2px solid var(--border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-weight: bold;
                                color: var(--text-secondary);
                                transition: all 0.2s;
                                user-select: none;
                            ">${i + 1}</div>
                        `).join('')}
                    </div>
                    <div id="kenoInfo" style="color: var(--text-secondary); margin-bottom: 20px;">
                        Selected: <span id="kenoSelected">0</span> / ${this.maxPicks}
                    </div>
                </div>
                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="kenoBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input">
                </div>
                <button id="playKenoBtn" class="btn btn-primary">Draw Numbers</button>
                <div id="kenoGameResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('keno', KenoGame);
