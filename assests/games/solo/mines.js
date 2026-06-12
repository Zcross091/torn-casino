// Mines Game
class MinesGame extends GameEngine {
    constructor() {
        super('mines', 'Mines', { rake: 0.05 });
        this.boardSize = 5;
        this.mineCount = 3;
        this.board = [];
        this.revealed = [];
        this.gameOver = false;
        this.score = 0;
    }

    initBoard() {
        const totalCells = this.boardSize * this.boardSize;
        this.board = Array(totalCells).fill(false);
        
        // Place mines
        let minesPlaced = 0;
        while (minesPlaced < this.mineCount) {
            const pos = Math.floor(this.getRandomNumber() * totalCells);
            if (!this.board[pos]) {
                this.board[pos] = true;
                minesPlaced++;
            }
        }

        this.revealed = Array(totalCells).fill(false);
        this.gameOver = false;
        this.score = 0;
    }

    revealCell(index) {
        if (this.revealed[index] || this.gameOver) {
            return null;
        }

        this.revealed[index] = true;

        if (this.board[index]) {
            this.gameOver = true;
            return this.lose();
        }

        this.score++;
        const revealedCount = this.revealed.filter(r => r).length;
        const safeCount = (this.boardSize * this.boardSize) - this.mineCount;

        if (this.score === safeCount) {
            this.gameOver = true;
            const multiplier = (safeCount / revealedCount) * 1.5;
            return this.win(multiplier);
        }

        return { type: 'safe', score: this.score };
    }

    cashOut() {
        if (this.gameOver) {
            throw new Error('Game already over');
        }
        this.gameOver = true;
        const multiplier = 1 + (this.score * 0.2);
        return this.win(multiplier);
    }

    getHTML() {
        return `
            <div class="game-controls">
                <div class="mines-board" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; margin: 20px 0; padding: 20px; background: var(--dark-bg); border-radius: 8px;">
                    ${Array(25).fill(0).map((_, i) => `
                        <div id="mine-${i}" class="mine-cell" style="
                            width: 100%;
                            padding-top: 100%;
                            position: relative;
                            background: var(--card-bg);
                            border: 2px solid var(--border);
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 20px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">?</div>
                    `).join('')}
                </div>
                <div style="text-align: center; margin: 20px 0; font-size: 18px; color: var(--primary); font-weight: bold;">
                    Safe Cells Revealed: <span id="minesScore">0</span>
                </div>
                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="minesBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input">
                </div>
                <button id="playMinesBtn" class="btn btn-primary">New Game</button>
                <button id="minesCashOutBtn" class="btn btn-small" style="display: none;">Cash Out</button>
                <div id="minesGameResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('mines', MinesGame);
