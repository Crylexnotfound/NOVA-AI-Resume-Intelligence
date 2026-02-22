// Visual effects and UI enhancements
class Visuals {
    constructor() {
        this.init();
    }

    init() {
        this.setupAnimations();
        this.setupInteractions();
        this.setupScrollEffects();
    }

    setupAnimations() {
        // Animate elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all cards and sections
        document.querySelectorAll('.glass-card, .feature-card, .tilt-card').forEach(el => {
            observer.observe(el);
        });
    }

    setupInteractions() {
        // Button hover effects
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });

        // Card hover effects
        document.querySelectorAll('.glass-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
            });
        });

        // File upload area interactions
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('border-emerald-500', 'bg-emerald-50');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('border-emerald-500', 'bg-emerald-50');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('border-emerald-500', 'bg-emerald-50');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload(files[0]);
                }
            });
        }
    }

    setupScrollEffects() {
        let lastScrollY = window.scrollY;
        const navbar = document.getElementById('navbar');

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            if (navbar) {
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    // Scrolling down
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    // Scrolling up
                    navbar.style.transform = 'translateY(0)';
                }
            }

            lastScrollY = currentScrollY;
        });
    }

    handleFileUpload(file) {
        const fileInput = document.getElementById('resume-file');
        if (fileInput) {
            fileInput.files = file;
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
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

    animateScore(score) {
        const scoreElement = document.getElementById('ats-score');
        const scoreRing = document.getElementById('score-ring');
        
        if (!scoreElement || !scoreRing) return;

        let currentScore = 0;
        const targetScore = score;
        const increment = targetScore / 50; // Animate over 50 steps

        const animation = setInterval(() => {
            currentScore += increment;
            
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(animation);
            }

            scoreElement.textContent = Math.round(currentScore);

            // Update ring progress
            const circumference = 2 * Math.PI * 120;
            const offset = circumference - (currentScore / 100) * circumference;
            scoreRing.style.strokeDashoffset = offset;
        }, 20);
    }

    createParticles(element) {
        const rect = element.getBoundingClientRect();
        const particles = 20;

        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.className = 'absolute w-2 h-2 bg-emerald-500 rounded-full pointer-events-none';
            particle.style.left = `${rect.left + rect.width / 2}px`;
            particle.style.top = `${rect.top + rect.height / 2}px`;
            particle.style.transform = 'translate(-50%, -50%)';
            
            document.body.appendChild(particle);

            const angle = (Math.PI * 2 * i) / particles;
            const velocity = 5 + Math.random() * 5;
            const lifetime = 1000 + Math.random() * 1000;

            particle.animate([
                {
                    transform: 'translate(-50%, -50%) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translate(${Math.cos(angle) * velocity * 20}px, ${Math.sin(angle) * velocity * 20}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: lifetime,
                easing: 'ease-out'
            }).onfinish = () => particle.remove();
        }
    }

    setupTypingEffect(element, text, speed = 50) {
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

    createRipple(event, element) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.className = 'absolute bg-white opacity-30 rounded-full pointer-events-none';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s ease-out';

        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Add CSS for animations
    static addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            @keyframes fade-in {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .animate-fade-in {
                animation: fade-in 0.6s ease-out forwards;
            }

            .glass-card {
                backdrop-filter: blur(10px);
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .tilt-card {
                transition: transform 0.3s ease;
            }

            .tilt-card:hover {
                transform: perspective(1000px) rotateX(5deg) rotateY(5deg);
            }
        `;
        document.head.appendChild(style);
    }
}

// Add styles when module loads
Visuals.addStyles();

// Export for use in other modules
window.visuals = new Visuals();
