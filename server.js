const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors());
// Serve the static frontend files
app.use(express.static(__dirname));

// === HELPER FUNCTIONS ===
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function authenticateUser(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    db.get('SELECT * FROM users WHERE session_token = ?', [token], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// === AUTHENTICATION ===
app.post('/api/auth/login', async (req, res) => {
    const { apiKey } = req.body;

    try {
        // Verify API key with Torn City
        const response = await axios.get(`https://api.torn.com/user/?selections=profile&key=${apiKey}&format=json`);

        if (response.data.error) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        const userId = response.data.player_id;
        const username = response.data.name;
        const sessionToken = generateToken();

        // Upsert user into database
        db.get('SELECT * FROM users WHERE torn_id = ?', [userId], (err, row) => {
            if (row) {
                // Update existing user's token and name
                db.run('UPDATE users SET session_token = ?, username = ? WHERE torn_id = ?', [sessionToken, username, userId], (err) => {
                    res.json({ sessionToken, userId, username, balance: row.balance, vip_tier: row.vip_tier });
                });
            } else {
                // Create new user
                db.run('INSERT INTO users (torn_id, username, session_token, balance) VALUES (?, ?, ?, ?)', [userId, username, sessionToken, 1000], function(err) {
                    res.json({ sessionToken, userId, username, balance: 1000, vip_tier: 1 });
                });
            }
        });

    } catch (error) {
        console.error("Auth error:", error.message);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// === BALANCE ===
app.get('/api/user/balance', authenticateUser, (req, res) => {
    res.json({ balance: req.user.balance });
});

// === PLACE BET ===
app.post('/api/bets/place', authenticateUser, (req, res) => {
    const { game, amount, multiplier } = req.body;
    const user = req.user;

    if (amount < 1 || amount > 10000000) return res.status(400).json({ error: 'Invalid bet amount' });
    if (amount > user.balance) return res.status(400).json({ error: 'Insufficient balance' });

    // Deduct bet and add payout in one transaction
    const payout = Math.floor(amount * multiplier);
    const newBalance = user.balance - amount + payout;

    db.run('UPDATE users SET balance = ?, total_wagered = total_wagered + ? WHERE id = ? AND balance >= ?', [newBalance, amount, user.id, amount], function(err) {
        if (err || this.changes === 0) return res.status(400).json({ error: 'Failed to process bet' });

        // Record bet
        db.run('INSERT INTO bets (user_id, game, amount, multiplier, payout, result) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, game, amount, multiplier, payout, payout > 0 ? 'win' : 'lose'], function(err) {
                res.json({
                    result: payout > 0 ? 'win' : 'lose',
                    payout,
                    newBalance,
                    betId: this.lastID
                });
        });
    });
});

// === DAILY BONUS ===
app.post('/api/user/daily-bonus', authenticateUser, (req, res) => {
    const user = req.user;
    const now = new Date();
    const lastBonus = user.last_daily_bonus ? new Date(user.last_daily_bonus) : new Date(0);
    
    // Check if 24 hours have passed
    if (now - lastBonus < 24 * 60 * 60 * 1000) {
        const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (now - lastBonus)) / (1000 * 60 * 60));
        return res.status(400).json({ error: `You must wait ${hoursLeft} hours to claim your next bonus.` });
    }

    const bonusAmount = 5000 * (user.vip_tier || 1);
    const newBalance = user.balance + bonusAmount;

    db.run('UPDATE users SET balance = ?, last_daily_bonus = CURRENT_TIMESTAMP WHERE id = ?', [newBalance, user.id], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to claim bonus' });
        res.json({ message: `Claimed $${bonusAmount} daily bonus!`, newBalance });
    });
});

// === LEADERBOARD ===
app.get('/api/leaderboard', (req, res) => {
    db.all('SELECT username, total_wagered FROM users ORDER BY total_wagered DESC LIMIT 10', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch leaderboard' });
        res.json(rows);
    });
});

// === SOCKET.IO (PvP Games & Chat) ===
const lobbies = new Map(); // Coinflip lobbies
const chatHistory = []; // Last 50 messages

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    db.get('SELECT * FROM users WHERE session_token = ?', [token], (err, user) => {
        if (err || !user) return next(new Error('Authentication error'));
        socket.user = user;
        next();
    });
});

io.on('connection', (socket) => {
    console.log('User connected to Socket:', socket.user.username);
    
    // Send open lobbies and chat history
    socket.emit('lobbies_update', Array.from(lobbies.values()));
    socket.emit('chat_history', chatHistory);

    // Chat logic
    socket.on('send_chat', (message) => {
        if (typeof message !== 'string' || message.trim().length === 0) return;
        const chatMsg = {
            id: Date.now(),
            user: socket.user.username,
            text: message.substring(0, 200).trim(), // max 200 chars
            timestamp: new Date().toISOString()
        };
        chatHistory.push(chatMsg);
        if (chatHistory.length > 50) chatHistory.shift();
        io.emit('new_chat_message', chatMsg);
    });

    socket.on('create_coinflip', (data) => {
        const { amount, side } = data; // side: 'heads' or 'tails'
        
        if (amount < 1 || amount > socket.user.balance) return socket.emit('error', 'Invalid amount');

        // Deduct balance for creating
        db.run('UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?', [amount, socket.user.id, amount], function(err) {
            if (err || this.changes === 0) return socket.emit('error', 'Insufficient balance');
            
            const lobbyId = Date.now().toString();
            const lobby = {
                id: lobbyId,
                creator: socket.user.username,
                creatorId: socket.user.id,
                amount,
                side,
                status: 'waiting'
            };
            
            lobbies.set(lobbyId, lobby);
            io.emit('lobbies_update', Array.from(lobbies.values()));
        });
    });

    socket.on('join_coinflip', (lobbyId) => {
        const lobby = lobbies.get(lobbyId);
        if (!lobby || lobby.status !== 'waiting') return socket.emit('error', 'Lobby not available');
        if (lobby.creatorId === socket.user.id) return socket.emit('error', 'Cannot join own lobby');

        // Deduct balance for joining
        db.run('UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?', [lobby.amount, socket.user.id, lobby.amount], function(err) {
            if (err || this.changes === 0) return socket.emit('error', 'Insufficient balance');
            
            lobby.status = 'playing';
            lobby.joiner = socket.user.username;
            lobby.joinerId = socket.user.id;
            io.emit('lobbies_update', Array.from(lobbies.values()));

            // Flip the coin
            setTimeout(() => {
                const resultSide = Math.random() < 0.5 ? 'heads' : 'tails';
                const creatorWins = lobby.side === resultSide;
                
                const winnerId = creatorWins ? lobby.creatorId : lobby.joinerId;
                const loserId = creatorWins ? lobby.joinerId : lobby.creatorId;
                const payout = Math.floor(lobby.amount * 2 * 0.95); // 5% rake

                // Reward winner
                db.run('UPDATE users SET balance = balance + ?, total_wagered = total_wagered + ? WHERE id = ?', [payout, lobby.amount, winnerId]);
                // Update loser wager stat
                db.run('UPDATE users SET total_wagered = total_wagered + ? WHERE id = ?', [lobby.amount, loserId]);

                const result = {
                    ...lobby,
                    resultSide,
                    winnerId,
                    payout
                };

                io.emit('coinflip_result', result);
                lobbies.delete(lobbyId);
                io.emit('lobbies_update', Array.from(lobbies.values()));
            }, 3000); // 3 second suspense
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.user.username);
        // Refund waiting lobbies created by this user
        for (const [id, lobby] of lobbies) {
            if (lobby.creatorId === socket.user.id && lobby.status === 'waiting') {
                db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [lobby.amount, socket.user.id]);
                lobbies.delete(id);
            }
        }
        io.emit('lobbies_update', Array.from(lobbies.values()));
    });
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎰 Casino backend running on http://localhost:${PORT}`);
});
