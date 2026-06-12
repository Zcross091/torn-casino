# ⚡ Quick Start Guide

Get your casino running in 5 minutes!

## Step 1: Test Locally (2 minutes)

### Option A: Simple HTTP Server (Python)
```bash
cd /path/to/Xanflip.com
python -m http.server 8000
```

### Option B: Node.js HTTP Server
```bash
npx http-server -p 8000
```

### Option C: Live Server (VS Code)
- Install "Live Server" extension
- Right-click index.html → "Open with Live Server"

Then open: **http://localhost:8000**

## Step 2: Get Your Torn City API Key (1 minute)

1. Go to: https://www.torn.com/preferences.php#tab=api
2. Click "Generate API Key"
3. Copy your Personal API Key
4. Keep it safe!

## Step 3: Login & Play (2 minutes)

1. Open casino in browser
2. Paste your API key
3. Click "Login"
4. You get $1,000 to play with
5. Try a game!

## First Time Tips

✅ Start with **Dice** - simplest game
✅ Try small bets first ($10-100)
✅ Check **Bets** tab to see history
✅ Test winning and losing scenarios
✅ Verify balance updates work

## Deploy to Production (5 minutes)

### Fastest: Netlify

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to netlify.com
# 3. Click "New site from Git"
# 4. Select your repo
# 5. Deploy!
```

Done! Your casino is live at `your-site.netlify.app`

### Alternative: Heroku

```bash
heroku create my-casino
heroku config:set NODE_ENV=production
git push heroku main
```

Your site is at `my-casino.herokuapp.com`

## File Structure

```
Xanflip.com/
├── index.html              ← Main page
├── README.md               ← Full documentation
├── DEPLOYMENT.md           ← Deployment guide
├── backend-example.js      ← Backend reference
└── assets/
    ├── styles.css          ← Styling
    ├── config.js           ← Settings
    ├── api.js              ← Torn City API
    ├── ui.js               ← Game controls
    ├── main.js             ← App startup
    └── games/
        ├── gameEngine.js   ← Base game class
        └── solo/           ← 11 Games
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

## Common Questions

### Q: Can I change starting balance?
A: Yes! Edit `assets/api.js`, find `api.setLocalBalance(1000)` and change 1000

### Q: How do I add more games?
A: Create new file in `assets/games/solo/`, extend `GameEngine` class, register with `registerGame()`

### Q: How do players actually give me money?
A: You need a backend! See `backend-example.js` for reference

### Q: Is this real money?
A: No, this uses local storage. For real money, implement a payment system (Stripe, PayPal)

### Q: Can I modify the house rake?
A: Yes! Edit `HOUSE_RAKE` in `assets/config.js`

### Q: How do I track player balances?
A: For now it's local. For production, set up a database (see DEPLOYMENT.md)

## Customization Examples

### Change Colors
Edit `assets/styles.css` - top of file:
```css
:root {
    --primary: #00ff00;    /* Green - change this */
    --dark-bg: #0b0f18;    /* Dark - change this */
}
```

### Change Starting Balance
In `assets/api.js`:
```javascript
api.setLocalBalance(5000);  // $5,000 instead of $1,000
```

### Change Game Payouts
In each game file (e.g., `assets/games/solo/dice.js`):
```javascript
multiplier = (1 / probability) * 0.95;  // Adjust 0.95
```

### Add Your Logo
In `index.html`, replace:
```html
<h1>🎰 CASINO</h1>
```
With your logo/name

## Testing Checklist

- [ ] Login works with API key
- [ ] Balance displays correctly
- [ ] Can place bet
- [ ] Can win/lose
- [ ] Balance updates after game
- [ ] Bet appears in history
- [ ] Tab switching works
- [ ] Modal opens/closes
- [ ] Mobile responsive
- [ ] No console errors

## Next Steps

1. ✅ **Test locally** - Make sure everything works
2. ✅ **Customize** - Change colors, add your branding
3. ✅ **Deploy** - Push to Netlify or your server
4. ✅ **Monetize** (optional) - Set up payments
5. ✅ **Promote** - Tell your friends!

## Need Help?

### Check These Files First
- README.md - Full documentation
- DEPLOYMENT.md - Deployment options
- backend-example.js - Backend reference

### Common Issues
- **"Failed to fetch"** - Check API key
- **No balance showing** - Check console logs (F12)
- **Game won't load** - Verify all JS files loaded

### Debug Mode
Open browser console (F12) to see detailed logs and error messages

---

🎰 You're ready! Have fun running your casino!

Need a backend? See `backend-example.js` or DEPLOYMENT.md
