// NOVA - Visuals & Animations Module

const Visuals = {
    // ---- CUSTOM CURSOR ----
    initCursor() {
        const cursor = document.getElementById('cursor');
        const follower = document.getElementById('cursor-follower');
        if (!cursor || !follower) return;

        if ('ontouchstart' in window) {
            cursor.style.display = 'none';
            follower.style.display = 'none';
            document.body.style.cursor = 'auto';
            return;
        }

        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX - 4 + 'px';
            cursor.style.top = mouseY - 4 + 'px';
        });

        const animateFollower = () => {
            followerX += (mouseX - followerX) * 0.12;
            followerY += (mouseY - followerY) * 0.12;
            follower.style.left = followerX - 18 + 'px';
            follower.style.top = followerY - 18 + 'px';
            requestAnimationFrame(animateFollower);
        };
        animateFollower();
    },

    // ---- SCROLL ANIMATIONS ----
    initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, parseInt(delay));
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    },

    // ---- NAVBAR ----
    initNavbar() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    },

    // ---- HERO ORB & PARALLAX (Three.js) ----
    initHeroOrb() {
        const canvas = document.getElementById('hero-orb');
        if (!canvas) return;

        // Check if Three is loaded
        if (typeof THREE === 'undefined') {
            console.warn('Three.js not loaded');
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Particles
        const geometry = new THREE.BufferGeometry();
        const count = 2000;
        const posArray = new Float32Array(count * 3);
        const colorArray = new Float32Array(count * 3);

        const color1 = new THREE.Color('#8B5CF6'); // Violet
        const color2 = new THREE.Color('#06B6D4'); // Cyan

        for (let i = 0; i < count * 3; i += 3) {
            // Sphere distribution
            const r = 3.5 + Math.random() * 1.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            posArray[i] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            posArray[i + 2] = r * Math.cos(phi);

            // Mixed colors
            const mixedColor = Math.random() > 0.5 ? color1 : color2;
            colorArray[i] = mixedColor.r;
            colorArray[i + 1] = mixedColor.g;
            colorArray[i + 2] = mixedColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const material = new THREE.PointsMaterial({
            size: 0.03,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const sphere = new THREE.Points(geometry, material);
        scene.add(sphere);

        // Lights
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        camera.position.z = 8;

        // Mouse interaction
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);
        });

        const animate = () => {
            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;

            sphere.rotation.y += 0.002;
            sphere.rotation.x += 0.001;

            sphere.rotation.y += 0.05 * (targetX - sphere.rotation.y);
            sphere.rotation.x += 0.05 * (targetY - sphere.rotation.x);

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    },

    initHeroParallax() {
        const stack = document.querySelector('.hero-card-stack');
        if (!stack) return;
        let tx = 0, ty = 0, cx = 0, cy = 0;
        document.addEventListener('mousemove', (e) => {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            cx = (e.clientX / vw - 0.5) * 20;
            cy = (e.clientY / vh - 0.5) * 20;
        });
        const animate = () => {
            tx += (cx - tx) * 0.06;
            ty += (cy - ty) * 0.06;
            stack.style.transform = `perspective(800px) rotateY(${tx * 0.5}deg) rotateX(${-ty * 0.5}deg) translate3d(${tx}px, ${ty}px, 0)`;
            requestAnimationFrame(animate);
        };
        animate();
    },

    // ---- COUNTER ANIMATION ----
    animateCounters() {
        const counters = document.querySelectorAll('[data-count]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count);
                    let current = 0;
                    const step = target / 60;
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        el.textContent = Math.floor(current);
                    }, 25);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(c => observer.observe(c));
    },

    // ---- SCORE ANIMATION ----
    animateScore(targetScore) {
        const scoreEl = document.getElementById('ats-score');
        const ring = document.getElementById('score-ring');
        if (!scoreEl || !ring) return;

        const circumference = 553;
        const duration = 1500;
        const start = performance.now();

        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(targetScore * eased);

            scoreEl.textContent = current;
            ring.style.strokeDashoffset = circumference - (circumference * (current / 100));

            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    },

    // ---- ANALYSIS OVERLAY ----
    showAnalysisOverlay() {
        var el = document.getElementById('analysis-overlay');
        if (el) el.classList.remove('hidden');
    },

    hideAnalysisOverlay() {
        var el = document.getElementById('analysis-overlay');
        if (el) el.classList.add('hidden');
    },

    updateAnalysisStep(step, text) {
        const stepText = document.getElementById('analysis-step-text');
        if (stepText) stepText.textContent = text;

        const bar = document.getElementById('analysis-progress-bar');
        if (bar) bar.style.width = (step * 25) + '%';

        document.querySelectorAll('.a-step').forEach(s => {
            const sStep = parseInt(s.dataset.step);
            s.classList.toggle('done', sStep < step);
            s.classList.toggle('active', sStep === step);
        });
    },

    // ---- TOAST ----
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
        toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i> <span>' + Helpers.escapeHtml(message) + '</span>';
        container.appendChild(toast);

        setTimeout(function () {
            toast.classList.add('removing');
            setTimeout(function () { toast.remove(); }, 300);
        }, 3500);
    }
};
