// PvP Coinflip Manager
class PvPCoinflip {
    constructor() {
        this.lobbies = [];
        this.setupSocket();
        this.setupUI();
    }

    setupSocket() {
        if (!api.sessionToken) return;
        
        // Connect Socket.io
        this.socket = io(CONFIG.BACKEND_URL, {
            auth: { token: api.sessionToken }
        });

        this.socket.on('connect', () => {
            console.log('Connected to PvP server');
        });

        this.socket.on('error', (msg) => {
            alert(msg);
        });

        this.socket.on('lobbies_update', (lobbies) => {
            this.lobbies = lobbies;
            this.renderLobbies();
        });

        this.socket.on('coinflip_result', (result) => {
            // Show result modal or notification
            const amIWinner = result.winnerId === ui.userInfo?.id;
            const amILoser = (result.creatorId === ui.userInfo?.id || result.joinerId === ui.userInfo?.id) && !amIWinner;
            
            if (amIWinner) {
                alert(`🎉 You won the Coinflip against ${result.creatorId === ui.userInfo?.id ? result.joiner : result.creator}! Payout: $${result.payout}`);
                api.getMoney().then(() => ui.updateBalance());
            } else if (amILoser) {
                alert(`💀 You lost the Coinflip against ${result.creatorId === ui.userInfo?.id ? result.joiner : result.creator}. Better luck next time.`);
            }
            
            this.lobbies = this.lobbies.filter(l => l.id !== result.id);
            this.renderLobbies();
        });

        // Chat Events
        this.socket.on('chat_history', (history) => {
            const container = document.getElementById('chatMessages');
            if (container) {
                container.innerHTML = history.map(msg => this.formatChatMessage(msg)).join('');
                container.scrollTop = container.scrollHeight;
            }
        });

        this.socket.on('new_chat_message', (msg) => {
            const container = document.getElementById('chatMessages');
            if (container) {
                container.innerHTML += this.formatChatMessage(msg);
                container.scrollTop = container.scrollHeight;
            }
        });
    }

    formatChatMessage(msg) {
        return `<div style="margin-bottom: 5px;">
            <strong style="color: var(--primary);">${msg.user}:</strong> 
            <span style="color: var(--text);">${this.escapeHTML(msg.text)}</span>
        </div>`;
    }

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    setupUI() {
        document.getElementById('createCoinflipBtn')?.addEventListener('click', () => {
            const amount = parseInt(document.getElementById('coinflipAmount').value);
            const side = document.getElementById('coinflipSide').value;
            
            if (amount < 1) {
                alert("Amount must be positive");
                return;
            }
            
            this.socket.emit('create_coinflip', { amount, side });
        });
    }

    joinLobby(id) {
        this.socket.emit('join_coinflip', id);
    }

    renderLobbies() {
        const container = document.getElementById('pvp-lobbies-list');
        if (!container) return;

        if (this.lobbies.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary)">No open lobbies. Create one!</p>';
            return;
        }

        container.innerHTML = this.lobbies.filter(l => l.status === 'waiting').map(lobby => `
            <div class="pvp-lobby-card" style="background: var(--card-bg); padding: 15px; margin-bottom: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${lobby.creator}</strong> is betting <strong>$${lobby.amount.toLocaleString()}</strong> on <strong>${lobby.side.toUpperCase()}</strong>
                </div>
                ${lobby.creator !== ui.userInfo?.name ? 
                    `<button class="btn btn-primary btn-small" onclick="window.pvpCoinflip.joinLobby('${lobby.id}')">Join & Flip (${lobby.side === 'heads' ? 'Tails' : 'Heads'})</button>` 
                    : 
                    `<span style="color: var(--primary);">Waiting for opponent...</span>`
                }
            </div>
        `).join('');
    }
}

window.PvPCoinflip = PvPCoinflip;
