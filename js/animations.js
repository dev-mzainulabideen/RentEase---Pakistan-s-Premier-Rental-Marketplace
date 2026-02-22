// ============================================
// Modern Scroll Animations
// Smooth, Performance-Optimized
// ============================================

(function() {
    'use strict';

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Initialize scroll animations
    function initScrollAnimations() {
        const elements = document.querySelectorAll('.scroll-animate');
        elements.forEach((el, index) => {
            // Add stagger delay
            if (el.classList.contains('stagger-1')) {
                el.style.transitionDelay = '0.1s';
            } else if (el.classList.contains('stagger-2')) {
                el.style.transitionDelay = '0.2s';
            } else if (el.classList.contains('stagger-3')) {
                el.style.transitionDelay = '0.3s';
            } else if (el.classList.contains('stagger-4')) {
                el.style.transitionDelay = '0.4s';
            } else if (el.classList.contains('stagger-5')) {
                el.style.transitionDelay = '0.5s';
            } else if (el.classList.contains('stagger-6')) {
                el.style.transitionDelay = '0.6s';
            } else {
                // Auto-stagger for category cards and listings
                const delay = (index % 6) * 0.1;
                el.style.transitionDelay = `${delay}s`;
            }
            
            observer.observe(el);
        });
    }

    // Parallax effect for hero section
    function initParallax() {
        const hero = document.querySelector('.hero-section');
        if (!hero) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.5;
            
            if (hero.querySelector('.hero-background')) {
                hero.querySelector('.hero-background').style.transform = `translateY(${rate}px)`;
            }
        }, { passive: true });
    }

    // Smooth reveal for sections
    function initSectionReveal() {
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('section-visible');
                    }
                });
            }, {
                threshold: 0.2
            });
            
            sectionObserver.observe(section);
        });
    }

    // Animate numbers/counters
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start).toLocaleString();
            }
        }, 16);
    }

    // Initialize counters when visible
    function initCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-counter'));
                    animateCounter(entry.target, target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => counterObserver.observe(counter));
    }

    // Cursor trail effect (optional, can be disabled)
    function initCursorTrail() {
        if (window.innerWidth < 768) return; // Disable on mobile
        
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        document.body.appendChild(trail);
        
        let mouseX = 0, mouseY = 0;
        let trailX = 0, trailY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        function animateTrail() {
            trailX += (mouseX - trailX) * 0.1;
            trailY += (mouseY - trailY) * 0.1;
            
            trail.style.left = trailX + 'px';
            trail.style.top = trailY + 'px';
            
            requestAnimationFrame(animateTrail);
        }
        
        animateTrail();
    }

    // Stagger animation for category cards
    function staggerCategoryCards() {
        const cards = document.querySelectorAll('.category-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('scroll-animate', 'fade-in-up');
        });
    }

    // Stagger animation for listing cards
    function staggerListingCards() {
        const cards = document.querySelectorAll('.listing-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('scroll-animate', 'fade-in-up');
        });
    }

    // Initialize all animations
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Initialize animations
        initScrollAnimations();
        initParallax();
        initSectionReveal();
        initCounters();
        staggerCategoryCards();
        staggerListingCards();
        
        // Optional: Enable cursor trail (can be disabled)
        // initCursorTrail();
    }

    // Run initialization
    init();

    // Re-initialize on dynamic content load
    if (typeof loadCategories === 'function') {
        const originalLoadCategories = loadCategories;
        loadCategories = function() {
            originalLoadCategories();
            setTimeout(() => {
                staggerCategoryCards();
                initScrollAnimations();
            }, 100);
        };
    }

    if (typeof loadFeaturedListings === 'function') {
        const originalLoadFeaturedListings = loadFeaturedListings;
        loadFeaturedListings = function() {
            originalLoadFeaturedListings();
            setTimeout(() => {
                staggerListingCards();
                initScrollAnimations();
            }, 100);
        };
    }
})();

