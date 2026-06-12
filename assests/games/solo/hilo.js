// Hi-Lo Game
class HiLoGame extends GameEngine {
    constructor() {
        super('hilo', 'Hi-Lo', { rake: 0.05 });
        this.dealerCard = 0;
        this.playerCard = 0;
    }

    deal() {
        if (!this.currentBet) {
            throw new Error('No bet placed');
        }

        this.dealerCard = Math.floor(this.getRandomNumber() * 13) + 1; // Ace to King
    }

    playCard(isHigher) {
        if (this.dealerCard === 0) {
            throw new Error('No dealer card');
        }

        this.playerCard = Math.floor(this.getRandomNumber() * 13) + 1;

        let won = false;
        if (isHigher) {
            won = this.playerCard > this.dealerCard;
        } else {
            won = this.playerCard < this.dealerCard;
        }

        if (won) {
            return this.win(1.95); // ~2x with rake
        } else {
            return this.lose();
        }
    }

    getCardName(num) {
        const names = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        return names[num - 1];
    }

    getHTML() {
        return `
            <div class="game-controls">
                <div style="text-align: center; margin: 30px 0;">
                    <div style="margin-bottom: 20px;">
                        <p style="color: var(--text-secondary); margin-bottom: 10px;">Dealer Card</p>
                        <div id="dealerCard" style="font-size: 60px;">🃏</div>
                        <div id="dealerCardValue" style="font-size: 14px; color: var(--text-secondary);">Hidden</div>
                    </div>
                </div>
                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="hiloBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input">
                </div>
                <button id="playHiLoBtn" class="btn btn-primary">Deal Card</button>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button id="hiLoHighBtn" class="btn btn-small" style="display: none; flex: 1;">Higher</button>
                    <button id="hiLoLowBtn" class="btn btn-small" style="display: none; flex: 1;">Lower</button>
                </div>
                <div id="hiLoGameResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('hilo', HiLoGame);
