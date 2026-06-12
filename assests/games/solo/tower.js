// Tower Game
class TowerGame extends GameEngine {
    constructor() {
        super('tower', 'Tower', { rake: 0.05 });
        this.levels = 8;
        this.currentLevel = 0;
        this.towers = [];
        this.gameOver = false;
        this.multipliers = [1.1, 1.5, 2, 3, 4, 6, 8, 12];
    }

    initGame() {
        if (!this.currentBet) {
            throw new Error('No bet placed');
        }

        this.towers = [];
        this.currentLevel = 0;
        this.gameOver = false;

        // Generate random safe tiles for each level
        for (let i = 0; i < this.levels; i++) {
            const randomTiles = [];
            while (randomTiles.length < 2) {
                const tile = Math.floor(this.getRandomNumber() * 3);
                if (!randomTiles.includes(tile)) {
                    randomTiles.push(tile);
                }
            }
            this.towers.push({
                safe: randomTiles,
                revealed: [false, false, false]
            });
        }

        return { type: 'started', level: 0 };
    }

    selectTile(tileIndex) {
        if (this.gameOver) throw new Error('Game over');
        if (this.currentLevel >= this.levels) throw new Error('Tower complete');

        const currentTower = this.towers[this.currentLevel];
        if (currentTower.revealed[tileIndex]) {
            throw new Error('Tile already revealed');
        }

        currentTower.revealed[tileIndex] = true;

        if (!currentTower.safe.includes(tileIndex)) {
            this.gameOver = true;
            return this.lose();
        }

        this.currentLevel++;

        if (this.currentLevel >= this.levels) {
            this.gameOver = true;
            const multiplier = this.multipliers[this.levels - 1];
            return this.win(multiplier);
        }

        return { type: 'advance', level: this.currentLevel, multiplier: this.multipliers[this.currentLevel - 1] };
    }

    cashOut() {
        if (this.gameOver) throw new Error('Game over');
        
        this.gameOver = true;
        if (this.currentLevel === 0) {
            return this.lose();
        }
        const multiplier = this.multipliers[this.currentLevel - 1];
        return this.win(multiplier);
    }

    getHTML() {
        return `
            <div class="game-controls">
                <div style="text-align: center; margin: 20px 0;">
                    <div id="towerDisplay" style="display: grid; gap: 10px;">
                        ${Array(8).fill(0).map((_, level) => `
                            <div id="tower-level-${level}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
                                ${Array(3).fill(0).map((_, tile) => `
                                    <div id="tower-${level}-${tile}" class="tower-tile" style="
                                        padding: 15px;
                                        background: var(--card-bg);
                                        border: 2px solid var(--border);
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 24px;
                                        text-align: center;
                                    ">?</div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                    <div id="towerMultiplier" style="margin-top: 20px; font-size: 24px; color: var(--primary); font-weight: bold;">
                        Current: 1.00x
                    </div>
                </div>
                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="towerBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input">
                </div>
                <button id="playTowerBtn" class="btn btn-primary">Start Tower</button>
                <button id="towerCashOutBtn" class="btn btn-small" style="display: none;">Cash Out</button>
                <div id="towerGameResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('tower', TowerGame);
