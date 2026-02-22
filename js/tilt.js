// Tilt effect module
class Tilt {
    constructor() {
        this.init();
    }

    init() {
        // Initialize VanillaTilt if available
        if (window.VanillaTilt) {
            this.setupVanillaTilt();
        } else {
            // Fallback to custom tilt implementation
            this.setupCustomTilt();
        }
    }

    setupVanillaTilt() {
        VanillaTilt.init(document.querySelectorAll('.tilt-card'), {
            max: 5,
            speed: 400,
            glare: true,
            'max-glare': 0.2,
        });
    }

    setupCustomTilt() {
        const tiltElements = document.querySelectorAll('.tilt-card');
        
        tiltElements.forEach(element => {
            this.addTiltEffect(element);
        });
    }

    addTiltEffect(element) {
        let isMouseOver = false;
        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;

        const handleMouseMove = (e) => {
            if (!isMouseOver) return;

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) / (rect.width / 2);
            const deltaY = (e.clientY - centerY) / (rect.height / 2);

            targetX = deltaY * -10; // Rotate on X axis
            targetY = deltaX * 10;  // Rotate on Y axis
        };

        const handleMouseEnter = () => {
            isMouseOver = true;
            element.style.transition = 'transform 0.1s ease-out';
        };

        const handleMouseLeave = () => {
            isMouseOver = false;
            targetX = 0;
            targetY = 0;
            element.style.transition = 'transform 0.3s ease-out';
        };

        const animate = () => {
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;

            element.style.transform = `perspective(1000px) rotateX(${currentX}deg) rotateY(${currentY}deg)`;

            requestAnimationFrame(animate);
        };

        // Add event listeners
        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        // Start animation loop
        animate();
    }

    // Add tilt class to elements
    static addTiltClass(selector) {
        document.querySelectorAll(selector).forEach(element => {
            element.classList.add('tilt-card');
        });
    }

    // Remove tilt effect
    removeTilt(element) {
        element.style.transform = '';
        element.removeEventListener('mousemove', this.handleMouseMove);
        element.removeEventListener('mouseenter', this.handleMouseEnter);
        element.removeEventListener('mouseleave', this.handleMouseLeave);
    }
}

// Export for use in other modules
window.tilt = new Tilt();
