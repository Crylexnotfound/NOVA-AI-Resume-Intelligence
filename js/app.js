console.log('app.js script loaded');
// NOVA - Main Application Orchestrator
// Thin coordinator that initialises all modules in the correct order and
// exposes a single global `app` object for inline HTML event handlers.
//
// Module responsibilities:
//   Landing     (js/landing.js)      — hero, scroll animations, navbar, navigation
//   Upload      (js/upload.js)       — file upload, file handling, mode selection
//   Analysis    (js/analysis.js)      — resume analysis, results rendering
//   CoverLetter (js/coverLetter.js)   — cover letter generation
//   Jobs        (js/jobs.js)         — job search and listings
//   ResumeGen   (js/resumeGen.js)    — resume generation and PDF export
//   Chat        (js/chat.js)         — AI coach chat
//   Career      (js/career.js)       — career prediction and roast
//   Auth        (js/auth.js)         — sign-in / sign-out via Puter
//   Visuals     (js/visuals.js)      — cursor, Three.js orb, toasts, overlays
//   Helpers     (js/helpers.js)       — pure utility functions
//   Parser      (js/parser.js)        — PDF text extraction and file validation
//   Prompts     (js/prompts.js)       — AI prompt templates

var app = {
    dropdownOpen: false, // Tracks whether the user account dropdown is open

    // ---- INITIALISATION ----
    // Called automatically on DOMContentLoaded (see bottom of file).
    // Initialises Puter, then delegates to all modules.
    init: async function () {
        console.log('NOVA App initializing...');

        // Global error handler — logs uncaught errors to the console
        window.onerror = function (msg, url, line, col, error) {
            console.error('GLOBAL ERROR:', msg, 'at', url, 'line', line);
            return false;
        };

        try {
            // Initialise the Puter SDK — waits for window.puter, silently checks auth
            await PuterService.init();

            // Update the navbar to show the user pill if already signed in
            Auth.updateUI();

            // Initialise all modules
            Landing.init();         // Landing page visuals
            Upload.init();          // File upload handling
            Analysis.init();        // Analysis module
            CoverLetter.init();     // Cover letter module
            Jobs.init();            // Jobs module
            ResumeGen.init();       // Resume generation module
            Chat.init();            // Chat module
            Career.init();          // Career module

            // Set up the user dropdown click-outside-to-close behaviour
            this.initDropdownListeners();

            // Hide the loading screen after 2.2 seconds
            // (gives fonts and Three.js time to render before revealing the page)
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

    // Wires up the click-outside-to-close behaviour for the user dropdown.
    initDropdownListeners: function () {
        document.addEventListener('click', function (e) {
            var pill = document.getElementById('user-pill');
            var dropdown = document.getElementById('user-dropdown');
            if (app.dropdownOpen && pill && !pill.contains(e.target) && dropdown && !dropdown.contains(e.target)) {
                app.closeDropdown();
            }
        });

        var pill = document.getElementById('user-pill');
        if (pill) {
            pill.addEventListener('click', function (e) {
                e.stopPropagation();
                app.toggleDropdown();
            });
        }
    },

    toggleDropdown: function () {
        var dropdown = document.getElementById('user-dropdown');
        if (this.dropdownOpen) {
            this.closeDropdown();
        } else {
            if (dropdown) dropdown.classList.remove('hidden');
            this.dropdownOpen = true;
        }
    },

    closeDropdown: function () {
        var dd = document.getElementById('user-dropdown');
        if (dd) dd.classList.add('hidden');
        this.dropdownOpen = false;
    },

    // ---- AUTH WRAPPERS ----
    // Thin delegates to Auth module — kept on app so inline HTML handlers work.
    handleAuth: function () { Auth.handleAuth(); },
    signOut: function () { Auth.signOut(); },

    // ---- NAVIGATION DELEGATES ----
    // Thin delegates to Landing module — kept on app so inline HTML handlers work.
    goHome: function () { Landing.goHome(); },
    showDashboard: function () { Landing.showDashboard(); },
    startAnalysis: function () { Landing.startAnalysis(); },
    toggleMobileMenu: function () { Landing.toggleMobileMenu(); },

    // ---- UPLOAD DELEGATES ----
    // Thin delegates to Upload module — kept on app so inline HTML handlers work.
    handleFile: function (file) { Upload.handleFile(file); },
    removeFile: function () { Upload.removeFile(); },
    selectMode: function (el) { Upload.selectMode(el); },

    // ---- ANALYSIS DELEGATES ----
    analyzeResume: function () { Analysis.analyzeResume(); },
    reAnalyze: function () { Analysis.reAnalyze(); },
    exportPDF: function () { Analysis.exportPDF(); },
    switchTab: function (el) { Analysis.switchTab(el); },

    // ---- COVER LETTER DELEGATES ----
    generateCoverLetter: function () { CoverLetter.generateCoverLetter(); },
    copyCoverLetter: function () { CoverLetter.copyCoverLetter(); },

    // ---- JOBS DELEGATES ----
    loadLiveJobs: function () { Jobs.loadLiveJobs(); },
    findMoreJobs: function () { Jobs.findMoreJobs(); },
    searchExternal: function (platform) { Jobs.searchExternal(platform); },

    // ---- RESUME GENERATION DELEGATES ----
    selectTemplate: function (el) { ResumeGen.selectTemplate(el); },
    selectPalette: function (el) { ResumeGen.selectPalette(el); },
    generateNewResume: function () { ResumeGen.generateNewResume(); },
    downloadResumePDF: function () { ResumeGen.downloadResumePDF(); },

    // ---- CHAT DELEGATES ----
    sendChat: function () { Chat.sendChat(); },

    // ---- HISTORY ----
    showHistory: function () { Upload.showHistory(); },

    // ---- SETTINGS ----
    showSettings: function () { Visuals.toast('Settings coming soon', 'info'); }
};

// ---- BOOTSTRAP ----
// Start the app when the DOM is ready.
// Uses readyState check to handle both cases:
//   - Script loads before DOM is ready: wait for DOMContentLoaded
//   - Script loads after DOM is ready (e.g. deferred): call init() immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { app.init(); });
} else {
    app.init();
}

window.app = app;
