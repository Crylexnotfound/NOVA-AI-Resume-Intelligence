// Visual rendering & UI components module
export class visuals {
    constructor() {
        this.notifications = [];
        this.modals = [];
        this.init();
    }

    init() {
        this.setupGlobalStyles();
        this.setupEventListeners();
        this.initializeComponents();
    }

    setupGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Notification Styles */
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                max-width: 400px;
                word-wrap: break-word;
            }

            .notification.show {
                transform: translateX(0);
            }

            .notification.success {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }

            .notification.error {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
            }

            .notification.warning {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
            }

            .notification.info {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
            }

            /* Modal Styles */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 999;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .modal-overlay.show {
                opacity: 1;
            }

            .modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                background: white;
                border-radius: 16px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            .modal.show {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }

            /* Loading Spinner */
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #e5e7eb;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Progress Bar */
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                border-radius: 4px;
                transition: width 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            /* Glass Card Effect */
            .glass-card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }

            /* Button Hover Effects */
            .btn-hover {
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .btn-hover::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s ease;
            }

            .btn-hover:hover::before {
                left: 100%;
            }

            /* Floating Animation */
            .float-animation {
                animation: float 3s ease-in-out infinite;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }

            /* Pulse Animation */
            .pulse-animation {
                animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Handle escape key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Handle click outside modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target.querySelector('.modal'));
            }
        });
    }

    initializeComponents() {
        // Initialize tooltips
        this.initializeTooltips();
        
        // Initialize dropdowns
        this.initializeDropdowns();
        
        // Initialize tabs
        this.initializeTabs();
    }

    // Notification System
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="flex-shrink: 0;">
                    ${this.getNotificationIcon(type)}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${this.getNotificationTitle(type)}</div>
                    <div style="font-size: 14px; opacity: 0.9;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; margin-left: 8px;">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);
        this.notifications.push(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        return notification;
    }

    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
        };
        return icons[type] || icons.info;
    }

    getNotificationTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };
        return titles[type] || 'Notification';
    }

    // Modal System
    showModal(options = {}) {
        const {
            title = 'Modal',
            content = '',
            size = 'medium',
            showClose = true,
            closeOnEscape = true,
            closeOnOverlay = true
        } = options;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = `modal modal-${size}`;
        
        modal.innerHTML = `
            <div style="padding: 24px; position: relative;">
                ${title ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #1f2937;">${title}</h2>
                        ${showClose ? '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; line-height: 1;">&times;</button>' : ''}
                    </div>
                ` : ''}
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this.modals.push({ overlay, modal });

        // Trigger animations
        setTimeout(() => {
            overlay.classList.add('show');
            modal.classList.add('show');
        }, 100);

        return { overlay, modal };
    }

    closeModal(modal) {
        if (!modal) return;

        const modalData = this.modals.find(m => m.modal === modal);
        if (!modalData) return;

        modalData.overlay.classList.remove('show');
        modalData.modal.classList.remove('show');

        setTimeout(() => {
            if (modalData.overlay.parentNode) {
                modalData.overlay.parentNode.removeChild(modalData.overlay);
            }
            const index = this.modals.indexOf(modalData);
            if (index > -1) {
                this.modals.splice(index, 1);
            }
        }, 300);
    }

    closeAllModals() {
        this.modals.forEach(modalData => {
            this.closeModal(modalData.modal);
        });
    }

    // Loading States
    showLoading(element, message = 'Loading...') {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
            border-radius: inherit;
        `;

        loadingOverlay.innerHTML = `
            <div class="spinner"></div>
            <div style="margin-top: 16px; color: #6b7280; font-weight: 500;">${message}</div>
        `;

        // Ensure parent has relative positioning
        const parentStyle = window.getComputedStyle(element);
        if (parentStyle.position !== 'relative' && parentStyle.position !== 'absolute') {
            element.style.position = 'relative';
        }

        element.appendChild(loadingOverlay);
        return loadingOverlay;
    }

    hideLoading(element) {
        const loadingOverlay = element.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    // Progress Bars
    createProgressBar(container, options = {}) {
        const {
            value = 0,
            max = 100,
            showLabel = true,
            animated = true,
            color = '#3b82f6'
        } = options;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = `${(value / max) * 100}%`;
        progressFill.style.background = color;

        progressBar.appendChild(progressFill);

        if (showLabel) {
            const label = document.createElement('div');
            label.style.cssText = 'margin-top: 8px; font-size: 14px; color: #6b7280; text-align: center;';
            label.textContent = `${value} / ${max}`;
            progressBar.appendChild(label);
        }

        if (container) {
            container.appendChild(progressBar);
        }

        return {
            element: progressBar,
            setValue: (newValue) => {
                const percentage = Math.min(100, Math.max(0, (newValue / max) * 100));
                progressFill.style.width = `${percentage}%`;
                if (showLabel) {
                    const label = progressBar.querySelector('div[style*="margin-top"]');
                    if (label) {
                        label.textContent = `${newValue} / ${max}`;
                    }
                }
            }
        };
    }

    // Tooltips
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', (e) => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: fixed;
            background: #1f2937;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1001;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            max-width: 200px;
            word-wrap: break-word;
        `;

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 8;

        // Adjust position if tooltip goes off screen
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }
        if (top < 8) {
            top = rect.bottom + 8;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;

        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 100);
    }

    hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 200);
        }
    }

    // Dropdowns
    initializeDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (trigger && menu) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDropdown(menu);
                });
                
                document.addEventListener('click', () => {
                    this.closeDropdown(menu);
                });
            }
        });
    }

    toggleDropdown(menu) {
        if (menu.style.display === 'block') {
            this.closeDropdown(menu);
        } else {
            this.closeAllDropdowns();
            menu.style.display = 'block';
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                menu.style.transition = 'all 0.2s ease';
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    closeDropdown(menu) {
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            menu.style.display = 'none';
        }, 200);
    }

    closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown-menu');
        dropdowns.forEach(menu => {
            this.closeDropdown(menu);
        });
    }

    // Tabs
    initializeTabs() {
        const tabGroups = document.querySelectorAll('.tabs');
        
        tabGroups.forEach(tabGroup => {
            const triggers = tabGroup.querySelectorAll('.tab-trigger');
            const contents = tabGroup.querySelectorAll('.tab-content');
            
            triggers.forEach((trigger, index) => {
                trigger.addEventListener('click', () => {
                    this.switchTab(triggers, contents, index);
                });
            });
            
            // Activate first tab by default
            if (triggers.length > 0) {
                this.switchTab(triggers, contents, 0);
            }
        });
    }

    switchTab(triggers, contents, activeIndex) {
        triggers.forEach((trigger, index) => {
            if (index === activeIndex) {
                trigger.classList.add('active');
                trigger.setAttribute('aria-selected', 'true');
            } else {
                trigger.classList.remove('active');
                trigger.setAttribute('aria-selected', 'false');
            }
        });
        
        contents.forEach((content, index) => {
            if (index === activeIndex) {
                content.classList.add('active');
                content.setAttribute('aria-hidden', 'false');
            } else {
                content.classList.remove('active');
                content.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // Utility Methods
    animateValue(element, start, end, duration = 1000) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = start + (end - start) * easeOutQuart;
            
            element.textContent = Math.round(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    createRipple(event, element) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            pointer-events: none;
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Cleanup
    destroy() {
        // Remove all notifications
        this.notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        this.notifications = [];

        // Close all modals
        this.closeAllModals();

        // Remove event listeners
        document.removeEventListener('keydown', this.handleEscape);
        document.removeEventListener('click', this.handleOverlayClick);
    }
}

// Add ripple animation to global styles
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Export singleton instance
export const visualsInstance = new visuals();
