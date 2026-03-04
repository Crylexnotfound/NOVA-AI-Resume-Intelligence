// NOVA - Puter Service Layer
// Wraps the Puter SDK (window.puter) to provide:
//   - Authentication (sign in / sign out / get user)
//   - AI chat via GPT-4o (free via Puter)
//   - Key-Value storage for saving analysis history
// All methods are async and handle errors gracefully.

const PuterService = {
    user: null,         // Stores the authenticated user object (or null if not signed in)
    initialized: false, // Tracks whether init() has completed

    // ---- INITIALIZATION ----
    // Called once during app.init()
    // Waits for window.puter to be available (SDK loads asynchronously)
    // Attempts to get the current user silently — no popup if not signed in
    async init() {
        try {
            if (!window.puter) {
                // SDK may not have loaded yet — wait 1.5s and retry once
                console.warn('Puter SDK not loaded yet, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1500));
                if (!window.puter) throw new Error('Puter SDK not available');
            }

            try {
                // getUser() returns the signed-in user or throws if not authenticated
                const user = await puter.auth.getUser();
                if (user) {
                    this.user = user; // Cache user object for isSignedIn() checks
                }
            } catch (e) {
                // Not authenticated yet — this is expected on first visit, not an error
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Puter init failed:', error);
            this.initialized = true; // Mark as initialized even on failure so app continues
            return false;
        }
    },

    // ---- AUTHENTICATION ----

    // Opens the Puter sign-in popup
    // Returns the user object on success, throws on failure
    async signIn() {
        try {
            const token = await puter.auth.signIn(); // Opens OAuth popup
            if (token) {
                this.user = await puter.auth.getUser(); // Fetch user details after sign-in
            }
            return this.user;
        } catch (error) {
            console.error('Sign in failed:', error);
            throw error; // Re-throw so Auth.handleAuth() can catch and show toast
        }
    },

    // Signs the user out and clears the cached user object
    async signOut() {
        try {
            await puter.auth.signOut();
            this.user = null; // Clear cached user
            return true;
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    },

    // Returns the cached user object (null if not signed in)
    getUser() {
        return this.user;
    },

    // Returns true if a user is currently signed in
    isSignedIn() {
        return this.user !== null;
    },

    // ---- AI CHAT ----
    // Sends a prompt to GPT-4o via Puter's free AI service
    // Handles multiple response formats that Puter may return
    async aiChat(prompt) {
        try {
            const response = await puter.ai.chat(prompt, {
                model: 'gpt-4o' // Use GPT-4o — Puter provides this for free
            });

            // Puter can return the response in several formats depending on the model/version
            // We normalize all of them to a plain string:

            if (typeof response === 'string') return response;

            // Standard OpenAI-style response object
            if (response && response.message && response.message.content)
                return response.message.content;

            // Some Puter versions return a .text property
            if (response && typeof response.text === 'string') return response.text;

            // Try toString() — some proxy objects stringify correctly
            if (response && response.toString && typeof response.toString === 'function') {
                const str = response.toString();
                if (str !== '[object Object]') return str;
            }

            // OpenAI choices array format
            if (response && typeof response === 'object') {
                if (response.choices && response.choices[0] &&
                    response.choices[0].message && response.choices[0].message.content) {
                    return response.choices[0].message.content;
                }
                // Last resort — stringify the whole object
                return JSON.stringify(response);
            }

            return String(response);
        } catch (error) {
            console.error('AI chat failed:', error);
            throw error; // Re-throw so app.analyzeResume() can catch and show error toast
        }
    },

    // ---- KV STORAGE ----
    // Puter provides a simple key-value store per user — used to save analysis history

    // Saves a value to KV storage
    // Automatically JSON-stringifies objects
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

    // Retrieves a value from KV storage
    // Automatically JSON-parses if the value is valid JSON
    async kvGet(key) {
        try {
            const value = await puter.kv.get(key);
            if (!value) return null;
            try { return JSON.parse(value); } catch { return value; } // Return raw string if not JSON
        } catch (error) {
            console.error('KV get failed:', error);
            return null;
        }
    },

    // Deletes a key from KV storage
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
    // Saves a summary of an analysis to the user's history (max 20 entries)
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
            // Keep only the 20 most recent analyses
            await this.kvSet('nova_history', history.slice(0, 20));
            return true;
        } catch (error) {
            console.error('Save analysis failed:', error);
            return false;
        }
    },

    // Returns the user's analysis history array (or empty array if none)
    async getHistory() {
        return (await this.kvGet('nova_history')) || [];
    }
};