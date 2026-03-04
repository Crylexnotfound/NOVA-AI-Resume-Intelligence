// NOVA - Main Application Orchestrator
// Thin coordinator — initialises Landing and Upload modules in the correct order.
// Exposes window.app for inline HTML event handlers.

var app = {
    dropdownOpen: false,

    // ---- INITIALISATION ----
    init: async function () {
        console.log('NOVA App initializing...');
        window.onerror = function (msg, url, line, col, error) {
            console.error('GLOBAL ERROR:', msg, 'at', url, 'line', line);
            return false;
        };

        try {
            await PuterService.init();   // Wait for Puter SDK, silently check auth
            Auth.updateUI();             // Show user pill if already signed in
            Landing.init();             // Hero, scroll animations, navigation
            Upload.init();              // File listeners, preferences
            this.initDropdownListeners();

            setTimeout(function () {
                var ls = document.getElementById('loading-screen');
                if (ls) ls.classList.add('hide');
            }, 2200);

            console.log('NOVA App initialized successfully');
        } catch (err) {
            console.error('Initialization failed:', err);
        }
    },

    // ---- USER DROPDOWN ----
    initDropdownListeners: function () {
        document.addEventListener('click', function (e) {
            var pill = document.getElementById('user-pill');
            var dropdown = document.getElementById('user-dropdown');
            if (app.dropdownOpen && pill && !pill.contains(e.target) && dropdown && !dropdown.contains(e.target)) {
                app.closeDropdown();
            }
        });
        var pill = document.getElementById('user-pill');
        if (pill) pill.addEventListener('click', function (e) { e.stopPropagation(); app.toggleDropdown(); });
    },

    toggleDropdown: function () {
        var dropdown = document.getElementById('user-dropdown');
        if (this.dropdownOpen) { this.closeDropdown(); }
        else { if (dropdown) dropdown.classList.remove('hidden'); this.dropdownOpen = true; }
    },

    closeDropdown: function () {
        var dd = document.getElementById('user-dropdown');
        if (dd) dd.classList.add('hidden');
        this.dropdownOpen = false;
    },

    // ---- DELEGATES ----
    // Auth
    handleAuth: function () { Auth.handleAuth(); },
    signOut: function () { Auth.signOut(); },

    // Landing
    goHome: function () { Landing.goHome(); },
    showDashboard: function () { Landing.showDashboard(); },
    startAnalysis: function () { Landing.startAnalysis(); },
    toggleMobileMenu: function () { Landing.toggleMobileMenu(); },

    // Upload
    handleFile: function (file) { Upload.handleFile(file); },
    removeFile: function () { Upload.removeFile(); },
    selectMode: function (el) { Upload.selectMode(el); },
    analyzeResume: function () { Upload.analyzeResume(); },
    reAnalyze: function () { Upload.reAnalyze(); },
    exportPDF: function () { Upload.exportPDF(); },
    switchTab: function (el) { Upload.switchTab(el); },
    generateCoverLetter: function () { Upload.generateCoverLetter(); },
    copyCoverLetter: function () { Upload.copyCoverLetter(); },
    selectTemplate: function (el) { Upload.selectTemplate(el); },
    selectPalette: function (el) { Upload.selectPalette(el); },
    generateNewResume: function () { Upload.generateNewResume(); },
    downloadResumePDF: function () { Upload.downloadResumePDF(); },
    sendChat: function () { Upload.sendChat(); },
    loadLiveJobs: function () { Upload.loadLiveJobs(); },
    findMoreJobs: function () { Upload.findMoreJobs(); },
    searchExternal: function (platform) { Upload.searchExternal(platform); },
    showHistory: function () { Upload.showHistory(); },
    showSettings: function () { Visuals.toast('Settings coming soon', 'info'); }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { app.init(); });
} else {
    app.init();
}

window.app = app;