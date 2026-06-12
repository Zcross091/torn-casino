// Chicken Game
class ChickenGame extends GameEngine {
    constructor() {
        super('chicken', 'Chicken', { rake: 0.05 });
        this.board = [];
        this.caught = 0;
        this.targetChickens = 3;
    }

    startGame() {
        if (!this.currentBet) {
            throw new Error('No bet placed');
        }

        this.board = Array(12).fill(false);
        
        // Randomly place golden chickens
        let placed = 0;
        while (placed < this.targetChickens) {
            const pos = Math.floor(this.getRandomNumber() * 12);
            if (!this.board[pos]) {
                this.board[pos] = true;
                placed++;
            }
        }

        this.caught = 0;
    }

    catchChicken(index) {
        if (this.board[index]) {
            this.caught++;
            this.board[index] = false;

            if (this.caught >= this.targetChickens) {
                return this.win(2 + (this.caught * 0.2));
            }

            return { type: 'caught', progress: this.caught };
        } else {
            return this.lose();
        }
    }

    getHTML() {
        return `
            <div class="game-controls">
                <div style="text-align: center; margin: 20px 0;">
                    <div id="chickenGrid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
                        ${Array(12).fill(0).map((_, i) => `
                            <div id="chicken-${i}" class="chicken" style="
                                padding: 20px;
                                background: var(--card-bg);
                                border: 2px solid var(--border);
                                border-radius: 8px;
                                font-size: 32px;
                                cursor: pointer;
                                text-align: center;
                            ">🐔</div>
                        `).join('')}
                    </div>
                    <div id="chickenScore" style="font-size: 20px; color: var(--primary); font-weight: bold; margin: 20px 0;">
                        Caught: 0 / 3
                    </div>
                </div>
                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="chickenBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input">
                </div>
                <button id="playChickenBtn" class="btn btn-primary">Start Game</button>
                <div id="chickenGameResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('chicken', ChickenGame);
