// Blackjack Game
class BlackjackGame extends GameEngine {
    constructor() {
        super('blackjack', 'Blackjack', { rake: 0.05 });
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.playerTotal = 0;
        this.dealerTotal = 0;
        this.gameOver = false;
    }

    initDeck() {
        this.deck = [];
        for (let i = 0; i < 4; i++) { // 4 decks
            for (let suit = 0; suit < 4; suit++) {
                for (let rank = 1; rank <= 13; rank++) {
                    this.deck.push(rank);
                }
            }
        }
        this.deck.sort(() => this.getRandomNumber() - 0.5);
    }

    dealInitialCards() {
        if (!this.currentBet) {
            throw new Error('No bet placed');
        }

        this.initDeck();
        this.playerHand = [this.deck.pop(), this.deck.pop()];
        this.dealerHand = [this.deck.pop(), this.deck.pop()];
        this.playerTotal = this.calculateTotal(this.playerHand);
        this.dealerTotal = this.calculateTotal(this.dealerHand);

        // Check for blackjack
        if (this.playerTotal === 21) {
            return this.win(2.4);
        }

        return { type: 'dealt' };
    }

    hit() {
        if (this.gameOver) throw new Error('Game over');
        
        this.playerHand.push(this.deck.pop());
        this.playerTotal = this.calculateTotal(this.playerHand);

        if (this.playerTotal > 21) {
            this.gameOver = true;
            return this.lose();
        }

        return { type: 'hit', total: this.playerTotal };
    }

    stand() {
        if (this.gameOver) throw new Error('Game over');

        this.gameOver = true;
        this.dealerTotal = this.calculateTotal(this.dealerHand);

        while (this.dealerTotal < 17) {
            this.dealerHand.push(this.deck.pop());
            this.dealerTotal = this.calculateTotal(this.dealerHand);
        }

        if (this.dealerTotal > 21) {
            return this.win(1.95);
        } else if (this.dealerTotal > this.playerTotal) {
            return this.lose();
        } else if (this.dealerTotal === this.playerTotal) {
            // Push - return bet
            api.addMoney(this.currentBet);
            return { type: 'push', total: this.playerTotal };
        } else {
            return this.win(1.95);
        }
    }

    calculateTotal(hand) {
        let total = 0;
        let aces = 0;

        for (let card of hand) {
            if (card === 1) {
                aces++;
                total += 11;
            } else if (card > 10) {
                total += 10;
            } else {
                total += card;
            }
        }

        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return total;
    }

    getHTML() {
        return `
            <div class="game-controls">
                <div style="text-align: center; margin: 20px 0;">
                    <div style="margin-bottom: 20px;">
                        <p style="color: var(--text-secondary); margin-bottom: 10px;">Dealer Hand</p>
                        <div id="dealerHand" style="font-size: 32px;">🃏</div>
                        <div id="dealerTotal" style="font-size: 14px; color: var(--text-secondary);">-</div>
                    </div>
                </div>
                <div style="text-align: center; margin: 20px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 20px 0;">
                    <div style="margin-bottom: 20px;">
                        <p style="color: var(--text-secondary); margin-bottom: 10px;">Your Hand</p>
                        <div id="playerHand" style="font-size: 32px;">🃏</div>
                        <div id="playerTotal" style="font-size: 18px; color: var(--primary); font-weight: bold;">-</div>
                    </div>
                </div>
                <div class="control-group">
                    <label>Bet Amount ($)</label>
                    <input type="number" id="blackjackBet" min="${this.minBet}" max="${this.maxBet}" value="100" class="input">
                </div>
                <button id="playBlackjackBtn" class="btn btn-primary">Deal</button>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button id="blackjackHitBtn" class="btn btn-small" style="display: none; flex: 1;">Hit</button>
                    <button id="blackjackStandBtn" class="btn btn-small" style="display: none; flex: 1;">Stand</button>
                </div>
                <div id="blackjackGameResult" class="game-result" style="display: none;"></div>
            </div>
        `;
    }
}

registerGame('blackjack', BlackjackGame);
