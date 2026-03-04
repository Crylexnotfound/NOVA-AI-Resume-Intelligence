// NOVA - Visuals & Animations Module
// Depends on: THREE (loaded from CDN), Helpers
// Provides all visual effects for the landing page and upload UI

const Visuals = {

    // ---- CUSTOM CURSOR ----
    // Replaces the default browser cursor with a custom dot + ring
    // The ring follows the dot with a smooth lag effect using requestAnimationFrame
    // On touch devices, the custom cursor is hidden and default cursor is restored
    initCursor() {
        const cursor = document.getElementById('cursor');
        const follower = document.getElementById('cursor-follower');
        if (!cursor || !follower) return;

        // Disable custom cursor on touch devices (phones/tablets)
        if ('ontouchstart' in window) {
            cursor.style.display = 'none';
            follower.style.display = 'none';
            document.body.style.cursor = 'auto';
            return;
        }

        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;

        // Move the dot cursor instantly to mouse position
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX - 4 + 'px'; // -4 to center the 8px dot
            cursor.style.top = mouseY - 4 + 'px';
        });

        // Animate the follower ring with lerp (linear interpolation) for smooth lag
        const animateFollower = () => {
            followerX += (mouseX - followerX) * 0.12; // 12% of distance per frame
            followerY += (mouseY - followerY) * 0.12;
            follower.style.left = followerX - 18 + 'px'; // -18 to center the 36px ring
            follower.style.top = followerY - 18 + 'px';
            requestAnimationFrame(animateFollower);
        };
        animateFollower();
    },

    // ---- SCROLL ANIMATIONS ----
    // Uses IntersectionObserver to trigger fade-up animations on elements
    // with data-animate attribute when they scroll into view
    // data-delay attribute (in ms) staggers animations within a group
    initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible'); // CSS handles the animation
                    }, parseInt(delay));
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% of element is visible

        document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    },

    // ---- NAVBAR ----
    // Adds "scrolled" class to navbar when user scrolls past 50px
    // CSS uses this to darken the navbar background for better readability
    initNavbar() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    },

    // ---- HERO ORB (Three.js) ----
    // Renders a rotating sphere of 2000 violet/cyan particles behind the hero section
    // Particles respond to mouse movement — sphere tilts toward cursor
    initHeroOrb() {
        const canvas = document.getElementById('hero-orb');
        if (!canvas || typeof THREE === 'undefined') return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance

        // Create 2000 particles distributed on a sphere surface
        const geometry = new THREE.BufferGeometry();
        const count = 2000;
        const posArray = new Float32Array(count * 3);   // x,y,z for each particle
        const colorArray = new Float32Array(count * 3); // r,g,b for each particle

        const color1 = new THREE.Color('#8B5CF6'); // Violet
        const color2 = new THREE.Color('#06B6D4'); // Cyan

        for (let i = 0; i < count * 3; i += 3) {
            // Spherical coordinates → Cartesian for uniform sphere distribution
            const r = 3.5 + Math.random() * 1.5; // Radius between 3.5 and 5
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1); // Uniform distribution on sphere

            posArray[i] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            posArray[i + 2] = r * Math.cos(phi);

            // Randomly assign violet or cyan color to each particle
            const mixedColor = Math.random() > 0.5 ? color1 : color2;
            colorArray[i] = mixedColor.r;
            colorArray[i + 1] = mixedColor.g;
            colorArray[i + 2] = mixedColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const material = new THREE.PointsMaterial({
            size: 0.03,
            vertexColors: true,       // Use per-particle colors
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending // Particles add light — brighter where they overlap
        });

        const sphere = new THREE.Points(geometry, material);
        scene.add(sphere);
        camera.position.z = 8;

        // Track mouse position for interactive rotation
        let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);
        });

        const animate = () => {
            // Lerp toward mouse position for smooth interactive rotation
            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;

            sphere.rotation.y += 0.002; // Constant slow rotation
            sphere.rotation.x += 0.001;

            // Additional rotation toward mouse — 5% of remaining distance per frame
            sphere.rotation.y += 0.05 * (targetX - sphere.rotation.y);
            sphere.rotation.x += 0.05 * (targetY - sphere.rotation.x);

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        // Update camera and renderer on window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    },

    // ---- HERO CARD PARALLAX ----
    // Applies a 3D perspective tilt to the hero card stack based on mouse position
    // Creates a subtle depth effect as the user moves their cursor
    initHeroParallax() {
        const stack = document.querySelector('.hero-card-stack');
        if (!stack) return;
        let tx = 0, ty = 0, cx = 0, cy = 0;

        document.addEventListener('mousemove', (e) => {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            // Normalize mouse position to -10 to +10 range
            cx = (e.clientX / vw - 0.5) * 20;
            cy = (e.clientY / vh - 0.5) * 20;
        });

        const animate = () => {
            tx += (cx - tx) * 0.06; // Smooth lerp — 6% per frame
            ty += (cy - ty) * 0.06;
            // Apply 3D perspective transform — half the rotation for subtle effect
            stack.style.transform =
                `perspective(800px) rotateY(${tx * 0.5}deg) rotateX(${-ty * 0.5}deg) translate3d(${tx}px, ${ty}px, 0)`;
            requestAnimationFrame(animate);
        };
        animate();
    },

    // ---- COUNTER ANIMATION ----
    // Animates number counters from 0 to their target value when scrolled into view
    // Elements must have data-count="<target>" attribute
    animateCounters() {
        const counters = document.querySelectorAll('[data-count]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count);
                    let current = 0;
                    const step = target / 60; // Reach target in ~60 frames (1.5s at 60fps)
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        el.textContent = Math.floor(current);
                    }, 25); // ~40fps update rate
                    observer.unobserve(el); // Only animate once
                }
            });
        }, { threshold: 0.5 }); // Trigger when 50% visible

        counters.forEach(c => observer.observe(c));
    },

    // ---- ANALYSIS OVERLAY ----
    // Shows/hides the full-screen loading modal during AI processing

    showAnalysisOverlay() {
        var el = document.getElementById('analysis-overlay');
        if (el) el.classList.remove('hidden');
    },

    hideAnalysisOverlay() {
        var el = document.getElementById('analysis-overlay');
        if (el) el.classList.add('hidden');
    },

    // Updates the analysis overlay to show current step progress
    // step: 1-4 (each step = 25% progress)
    // text: description shown above the progress bar
    updateAnalysisStep(step, text) {
        const stepText = document.getElementById('analysis-step-text');
        if (stepText) stepText.textContent = text;

        const bar = document.getElementById('analysis-progress-bar');
        if (bar) bar.style.width = (step * 25) + '%'; // 4 steps = 100%

        // Update step indicator classes — "done" for past steps, "active" for current
        document.querySelectorAll('.a-step').forEach(s => {
            const sStep = parseInt(s.dataset.step);
            s.classList.toggle('done', sStep < step);
            s.classList.toggle('active', sStep === step);
        });
    },

    // ---- TOAST NOTIFICATIONS ----
    // Creates a temporary notification that slides in from the right and auto-dismisses
    // type: 'success' | 'error' | 'warning' | 'info'
    toast(message, type) {
        type = type || 'info';
        const container = document.getElementById('toast-container');
        if (!container) return;

        var icons = {
            success: 'fa-check-circle',
            error: 'fa-circle-exclamation',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        // Use escapeHtml to prevent XSS in toast messages
        toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i> <span>' +
            Helpers.escapeHtml(message) + '</span>';
        container.appendChild(toast);

        // Auto-dismiss after 3.5 seconds with a fade-out animation
        setTimeout(function () {
            toast.classList.add('removing'); // Triggers CSS toastOut animation
            setTimeout(function () { toast.remove(); }, 300); // Remove after animation
        }, 3500);
    }
};