// Dice Game with animations and improved logic
class DiceGame extends GameEngine {
    constructor() {
        super('dice', 'Dice', { rake: 0.05 });
        this.roll = 0;
        this.target = 50;
        this.betType = 'higher';
    }

    setParameters(target, betType) {
        if (target < 1 || target > 99) {
            throw new Error('Target must be between 1 and 99');
        }
        this.target = target;
        this.betType = betType;
    }

    play() {
        if (!this.currentBet) {
            throw new Error('No bet placed');
        }

        // Animate dice rolling
        this.animateDiceRoll();

        this.roll = Math.floor(this.getRandomNumber() * 100);
        
        let won = false;
        if (this.betType === 'higher') {
            won = this.roll > this.target;
        } else {
            won = this.roll < this.target;
        }

        // Improved multiplier calculation
        const probability = this.betType === 'higher' 
            ? (100 - this.target) / 100 
            : this.target / 100;
        
        // Better payout: account for rake
        const multiplier = Math.max(0.1, (1 / probability) * (1 - this.rake));

        if (won) {
            return this.win(multiplier);
        } else {
            return this.lose();
        }
    }

    animateDiceRoll() {
        const diceVisual = document.getElementById('diceVisual');
        if (diceVisual) {
            diceVisual.classList.remove('rolling');
            // Trigger reflow
            void diceVisual.offsetWidth;
            diceVisual.classList.add('rolling');
        }
    }

    getHTML() {
        const winChance = this.betType === 'higher' 
            ? Math.round((100 - this.target) * 100) / 100
            : Math.round(this.target * 100) / 100;

        return `
            <div class="game-controls">
                <div class="dice-display">
                    <div id="diceVisual">🎲</div>
                </div>
                
                <div class="control-group">
                    <label>Target Number (1-99)</label>
                    <input type="number" id="diceTarget" min="1" max="99" value="50" class="input">
                </div>

                <div class="control-group">
                    <label>Bet Type</label>
                    <select id="diceBetType" class="input">
                        <option value="higher">Roll Higher</option>
                        <option value="lower">Roll Lower</option>
                    </select>
                </div>

                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="diceBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input">
                </div>

                <div style="font-size: 12px; color: var(--text-secondary); margin: 10px 0; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 6px;">
                    Win Chance: <strong>${winChance}%</strong>
                </div>

                <button id="playDiceBtn" class="btn btn-primary">Roll the Dice</button>
                <div id="diceResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('dice', DiceGame);
