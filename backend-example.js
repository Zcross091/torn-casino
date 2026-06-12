// Backend Integration Example (Node.js + Express)
// This is a reference implementation for integrating a real backend

/*
SETUP:
1. npm install express axios cors dotenv
2. Create .env file with API keys
3. Run: node backend.js

This example shows how to:
- Authenticate users with Torn City
- Store balances in database
- Process bets server-side
- Implement provably fair
*/

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Database (use MongoDB, PostgreSQL, etc in production)
const users = new Map();
const bets = [];

// === AUTHENTICATION ===
app.post('/api/auth/login', async (req, res) => {
    const { apiKey, tornUserId } = req.body;

    try {
        // Verify API key with Torn City
        const response = await axios.get(
            `https://api.torn.com/user/?selections=profile&key=${apiKey}&format=json`
        );

        if (response.data.error) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        const userId = response.data.player_id;
        const username = response.data.name;

        // Create or get user
        if (!users.has(userId)) {
            users.set(userId, {
                id: userId,
                username: username,
                balance: 1000, // Starting balance
                createdAt: new Date(),
                sessionToken: generateToken()
            });
        }

        const user = users.get(userId);
        const sessionToken = generateToken();
        user.sessionToken = sessionToken;

        res.json({
            sessionToken,
            userId,
            username,
            balance: user.balance
        });
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// === BALANCE ===
app.get('/api/user/balance', authenticateUser, (req, res) => {
    const user = users.get(req.userId);
    res.json({ balance: user.balance });
});

// === PLACE BET ===
app.post('/api/bets/place', authenticateUser, (req, res) => {
    const { game, amount, parameters } = req.body;
    const user = users.get(req.userId);

    // Validate bet
    if (amount < 1 || amount > 1000000) {
        return res.status(400).json({ error: 'Invalid bet amount' });
    }

    if (amount > user.balance) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct bet
    user.balance -= amount;

    // Run game server-side
    const result = processGame(game, amount, parameters);

    // Apply result
    if (result.won) {
        user.balance += result.payout;
    }

    // Record bet
    const bet = {
        id: Date.now(),
        userId: req.userId,
        game,
        amount,
        result: result.won ? 'win' : 'lose',
        payout: result.payout,
        multiplier: result.multiplier,
        createdAt: new Date(),
        serverSeed: result.serverSeed,
        clientSeed: parameters.clientSeed
    };
    bets.push(bet);

    res.json({
        result: result.won ? 'win' : 'lose',
        payout: result.payout,
        newBalance: user.balance,
        betId: bet.id
    });
});

// === PROVABLY FAIR ===
app.post('/api/verify-bet', (req, res) => {
    const { betId, clientSeed } = req.body;
    
    const bet = bets.find(b => b.id === betId);
    if (!bet) {
        return res.status(404).json({ error: 'Bet not found' });
    }

    // Verify hash
    const crypto = require('crypto');
    const combined = `${bet.serverSeed}:${clientSeed}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    const provablyFair = parseInt(hash.substring(0, 8), 16) % 10000;

    res.json({
        betId,
        serverSeed: bet.serverSeed,
        clientSeed,
        hash,
        provablyFair,
        result: bet.result
    });
});

// === MONETIZATION: DEPOSIT ===
app.post('/api/user/deposit', authenticateUser, (req, res) => {
    const { amount, paymentMethod } = req.body;
    const user = users.get(req.userId);

    // Process payment (Stripe, PayPal, etc)
    // This is just a placeholder
    
    user.balance += amount;

    res.json({
        success: true,
        newBalance: user.balance,
        depositId: Date.now()
    });
});

// === MONETIZATION: WITHDRAW ===
app.post('/api/user/withdraw', authenticateUser, (req, res) => {
    const { amount } = req.body;
    const user = users.get(req.userId);

    if (amount > user.balance) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Process withdrawal
    user.balance -= amount;

    res.json({
        success: true,
        newBalance: user.balance,
        withdrawalId: Date.now()
    });
});

// === HOUSE STATISTICS ===
app.get('/api/house/stats', (req, res) => {
    const totalBets = bets.reduce((sum, b) => sum + b.amount, 0);
    const totalPayouts = bets.reduce((sum, b) => sum + b.payout, 0);
    const profit = totalBets - totalPayouts;

    res.json({
        totalBets,
        totalPayouts,
        profit,
        totalGames: bets.length,
        games: aggregateByGame()
    });
});

// === HELPER FUNCTIONS ===

function generateToken() {
    return Math.random().toString(36).substring(2, 15);
}

function authenticateUser(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token' });
    }

    // Find user with this token
    for (const [userId, user] of users) {
        if (user.sessionToken === token) {
            req.userId = userId;
            return next();
        }
    }

    res.status(401).json({ error: 'Invalid token' });
}

function processGame(gameName, amount, parameters) {
    // Server-side game logic with provably fair
    const crypto = require('crypto');
    const serverSeed = crypto.randomBytes(16).toString('hex');
    const clientSeed = parameters.clientSeed || '';
    
    const combined = `${serverSeed}:${clientSeed}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    const random = parseInt(hash.substring(0, 8), 16) / 0xffffffff;

    let multiplier = 0;
    let won = false;

    switch (gameName) {
        case 'dice':
            const target = parameters.target || 50;
            const roll = Math.floor(random * 100);
            won = parameters.betType === 'higher' 
                ? roll > target 
                : roll < target;
            multiplier = won ? ((100 - target) / 100) * 0.97 : 0;
            break;

        case 'wheel':
            if (random < 0.35) multiplier = 2;
            else if (random < 0.55) multiplier = 5;
            else if (random < 0.65) multiplier = 10;
            else multiplier = 0;
            won = multiplier > 0;
            break;

        // Add more games as needed
        default:
            return { won: false, payout: 0, multiplier: 0, serverSeed };
    }

    const payout = won ? amount * multiplier : 0;
    return {
        won,
        payout,
        multiplier,
        serverSeed
    };
}

function aggregateByGame() {
    const stats = {};
    for (const bet of bets) {
        if (!stats[bet.game]) {
            stats[bet.game] = { count: 0, total: 0, wins: 0 };
        }
        stats[bet.game].count++;
        stats[bet.game].total += bet.amount;
        if (bet.result === 'win') stats[bet.game].wins++;
    }
    return stats;
}

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🎰 Casino backend running on port ${PORT}`);
});

/*
FRONTEND INTEGRATION:

Update assets/api.js:

const API_URL = 'http://localhost:3000/api';

async deductMoney(amount) {
    const response = await fetch(`${API_URL}/user/balance/deduct`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${this.sessionToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
}

async placeBet(game, amount, parameters) {
    const response = await fetch(`${API_URL}/bets/place`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${this.sessionToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ game, amount, parameters })
    });
    return response.json();
}
*/
