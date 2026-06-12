# 🎰 Torn City Casino Platform

A complete vanilla JavaScript casino platform for Torn City with 11 playable games. Players use their Torn City API keys to login and play with casino tokens.

## Features

### Games Included (11 Total)
- **Dice** - Predict higher or lower
- **Wheel** - Spin the wheel for random multipliers (up to 10x)
- **Crash** - Cash out before the crash (variable multiplier)
- **Mines** - Find gems and avoid mines (up to 10x)
- **Hi-Lo** - Beat the dealer with card predictions
- **Blackjack** - Classic card game (up to 2.5x)
- **Tower** - Climb the tower for bigger wins (up to 12x)
- **Moles** - Whack moles in 3 seconds (up to 8x)
- **Chicken** - Catch golden chickens (up to 5x)
- **Plinko** - Watch the ball fall for payouts (up to 8x)
- **Keno** - Pick your lucky numbers (up to 15x)

### Features
✅ Torn City API Integration
✅ Provably Fair RNG (basic implementation)
✅ Complete bet history tracking
✅ User authentication via API keys
✅ Local balance management
✅ House rake system (2-5% depending on game)
✅ Responsive design
✅ Dark theme with green accents
✅ Real-time balance updates

## Getting Started

### Prerequisites
- Web server (Apache, Nginx, Node.js, etc.)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Torn City API key from each player

### Installation

1. **Clone/Download the casino files** to your web server
   ```
   /
   ├── index.html
   ├── assets/
   │   ├── styles.css
   │   ├── config.js
   │   ├── api.js
   │   ├── ui.js
   │   ├── main.js
   │   └── games/
   │       ├── gameEngine.js
   │       └── solo/
   │           ├── dice.js
   │           ├── wheel.js
   │           ├── crash.js
   │           ├── mines.js
   │           ├── hilo.js
   │           ├── blackjack.js
   │           ├── tower.js
   │           ├── moles.js
   │           ├── chicken.js
   │           ├── plinko.js
   │           └── keno.js
   └── games/
       ├── pvp/
       └── solo/
   ```

2. **Start your web server**
   - Ensure all files are accessible via HTTP/HTTPS
   - Test by visiting your casino URL

3. **Players log in with their Torn City API key**
   - Get API key from Torn City: https://www.torn.com/preferences.php#tab=api
   - Paste key into login form

### Configuration

Edit `assets/config.js` to customize:

```javascript
// Minimum and maximum bet amounts
MIN_BET: 1,
MAX_BET: 1000000,

// House rake percentage (2-5%)
HOUSE_RAKE: 0.05,

// Starting balance for new players (in local storage)
// Currently set to $1,000 in api.js
```

## How It Works

### Game Flow
1. Player enters Torn City API key
2. System verifies API key with Torn City API
3. Player gets initial balance ($1,000 by default)
4. Player selects game and places bet
5. Game runs and displays result
6. Bet is recorded in history
7. Balance updates automatically

### Rake System
Each game takes a small house rake:
- Most games: 5% rake
- Crash: 2% rake
- Multipliers are adjusted to account for rake

Example: 
- Bet: $100
- Win multiplier: 2x
- Gross win: $200
- Rake (5%): $10
- Net win: $190
- Total payout: $290 ($100 original + $190 net win)

### Balance Management (Current Implementation)

**Local Storage** (development mode):
- Balances stored in browser's local storage
- Perfect for testing and prototyping
- Data persists across sessions on same device

**For Production** you should implement:
- Backend server to store balances in database
- API endpoints for deposit/withdrawal
- Direct Torn City integration for real money
- Server-side game verification (provably fair)

## Technical Stack

- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: CSS3 with CSS Variables
- **API**: Torn City REST API
- **Storage**: LocalStorage (replaceable with backend)

## Backend Integration Guide

For production, you'll want to:

### 1. Create Backend Endpoints

```
POST /api/auth/login
  Input: { apiKey, tornUserId }
  Output: { sessionToken, balance }

POST /api/bets/place
  Input: { sessionToken, game, amount, parameters }
  Output: { betId, result, newBalance }

GET /api/user/balance
  Input: { sessionToken }
  Output: { balance }
```

### 2. Update api.js

Replace local storage calls with backend API calls:

```javascript
async deductMoney(amount) {
    const response = await fetch('/api/user/balance/deduct', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.sessionToken}` },
        body: JSON.stringify({ amount })
    });
    return response.json();
}
```

### 3. Implement Provably Fair

Replace `getRandomNumber()` in gameEngine.js with:
- Cryptographic hashing
- Block hash verification
- Player seed + server seed commitment

### 4. Database Schema (Example)

```sql
CREATE TABLE users (
    id INT PRIMARY KEY,
    torn_id INT UNIQUE,
    balance BIGINT,
    created_at TIMESTAMP
);

CREATE TABLE bets (
    id INT PRIMARY KEY,
    user_id INT,
    game VARCHAR(50),
    amount BIGINT,
    multiplier DECIMAL,
    result VARCHAR(10),
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Keys and Security

⚠️ **Security Considerations**:

1. **API Keys never leave the browser**
   - All API calls in this version are read-only
   - Money transactions use local balance for now

2. **For Production**:
   - Implement backend authentication
   - Use session tokens instead of API keys
   - Never expose API keys in frontend code
   - Implement HTTPS only
   - Add CORS protection
   - Rate limiting on all endpoints

3. **Getting Torn City API Key**:
   - Go to https://www.torn.com/preferences.php#tab=api
   - Basic API key works fine
   - Can limit scopes for extra security

## Testing

### Manual Testing
1. Open index.html in browser
2. Use test API key from Torn City
3. Try different games
4. Check balance updates
5. View bet history

### Test Games
- Try each game type
- Test both winning and losing scenarios
- Verify rake is calculated correctly
- Check bet history is recorded

## Customization

### Change Colors
Edit `:root` in `assets/styles.css`:
```css
:root {
    --primary: #00ff00;  /* Green */
    --primary-dark: #00cc00;
    --dark-bg: #0b0f18;  /* Dark background */
    --card-bg: #1a1f2e;  /* Card background */
    --border: #2a3f5f;   /* Border color */
    --text: #e0e0e0;     /* Text color */
}
```

### Add More Games
1. Create new file: `assets/games/solo/newgame.js`
2. Extend `GameEngine` class
3. Implement `play()` and `getHTML()` methods
4. Register with `registerGame('newgame', NewGameClass)`
5. Add game card to index.html

### Customize Payouts
Edit multipliers in individual game files or in gameEngine.js

## Deployment

### Option 1: Static Hosting
- Netlify, Vercel, GitHub Pages
- Free and easy
- Limited to local storage balance

### Option 2: Traditional Server
- Apache, Nginx, Node.js
- Full control
- Can implement backend

### Option 3: Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["npx", "http-server", "-p", "3000"]
```

## Troubleshooting

### "Failed to fetch user info"
- Invalid API key
- API key has wrong permissions
- Network error

### Balance not updating
- Check browser console for errors
- Verify localStorage is enabled
- Try clearing browser cache

### Game not loading
- Check all script files are loaded in HTML
- Verify JavaScript console for errors
- Check file paths are correct

## File Structure Reference

```
assets/
├── config.js           # Configuration constants
├── api.js              # Torn City API integration
├── ui.js               # UI management and controls
├── main.js             # App initialization
├── styles.css          # All styling
└── games/
    ├── gameEngine.js   # Base game class
    └── solo/
        ├── dice.js
        ├── wheel.js
        ├── crash.js
        ├── mines.js
        ├── hilo.js
        ├── blackjack.js
        ├── tower.js
        ├── moles.js
        ├── chicken.js
        ├── plinko.js
        └── keno.js
```

## Future Enhancements

- [ ] PvP games (Coinflip, Jackpot)
- [ ] Real-time multiplayer
- [ ] Leaderboards
- [ ] Daily bonuses
- [ ] Achievements/Badges
- [ ] Tournaments
- [ ] Mobile app version
- [ ] VIP tiers
- [ ] Referral system
- [ ] Blockchain integration

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console logs
3. Verify all files are in correct locations
4. Test with different browsers

## License

Feel free to modify and use for your own casino project!

---

🎰 Good luck and happy gaming!
