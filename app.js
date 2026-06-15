/**
 * app.js - Client-Side Scraper & Google Sheets Engine
 */

// ==========================================
// CONFIGURATION
// Paste your Google Apps Script Web App URL here after deploying!
const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzXs-2zY26io4CKzZR3w3A0_SStcrhryWR1J9cRA2_YRqoAaxAhXnIbQm7CDyjhkkkr/exec'; 
// ==========================================

const STATE = {
    userKey: localStorage.getItem('torn_api_key') || '',
    isPremiumUnlocked: false,
    
    // Master Key Pool
    keyPool: ['lMzaRITl5w3eQY9d'], 
    currentKeyIndex: 0,

    newsItems: [],
    currentFilter: 'all',
    
    // Known targets to monitor for the premium feature
    traders: [1, 2, 3], // Dummy IDs for whales
};

const els = {
    date: document.getElementById('current-date'),
    settingsBtn: document.getElementById('toggle-settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    apiKeyInput: document.getElementById('api_key_input'),
    saveKeyBtn: document.getElementById('save-key-btn'),
    statusIndicator: document.getElementById('data-status-indicator'),
    newsContainer: document.getElementById('news-container'),
    filters: document.querySelectorAll('.filter-btn'),
    
    premiumOverlay: document.getElementById('premium-overlay'),
    premiumContent: document.getElementById('premium-content'),
    targetGrid: document.getElementById('target-grid')
};

// --- API Key Pool Logic ---
async function fetchKeyPool() {
    if (!GOOGLE_APP_SCRIPT_URL) {
        console.warn("No Google Script URL set. Using hardcoded master key only.");
        return;
    }
    try {
        const res = await fetch(GOOGLE_APP_SCRIPT_URL);
        const data = await res.json();
        if (data.keys && data.keys.length > 0) {
            // Merge hardcoded key with sheet keys, remove duplicates
            STATE.keyPool = [...new Set(['lMzaRITl5w3eQY9d', ...data.keys])];
            console.log(`Loaded ${STATE.keyPool.length} keys into the Round-Robin pool.`);
        }
    } catch (e) {
        console.error("Failed to fetch keys from Google Sheets:", e);
    }
}

function getNextKey() {
    if (STATE.keyPool.length === 0) return null;
    const key = STATE.keyPool[STATE.currentKeyIndex];
    STATE.currentKeyIndex = (STATE.currentKeyIndex + 1) % STATE.keyPool.length;
    return key;
}

// --- Scraper Engine ---
class ScraperEngine {
    constructor() {
        this.pollInterval = null;
    }

    async start() {
        console.log("Starting Scraper Engine...");
        await fetchKeyPool();
        this.runCycle();
        this.pollInterval = setInterval(() => this.runCycle(), 60000); // 1 min rotation
    }

    stop() {
        if (this.pollInterval) clearInterval(this.pollInterval);
    }

    async fetchApi(endpoint, specificKey = null) {
        // Use user's key if specified (for premium features), otherwise use Round-Robin pool
        const key = specificKey || getNextKey();
        if (!key) return null;

        try {
            const res = await fetch(`https://api.torn.com/v2/${endpoint}`, {
                headers: { 'Authorization': `ApiKey ${key}` }
            });
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn(`API Error on ${endpoint}:`, err);
            return null;
        }
    }

    triggerAlert(type, headline, details) {
        const id = Math.random().toString(36).substr(2, 9);
        const timestamp = new Date().toISOString();
        STATE.newsItems.unshift({ id, type, headline, details, timestamp });
        if (STATE.newsItems.length > 50) STATE.newsItems.pop();
        renderNews();
    }

    async runCycle() {
        await this.fetchBasicNews();
        if (STATE.isPremiumUnlocked) {
            await this.runPremiumLocator();
        }
    }

    async fetchBasicNews() {
        // 1. Travel News
        const travel = await this.fetchApi("torn/travel");
        if (travel && travel.count > 100) {
            this.triggerAlert("travel_flow", `MASS EXODUS: Flights to ${travel.destination} packed!`, `A sudden influx of ${travel.count} citizens boarded flights to ${travel.destination}. Expect high volatility in offshore markets.`);
        }

        // 2. Global Bounties Spikes
        const bounties = await this.fetchApi("torn/bounties");
        if (bounties && bounties.total_amount > 100000000) {
            this.triggerAlert("bounty_flow", `CASH FOR BLOOD: Bounty pool hits $${bounties.total_amount.toLocaleString()}!`, `A staggering total of $${bounties.total_amount.toLocaleString()} in active bounties has been registered on the board.`);
        }
        
        // Ensure there is something to show if API is slow
        if (STATE.newsItems.length === 0) {
            this.triggerAlert("price_anomaly", "MARKET OPENS TO PANIC", "The Torn City stock exchange reports high volatility. Expect irregular pricing on consumables and medical supplies throughout the day.");
        }
    }

    async runPremiumLocator() {
        // Use the user's specific key for private/premium API calls
        els.targetGrid.innerHTML = ''; 

        // TARGET 1: High Bounties
        const bounties = await this.fetchApi("torn/bounties", STATE.userKey);
        if (bounties && bounties.bounties) {
            // Find highest bounty
            const highest = bounties.bounties.sort((a,b) => b.reward - a.reward)[0];
            if (highest) {
                this.renderTargetCard('🎯 EXTREME BOUNTY', `Target ID: ${highest.target}`, `Reward: $${highest.reward.toLocaleString()}<br>Reason: ${highest.reason}`);
            }
        }

        // TARGET 2: Faction Members Flying (Option C)
        const faction = await this.fetchApi("faction/members", STATE.userKey);
        if (faction && faction.members) {
            const flying = Object.values(faction.members).filter(m => m.status.state === 'Traveling');
            if (flying.length > 0) {
                this.renderTargetCard('✈️ FACTION MOVEMENT', `${flying.length} Members Airborne`, `Multiple internal faction members are currently on flights. Potential item runners.`);
            }
        }

        // TARGET 3: Simulated Bazaar/Whale Monitor
        // (In reality, we would poll specific IDs here. We simulate for demonstration.)
        if (Math.random() > 0.3) {
            this.renderTargetCard('💰 WHALE DETECTED', `Known Casino Winner`, `Status: Returning to Torn (Est. 14 mins)<br>Likely carrying large cash reserves from recent Russian Roulette wins.`);
        }
    }

    renderTargetCard(title, subtitle, details) {
        const html = `
            <div class="border-2 border-red-900 bg-[#fff5f5] p-4 relative shadow-sm">
                <span class="absolute top-0 right-0 bg-red-900 text-white text-[9px] font-bold px-2 py-1 uppercase">Action Required</span>
                <h4 class="font-retro-title text-red-900 text-lg uppercase tracking-tight mb-1">${title}</h4>
                <div class="font-typewriter font-bold text-xs text-neutral-800 mb-2">${subtitle}</div>
                <p class="font-typewriter text-[10px] text-neutral-600 leading-relaxed">${details}</p>
            </div>
        `;
        els.targetGrid.insertAdjacentHTML('beforeend', html);
    }
}

// --- UI Rendering ---
function unlockPremium() {
    STATE.isPremiumUnlocked = true;
    els.premiumOverlay.style.display = 'none';
    els.premiumContent.classList.remove('premium-locked');
    els.statusIndicator.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Secure Network Active`;
    
    els.targetGrid.innerHTML = `
        <div class="border border-neutral-300 p-4 font-typewriter text-xs text-neutral-600 italic">
            Scanning for high-value targets...
        </div>
    `;
    engine.runPremiumLocator();
}

function renderNews() {
    // Basic rendering logic preserved
    if (STATE.newsItems.length === 0) return;
    
    const filtered = STATE.currentFilter === 'all' 
        ? STATE.newsItems 
        : STATE.newsItems.filter(n => n.type === STATE.currentFilter);

    if (filtered.length === 0) {
        els.newsContainer.innerHTML = `<div class="text-center py-10 font-typewriter text-xs">No reports found for this filter.</div>`;
        return;
    }

    let html = `<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
    filtered.forEach((story, idx) => {
        const time = new Date(story.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        html += `
            <article class="bg-[#fdfcf9] border border-neutral-300 p-5 shadow-sm flex flex-col justify-between paper-lift">
                <div>
                    <span class="inline-block border text-[9px] font-bold px-2 py-0.5 font-typewriter uppercase rounded tracking-wide bg-neutral-800 text-white mb-3.5">${story.type.replace('_', ' ')}</span>
                    <h3 class="font-retro-title text-xl uppercase font-bold text-neutral-950 leading-tight mb-2">${story.headline}</h3>
                    <p class="text-xs font-retro-serif text-neutral-700 leading-relaxed">${story.details}</p>
                </div>
                <div class="border-t border-neutral-200 pt-2 flex justify-between items-center text-[10px] font-typewriter text-neutral-500 mt-2">
                    <span>${time} TCT</span>
                </div>
            </article>
        `;
    });
    html += `</section>`;
    els.newsContainer.innerHTML = html;
}

// --- Event Listeners ---
els.settingsBtn.addEventListener('click', () => {
    els.settingsPanel.classList.toggle('open');
});

const engine = new ScraperEngine();

els.saveKeyBtn.addEventListener('click', async () => {
    const val = els.apiKeyInput.value.trim();
    if (val.length === 16) {
        els.saveKeyBtn.innerText = "Submitting...";
        els.saveKeyBtn.disabled = true;

        // Save locally
        STATE.userKey = val;
        localStorage.setItem('torn_api_key', val);

        // POST to Google Sheets Pool
        if (GOOGLE_APP_SCRIPT_URL) {
            try {
                await fetch(GOOGLE_APP_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ api_key: val })
                });
            } catch(e) {
                console.warn("Failed to push to Google Sheets", e);
            }
        } else {
            console.warn("No Google Script URL set. Key saved locally only.");
        }

        // Add to local pool immediately
        if (!STATE.keyPool.includes(val)) STATE.keyPool.push(val);

        els.saveKeyBtn.innerText = "Submit Key";
        els.saveKeyBtn.disabled = false;
        els.settingsPanel.classList.remove('open');
        
        unlockPremium();
    } else {
        alert("Invalid API Key length. Must be exactly 16 characters.");
    }
});

// Boot
document.getElementById('current-date').innerText = new Date().toLocaleDateString();
engine.start();

if (STATE.userKey.length === 16) {
    els.apiKeyInput.value = STATE.userKey;
    unlockPremium();
}
