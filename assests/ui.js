// UI Management
class UIManager {
    constructor() {
        this.currentGame = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auth
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('apiKeyInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Tabs (top and sidebar)
        document.querySelectorAll('.tab-btn, .side-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Game Cards
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.game;
                this.openGame(gameId);
            });
        });

        // Modal
        document.getElementById('closeGameBtn').addEventListener('click', () => this.closeGame());
        document.getElementById('gameModal').addEventListener('click', (e) => {
            if (e.target.id === 'gameModal') this.closeGame();
        });
    }

    async handleLogin() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        if (!apiKey) {
            alert('Please enter your API key');
            return;
        }

        try {
            api.setApiKey(apiKey);
            const userInfo = await api.getUserInfo();
            
            localStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(userInfo));
            
            // Give initial balance if new user
            if (!localStorage.getItem(CONFIG.STORAGE_KEY_BALANCE)) {
                api.setLocalBalance(1000); // Starting balance
            }

            this.showCasino(userInfo);
        } catch (error) {
            alert('Login failed: ' + error.message);
            api.clearApiKey();
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            api.clearAllData();
            document.getElementById('apiKeyInput').value = '';
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('casino-container').classList.add('hidden');
        document.getElementById('apiKeyInput').focus();
    }

    showCasino(userInfo) {
        if (!api.apiKey && localStorage.getItem(CONFIG.STORAGE_KEY_API_KEY)) {
            api.restoreSession();
        }

        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('casino-container').classList.remove('hidden');
        
        document.getElementById('username').textContent = userInfo.name;
        this.updateBalance();
        
        const activeSideBtns = document.querySelectorAll('.side-btn.active');
        if (activeSideBtns.length === 0) {
            const sidebarLobbyBtn = document.querySelector('[data-tab="lobby"].side-btn');
            if (sidebarLobbyBtn) sidebarLobbyBtn.classList.add('active');
        }
    }

    updateBalance() {
        const balance = api.getLocalBalance();
        document.getElementById('balanceAmount').textContent = `$${balance.toLocaleString()}`;
    }

    switchTab(tabName) {
        // Update top tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const topBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (topBtn) topBtn.classList.add('active');
        
        // Update sidebar buttons
        document.querySelectorAll('.side-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const sideBtn = document.querySelector(`.side-btn[data-tab="${tabName}"]`);
        if (sideBtn) sideBtn.classList.add('active');

        // Update content panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        const pane = document.getElementById(tabName);
        if (pane) pane.classList.add('active');

        // Load bets if viewing bets tab
        if (tabName === 'bets') {
            this.loadBets();
        }

        // Save current tab preference
        localStorage.setItem('lastViewedTab', tabName);
    }

    openGame(gameId) {
        const parts = gameId.split('-');
        const type = parts[0]; // 'solo' or 'pvp'
        const name = parts[1]; // 'dice', 'wheel', etc

        try {
            const GameClass = getGame(name);
            this.currentGame = new GameClass();
            
            document.getElementById('gameTitle').textContent = this.currentGame.gameName;
            document.getElementById('gameContainer').innerHTML = this.currentGame.getHTML();
            document.getElementById('gameModal').classList.remove('hidden');

            // Setup game controls
            this.setupGameControls(name);
        } catch (error) {
            alert('Failed to load game: ' + error.message);
        }
    }

    closeGame() {
        document.getElementById('gameModal').classList.add('hidden');
        this.currentGame = null;
        this.updateBalance();
    }

    setupGameControls(gameName) {
        switch (gameName) {
            case 'dice':
                this.setupDiceControls();
                break;
            case 'wheel':
                this.setupWheelControls();
                break;
            case 'crash':
                this.setupCrashControls();
                break;
            case 'mines':
                this.setupMinesControls();
                break;
            case 'hilo':
                this.setupHiLoControls();
                break;
            case 'blackjack':
                this.setupBlackjackControls();
                break;
            case 'tower':
                this.setupTowerControls();
                break;
            case 'moles':
                this.setupMolesControls();
                break;
            case 'chicken':
                this.setupChickenControls();
                break;
            case 'plinko':
                this.setupPlinkoControls();
                break;
            case 'keno':
                this.setupKenoControls();
                break;
        }
    }

    setupDiceControls() {
        const playBtn = document.getElementById('playDiceBtn');
        playBtn.addEventListener('click', () => {
            try {
                const target = parseInt(document.getElementById('diceTarget').value);
                const betType = document.getElementById('diceBetType').value;
                const bet = parseInt(document.getElementById('diceBet').value);

                this.currentGame.setParameters(target, betType);
                this.currentGame.placeBet(bet);
                this.currentGame.play();

                const result = this.currentGame.result;
                const resultDiv = document.getElementById('diceResult');
                resultDiv.className = `game-result ${result.type}`;
                
                let resultText = `<strong>Rolled: ${this.currentGame.roll}</strong>`;
                
                if (result.type === 'win') {
                    resultText += `<br>✓ YOU WIN!<br>Multiplier: ${result.multiplier.toFixed(2)}x`;
                    resultText += `<br><strong>+$${Math.floor(result.totalPayout).toLocaleString()}</strong>`;
                } else {
                    resultText += `<br>✗ YOU LOST<br>Target was ${betType === 'higher' ? 'higher' : 'lower'} than ${target}`;
                    resultText += `<br>-$${bet.toLocaleString()}`;
                }
                
                resultDiv.innerHTML = resultText;
                resultDiv.style.display = 'block';

                playBtn.disabled = true;
                setTimeout(() => { playBtn.disabled = false; }, 1000);
                this.updateBalance();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    setupWheelControls() {
        const playBtn = document.getElementById('playWheelBtn');
        playBtn.addEventListener('click', () => {
            try {
                const bet = parseInt(document.getElementById('wheelBet').value);
                this.currentGame.placeBet(bet);
                this.currentGame.spin();

                const result = this.currentGame.result;
                const resultDiv = document.getElementById('wheelGameResult');
                resultDiv.className = `game-result ${result.type}`;
                
                let resultText = '';
                
                if (result.type === 'win') {
                    resultText = `<strong>🎉 YOU WON ${this.currentGame.result.label}!</strong>`;
                    resultText += `<br>Multiplier: ${result.multiplier.toFixed(1)}x`;
                    resultText += `<br><strong>+$${Math.floor(result.totalPayout).toLocaleString()}</strong>`;
                } else {
                    resultText = `<strong>❌ WHEEL LANDED ON LOSE</strong>`;
                    resultText += `<br>Better luck next time!`;
                    resultText += `<br>-$${bet.toLocaleString()}`;
                }
                
                resultDiv.innerHTML = resultText;
                resultDiv.style.display = 'block';

                playBtn.disabled = true;
                setTimeout(() => { playBtn.disabled = false; }, 1500);
                this.updateBalance();
                `;
                resultDiv.style.display = 'block';

                playBtn.disabled = true;
                this.updateBalance();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    setupCrashControls() {
        const playBtn = document.getElementById('playCrashBtn');
        const cashOutBtn = document.getElementById('crashCashOutBtn');
        let gameInterval;

        playBtn.addEventListener('click', () => {
            try {
                const bet = parseInt(document.getElementById('crashBet').value);
                this.currentGame.placeBet(bet);
                this.currentGame.start();

                playBtn.disabled = true;
                document.getElementById('crashBet').disabled = true;
                cashOutBtn.style.display = 'inline-block';

                gameInterval = setInterval(() => {
                    const update = this.currentGame.update();
                    if (update && update.type === 'update') {
                        document.getElementById('crashMultiplier').textContent = update.multiplier.toFixed(2) + 'x';
                    } else if (update) {
                        clearInterval(gameInterval);
                        this.showCrashResult(update);
                    }
                }, 100);
            } catch (error) {
                alert(error.message);
            }
        });

        cashOutBtn.addEventListener('click', () => {
            clearInterval(gameInterval);
            const result = this.currentGame.cashOut();
            this.showCrashResult(result);
            cashOutBtn.style.display = 'none';
        });
    }

    showCrashResult(result) {
        const resultDiv = document.getElementById('crashGameResult');
        resultDiv.className = `game-result ${result.type}`;
        resultDiv.innerHTML = `
            <div>${result.type === 'win' ? '✓ YOU WIN!' : '✗ CRASHED'}</div>
            <div style="margin-top: 10px; font-size: 14px;">
                ${result.type === 'win' ? `Payout: $${result.totalPayout.toLocaleString()}` : 'Game crashed!'}
            </div>
        `;
        resultDiv.style.display = 'block';
        this.updateBalance();
    }

    setupMinesControls() {
        const playBtn = document.getElementById('playMinesBtn');
        
        playBtn.addEventListener('click', () => {
            try {
                const bet = parseInt(document.getElementById('minesBet').value);
                this.currentGame.placeBet(bet);
                this.currentGame.initBoard();

                playBtn.disabled = true;
                document.getElementById('minesBet').disabled = true;

                // Setup mine cells
                for (let i = 0; i < 25; i++) {
                    const cell = document.getElementById(`mine-${i}`);
                    cell.addEventListener('click', () => {
                        const result = this.currentGame.revealCell(i);
                        
                        if (this.currentGame.board[i]) {
                            cell.textContent = '💣';
                            cell.style.background = 'rgba(255, 68, 68, 0.2)';
                        } else {
                            cell.textContent = '💎';
                            cell.style.background = 'rgba(0, 255, 0, 0.2)';
                        }

                        if (result) {
                            this.showMinesResult(result);
                        } else {
                            document.getElementById('minesScore').textContent = this.currentGame.score;
                        }
                    });
                }
            } catch (error) {
                alert(error.message);
            }
        });
    }

    showMinesResult(result) {
        const resultDiv = document.getElementById('minesGameResult');
        resultDiv.className = `game-result ${result.type}`;
        resultDiv.innerHTML = `
            <div>${result.type === 'win' ? '✓ YOU WIN!' : '✗ HIT A MINE'}</div>
            <div style="margin-top: 10px; font-size: 14px;">
                ${result.type === 'win' ? `Payout: $${result.totalPayout.toLocaleString()}` : `You revealed ${this.currentGame.score} safe cells`}
            </div>
        `;
        resultDiv.style.display = 'block';
        this.updateBalance();
    }

    setupHiLoControls() {
        const playBtn = document.getElementById('playHiLoBtn');
        const highBtn = document.getElementById('hiLoHighBtn');
        const lowBtn = document.getElementById('hiLoLowBtn');

        playBtn.addEventListener('click', () => {
            try {
                const bet = parseInt(document.getElementById('hiloBet').value);
                this.currentGame.placeBet(bet);
                this.currentGame.deal();

                playBtn.disabled = true;
                highBtn.style.display = 'inline-block';
                lowBtn.style.display = 'inline-block';

                document.getElementById('dealerCard').textContent = '🃏';
                document.getElementById('dealerCardValue').textContent = 'Hidden';
            } catch (error) {
                alert(error.message);
            }
        });

        highBtn.addEventListener('click', () => {
            const result = this.currentGame.playCard(true);
            this.showHiLoResult(result);
        });

        lowBtn.addEventListener('click', () => {
            const result = this.currentGame.playCard(false);
            this.showHiLoResult(result);
        });
    }

    showHiLoResult(result) {
        document.getElementById('dealerCard').textContent = this.currentGame.getCardName(this.currentGame.dealerCard);
        document.getElementById('dealerCardValue').textContent = this.currentGame.dealerCard;
        document.getElementById('playerHand').textContent = this.currentGame.getCardName(this.currentGame.playerCard);
        document.getElementById('playerTotal').textContent = this.currentGame.playerCard;

        const resultDiv = document.getElementById('hiLoGameResult');
        resultDiv.className = `game-result ${result.type}`;
        resultDiv.innerHTML = `
            <div>${result.type === 'win' ? '✓ YOU WIN!' : '✗ YOU LOSE'}</div>
            <div style="margin-top: 10px; font-size: 14px;">
                ${result.type === 'win' ? `Payout: $${result.totalPayout.toLocaleString()}` : 'Better luck next time'}
            </div>
        `;
        resultDiv.style.display = 'block';

        document.getElementById('hiLoHighBtn').style.display = 'none';
        document.getElementById('hiLoLowBtn').style.display = 'none';
        this.updateBalance();
    }

    setupBlackjackControls() {
        const playBtn = document.getElementById('playBlackjackBtn');
        const hitBtn = document.getElementById('blackjackHitBtn');
        const standBtn = document.getElementById('blackjackStandBtn');

        playBtn.addEventListener('click', () => {
            try {
                const bet = parseInt(document.getElementById('blackjackBet').value);
                this.currentGame.placeBet(bet);
                const result = this.currentGame.dealInitialCards();

                if (result.type === 'dealt') {
                    playBtn.disabled = true;
                    hitBtn.style.display = 'inline-block';
                    standBtn.style.display = 'inline-block';
                    this.updateBlackjackDisplay();
                } else {
                    this.showBlackjackResult(result);
                }
            } catch (error) {
                alert(error.message);
            }
        });

        hitBtn.addEventListener('click', () => {
            const result = this.currentGame.hit();
            if (result.type === 'hit') {
                this.updateBlackjackDisplay();
            } else {
                this.showBlackjackResult(result);
            }
        });

        standBtn.addEventListener('click', () => {
            const result = this.currentGame.stand();
            this.showBlackjackResult(result);
        });
    }

    updateBlackjackDisplay() {
        document.getElementById('playerHand').textContent = this.currentGame.playerHand.map(c => this.currentGame.getCardName(c)).join(' ');
        document.getElementById('playerTotal').textContent = this.currentGame.playerTotal;
    }

    showBlackjackResult(result) {
        document.getElementById('dealerHand').textContent = this.currentGame.dealerHand.map(c => this.currentGame.getCardName(c)).join(' ');
        document.getElementById('dealerTotal').textContent = this.currentGame.dealerTotal;

        const resultDiv = document.getElementById('blackjackGameResult');
        resultDiv.className = `game-result ${result.type}`;
        let message = '';
        if (result.type === 'win') {
            message = `✓ YOU WIN! Payout: $${result.totalPayout.toLocaleString()}`;
        } else if (result.type === 'push') {
            message = `Push - Bet returned`;
        } else {
            message = `✗ YOU LOSE`;
        }
        resultDiv.innerHTML = message;
        resultDiv.style.display = 'block';

        document.getElementById('blackjackHitBtn').style.display = 'none';
        document.getElementById('blackjackStandBtn').style.display = 'none';
        this.updateBalance();
    }

    setupTowerControls() {
        const playBtn = document.getElementById('playTowerBtn');
        
        playBtn.addEventListener('click', () => {
            try {
                const bet = parseInt(document.getElementById('towerBet').value);
                this.currentGame.placeBet(bet);
                this.currentGame.initGame();

                playBtn.disabled = true;
                document.getElementById('towerBet').disabled = true;

                // Setup tower tiles
                for (let level = 0; level < this.currentGame.levels; level++) {
                    for (let tile = 0; tile < 3; tile++) {
                        const tileEl = document.getElementById(`tower-${level}-${tile}`);
                        tileEl.addEventListener('click', () => {
                            const result = this.currentGame.selectTile(tile);
                            if (result.type === 'advance' || result.type === 'lose' || result.type === 'win') {
                                this.showTowerResult(result);
                            }
                        });
                    }
                }
            } catch (error) {
                alert(error.message);
            }
        });
    }

    showTowerResult(result) {
        const resultDiv = document.getElementById('towerGameResult');
        resultDiv.className = `game-result ${result.type}`;
        if (result.type === 'win') {
            resultDiv.innerHTML = `✓ YOU WIN! Level: ${this.currentGame.currentLevel}, Payout: $${result.totalPayout.toLocaleString()}`;
        } else if (result.type === 'advance') {
            resultDiv.innerHTML = `Advanced to Level ${result.level}! Multiplier: ${result.multiplier.toFixed(2)}x`;
        } else {
            resultDiv.innerHTML = `✗ GAME OVER! Reached Level ${this.currentGame.currentLevel}`;
        }
        resultDiv.style.display = 'block';
        this.updateBalance();
    }

    setupMolesControls() {
        const playBtn = document.getElementById('playMolesBtn');
        playBtn.addEventListener('click', () => {
            try {
                const bet = parseInt(document.getElementById('molesBet').value);
                this.currentGame.placeBet(bet);
                this.currentGame.startGame();

                playBtn.disabled = true;
                document.getElementById('molesBet').disabled = true;
            } catch (error) {
                alert(error.message);
            }
        });
    }

    setupChickenControls() {
        const playBtn = document.getElementById('playChickenBtn');
        playBtn.addEventListener('click', () => {
            try {
                const bet = parseInt(document.getElementById('chickenBet').value);
                this.currentGame.placeBet(bet);
                this.currentGame.startGame();

                playBtn.disabled = true;
                document.getElementById('chickenBet').disabled = true;

                for (let i = 0; i < 12; i++) {
                    const chicken = document.getElementById(`chicken-${i}`);
                    chicken.addEventListener('click', () => {
                        const result = this.currentGame.catchChicken(i);
                        if (result.type === 'caught') {
                            document.getElementById('chickenScore').textContent = `Caught: ${result.progress} / 3`;
                            chicken.style.opacity = '0.5';
                            chicken.style.pointerEvents = 'none';
                        } else {
                            this.showChickenResult(result);
                        }
                    });
                }
            } catch (error) {
                alert(error.message);
            }
        });
    }

    showChickenResult(result) {
        const resultDiv = document.getElementById('chickenGameResult');
        resultDiv.className = `game-result ${result.type}`;
        resultDiv.innerHTML = `
            <div>${result.type === 'win' ? '✓ YOU WIN!' : '✗ WRONG CHICKEN'}</div>
            <div style="margin-top: 10px; font-size: 14px;">
                ${result.type === 'win' ? `Payout: $${result.totalPayout.toLocaleString()}` : 'Caught the wrong one!'}
            </div>
        `;
        resultDiv.style.display = 'block';
        this.updateBalance();
    }

    setupPlinkoControls() {
        const playBtn = document.getElementById('playPlinkoBtn');
        playBtn.addEventListener('click', () => {
            try {
                const bet = parseInt(document.getElementById('plinkoBet').value);
                this.currentGame.placeBet(bet);
                const result = this.currentGame.dropBall();

                const resultDiv = document.getElementById('plinkoGameResult');
                resultDiv.className = `game-result ${result.type}`;
                resultDiv.innerHTML = `
                    <div>${result.type === 'win' ? '✓ YOU WIN!' : '✗ LANDED ON 1x'}</div>
                    <div style="margin-top: 10px; font-size: 14px;">
                        ${result.type === 'win' ? `Payout: $${result.totalPayout.toLocaleString()}` : 'Better luck next time'}
                    </div>
                `;
                resultDiv.style.display = 'block';

                playBtn.disabled = true;
                this.updateBalance();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    setupKenoControls() {
        const playBtn = document.getElementById('playKenoBtn');
        let selectedNumbers = [];

        // Setup number selection
        for (let i = 1; i <= 80; i++) {
            const numEl = document.getElementById(`keno-${i}`);
            numEl.addEventListener('click', () => {
                if (selectedNumbers.includes(i)) {
                    selectedNumbers = selectedNumbers.filter(n => n !== i);
                    numEl.style.background = 'var(--card-bg)';
                    numEl.style.color = 'var(--text-secondary)';
                } else if (selectedNumbers.length < 10) {
                    selectedNumbers.push(i);
                    numEl.style.background = 'var(--primary)';
                    numEl.style.color = '#000';
                }
                document.getElementById('kenoSelected').textContent = selectedNumbers.length;
            });
        }

        playBtn.addEventListener('click', () => {
            try {
                if (selectedNumbers.length === 0) {
                    alert('Pick at least one number');
                    return;
                }

                const bet = parseInt(document.getElementById('kenoBet').value);
                this.currentGame.placeBet(bet);
                this.currentGame.pickNumbers(selectedNumbers);
                const result = this.currentGame.drawNumbers();

                // Show drawn numbers
                for (let num of this.currentGame.drawnNumbers) {
                    const numEl = document.getElementById(`keno-${num}`);
                    numEl.style.borderColor = 'var(--primary)';
                }

                const resultDiv = document.getElementById('kenoGameResult');
                resultDiv.className = `game-result ${result.type}`;
                const matches = selectedNumbers.filter(n => this.currentGame.drawnNumbers.includes(n)).length;
                resultDiv.innerHTML = `
                    <div>${result.type === 'win' ? '✓ YOU WIN!' : '✗ NO MATCH'}</div>
                    <div style="margin-top: 10px; font-size: 14px;">
                        Matched: ${matches} numbers - ${result.type === 'win' ? `Payout: $${result.totalPayout.toLocaleString()}` : 'No wins'}
                    </div>
                `;
                resultDiv.style.display = 'block';

                playBtn.disabled = true;
                this.updateBalance();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    loadBets() {
        const bets = api.getBets();
        const betsList = document.getElementById('bets-list');
        
        if (bets.length === 0) {
            betsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No bets yet</p>';
            return;
        }

        betsList.innerHTML = bets.map(bet => `
            <div class="bet-item">
                <div class="bet-info">
                    <div class="bet-game">${bet.game}</div>
                    <div class="bet-time">${new Date(bet.timestamp).toLocaleString()}</div>
                </div>
                <div style="text-align: right;">
                    <div style="margin-bottom: 5px;">Bet: $${bet.betAmount}</div>
                    <div class="bet-result ${bet.isWin ? 'win' : 'lose'}">
                        ${bet.isWin ? `+$${bet.netWin}` : `-$${bet.betAmount}`}
                    </div>
                </div>
            </div>
        `).join('');
    }
}

const ui = new UIManager();
