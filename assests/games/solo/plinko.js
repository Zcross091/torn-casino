// Plinko Game
class PlinkoGame extends GameEngine {
    constructor() {
        super('plinko', 'Plinko', { rake: 0.05 });
        this.rows = 8;
        this.ballPath = [];
        this.finalPosition = 0;
        this.multipliers = [2, 1.5, 4, 1, 8, 1.2, 5, 1, 2];
    }

    dropBall() {
        if (!this.currentBet) {
            throw new Error('No bet placed');
        }

        this.ballPath = [];
        let position = 0;

        // Simulate ball bouncing down
        for (let row = 0; row < this.rows; row++) {
            const direction = this.getRandomNumber() > 0.5 ? 1 : 0;
            position = position * 2 + direction;
            this.ballPath.push(position);
        }

        this.finalPosition = position;
        const multiplier = this.multipliers[Math.min(position, this.multipliers.length - 1)];

        if (multiplier > 1) {
            return this.win(multiplier);
        } else {
            return this.lose();
        }
    }

    getHTML() {
        return `
            <div class="game-controls">
                <div style="text-align: center; margin: 20px 0;">
                    <div id="plinkoBoard" style="
                        border: 2px solid var(--border);
                        border-radius: 8px;
                        padding: 20px;
                        background: var(--dark-bg);
                        margin-bottom: 20px;
                        min-height: 300px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    ">
                        <div style="font-size: 48px; margin-bottom: 20px;">🔵</div>
                        <div style="font-size: 14px; color: var(--text-secondary);">Ball will drop here</div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(9, 1fr); gap: 5px; margin: 20px 0;">
                        ${Array(9).fill(0).map((_, i) => `
                            <div style="
                                padding: 10px;
                                background: var(--card-bg);
                                border: 1px solid var(--border);
                                border-radius: 4px;
                                font-size: 12px;
                                color: var(--primary);
                                font-weight: bold;
                            ">${this.multipliers[i]}x</div>
                        `).join('')}
                    </div>
                </div>
                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="plinkoBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input">
                </div>
                <button id="playPlinkoBtn" class="btn btn-primary">Drop Ball</button>
                <div id="plinkoGameResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('plinko', PlinkoGame);
