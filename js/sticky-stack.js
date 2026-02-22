/**
 * Sticky Stacking Scroll Effects
 * Modern storytelling approach with smooth scroll-based animations
 */

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Configuration
    const config = {
        scrollThreshold: 0.3, // When to trigger next card (30% of viewport)
        cardSpacing: 100, // Minimum spacing between cards in pixels
        animationDuration: 800, // Animation duration in ms
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        enableParallax: !prefersReducedMotion,
        enableMobileStacking: false, // Disable on mobile for better UX
    };

    // State
    let isScrolling = false;
    let scrollTimeout = null;
    let activeCardIndex = 0;
    let featuredCards = [];
    let whyChooseCards = [];
    let featuredSection = null;
    let whyChooseSection = null;
    let progressBar = null;
    let scrollIndicator = null;

    /**
     * Initialize sticky stacking for all sections
     */
    function initStickyStack() {
        // Check if mobile and stacking is disabled
        const isMobile = window.innerWidth < 768;
        if (isMobile && !config.enableMobileStacking) {
            // On mobile, just ensure cards are visible
            initMobileFallback();
            return;
        }

        // Initialize sections
        initFeaturedListings();
        initWhyChooseSection();
        
        // Create progress bar
        createProgressBar();
        
        // Create scroll indicator
        createScrollIndicator();
        
        // Setup scroll listener
        setupScrollListener();
        
        // Initial update
        updateStickyStack();
    }

    /**
     * Initialize Featured Listings sticky stack
     * DISABLED - Featured listings now use default layout
     */
    function initFeaturedListings() {
        // Featured listings no longer use sticky stacking
        return;
        
        /* DISABLED CODE
        featuredSection = document.getElementById('featured-listings-section');
        if (!featuredSection) return;

        const container = featuredSection.querySelector('#featured-listings');
        if (!container) return;

        // Wait for listings to load
        const checkListings = setInterval(() => {
            featuredCards = Array.from(container.querySelectorAll('.listing-card'));
            if (featuredCards.length > 0) {
                clearInterval(checkListings);
                setupFeaturedCards();
                updateWrapperHeight(featuredSection, featuredCards.length);
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => clearInterval(checkListings), 5000);
        */
    }

    /**
     * Setup featured listing cards
     */
    function setupFeaturedCards() {
        if (featuredCards.length === 0) return;

        featuredCards.forEach((card, index) => {
            // Ensure sticky-card class is present
            if (!card.classList.contains('sticky-card')) {
                card.classList.add('sticky-card');
            }
            
            card.classList.add('loading');
            
            // Set initial state
            if (index === 0) {
                setTimeout(() => {
                    card.classList.remove('loading');
                    card.classList.add('active');
                }, 100);
            } else {
                card.classList.add('inactive');
            }
        });
    }

    /**
     * Initialize Why Choose section sticky stack
     */
    function initWhyChooseSection() {
        whyChooseSection = document.getElementById('why-choose-section');
        if (!whyChooseSection) return;

        const container = whyChooseSection.querySelector('#why-choose-cards');
        if (!container) return;

        whyChooseCards = Array.from(container.querySelectorAll('.feature-card.sticky-card'));
        
        if (whyChooseCards.length > 0) {
            setupWhyChooseCards();
        }
    }

    /**
     * Setup Why Choose cards
     */
    function setupWhyChooseCards() {
        whyChooseCards.forEach((card, index) => {
            card.classList.add('loading');
            
            // Set initial state
            if (index === 0) {
                setTimeout(() => {
                    card.classList.remove('loading');
                    card.classList.add('active');
                }, 100);
            } else {
                card.classList.add('inactive');
            }
        });

        // Update wrapper height
        updateWrapperHeight(whyChooseSection, whyChooseCards.length);
    }

    /**
     * Update wrapper height based on number of cards
     */
    function updateWrapperHeight(section, cardCount) {
        if (!section) return;
        
        const wrapper = section.querySelector('.sticky-stack-wrapper');
        if (!wrapper) return;

        // Reduced height calculation for less white space
        const cardHeight = window.innerHeight * 0.6; // 60% of viewport per card
        const totalHeight = cardHeight * cardCount;
        wrapper.style.minHeight = `${totalHeight}px`;
        
        // On mobile, don't set min-height
        if (window.innerWidth < 768) {
            wrapper.style.minHeight = 'auto';
        }
    }

    /**
     * Setup scroll listener with throttling
     */
    function setupScrollListener() {
        let ticking = false;

        function handleScroll() {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateStickyStack();
                    updateProgressBar();
                    updateScrollIndicator();
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', () => {
            updateWrapperHeight(featuredSection, featuredCards.length);
            updateWrapperHeight(whyChooseSection, whyChooseCards.length);
            updateStickyStack();
        }, { passive: true });
    }

    /**
     * Update sticky stack based on scroll position
     */
    function updateStickyStack() {
        if (prefersReducedMotion) return;

        // Skip Featured Listings - using default layout now
        // updateCardStack(featuredSection, featuredCards, 'featured');
        
        // Update Why Choose
        updateCardStack(whyChooseSection, whyChooseCards, 'why-choose');
    }

    /**
     * Update card stack for a section
     */
    function updateCardStack(section, cards, sectionType) {
        if (!section || cards.length === 0) return;

        const sectionRect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const scrollProgress = Math.max(0, Math.min(1, 
            (viewportHeight - sectionRect.top) / (viewportHeight * 0.8)
        ));

        // Calculate active card index
        const totalCards = cards.length;
        const activeIndex = Math.min(
            Math.floor(scrollProgress * totalCards),
            totalCards - 1
        );

        // Update card states
        cards.forEach((card, index) => {
            if (!card) return;

            const distance = Math.abs(index - activeIndex);
            
            // Remove all state classes
            card.classList.remove('active', 'prev-active', 'next', 'inactive', 'loading');

            if (index === activeIndex) {
                card.classList.add('active');
            } else if (index < activeIndex) {
                // Previous cards
                if (distance === 1) {
                    card.classList.add('prev-active');
                } else {
                    card.classList.add('inactive');
                }
            } else {
                // Next cards
                if (distance === 1) {
                    card.classList.add('next');
                } else {
                    card.classList.add('inactive');
                }
            }
        });
    }

    /**
     * Create progress bar
     */
    function createProgressBar() {
        progressBar = document.createElement('div');
        progressBar.className = 'sticky-progress-bar';
        document.body.appendChild(progressBar);
    }

    /**
     * Update progress bar
     */
    function updateProgressBar() {
        if (!progressBar) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    /**
     * Create scroll indicator
     */
    function createScrollIndicator() {
        scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'sticky-scroll-indicator';
        scrollIndicator.innerHTML = `
            <div class="sticky-scroll-indicator-content">
                <i class="bi bi-arrow-down"></i>
                <span>Scroll to explore</span>
            </div>
        `;
        document.body.appendChild(scrollIndicator);
    }

    /**
     * Update scroll indicator visibility
     */
    function updateScrollIndicator() {
        if (!scrollIndicator) return;

        const featuredRect = featuredSection?.getBoundingClientRect();
        const whyChooseRect = whyChooseSection?.getBoundingClientRect();
        
        const isInFeatured = featuredRect && 
            featuredRect.top < window.innerHeight && 
            featuredRect.bottom > 0;
        
        const isInWhyChoose = whyChooseRect && 
            whyChooseRect.top < window.innerHeight && 
            whyChooseRect.bottom > 0;

        if (isInFeatured || isInWhyChoose) {
            scrollIndicator.classList.add('visible');
        } else {
            scrollIndicator.classList.remove('visible');
        }
    }

    /**
     * Mobile fallback - just ensure cards are visible
     */
    function initMobileFallback() {
        // Remove sticky classes and ensure all cards are visible
        const allStickyCards = document.querySelectorAll('.sticky-card');
        allStickyCards.forEach(card => {
            card.classList.remove('loading', 'inactive', 'next', 'prev-active');
            card.classList.add('active');
        });
    }

    /**
     * Smooth scroll to next card
     */
    function scrollToNextCard(section, cards, currentIndex) {
        if (currentIndex >= cards.length - 1) return;

        const nextCard = cards[currentIndex + 1];
        if (!nextCard) return;

        const cardRect = nextCard.getBoundingClientRect();
        const scrollTarget = window.pageYOffset + cardRect.top - (window.innerHeight * 0.2);

        window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
        });
    }

    /**
     * Initialize on DOM ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                // Wait a bit for content to load
                setTimeout(initStickyStack, 500);
            });
        } else {
            setTimeout(initStickyStack, 500);
        }
    }

    // Initialize
    init();

    // Re-initialize when featured listings are loaded
    if (typeof window !== 'undefined') {
        window.addEventListener('featuredListingsLoaded', () => {
            setTimeout(() => {
                initFeaturedListings();
                // Wait a bit more for DOM to settle
                setTimeout(() => {
                    updateStickyStack();
                }, 200);
            }, 300);
        });
    }

    // Export for external use
    if (typeof window !== 'undefined') {
        window.stickyStack = {
            init: initStickyStack,
            update: updateStickyStack,
            scrollToNext: scrollToNextCard
        };
    }

})();

