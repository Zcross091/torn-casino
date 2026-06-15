/**
 * app.js - Client-Side Scraper & UI Engine for Torn Tabloid Syndicate
 * Runs entirely in the browser. Zero backend required.
 */

const STATE = {
    apiKey: localStorage.getItem('torn_api_key') || '',
    newsItems: [], // Array of { id, type, headline, details, timestamp }
    currentFilter: 'all',
    priceHistories: {},
    trackedItems: ["Xanax", "Vicodin", "Torn Points", "Boxing Gloves", "Feathery Hotel Coupon"],
    trackedDestinations: ["Mexico", "Switzerland", "Hawaii", "South Africa", "Japan"]
};

// UI Elements
const els = {
    date: document.getElementById('current-date'),
    settingsBtn: document.getElementById('toggle-settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    apiKeyInput: document.getElementById('api_key_input'),
    saveKeyBtn: document.getElementById('save-key-btn'),
    statusIndicator: document.getElementById('data-status-indicator'),
    newsContainer: document.getElementById('news-container'),
    filters: document.querySelectorAll('.filter-btn')
};

const STAMPS = {
    'price_anomaly':   { text: 'MARKET FLUX', class: 'bg-red-800 text-red-100 border-red-950' },
    'hospitalization': { text: 'CASUALTY REPORT', class: 'bg-amber-800 text-amber-100 border-amber-950' },
    'gym_train':       { text: 'STRENGTH DEMON', class: 'bg-emerald-800 text-emerald-100 border-emerald-950' },
    'travel_flow':     { text: 'BORDER FLUX', class: 'bg-indigo-800 text-indigo-100 border-indigo-950' },
    'bounty_flow':     { text: 'CONTRACT HIT', class: 'bg-neutral-800 text-neutral-100 border-neutral-950' }
};

// --- Narrative Generator ---
const NarrativeGenerator = {
    generate(eventType, data) {
        const player = data.player || "A Shady Character";
        const count = data.count || 0;
        const item = data.item || "Unknown Item";
        const price = data.price || 0;
        const avgPrice = data.avg_price || 0;
        const percent = data.percent || 0.0;
        const destination = data.destination || "Unknown Land";
        const amount = data.amount || 0;

        let headlines = [], details = [];

        if (eventType === "hospitalization") {
            headlines = [
                `LOCAL PHARMACY REPORTS RECORD PROFITS: ${player} keeps medical staff employed!`,
                `TORN HOSPITAL GETS NEW WING NAMED AFTER ${player.toUpperCase()}!`,
                `FREQUENT FLYER TO THE ER: ${player} beats hospitalization record!`
            ];
            details = [
                `${player} was hospitalized ${count} times recently. Medical experts suggest their body is now 40% plaster cast and 60% sheer stubbornness. Local pharmacies report massive bandage shortages.`,
                `After being beaten to a pulp ${count} times, doctors are offering ${player} a premium loyalty card. The ER lobby has officially designated a leather sofa in their honor.`
            ];
        } else if (eventType === "gym_train") {
            headlines = [
                `LOCAL THUG HITS NEW HEAVYWEIGHT CLASS`,
                `SWOLY TRINITY: ${player} spotted lifting cars in Sector 4`,
                `BEAST MODE ACTIVATED: ${player} breaks gym scales!`
            ];
            details = [
                `${player} completed ${count} intense gym trains. Observers report the floor literally shook. Faction bosses are advised to double-reinforce their door frames.`,
                `Local authorities warn citizens to stay clear of ${player} after completing ${count} grueling gym trains. Witnesses saw them using a dumpster as a warmup kettlebell.`
            ];
        } else if (eventType === "price_anomaly") {
            const dir = percent > 0 ? "spiked" : "crashed";
            headlines = [
                `WALL STREET CHAOS: ${item} market in absolute meltdown!`,
                `MARKET ANOMALY: ${item} price has ${dir}!`,
                `TORN ECONOMY SHAKEN: Panic buying of ${item} detected!`
            ];
            details = [
                `The price of ${item} shifted by ${percent > 0 ? '+' : ''}${percent.toFixed(1)}% to $${price.toLocaleString()}! Traders are screaming, crying, and throwing their point cards. The moving average was $${avgPrice.toLocaleString()}.`,
                `Financial analysts are baffled as ${item} prices swing to $${price.toLocaleString()} (a ${percent > 0 ? '+' : ''}${percent.toFixed(1)}% shift from the historical average of $${avgPrice.toLocaleString()}). Black market brokers are hoarding stock.`
            ];
        } else if (eventType === "travel_flow") {
            headlines = [
                `BORDER CONTROL FLOODED: Shady travelers bound for ${destination}!`,
                `MASS EXODUS: Flights to ${destination} packed to capacity!`
            ];
            details = [
                `A sudden influx of ${count} citizens boarded flights to ${destination}. Airport customs reports a high smell of cheap cologne and suspicious luggage.`,
                `Flight radar shows ${count} private jets flying in V-formation towards ${destination}. Speculators suggest a faction war or a massive drug run is underway.`
            ];
        } else if (eventType === "bounty_flow") {
            headlines = [
                `WANTED DEAD OR ALIVE: Bounty hunter frenzy in Torn!`,
                `CASH FOR BLOOD: Bounty pool rises above $${amount.toLocaleString()}!`
            ];
            details = [
                `A staggering total of $${amount.toLocaleString()} in active bounties has been registered on the board. The streets are crawling with hitmen looking for quick cash.`,
                `Torn faction bosses have placed active bounties totaling $${amount.toLocaleString()}. Hitmen are sharpening their blades, and local hospits are preparing for an influx of business.`
            ];
        }

        return {
            headline: headlines[Math.floor(Math.random() * headlines.length)],
            details: details[Math.floor(Math.random() * details.length)]
        };
    }
};

// --- Scraper Engine ---
class ScraperEngine {
    constructor() {
        this.pollInterval = null;
        this.initHistories();
    }

    initHistories() {
        STATE.trackedItems.forEach(item => {
            const base = this.getBasePrice(item);
            STATE.priceHistories[item] = Array.from({length: 5}, () => Math.floor(base * (0.95 + Math.random() * 0.1)));
        });
    }

    getBasePrice(item) {
        if (item.includes("Xanax")) return 835000;
        if (item.includes("Vicodin")) return 4500;
        if (item.includes("Points")) return 48000;
        if (item.includes("Gloves")) return 450000000;
        return 100000;
    }

    start() {
        console.log("Starting Scraper Engine...");
        this.runCycle();
        // Run every 2 minutes for demonstration (real app would be 15 mins to save rate limits)
        this.pollInterval = setInterval(() => this.runCycle(), 120000); 
    }

    stop() {
        if (this.pollInterval) clearInterval(this.pollInterval);
    }

    async runCycle() {
        try {
            await this.checkMarketPrices();
            await this.checkTravelBounties();
            await this.checkPlayerStats();
            renderNews();
        } catch (e) {
            console.error("Scrape cycle failed:", e);
        }
    }

    async fetchApi(endpoint) {
        if (!STATE.apiKey) {
            return this.generateMockData(endpoint);
        }
        
        // Live Fetch from Torn API v2
        try {
            const res = await fetch(`https://api.torn.com/v2/${endpoint}`, {
                headers: { 'Authorization': `ApiKey ${STATE.apiKey}` }
            });
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn("Live API Failed, falling back to mock:", err);
            return this.generateMockData(endpoint);
        }
    }

    generateMockData(endpoint) {
        return new Promise(resolve => {
            setTimeout(() => {
                if (endpoint.includes("market")) {
                    const items = {};
                    STATE.trackedItems.forEach(item => {
                        const base = this.getBasePrice(item);
                        // 25% chance of a market anomaly for mock demo
                        const mult = Math.random() < 0.25 ? (Math.random() < 0.5 ? 1.15 : 0.85) : (0.97 + Math.random() * 0.06);
                        items[item] = Math.floor(base * mult);
                    });
                    resolve({ items });
                } else if (endpoint.includes("travel")) {
                    resolve({ destination: STATE.trackedDestinations[Math.floor(Math.random() * STATE.trackedDestinations.length)], count: Math.floor(Math.random() * 150) });
                } else if (endpoint.includes("bounties")) {
                    resolve({ total_amount: Math.floor(Math.random() * 80000000) });
                } else if (endpoint.includes("player")) {
                    const p = ["Buster", "Duke", "Zorg", "Molly", "Tony_Torn", "ShadowAgent"][Math.floor(Math.random() * 6)];
                    resolve({ player: p, hospitalizations: Math.floor(Math.random() * 40), gym_trains: Math.floor(Math.random() * 350) });
                }
            }, 500); // Simulate network latency
        });
    }

    triggerAlert(type, headline, details) {
        const id = Math.random().toString(36).substr(2, 9);
        const timestamp = new Date().toISOString();
        STATE.newsItems.unshift({ id, type, headline, details, timestamp });
        
        // Keep memory footprint small
        if (STATE.newsItems.length > 50) {
            STATE.newsItems.pop();
        }
    }

    async checkMarketPrices() {
        const data = await this.fetchApi("market");
        if (!data || !data.items) return;

        for (const [item, currentPrice] of Object.entries(data.items)) {
            if (!STATE.trackedItems.includes(item)) continue;
            
            const history = STATE.priceHistories[item];
            const avgPrice = history.reduce((a,b) => a+b, 0) / history.length;
            const deviation = ((currentPrice - avgPrice) / avgPrice) * 100;

            if (Math.abs(deviation) >= 10.0) {
                const narrative = NarrativeGenerator.generate("price_anomaly", { item, price: currentPrice, avg_price: Math.floor(avgPrice), percent: deviation });
                this.triggerAlert("price_anomaly", narrative.headline, narrative.details);
            }

            history.push(currentPrice);
            if (history.length > 10) history.shift();
        }
    }

    async checkTravelBounties() {
        const travel = await this.fetchApi("torn/travel");
        if (travel && travel.count > 80) {
            const n = NarrativeGenerator.generate("travel_flow", travel);
            this.triggerAlert("travel_flow", n.headline, n.details);
        }

        const bounties = await this.fetchApi("torn/bounties");
        if (bounties && bounties.total_amount > 50000000) {
            const n = NarrativeGenerator.generate("bounty_flow", { amount: bounties.total_amount });
            this.triggerAlert("bounty_flow", n.headline, n.details);
        }
    }

    async checkPlayerStats() {
        const stats = await this.fetchApi("player/stats");
        if (!stats) return;

        if (stats.hospitalizations >= 25) {
            const n = NarrativeGenerator.generate("hospitalization", { player: stats.player, count: stats.hospitalizations });
            this.triggerAlert("hospitalization", n.headline, n.details);
        }

        if (stats.gym_trains >= 250) {
            const n = NarrativeGenerator.generate("gym_train", { player: stats.player, count: stats.gym_trains });
            this.triggerAlert("gym_train", n.headline, n.details);
        }
    }
}

// --- UI Rendering ---
function renderDate() {
    const d = new Date();
    els.date.innerText = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function updateStatusIndicator() {
    if (STATE.apiKey) {
        els.statusIndicator.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Live Data Mode`;
        els.apiKeyInput.value = STATE.apiKey;
    } else {
        els.statusIndicator.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span> Mock Data Mode`;
        els.apiKeyInput.value = '';
    }
}

function renderNews() {
    const filtered = STATE.currentFilter === 'all' 
        ? STATE.newsItems 
        : STATE.newsItems.filter(n => n.type === STATE.currentFilter);

    if (filtered.length === 0) {
        els.newsContainer.innerHTML = `
            <section class="text-center py-20 border-b border-neutral-400">
                <span class="font-retro-title text-4xl block text-neutral-400 uppercase tracking-widest mb-4">⚠️ WIRELESS STATIC</span>
                <p class="font-typewriter text-xs text-neutral-600">No reports found for this filter. The syndicate scraper is waiting for anomalies.</p>
            </section>
        `;
        return;
    }

    const lead = filtered[0];
    const rest = filtered.slice(1, 13); // max 12 secondary items
    const leadStamp = STAMPS[lead.type] || { text: 'EXTRA', class: 'bg-neutral-800 text-white' };
    const leadTime = new Date(lead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let html = `
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8 border-b-4 border-neutral-900 pb-8 mb-8">
            <div class="lg:col-span-2 border-r-0 lg:border-r border-neutral-400 lg:pr-8">
                <span class="inline-block border text-[10px] font-bold px-2 py-0.5 font-typewriter uppercase rounded tracking-wide mb-3 ${leadStamp.class}">${leadStamp.text}</span>
                <h2 class="font-retro-title text-3xl sm:text-5xl uppercase font-bold tracking-tight mb-4 text-neutral-950 leading-tight">${lead.headline}</h2>
                <div class="text-xs font-typewriter text-neutral-500 uppercase mb-4 flex justify-between">
                    <span>BY SYNDICATE INVESTIGATIVE DESK</span>
                    <span>Logged: ${leadTime} TCT</span>
                </div>
                <p class="drop-cap text-base text-neutral-800 leading-relaxed font-retro-serif text-justify">${lead.details}</p>
            </div>
            <div class="flex flex-col justify-between">
                <div class="border-2 border-neutral-950 p-2 bg-white shadow-md relative">
                    <img src="retro_illustration.png" alt="Retro Graphic" class="w-full h-auto grayscale contrast-125 border border-neutral-300">
                    <div class="text-[10px] font-typewriter mt-1.5 text-neutral-500 italic text-center">FIG. 1 - Surveillance snapshot recovered from Torn City streets.</div>
                </div>
            </div>
        </section>
    `;

    if (rest.length > 0) {
        html += `<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
        rest.forEach((story, idx) => {
            const stamp = STAMPS[story.type] || leadStamp;
            const time = new Date(story.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const liftClass = idx % 2 === 0 ? 'paper-lift' : 'paper-lift paper-lift-right';
            const detailsExcerpt = story.details.length > 180 ? story.details.substring(0, 177) + "..." : story.details;
            
            html += `
                <article class="bg-[#fdfcf9] border border-neutral-300 p-5 shadow-sm flex flex-col justify-between relative ${liftClass}">
                    <div>
                        <span class="inline-block border text-[9px] font-bold px-2 py-0.5 font-typewriter uppercase rounded tracking-wide mb-3.5 ${stamp.class}">${stamp.text}</span>
                        <h3 class="font-retro-title text-xl uppercase font-bold text-neutral-950 leading-tight mb-2">${story.headline}</h3>
                        <p class="text-xs font-retro-serif text-neutral-700 leading-relaxed text-justify mb-4">${detailsExcerpt}</p>
                    </div>
                    <div class="border-t border-neutral-200 pt-2 flex justify-between items-center text-[10px] font-typewriter text-neutral-500 mt-2">
                        <span>${time} TCT</span>
                        <span class="underline cursor-pointer" onclick="filterBy('${story.type}')">Chronicle Filter</span>
                    </div>
                </article>
            `;
        });
        html += `</section>`;
    }

    els.newsContainer.innerHTML = html;
}

// --- Event Listeners & Initialization ---

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

const engine = new ScraperEngine();

els.saveKeyBtn.addEventListener('click', () => {
    const val = els.apiKeyInput.value.trim();
    if (val.length === 16 || val.length === 0) {
        STATE.apiKey = val;
        localStorage.setItem('torn_api_key', val);
        updateStatusIndicator();
        els.settingsPanel.classList.remove('open');
        
        // Force immediate scrape
        engine.stop();
        els.newsContainer.innerHTML = `
            <div class="text-center py-20 border-b border-neutral-400">
                <span class="font-retro-title text-4xl block text-neutral-400 uppercase tracking-widest mb-4 animate-pulse">📡 RETUNING THE WIRELESS...</span>
            </div>`;
        setTimeout(() => engine.start(), 800);
    } else {
        alert("Invalid API Key length. Must be exactly 16 characters, or blank for mock mode.");
    }
});

// Boot Sequence
renderDate();
updateStatusIndicator();
engine.start();

// Seed initial mock data so the page isn't empty immediately
setTimeout(() => {
    if (STATE.newsItems.length === 0) {
        engine.triggerAlert("price_anomaly", "MARKET OPENS TO PANIC", "The Torn City stock exchange reports high volatility. Expect irregular pricing on consumables and medical supplies throughout the day.");
        renderNews();
    }
}, 300);
