// Wheel Game with spinner animation and improved logic
class WheelGame extends GameEngine {
    constructor() {\n        super('wheel', 'Wheel', { rake: 0.05 });
        this.sectors = [
            { label: '2x', multiplier: 2, weight: 0.35 },
            { label: '5x', multiplier: 5, weight: 0.20 },
            { label: '10x', multiplier: 10, weight: 0.10 },
            { label: '0x (Lose)', multiplier: 0, weight: 0.35 }
        ];
        this.result = null;
    }

    spin() {
        if (!this.currentBet) {
            throw new Error('No bet placed');
        }

        // Animate wheel spinning
        this.animateWheel();

        // Use weighted random for better odds calculation
        const sector = this.getWeightedRandom(this.sectors);
        this.result = sector;

        if (sector.multiplier > 0) {
            return this.win(sector.multiplier);
        } else {
            return this.lose();
        }
    }

    animateWheel() {
        const wheelVisual = document.getElementById('wheelVisual');
        if (wheelVisual) {
            wheelVisual.classList.remove('spinning');
            // Trigger reflow to restart animation
            void wheelVisual.offsetWidth;
            wheelVisual.classList.add('spinning');
        }
    }

    getHTML() {
        const expectedValue = this.sectors.reduce((sum, s) => sum + (s.multiplier * s.weight), 0).toFixed(2);
        
        return `
            <div class="game-controls">
                <div class="wheel-display">
                    <div id="wheelVisual">🎡</div>
                </div>

                <div style="text-align: center; margin-bottom: 16px;">
                    <div id="wheelResult" style="color: var(--primary); font-size: 20px; font-weight: bold;">Ready to spin!</div>
                </div>

                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="wheelBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input">
                </div>

                <div style="font-size: 12px; color: var(--text-secondary); margin: 10px 0; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 6px;">
                    Payouts: 2x (35%), 5x (20%), 10x (10%), Lose (35%)
                </div>

                <button id="playWheelBtn" class="btn btn-primary">Spin the Wheel!</button>
                <div id="wheelGameResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('wheel', WheelGame);
