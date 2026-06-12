// Main Application
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem(CONFIG.STORAGE_KEY_USER);
    
    if (savedUser) {
        try {
            const userInfo = JSON.parse(savedUser);
            
            // Restore API key and validate session
            if (api.restoreSession()) {
                // Validate that the stored API key is still valid
                const isValid = await api.isSessionValid();
                if (isValid) {
                    console.log('✅ Session restored:', userInfo.name);
                    ui.showCasino(userInfo);
                } else {
                    console.warn('⚠️ Stored session is no longer valid');
                    api.clearAllData();
                    ui.showAuth();
                }
            } else {
                // No API key found, show login
                ui.showAuth();
            }
        } catch (error) {
            console.error('Failed to restore user session:', error);
            ui.showAuth();
        }
    } else {
        ui.showAuth();
    }
});

// Add a select element for Keno if it doesn't exist
if (!document.querySelector('select.input')) {
    const style = document.createElement('style');
    style.textContent = `
        select.input {
            padding: 10px;
            background: var(--dark-bg);
            border: 2px solid var(--border);
            color: var(--text);
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
        }
        select.input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }
    `;
    document.head.appendChild(style);
}

console.log('🎰 Casino loaded successfully!');
