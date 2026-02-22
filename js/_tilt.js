// Tilt effects module
export class tilt {
    constructor() {
        this.elements = [];
        this.settings = {
            max: 15,
            speed: 400,
            glare: true,
            maxGlare: 0.5,
            scale: 1.05,
            perspective: 1000
        };
        this.init();
    }

    init() {
        // Initialize tilt effects on elements with tilt-card class
        this.setupTiltCards();
        
        // Setup dynamic tilt for new elements
        this.observeNewElements();
    }

    setupTiltCards() {
        const tiltCards = document.querySelectorAll('.tilt-card');
        tiltCards.forEach(card => {
            this.addTiltEffect(card);
        });
    }

    addTiltEffect(element) {
        if (this.elements.includes(element)) return;
        
        this.elements.push(element);
        
        let isMouseOver = false;
        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        let glareElement = null;

        // Create glare element if enabled
        if (this.settings.glare) {
            glareElement = this.createGlareElement(element);
        }

        const handleMouseMove = (e) => {
            if (!isMouseOver) return;

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) / (rect.width / 2);
            const deltaY = (e.clientY - centerY) / (rect.height / 2);

            // Calculate rotation based on mouse position
            targetX = deltaY * this.settings.max;
            targetY = deltaX * this.settings.max;

            // Update glare position
            if (glareElement) {
                this.updateGlare(glareElement, deltaX, deltaY);
            }
        };

        const handleMouseEnter = () => {
            isMouseOver = true;
            element.style.transition = `transform ${this.settings.speed}ms ease-out`;
            element.style.transformStyle = 'preserve-3d';
            
            if (glareElement) {
                glareElement.style.opacity = '1';
            }
        };

        const handleMouseLeave = () => {
            isMouseOver = false;
            targetX = 0;
            targetY = 0;
            element.style.transition = `transform ${this.settings.speed}ms ease-out`;
            
            if (glareElement) {
                glareElement.style.opacity = '0';
            }
        };

        const animate = () => {
            // Smooth animation
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;

            // Apply transform
            const transform = `
                perspective(${this.settings.perspective}px)
                rotateX(${currentX}deg)
                rotateY(${currentY}deg)
                scale3d(${this.settings.scale}, ${this.settings.scale}, ${this.settings.scale})
            `;
            
            element.style.transform = transform;

            requestAnimationFrame(animate);
        };

        // Add event listeners
        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        // Start animation loop
        animate();

        // Store cleanup function
        element._tiltCleanup = () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
            
            if (glareElement && glareElement.parentNode) {
                glareElement.parentNode.removeChild(glareElement);
            }
        };
    }

    createGlareElement(element) {
        const glare = document.createElement('div');
        glare.className = 'tilt-glare';
        
        // Style the glare element
        Object.assign(glare.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.7) 45%, transparent 50%)',
            pointerEvents: 'none',
            opacity: '0',
            transition: `opacity ${this.settings.speed}ms ease-out`,
            zIndex: '1'
        });

        // Ensure parent has relative positioning
        const parentStyle = window.getComputedStyle(element);
        if (parentStyle.position !== 'relative' && parentStyle.position !== 'absolute') {
            element.style.position = 'relative';
        }

        element.appendChild(glare);
        return glare;
    }

    updateGlare(glareElement, deltaX, deltaY) {
        // Calculate glare position based on mouse position
        const glareX = (deltaX + 1) * 50;
        const glareY = (deltaY + 1) * 50;
        
        glareElement.style.background = `
            radial-gradient(
                circle at ${glareX}% ${glareY}%, 
                rgba(255,255,255,${this.settings.maxGlare}) 0%, 
                transparent 60%
            )
        `;
    }

    observeNewElements() {
        // Observe DOM changes for new tilt cards
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the new element is a tilt card
                        if (node.classList && node.classList.contains('tilt-card')) {
                            this.addTiltEffect(node);
                        }
                        
                        // Check for tilt cards within the new element
                        const tiltCards = node.querySelectorAll && node.querySelectorAll('.tilt-card');
                        if (tiltCards) {
                            tiltCards.forEach(card => this.addTiltEffect(card));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.observer = observer;
    }

    // Add tilt class to elements dynamically
    addTiltClass(selector) {
        document.querySelectorAll(selector).forEach(element => {
            element.classList.add('tilt-card');
            this.addTiltEffect(element);
        });
    }

    // Remove tilt effect from element
    removeTilt(element) {
        const index = this.elements.indexOf(element);
        if (index > -1) {
            this.elements.splice(index, 1);
            
            // Reset element styles
            element.style.transform = '';
            element.style.transition = '';
            element.style.transformStyle = '';
            
            // Call cleanup if available
            if (element._tiltCleanup) {
                element._tiltCleanup();
                delete element._tiltCleanup;
            }
        }
    }

    // Update tilt settings
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        // Reapply effects to all elements with new settings
        this.elements.forEach(element => {
            this.removeTilt(element);
            this.addTiltEffect(element);
        });
    }

    // Enable/disable tilt for all elements
    enable(enabled = true) {
        this.elements.forEach(element => {
            if (enabled) {
                element.style.pointerEvents = 'auto';
            } else {
                element.style.pointerEvents = 'none';
                element.style.transform = '';
            }
        });
    }

    // Add parallax tilt effect
    addParallaxTilt(element, options = {}) {
        const settings = {
            speed: 0.5,
            max: 20,
            ...options
        };

        let isMouseOver = false;
        let currentX = 0;
        let currentY = 0;

        const handleMouseMove = (e) => {
            if (!isMouseOver) return;

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) / (rect.width / 2);
            const deltaY = (e.clientY - centerY) / (rect.height / 2);

            targetX = deltaX * settings.max * settings.speed;
            targetY = deltaY * settings.max * settings.speed;
        };

        const handleMouseEnter = () => {
            isMouseOver = true;
        };

        const handleMouseLeave = () => {
            isMouseOver = false;
            targetX = 0;
            targetY = 0;
        };

        const animate = () => {
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;

            element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            requestAnimationFrame(animate);
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        animate();

        // Store cleanup function
        element._parallaxCleanup = () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
            element.style.transform = '';
        };
    }

    // Add 3D card flip effect
    add3DCardFlip(element, options = {}) {
        const settings = {
            trigger: 'hover',
            duration: 600,
            ...options
        };

        const isFlipped = false;

        const flip = () => {
            element.style.transform = element.style.transform === 'rotateY(180deg)' ? 
                'rotateY(0deg)' : 'rotateY(180deg)';
        };

        if (settings.trigger === 'hover') {
            element.addEventListener('mouseenter', flip);
            element.addEventListener('mouseleave', flip);
        } else if (settings.trigger === 'click') {
            element.addEventListener('click', flip);
        }

        element.style.transition = `transform ${settings.duration}ms`;
        element.style.transformStyle = 'preserve-3d';
        element.style.perspective = '1000px';
    }

    // Add magnetic effect
    addMagneticEffect(element, options = {}) {
        const settings = {
            strength: 0.3,
            maxDistance: 100,
            ...options
        };

        const originalPosition = { x: 0, y: 0 };

        const handleMouseMove = (e) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance < settings.maxDistance) {
                const force = (1 - distance / settings.maxDistance) * settings.strength;
                const x = deltaX * force;
                const y = deltaY * force;

                element.style.transform = `translate(${x}px, ${y}px)`;
            }
        };

        const handleMouseLeave = () => {
            element.style.transform = `translate(${originalPosition.x}px, ${originalPosition.y}px)`;
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);
    }

    // Cleanup all tilt effects
    destroy() {
        // Remove tilt from all elements
        this.elements.forEach(element => {
            this.removeTilt(element);
        });

        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
        }

        this.elements = [];
    }
}

// Export singleton instance
export const tiltInstance = new tilt();
