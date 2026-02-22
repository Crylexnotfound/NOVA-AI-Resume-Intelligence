// Animation module
class Animations {
    constructor() {
        this.observers = [];
    }

    observeElements() {
        // Observe elements for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all animatable elements
        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });

        this.observers.push(observer);
    }

    animateElement(element) {
        const animation = element.dataset.animate;
        
        switch (animation) {
            case 'fade-in':
                this.fadeIn(element);
                break;
            case 'slide-up':
                this.slideUp(element);
                break;
            case 'scale-in':
                this.scaleIn(element);
                break;
            case 'bounce-in':
                this.bounceIn(element);
                break;
            default:
                this.fadeIn(element);
        }
    }

    fadeIn(element, duration = 600) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        element.animate([
            {
                opacity: 0,
                transform: 'translateY(20px)'
            },
            {
                opacity: 1,
                transform: 'translateY(0)'
            }
        ], {
            duration: duration,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    slideUp(element, duration = 600) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(40px)';
        
        element.animate([
            {
                opacity: 0,
                transform: 'translateY(40px)'
            },
            {
                opacity: 1,
                transform: 'translateY(0)'
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });
    }

    scaleIn(element, duration = 600) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        
        element.animate([
            {
                opacity: 0,
                transform: 'scale(0.8)'
            },
            {
                opacity: 1,
                transform: 'scale(1)'
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });
    }

    bounceIn(element, duration = 800) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.3)';
        
        element.animate([
            {
                opacity: 0,
                transform: 'scale(0.3)'
            },
            {
                opacity: 1,
                transform: 'scale(1.05)'
            },
            {
                opacity: 1,
                transform: 'scale(0.95)'
            },
            {
                opacity: 1,
                transform: 'scale(1)'
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            fill: 'forwards'
        });
    }

    staggerAnimation(elements, animation, delay = 100) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                this.animateElement(element);
            }, index * delay);
        });
    }

    countUp(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            element.textContent = Math.round(current);
        }, 16);
    }

    typewriter(element, text, speed = 50) {
        element.textContent = '';
        let index = 0;

        const type = () => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(type, speed);
            }
        };

        type();
    }

    loadingDots(element) {
        const dots = 3;
        let current = 0;

        const animate = () => {
            element.textContent = '.'.repeat(current + 1);
            current = (current + 1) % dots;
        };

        const interval = setInterval(animate, 500);
        return interval;
    }

    pulse(element, duration = 1000) {
        element.animate([
            {
                transform: 'scale(1)',
                opacity: 1
            },
            {
                transform: 'scale(1.05)',
                opacity: 0.8
            },
            {
                transform: 'scale(1)',
                opacity: 1
            }
        ], {
            duration: duration,
            iterations: Infinity
        });
    }

    shake(element, duration = 500) {
        element.animate([
            {
                transform: 'translateX(0)'
            },
            {
                transform: 'translateX(-10px)'
            },
            {
                transform: 'translateX(10px)'
            },
            {
                transform: 'translateX(-10px)'
            },
            {
                transform: 'translateX(10px)'
            },
            {
                transform: 'translateX(0)'
            }
        ], {
            duration: duration,
            easing: 'ease-in-out'
        });
    }

    float(element, duration = 3000) {
        element.animate([
            {
                transform: 'translateY(0px)'
            },
            {
                transform: 'translateY(-10px)'
            },
            {
                transform: 'translateY(0px)'
            }
        ], {
            duration: duration,
            iterations: Infinity,
            easing: 'ease-in-out'
        });
    }

    glow(element, color = '#10b981', duration = 2000) {
        element.animate([
            {
                boxShadow: `0 0 5px ${color}`
            },
            {
                boxShadow: `0 0 20px ${color}, 0 0 30px ${color}`
            },
            {
                boxShadow: `0 0 5px ${color}`
            }
        ], {
            duration: duration,
            iterations: Infinity
        });
    }

    slideInFromLeft(element, duration = 600) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(-50px)';
        
        element.animate([
            {
                opacity: 0,
                transform: 'translateX(-50px)'
            },
            {
                opacity: 1,
                transform: 'translateX(0)'
            }
        ], {
            duration: duration,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    slideInFromRight(element, duration = 600) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(50px)';
        
        element.animate([
            {
                opacity: 0,
                transform: 'translateX(50px)'
            },
            {
                opacity: 1,
                transform: 'translateX(0)'
            }
        ], {
            duration: duration,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    rotateIn(element, duration = 600) {
        element.style.opacity = '0';
        element.style.transform = 'rotate(-180deg) scale(0.5)';
        
        element.animate([
            {
                opacity: 0,
                transform: 'rotate(-180deg) scale(0.5)'
            },
            {
                opacity: 1,
                transform: 'rotate(0deg) scale(1)'
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });
    }

    // Cleanup observers
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Export for use in other modules
window.animations = new Animations();
