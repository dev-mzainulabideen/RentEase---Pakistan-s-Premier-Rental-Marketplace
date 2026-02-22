// Enhanced Modern Hero Section with Advanced Animations
(function() {
    'use strict';
    
    let ticking = false;
    let lastScrollY = 0;
    
    /**
     * Initialize hero section animations
     */
    function initHero() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        // Parallax effect for background
        initParallax();
        
        // Animate stats on scroll
        initStatsAnimation();
        
        // Enhanced scroll indicator
        initScrollIndicator();
        
        // Mouse move parallax effect
        initMouseParallax();
        
        // Intersection observer for performance
        initIntersectionObserver();
        
        console.log('✅ Modern Hero Section initialized');
    }
    
    /**
     * Parallax scrolling effect
     */
    function initParallax() {
        const heroBackground = document.querySelector('.hero-background');
        const heroShapes = document.querySelector('.hero-shapes');
        const heroContent = document.querySelector('.hero-content');
        
        if (!heroBackground) return;
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    const scrolled = window.pageYOffset;
                    const heroHeight = document.querySelector('.hero-section')?.offsetHeight || 0;
                    
                    if (scrolled < heroHeight) {
                        // Parallax background
                        if (heroBackground) {
                            const parallaxSpeed = 0.5;
                            heroBackground.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
                        }
                        
                        // Parallax shapes (slower)
                        if (heroShapes) {
                            const shapesSpeed = 0.3;
                            heroShapes.style.transform = `translateY(${scrolled * shapesSpeed}px)`;
                        }
                        
                        // Content fade on scroll
                        if (heroContent) {
                            const opacity = 1 - (scrolled / heroHeight) * 0.5;
                            heroContent.style.opacity = Math.max(0.5, opacity);
                        }
                    }
                    
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }
    
    /**
     * Animate stats on scroll into view
     */
    function initStatsAnimation() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statNumber = entry.target;
                    const finalValue = statNumber.textContent;
                    
                    // Animate number if it contains a number
                    if (finalValue.match(/\d+/)) {
                        animateNumber(statNumber, finalValue);
                    }
                    
                    observer.unobserve(statNumber);
                }
            });
        }, { threshold: 0.5 });
        
        statNumbers.forEach(stat => observer.observe(stat));
    }
    
    /**
     * Animate number counting
     */
    function animateNumber(element, finalValue) {
        const match = finalValue.match(/(\d+)([K★+]*)/);
        if (!match) return;
        
        const targetNumber = parseInt(match[1]);
        const suffix = match[2] || '';
        const duration = 2000;
        const startTime = performance.now();
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentNumber = Math.floor(targetNumber * easeOutCubic);
            
            element.textContent = currentNumber + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = finalValue;
            }
        }
        
        requestAnimationFrame(updateNumber);
    }
    
    /**
     * Enhanced scroll indicator
     */
    function initScrollIndicator() {
        const scrollIndicator = document.querySelector('.hero-scroll-indicator');
        const heroSection = document.querySelector('.hero-section');
        
        if (!scrollIndicator || !heroSection) return;
        
        // Hide/show based on scroll position
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const heroHeight = heroSection.offsetHeight;
            
            if (scrolled > heroHeight * 0.7) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.pointerEvents = 'auto';
            }
        }, { passive: true });
        
        // Enhanced click handler
        scrollIndicator.addEventListener('click', function() {
            const heroHeight = heroSection.offsetHeight;
            smoothScrollTo(heroHeight, 800);
        });
    }
    
    /**
     * Mouse move parallax effect
     */
    function initMouseParallax() {
        const heroSection = document.querySelector('.hero-section');
        const shapes = document.querySelectorAll('.shape');
        
        if (!heroSection) return;
        
        heroSection.addEventListener('mousemove', function(e) {
            const rect = heroSection.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            
            shapes.forEach((shape, index) => {
                const speed = (index + 1) * 0.1;
                const moveX = x * 20 * speed;
                const moveY = y * 20 * speed;
                
                shape.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        });
    }
    
    /**
     * Intersection Observer for performance
     */
    function initIntersectionObserver() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Hero is visible - ensure animations are running
                    heroSection.classList.add('visible');
                } else {
                    // Hero is not visible - pause heavy animations
                    heroSection.classList.remove('visible');
                }
            });
        }, {
            threshold: 0.1
        });
        
        observer.observe(heroSection);
    }
    
    /**
     * Smooth scroll function
     */
    function smoothScrollTo(target, duration) {
        const start = window.pageYOffset;
        const distance = target - start;
        const startTime = performance.now();
        
        function easeInOutCubic(t) {
            return t < 0.5 
                ? 4 * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
        
        function animation(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeInOutCubic(progress);
            
            window.scrollTo(0, start + distance * ease);
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }
    
    /**
     * Add floating animation to hero elements
     */
    function addFloatingAnimation() {
        const heroBadge = document.querySelector('.hero-badge');
        const heroTitle = document.querySelector('.hero-title');
        const heroSearchCard = document.querySelector('.hero-search-card');
        
        // Subtle floating animation
        setInterval(function() {
            if (heroBadge) {
                const randomY = Math.sin(Date.now() / 2000) * 3;
                heroBadge.style.transform = `translateY(${randomY}px)`;
            }
        }, 50);
    }
    
    /**
     * Initialize on DOM ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initHero();
            addFloatingAnimation();
        });
    } else {
        initHero();
        addFloatingAnimation();
    }
    
    // Re-initialize on page visibility change
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // Page is visible again
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.classList.add('visible');
            }
        }
    });
    
    // Reduced motion support
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        // Disable animations for users who prefer reduced motion
        const style = document.createElement('style');
        style.textContent = `
            .hero-section *,
            .hero-section *::before,
            .hero-section *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }
})();
