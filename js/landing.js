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
    init: function () {
        Visuals.initCursor();            // Custom dot + ring cursor
        Visuals.initScrollAnimations();  // Fade-up on scroll for [data-animate] elements
        Visuals.initNavbar();            // Darken navbar when scrollY > 50
        Visuals.initHeroOrb();           // Three.js rotating particle sphere
        Visuals.initHeroParallax();      // 3D perspective tilt on the hero card stack
        Visuals.animateCounters();       // Count-up animation for hero stats

        this._initFeatureCards();        // Hover tilt interactions on feature cards
        this._initSmoothScrollLinks();   // Smooth-scroll for in-page anchor links
    },

    // Adds a subtle 3D tilt effect to feature cards on mouse move
    _initFeatureCards: function () {
        document.querySelectorAll('.feature-card').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width - 0.5;
                var y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = 'translateY(-4px) rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 6) + 'deg)';
            });
            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
            });
        });
    },

    // Intercepts clicks on anchor links and replaces the default jump with smooth scroll
    _initSmoothScrollLinks: function () {
        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var href = link.getAttribute('href');
                if (!href || href === '#') return; // Skip bare '#' links
                try {
                    var target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                } catch (err) { /* invalid selector, ignore */ }
            });
        });
    },

    // Toggles the mobile navigation dropdown open/closed
    toggleMobileMenu: function () {
        var mm = document.getElementById('mobile-menu');
        if (mm) mm.classList.toggle('open');
    },

    // Returns to the landing page — shows hero/features/process/CTA, hides dashboard
    goHome: function () {
        var hero = document.getElementById('hero');
        if (hero) hero.classList.remove('hidden');
        document.querySelectorAll('.features-section, .process-section, .cta-section, .footer')
            .forEach(function (s) { s.classList.remove('hidden'); });
        var dash = document.getElementById('dashboard');
        if (dash) dash.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Shows the authenticated dashboard — requires sign-in
    showDashboard: function () {
        if (!PuterService.isSignedIn()) { Auth.handleAuth(); return; }
        var hero = document.getElementById('hero');
        if (hero) hero.classList.add('hidden');
        document.querySelectorAll('.features-section, .process-section, .cta-section')
            .forEach(function (s) { s.classList.add('hidden'); });
        var dash = document.getElementById('dashboard');
        if (dash) dash.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Entry point for CTA buttons — requires auth before proceeding
    startAnalysis: function () {
        if (!PuterService.isSignedIn()) { Auth.handleAuth(); return; }
        this.showDashboard();
    }
};

window.Landing = Landing;