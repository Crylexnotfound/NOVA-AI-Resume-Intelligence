// NOVA - Puter Service Layer
// Handles Authentication, AI, Database (KV) via Puter SDK

const PuterService = {
    user: null,
    initialized: false,

    async init() {
        try {
            if (!window.puter) {
                console.warn('Puter SDK not loaded yet, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1500));
                if (!window.puter) throw new Error('Puter SDK not available');
            }

            try {
                const user = await puter.auth.getUser();
                if (user) {
                    this.user = user;
                }
            } catch (e) {
                // Not authenticated yet - that's fine
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Puter init failed:', error);
            this.initialized = true;
            return false;
        }
    },

    // ---- AUTH ----
    async signIn() {
        try {
            const token = await puter.auth.signIn();
            if (token) {
                this.user = await puter.auth.getUser();
            }
            return this.user;
        } catch (error) {
            console.error('Sign in failed:', error);
            throw error;
        }
    },

    async signOut() {
        try {
            await puter.auth.signOut();
            this.user = null;
            return true;
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    },

    getUser() {
        return this.user;
    },

    isSignedIn() {
        return this.user !== null;
    },

    // ---- AI CHAT ----
    async aiChat(prompt) {
        try {
            const response = await puter.ai.chat(prompt, {
                model: 'gpt-4o'
            });

            // Handle various response formats from Puter
            if (typeof response === 'string') return response;
            if (response && response.message && response.message.content) return response.message.content;
            if (response && typeof response.text === 'string') return response.text;
            if (response && response.toString && typeof response.toString === 'function') {
                const str = response.toString();
                if (str !== '[object Object]') return str;
            }
            // If it's an object, try to get content from it
            if (response && typeof response === 'object') {
                // Some models wrap in choices array
                if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
                    return response.choices[0].message.content;
                }
                return JSON.stringify(response);
            }
            return String(response);
        } catch (error) {
            console.error('AI chat failed:', error);
            throw error;
        }
    },

    // ---- KV STORAGE ----
    async kvSet(key, value) {
        try {
            const data = typeof value === 'string' ? value : JSON.stringify(value);
            await puter.kv.set(key, data);
            return true;
        } catch (error) {
            console.error('KV set failed:', error);
            return false;
        }
    },

    async kvGet(key) {
        try {
            const value = await puter.kv.get(key);
            if (!value) return null;
            try { return JSON.parse(value); } catch { return value; }
        } catch (error) {
            console.error('KV get failed:', error);
            return null;
        }
    },

    async kvDelete(key) {
        try {
            await puter.kv.del(key);
            return true;
        } catch (error) {
            console.error('KV delete failed:', error);
            return false;
        }
    },

    // ---- HISTORY ----
    async saveAnalysis(data) {
        try {
            const history = (await this.kvGet('nova_history')) || [];
            history.unshift({
                id: Date.now(),
                timestamp: new Date().toISOString(),
                fileName: data.fileName,
                atsScore: data.atsScore,
                mode: data.mode
            });
            await this.kvSet('nova_history', history.slice(0, 20));
            return true;
        } catch (error) {
            console.error('Save analysis failed:', error);
            return false;
        }
    },

    async getHistory() {
        return (await this.kvGet('nova_history')) || [];
    }
};
