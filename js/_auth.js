// Authentication logic module - Faraz
import { puterService } from '../lib/puter-service.js';

export class auth {
    constructor() {
        this.user = null;
        this.isInitialized = false;
        this.sessionTimeout = null;
    }

    async init() {
        try {
            // Initialize Puter authentication
            if (window.puter) {
                await puter.auth.init();
                
                // Check for existing session
                const existingUser = await puter.auth.getUser();
                if (existingUser) {
                    this.user = existingUser;
                    this.updateUI();
                    this.setupSessionTimeout();
                }
                
                this.isInitialized = true;
            }
        } catch (error) {
            console.error('Auth initialization failed:', error);
            this.handleAuthError(error);
        }
    }

    async signIn() {
        try {
            if (!window.puter) {
                throw new Error('Puter SDK not available');
            }

            // Show loading state
            this.showAuthLoading(true);

            // Authenticate with Puter
            await puter.auth.signIn();
            
            // Get user information
            this.user = await puter.auth.getUser();
            
            // Store session locally
            await this.storeSession();
            
            // Update UI
            this.updateUI();
            
            // Setup session timeout
            this.setupSessionTimeout();
            
            // Show success notification
            this.showNotification('Successfully signed in!', 'success');
            
            return true;
        } catch (error) {
            console.error('Sign in failed:', error);
            this.handleAuthError(error);
            return false;
        } finally {
            this.showAuthLoading(false);
        }
    }

    async signOut() {
        try {
            if (window.puter) {
                await puter.auth.signOut();
            }
            
            // Clear local session
            await this.clearSession();
            
            // Reset user state
            this.user = null;
            
            // Clear session timeout
            if (this.sessionTimeout) {
                clearTimeout(this.sessionTimeout);
                this.sessionTimeout = null;
            }
            
            // Update UI
            this.updateUI();
            
            // Show notification
            this.showNotification('Successfully signed out', 'info');
            
            return true;
        } catch (error) {
            console.error('Sign out failed:', error);
            this.showNotification('Sign out failed', 'error');
            return false;
        }
    }

    getUser() {
        return this.user;
    }

    isSignedIn() {
        return this.user !== null;
    }

    async storeSession() {
        try {
            const sessionData = {
                user: this.user,
                timestamp: Date.now()
            };
            
            // Store in Puter's secure storage
            if (window.puter) {
                await puter.kv.set('aira_session', sessionData);
            }
            
            // Also store in localStorage as backup
            localStorage.setItem('aira_session', JSON.stringify(sessionData));
        } catch (error) {
            console.error('Failed to store session:', error);
        }
    }

    async clearSession() {
        try {
            // Clear from Puter storage
            if (window.puter) {
                await puter.kv.delete('aira_session');
            }
            
            // Clear from localStorage
            localStorage.removeItem('aira_session');
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    }

    async restoreSession() {
        try {
            let sessionData = null;
            
            // Try to get from Puter storage first
            if (window.puter) {
                sessionData = await puter.kv.get('aira_session');
            }
            
            // Fallback to localStorage
            if (!sessionData) {
                const localSession = localStorage.getItem('aira_session');
                if (localSession) {
                    sessionData = JSON.parse(localSession);
                }
            }
            
            // Check if session is valid (24 hours)
            if (sessionData && (Date.now() - sessionData.timestamp) < 24 * 60 * 60 * 1000) {
                this.user = sessionData.user;
                this.setupSessionTimeout();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to restore session:', error);
            return false;
        }
    }

    setupSessionTimeout() {
        // Clear existing timeout
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }
        
        // Set new timeout for 24 hours
        this.sessionTimeout = setTimeout(async () => {
            console.log('Session expired, signing out...');
            await this.signOut();
        }, 24 * 60 * 60 * 1000);
    }

    updateUI() {
        const signInBtn = document.getElementById('sign-in-btn');
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userName = document.getElementById('user-name');
        const landingView = document.getElementById('landing-view');
        const dashboardView = document.getElementById('dashboard-view');

        if (this.isSignedIn()) {
            // Show user menu, hide sign in
            if (signInBtn) signInBtn.classList.add('hidden');
            if (userMenuBtn) userMenuBtn.classList.remove('hidden');
            
            // Update user name
            if (userName && this.user) {
                userName.textContent = this.user.username || this.user.name || 'User';
            }
            
            // Enable dashboard access
            if (landingView && dashboardView) {
                // Keep landing view visible, but enable dashboard access
                const startBtn = document.getElementById('start-analysis-btn');
                if (startBtn) {
                    startBtn.textContent = 'Go to Dashboard';
                    startBtn.innerHTML = '<i class="fas fa-tachometer-alt mr-2"></i>Go to Dashboard';
                }
            }
        } else {
            // Show sign in, hide user menu
            if (signInBtn) signInBtn.classList.remove('hidden');
            if (userMenuBtn) userMenuBtn.classList.add('hidden');
            
            // Reset user name
            if (userName) userName.textContent = 'User';
            
            // Disable dashboard access
            const startBtn = document.getElementById('start-analysis-btn');
            if (startBtn) {
                startBtn.textContent = 'Start Analysis';
                startBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Start Analysis';
            }
        }
    }

    showUserMenu() {
        // Create user menu dropdown
        const existingMenu = document.getElementById('user-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.id = 'user-menu';
        menu.className = 'absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50';
        menu.innerHTML = `
            <div class="p-4 border-b border-gray-200">
                <p class="text-sm font-medium text-gray-900">${this.user?.name || 'User'}</p>
                <p class="text-xs text-gray-500">${this.user?.email || ''}</p>
            </div>
            <div class="py-2">
                <button id="profile-btn" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <i class="fas fa-user mr-2"></i>Profile
                </button>
                <button id="settings-btn" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <i class="fas fa-cog mr-2"></i>Settings
                </button>
                <button id="sign-out-btn" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <i class="fas fa-sign-out-alt mr-2"></i>Sign Out
                </button>
            </div>
        `;

        // Position menu
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.parentElement.style.position = 'relative';
            userMenuBtn.parentElement.appendChild(menu);
        }

        // Add event listeners
        document.getElementById('sign-out-btn')?.addEventListener('click', () => {
            this.signOut();
            menu.remove();
        });

        document.getElementById('profile-btn')?.addEventListener('click', () => {
            this.showProfile();
            menu.remove();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettings();
            menu.remove();
        });

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', () => {
                menu.remove();
            }, { once: true });
        }, 100);
    }

    showProfile() {
        // Show user profile modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input type="text" value="${this.user?.name || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" readonly>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value="${this.user?.email || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" readonly>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input type="text" value="${this.user?.username || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" readonly>
                    </div>
                </div>
                <button class="w-full mt-6 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                    Close
                </button>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        modal.querySelector('button').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);
    }

    showSettings() {
        // Show settings modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">Email Notifications</label>
                        <input type="checkbox" class="toggle" checked>
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">Analysis Reports</label>
                        <input type="checkbox" class="toggle" checked>
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-gray-700">Data Sharing</label>
                        <input type="checkbox" class="toggle">
                    </div>
                </div>
                <div class="flex gap-4 mt-6">
                    <button class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button class="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                        Save
                    </button>
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        modal.querySelector('.bg-gray-200').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.bg-emerald-600').addEventListener('click', () => {
            this.showNotification('Settings saved successfully', 'success');
            modal.remove();
        });

        document.body.appendChild(modal);
    }

    showAuthLoading(show) {
        const signInBtn = document.getElementById('sign-in-btn');
        if (signInBtn) {
            if (show) {
                signInBtn.disabled = true;
                signInBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
            } else {
                signInBtn.disabled = false;
                signInBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${this.getNotificationClass(type)}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${this.getNotificationIcon(type)} mr-2"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease-out';

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    getNotificationClass(type) {
        const classes = {
            success: 'bg-emerald-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-amber-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        return classes[type] || classes.info;
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    handleAuthError(error) {
        console.error('Authentication error:', error);
        
        let message = 'Authentication failed';
        if (error.message) {
            if (error.message.includes('network')) {
                message = 'Network error. Please check your connection.';
            } else if (error.message.includes('cancelled')) {
                message = 'Sign in was cancelled.';
            } else {
                message = error.message;
            }
        }
        
        this.showNotification(message, 'error');
    }
}

// Export singleton instance
export const authInstance = new auth();
