// NOVA - Authentication Module
// Depends on: PuterService, Visuals, app (global)
// Manages the sign-in/out flow and updates the navbar UI to reflect auth state

const Auth = {

    // Updates the navbar to show either the "Get Started" button (unauthenticated)
    // or the user pill with avatar and name (authenticated)
    // Called after init(), after sign-in, and after sign-out
    updateUI() {
        const authBtn = document.getElementById('auth-btn');
        const userPill = document.getElementById('user-pill');
        const user = PuterService.getUser();

        if (user) {
            // User is signed in — hide the CTA button, show the user pill
            if (authBtn) authBtn.classList.add('hidden');
            if (userPill) userPill.classList.remove('hidden');

            // Get the first letter of the username for the avatar circle
            const initial = (user.username || user.name || 'U')[0].toUpperCase();
            const name = user.username || user.name || 'User';

            const setText = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            };

            // Update all places where the user's identity is displayed
            setText('user-avatar', initial);           // Navbar pill avatar
            setText('user-display-name', name);        // Navbar pill name
            setText('dropdown-avatar', initial);       // Dropdown header avatar
            setText('dropdown-name', name);            // Dropdown header name
            setText('dropdown-email', user.email || ''); // Dropdown email
        } else {
            // User is not signed in — show the CTA button, hide the user pill
            if (authBtn) authBtn.classList.remove('hidden');
            if (userPill) userPill.classList.add('hidden');
        }
    },

    // Handles the "Get Started" button click
    // If already signed in: goes directly to dashboard
    // If not signed in: opens Puter sign-in popup, then goes to dashboard on success
    async handleAuth() {
        if (PuterService.isSignedIn()) {
            app.showDashboard();
        } else {
            try {
                await PuterService.signIn(); // Opens OAuth popup
                this.updateUI();             // Update navbar to show user pill
                Visuals.toast('Welcome to NOVA!', 'success');
                app.showDashboard();         // Navigate to the upload dashboard
            } catch (err) {
                // User cancelled the popup — don't show an error
                if (err.message && err.message.includes('cancel')) return;
                Visuals.toast('Sign in failed. Try again.', 'error');
            }
        }
    },

    // Signs the user out, updates UI, closes dropdown, and returns to landing page
    async signOut() {
        try {
            await PuterService.signOut();
            this.updateUI();      // Revert navbar to unauthenticated state
            app.closeDropdown();  // Close the user dropdown if open
            app.goHome();         // Scroll back to hero section
            Visuals.toast('Signed out', 'info');
        } catch (err) {
            Visuals.toast('Sign out failed', 'error');
        }
    }
};