/**
 * Smooth Page Animations & Scroll Effects
 * Eliminates white space, creates seamless flow
 */

(function() {
    'use strict';

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Skip animations if user prefers reduced motion
        return;
    }

    // Configuration
    const config = {
        threshold: 0.1, // Trigger animation when 10% visible
        rootMargin: '0px 0px -50px 0px',
        animationDuration: 800,
    };

    // Initialize Intersection Observer
    let observer = null;

    /**
     * Initialize scroll animations
     */
    function initScrollAnimations() {
        // Create Intersection Observer
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Mark section as visible
                    if (entry.target.closest('section')) {
                        entry.target.closest('section').classList.add('visible');
                    }
                }
            });
        }, {
            threshold: config.threshold,
            rootMargin: config.rootMargin
        });

        // Observe all animated elements
        const animatedElements = document.querySelectorAll(
            '.fade-in-up, .slide-in-left, .slide-in-right, .scale-in, section'
        );
        
        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Smooth scroll to section
     */
    function smoothScrollToSection(target) {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
        
        if (!element) return;

        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Parallax effect for sections
     */
    function initParallax() {
        let ticking = false;

        function updateParallax() {
            const scrolled = window.pageYOffset;
            const sections = document.querySelectorAll('section[data-parallax]');
            
            sections.forEach(section => {
                const speed = parseFloat(section.dataset.parallax) || 0.5;
                const yPos = -(scrolled * speed);
                section.style.transform = `translateY(${yPos}px)`;
            });

            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    /**
     * Add scroll progress indicator
     */
    function initScrollProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress-bar';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, #FF385C, #FF6B9D);
            z-index: 10000;
            transition: width 0.1s ease-out;
            box-shadow: 0 0 10px rgba(255, 56, 92, 0.5);
        `;
        document.body.appendChild(progressBar);

        function updateProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    /**
     * Lazy load images with fade-in
     */
    function initLazyImages() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.6s ease';
                    
                    if (img.complete) {
                        img.style.opacity = '1';
                    } else {
                        img.addEventListener('load', () => {
                            img.style.opacity = '1';
                        });
                    }
                    
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    /**
     * Initialize on DOM ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    initScrollAnimations();
                    initParallax();
                    initScrollProgress();
                    initLazyImages();
                }, 100);
            });
        } else {
            setTimeout(() => {
                initScrollAnimations();
                initParallax();
                initScrollProgress();
                initLazyImages();
            }, 100);
        }
    }

    // Initialize
    init();

    // Re-initialize when content is loaded dynamically
    if (typeof window !== 'undefined') {
        window.addEventListener('featuredListingsLoaded', () => {
            setTimeout(() => {
                if (observer) {
                    const newElements = document.querySelectorAll(
                        '.fade-in-up:not(.visible), .slide-in-left:not(.visible), .slide-in-right:not(.visible), .scale-in:not(.visible)'
                    );
                    newElements.forEach(el => observer.observe(el));
                }
            }, 200);
        });
    }

    // Export for external use
    if (typeof window !== 'undefined') {
        window.pageAnimations = {
            scrollTo: smoothScrollToSection,
            init: initScrollAnimations
        };
    }

})();

