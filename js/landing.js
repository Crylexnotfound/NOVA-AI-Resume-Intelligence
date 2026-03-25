// NOVA - Landing Page Module
// Handles all logic scoped to the public landing page:
//   - Hero animations (Three.js orb, parallax card stack)
//   - Scroll-triggered [data-animate] visibility toggling
//   - Navbar scroll behaviour
//   - Smooth-scroll navigation
//   - Feature card interactions
//   - Hero stats counter animation
//   - Mobile menu toggle
//   - Navigation between landing and dashboard views
//
// Depends on: Visuals (visuals.js), PuterService (puter-service.js), Auth (auth.js)
// Exposes: window.Landing

var Landing = {

    // ---- INITIALISATION ----
    // Called once from app.init() after PuterService and Auth are ready.
    // Sets up every visual and interactive system that belongs to the landing page.
    init: function () {
        Visuals.initCursor();            // Custom dot + ring cursor
        Visuals.initScrollAnimations();  // Fade-up on scroll for [data-animate] elements
        Visuals.initNavbar();            // Darken navbar when scrollY > 50
        Visuals.initHeroOrb();           // Three.js rotating particle sphere
        Visuals.initHeroParallax();      // 3D perspective tilt on the hero card stack
        Visuals.animateCounters();       // Count-up animation for hero stats

        this._initFeatureCards();        // Hover interactions on feature cards
        this._initSmoothScrollLinks();   // Smooth-scroll for in-page anchor links
    },

    // ---- FEATURE CARD INTERACTIONS ----
    // Adds a subtle tilt effect to feature cards on mouse move.
    // This is purely cosmetic — no state changes.
    _initFeatureCards: function () {
        document.querySelectorAll('.feature-card').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 to 0.5
                var y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = 'translateY(-4px) rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 6) + 'deg)';
            });
            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
            });
        });
    },

    // ---- SMOOTH SCROLL ----
    // Intercepts clicks on anchor links that point to in-page sections
    // and replaces the default jump with a smooth scroll.
    _initSmoothScrollLinks: function () {
        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    },

    // ---- MOBILE MENU ----
    // Toggles the mobile navigation dropdown open/closed.
    // Called by the hamburger button in the navbar.
    toggleMobileMenu: function () {
        var mm = document.getElementById('mobile-menu');
        if (mm) mm.classList.toggle('open');
    },

    // ---- NAVIGATION ----

    // Returns to the landing page from the dashboard.
    // Shows: hero, features, process, CTA, footer.
    // Hides: dashboard section.
    goHome: function () {
        var hero = document.getElementById('hero');
        if (hero) hero.classList.remove('hidden');

        // Restore all landing page sections
        document.querySelectorAll('.features-section, .process-section, .cta-section, .footer')
            .forEach(function (s) { s.classList.remove('hidden'); });

        // Hide the dashboard
        var dash = document.getElementById('dashboard');
        if (dash) dash.classList.add('hidden');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Shows the authenticated dashboard.
    // Hides: hero, features, process, CTA.
    // Shows: dashboard section.
    // Requires authentication — redirects to sign-in if not signed in.
    showDashboard: function () {
        if (!PuterService.isSignedIn()) {
            Auth.handleAuth();
            return;
        }

        // Hide landing page sections
        var hero = document.getElementById('hero');
        if (hero) hero.classList.add('hidden');

        document.querySelectorAll('.features-section, .process-section, .cta-section')
            .forEach(function (s) { s.classList.add('hidden'); });

        // Show dashboard
        var dash = document.getElementById('dashboard');
        if (dash) dash.classList.remove('hidden');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Entry point for the "Get Started" / "Launch Analysis" / "Start Free Analysis" buttons.
    // Requires authentication before proceeding to the dashboard.
    startAnalysis: function () {
        if (!PuterService.isSignedIn()) {
            Auth.handleAuth();
            return;
        }
        this.showDashboard();
    }
};

window.Landing = Landing;
