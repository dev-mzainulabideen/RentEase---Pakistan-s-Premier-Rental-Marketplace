// Advanced Scroll-Triggered Animations
// Section-by-Section Storytelling with Sticky Stacking

(function() {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Skip animations if user prefers reduced motion
        document.querySelectorAll('section').forEach(section => {
            section.classList.add('section-visible');
        });
        return;
    }

    // Get all sections
    const sections = document.querySelectorAll('#home-page > section');
    if (sections.length === 0) return;

    // Configuration
    const config = {
        rootMargin: '-20% 0px -20% 0px', // Trigger when section is 20% visible
        threshold: [0, 0.25, 0.5, 0.75, 1],
        stickyEnabled: true,
        parallaxEnabled: true
    };

    // Track active section
    let activeSectionIndex = 0;
    let isScrolling = false;
    let scrollTimeout;

    // Initialize sections
    function initSections() {
        sections.forEach((section, index) => {
            // Hero section is always visible initially
            if (index === 0) {
                section.classList.add('section-visible');
                activeSectionIndex = 0;
            } else {
                section.classList.add('section-next');
            }

            // Add sticky class for stacking effect
            if (config.stickyEnabled && index > 0) {
                section.classList.add('sticky-section');
            }
        });
    }

    // Update section states
    function updateSectionStates() {
        sections.forEach((section, index) => {
            section.classList.remove('section-visible', 'section-prev', 'section-next', 'active', 'prev');

            if (index === activeSectionIndex) {
                section.classList.add('section-visible', 'active');
            } else if (index < activeSectionIndex) {
                section.classList.add('section-prev', 'prev');
            } else {
                section.classList.add('section-next');
            }
        });
    }

    // Intersection Observer for scroll-triggered animations
    const observerOptions = {
        root: null,
        rootMargin: config.rootMargin,
        threshold: config.threshold
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const section = entry.target;
            const index = Array.from(sections).indexOf(section);

            if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
                // Section is in view
                if (index !== activeSectionIndex) {
                    activeSectionIndex = index;
                    updateSectionStates();
                    
                    // Trigger custom event
                    section.dispatchEvent(new CustomEvent('sectionEnter', {
                        detail: { index, section }
                    }));
                }
            }
        });
    }, observerOptions);

    // Observe all sections
    sections.forEach(section => {
        observer.observe(section);
    });

    // Parallax effect for images
    function applyParallax() {
        if (!config.parallaxEnabled) return;

        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        sections.forEach((section, index) => {
            if (index === activeSectionIndex) {
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top;
                const sectionHeight = rect.height;
                const scrollProgress = Math.max(0, Math.min(1, 
                    (windowHeight - sectionTop) / (windowHeight + sectionHeight)
                ));

                // Apply parallax to images
                const images = section.querySelectorAll('.category-image, .listing-image');
                images.forEach((img, imgIndex) => {
                    const parallaxOffset = (scrollProgress - 0.5) * 30 * (imgIndex % 2 === 0 ? 1 : -1);
                    img.style.transform = `translateY(${parallaxOffset}px) scale(1)`;
                });
            }
        });
    }

    // Smooth scroll handler
    let lastScrollTime = performance.now();
    function handleScroll() {
        const now = performance.now();
        if (now - lastScrollTime < 16) return; // ~60fps
        lastScrollTime = now;

        isScrolling = true;
        clearTimeout(scrollTimeout);

        if (config.parallaxEnabled) {
            applyParallax();
        }

        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150);
    }

    // Throttled scroll event
    let scrollAnimationFrame;
    window.addEventListener('scroll', () => {
        if (scrollAnimationFrame) return;
        scrollAnimationFrame = requestAnimationFrame(() => {
            handleScroll();
            scrollAnimationFrame = null;
        });
    }, { passive: true });

    // Initialize on load
    function init() {
        initSections();
        updateSectionStates();
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            // Trigger initial intersection check
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                if (isVisible) {
                    const index = Array.from(sections).indexOf(section);
                    if (index < activeSectionIndex) {
                        activeSectionIndex = index;
                    }
                }
            });
            updateSectionStates();
        }, 100);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateSectionStates();
        }, 250);
    });

    // Listen for reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
        if (e.matches) {
            document.querySelectorAll('section').forEach(section => {
                section.classList.add('section-visible');
            });
        }
    });

    // Export for external use
    window.scrollAnimations = {
        getActiveSection: () => sections[activeSectionIndex],
        getActiveIndex: () => activeSectionIndex,
        scrollToSection: (index) => {
            if (index >= 0 && index < sections.length) {
                sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

})();

