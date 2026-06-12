// Moles Game
class MolesGame extends GameEngine {
    constructor() {
        super('moles', 'Moles', { rake: 0.05 });
        this.moles = [];
        this.hits = 0;
        this.maxMoles = 6;
        this.gameTime = 3000; // 3 seconds
        this.gameRunning = false;
    }

    startGame() {
        if (!this.currentBet) {
            throw new Error('No bet placed');
        }

        this.hits = 0;
        this.moles = Array(this.maxMoles).fill(0).map(() => ({
            active: false,
            hit: false
        }));
        this.gameRunning = true;

        // Start showing moles
        const gameStart = Date.now();
        const duration = this.gameTime;

        const interval = setInterval(() => {
            if (Date.now() - gameStart > duration) {
                this.gameRunning = false;
                clearInterval(interval);

                const multiplier = this.calculateMultiplier();
                if (this.hits > 0) {
                    this.win(multiplier);
                } else {
                    this.lose();
                }
                return;
            }

            // Randomly show a mole
            const randomMole = Math.floor(this.getRandomNumber() * this.maxMoles);
            this.moles[randomMole].active = true;
        }, 200);
    }

    hitMole(moleIndex) {
        if (!this.gameRunning) throw new Error('Game not running');
        if (this.moles[moleIndex].hit) throw new Error('Mole already hit');

        this.moles[moleIndex].hit = true;
        this.moles[moleIndex].active = false;
        this.hits++;
    }

    calculateMultiplier() {
        return 1 + (this.hits * 0.5);
    }

    getHTML() {
        return `
            <div class="game-controls">
                <div style="text-align: center; margin: 20px 0;">
                    <div id="moleGrid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                        ${Array(6).fill(0).map((_, i) => `
                            <div id="mole-${i}" class="mole" style="
                                padding: 30px;
                                background: var(--card-bg);
                                border: 2px solid var(--border);
                                border-radius: 8px;
                                font-size: 40px;
                                cursor: pointer;
                                text-align: center;
                                transition: all 0.1s;
                            ">🐁</div>
                        `).join('')}
                    </div>
                    <div id="moleScore" style="font-size: 24px; color: var(--primary); font-weight: bold; margin: 20px 0;">
                        Hits: 0
                    </div>
                </div>
                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="molesBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input">
                </div>
                <button id="playMolesBtn" class="btn btn-primary">Whack Moles!</button>
                <div id="molesGameResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('moles', MolesGame);
