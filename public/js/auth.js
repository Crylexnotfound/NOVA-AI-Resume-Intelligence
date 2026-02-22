// Authentication module using Puter
class Auth {
    constructor() {
        this.user = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Initialize Puter
            if (window.puter) {
                await puter.auth.init();
                this.user = await puter.auth.getUser();
                this.isInitialized = true;
                this.updateUI();
            }
        } catch (error) {
            console.error('Auth initialization failed:', error);
        }
    }

    async signIn() {
        try {
            if (window.puter) {
                await puter.auth.signIn();
                this.user = await puter.auth.getUser();
                this.updateUI();
                return true;
            }
        } catch (error) {
            console.error('Sign in failed:', error);
            return false;
        }
    }

    async signOut() {
        try {
            if (window.puter) {
                await puter.auth.signOut();
                this.user = null;
                this.updateUI();
                return true;
            }
        } catch (error) {
            console.error('Sign out failed:', error);
            return false;
        }
    }

    getUser() {
        return this.user;
    }

    isSignedIn() {
        return this.user !== null;
    }

    updateUI() {
        const landingView = document.getElementById('landing-view');
        const dashboardView = document.getElementById('dashboard-view');
        const signInBtn = document.getElementById('sign-in-btn');
        const signOutBtn = document.getElementById('sign-out-btn');
        const userName = document.getElementById('user-name');

        if (this.isSignedIn()) {
            // Show dashboard
            if (landingView) landingView.classList.add('hidden');
            if (dashboardView) dashboardView.classList.remove('hidden');
            if (signInBtn) signInBtn.classList.add('hidden');
            if (signOutBtn) signOutBtn.classList.remove('hidden');
            if (userName && this.user) userName.textContent = this.user.username || this.user.name || 'User';
        } else {
            // Show landing
            if (landingView) landingView.classList.remove('hidden');
            if (dashboardView) dashboardView.classList.add('hidden');
            if (signInBtn) signInBtn.classList.remove('hidden');
            if (signOutBtn) signOutBtn.classList.add('hidden');
        }
    }
}

// Export for use in other modules
window.auth = new Auth();
