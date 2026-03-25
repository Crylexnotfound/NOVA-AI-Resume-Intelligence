// NOVA - Authentication Module

const Auth = {
    updateUI() {
        const authBtn = document.getElementById('auth-btn');
        const userPill = document.getElementById('user-pill');
        const user = PuterService.getUser();

        if (user) {
            if (authBtn) authBtn.classList.add('hidden');
            if (userPill) userPill.classList.remove('hidden');

            const initial = (user.username || user.name || 'U')[0].toUpperCase();
            const name = user.username || user.name || 'User';

            const setText = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            };

            setText('user-avatar', initial);
            setText('user-display-name', name);
            setText('dropdown-avatar', initial);
            setText('dropdown-name', name);
            setText('dropdown-email', user.email || '');
        } else {
            if (authBtn) authBtn.classList.remove('hidden');
            if (userPill) userPill.classList.add('hidden');
        }
    },

    async handleAuth() {
        if (PuterService.isSignedIn()) {
            app.showDashboard();
        } else {
            try {
                await PuterService.signIn();
                this.updateUI();
                Visuals.toast('Welcome to NOVA!', 'success');
                app.showDashboard();
            } catch (err) {
                if (err.message && err.message.includes('cancel')) return;
                Visuals.toast('Sign in failed. Try again.', 'error');
            }
        }
    },

    async signOut() {
        try {
            await PuterService.signOut();
            this.updateUI();
            app.closeDropdown();
            app.goHome();
            Visuals.toast('Signed out', 'info');
        } catch (err) {
            Visuals.toast('Sign out failed', 'error');
        }
    }
};
