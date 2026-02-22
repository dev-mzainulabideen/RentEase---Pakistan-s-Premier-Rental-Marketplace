// Advanced Horizontal Parallax Categories Gallery
// Center focus, dynamic scaling, smooth inertia, and premium animations

function initCategoriesGallery() {
    const gallery = document.getElementById('categories-gallery');
    if (!gallery) return;

    const cards = gallery.querySelectorAll('.category-card');
    if (cards.length === 0) return;

    const scrollLeft = document.getElementById('scroll-left');
    const scrollRight = document.getElementById('scroll-right');

    let isScrolling = false;
    let scrollTimeout;
    let isDragging = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let velocity = 0;
    let lastScrollLeft = 0;
    let lastScrollTime = performance.now();
    let animationFrameId = null;
    let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Find center card
    function findCenterCard() {
        const galleryRect = gallery.getBoundingClientRect();
        const galleryCenter = galleryRect.left + galleryRect.width / 2;
        let centerCard = null;
        let minDistance = Infinity;

        cards.forEach((card) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(cardCenter - galleryCenter);

            if (distance < minDistance) {
                minDistance = distance;
                centerCard = card;
            }
        });

        return centerCard;
    }

    // Update active card and apply transformations
    function updateActiveCard() {
        const centerCard = findCenterCard();
        const galleryRect = gallery.getBoundingClientRect();
        const galleryCenter = galleryRect.left + galleryRect.width / 2;

        cards.forEach((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distanceFromCenter = cardCenter - galleryCenter;
            const maxDistance = galleryRect.width / 2;
            const normalizedDistance = Math.abs(distanceFromCenter) / maxDistance;
            const clampedDistance = Math.min(normalizedDistance, 1);

            if (card === centerCard) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }

            // Apply parallax and depth effects
            if (!prefersReducedMotion) {
                const parallaxOffset = (distanceFromCenter / maxDistance) * 30;
                const scale = centerCard === card ? 1.2 : 0.85 + (1 - clampedDistance) * 0.15;
                const translateY = centerCard === card ? -20 : 0;
                const opacity = centerCard === card ? 1 : 0.5 + (1 - clampedDistance) * 0.3;
                const blur = centerCard === card ? 0 : 3 * clampedDistance;
                const zIndex = centerCard === card ? 10 : Math.max(1, 10 - Math.floor(clampedDistance * 9));

                card.style.transform = `translateX(${parallaxOffset}px) translateY(${translateY}px) translateZ(0) scale(${scale})`;
                card.style.opacity = opacity;
                card.style.filter = `blur(${blur}px)`;
                card.style.zIndex = zIndex;
            }
        });
    }

    // Smooth scroll with inertia
    function smoothScrollWithInertia(target, duration = 600) {
        const start = gallery.scrollLeft;
        const distance = target - start;
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Advanced easing (ease-out-cubic with bounce)
            const ease = 1 - Math.pow(1 - progress, 3);
            
            gallery.scrollLeft = start + distance * ease;
            updateActiveCard();
            
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                updateActiveCard();
                updateScrollIndicators();
            }
        }

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(animate);
    }

    // Update scroll indicators visibility
    function updateScrollIndicators() {
        const { scrollLeft: currentScroll, scrollWidth, clientWidth } = gallery;
        const isAtStart = currentScroll <= 10;
        const isAtEnd = currentScroll >= scrollWidth - clientWidth - 10;

        if (scrollLeft) {
            scrollLeft.classList.toggle('visible', !isAtStart);
        }
        if (scrollRight) {
            scrollRight.classList.toggle('visible', !isAtEnd);
        }
    }

    // Scroll to center card
    function scrollToCard(card, smooth = true) {
        const cardRect = card.getBoundingClientRect();
        const galleryRect = gallery.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const galleryCenter = galleryRect.left + galleryRect.width / 2;
        const offset = cardCenter - galleryCenter;
        const target = gallery.scrollLeft + offset;

        if (smooth) {
            smoothScrollWithInertia(target, 600);
        } else {
            gallery.scrollLeft = target;
            updateActiveCard();
        }
    }

    // Scroll left
    if (scrollLeft) {
        scrollLeft.addEventListener('click', () => {
            const centerCard = findCenterCard();
            if (!centerCard) return;
            
            const currentIndex = Array.from(cards).indexOf(centerCard);
            if (currentIndex > 0) {
                scrollToCard(cards[currentIndex - 1]);
            }
        });
    }

    // Scroll right
    if (scrollRight) {
        scrollRight.addEventListener('click', () => {
            const centerCard = findCenterCard();
            if (!centerCard) return;
            
            const currentIndex = Array.from(cards).indexOf(centerCard);
            if (currentIndex < cards.length - 1) {
                scrollToCard(cards[currentIndex + 1]);
            }
        });
    }

    // Mouse wheel horizontal scrolling with momentum
    gallery.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            
            const scrollAmount = e.deltaY * 0.6;
            velocity = scrollAmount * 0.3; // Momentum factor
            
            gallery.scrollLeft += scrollAmount;
            updateActiveCard();
            updateScrollIndicators();
            
            // Apply momentum
            if (Math.abs(velocity) > 0.5) {
                let momentum = velocity;
                const friction = 0.95;
                
                function applyMomentum() {
                    if (Math.abs(momentum) > 0.5) {
                        gallery.scrollLeft += momentum;
                        momentum *= friction;
                        updateActiveCard();
                        requestAnimationFrame(applyMomentum);
                    } else {
                        updateActiveCard();
                        updateScrollIndicators();
                    }
                }
                
                requestAnimationFrame(applyMomentum);
            }
        }
    }, { passive: false });

    // Touch drag support with momentum
    gallery.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].pageX - gallery.offsetLeft;
        scrollLeftStart = gallery.scrollLeft;
        velocity = 0;
        lastScrollLeft = gallery.scrollLeft;
        lastScrollTime = performance.now();
        gallery.style.cursor = 'grabbing';
    }, { passive: true });

    gallery.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX - gallery.offsetLeft;
        const walk = (x - startX) * 1.2;
        gallery.scrollLeft = scrollLeftStart - walk;
        
        // Calculate velocity
        const now = performance.now();
        const timeDelta = now - lastScrollTime;
        if (timeDelta > 0) {
            velocity = (gallery.scrollLeft - lastScrollLeft) / timeDelta * 16;
        }
        lastScrollLeft = gallery.scrollLeft;
        lastScrollTime = now;
        
        updateActiveCard();
    }, { passive: false });

    gallery.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        gallery.style.cursor = 'grab';
        
        // Apply momentum
        if (Math.abs(velocity) > 1) {
            let momentum = velocity * 10;
            const friction = 0.92;
            
            function applyMomentum() {
                if (Math.abs(momentum) > 0.5) {
                    gallery.scrollLeft += momentum;
                    momentum *= friction;
                    updateActiveCard();
                    requestAnimationFrame(applyMomentum);
                } else {
                    // Snap to nearest card
                    const centerCard = findCenterCard();
                    if (centerCard) {
                        scrollToCard(centerCard);
                    }
                    updateScrollIndicators();
                }
            }
            
            requestAnimationFrame(applyMomentum);
        } else {
            // Snap to nearest card
            const centerCard = findCenterCard();
            if (centerCard) {
                scrollToCard(centerCard);
            }
            updateScrollIndicators();
        }
    });

    // Mouse drag support
    gallery.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - gallery.offsetLeft;
        scrollLeftStart = gallery.scrollLeft;
        velocity = 0;
        lastScrollLeft = gallery.scrollLeft;
        lastScrollTime = performance.now();
        gallery.style.cursor = 'grabbing';
        e.preventDefault();
    });

    gallery.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - gallery.offsetLeft;
        const walk = (x - startX) * 1.2;
        gallery.scrollLeft = scrollLeftStart - walk;
        
        // Calculate velocity
        const now = performance.now();
        const timeDelta = now - lastScrollTime;
        if (timeDelta > 0) {
            velocity = (gallery.scrollLeft - lastScrollLeft) / timeDelta * 16;
        }
        lastScrollLeft = gallery.scrollLeft;
        lastScrollTime = now;
        
        updateActiveCard();
    });

    gallery.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        gallery.style.cursor = 'grab';
        
        // Apply momentum
        if (Math.abs(velocity) > 1) {
            let momentum = velocity * 8;
            const friction = 0.94;
            
            function applyMomentum() {
                if (Math.abs(momentum) > 0.5) {
                    gallery.scrollLeft += momentum;
                    momentum *= friction;
                    updateActiveCard();
                    requestAnimationFrame(applyMomentum);
                } else {
                    // Snap to nearest card
                    const centerCard = findCenterCard();
                    if (centerCard) {
                        scrollToCard(centerCard);
                    }
                    updateScrollIndicators();
                }
            }
            
            requestAnimationFrame(applyMomentum);
        } else {
            // Snap to nearest card
            const centerCard = findCenterCard();
            if (centerCard) {
                scrollToCard(centerCard);
            }
            updateScrollIndicators();
        }
    });

    gallery.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            gallery.style.cursor = 'grab';
            
            // Snap to nearest card
            const centerCard = findCenterCard();
            if (centerCard) {
                scrollToCard(centerCard);
            }
            updateScrollIndicators();
        }
    });

    // Throttled scroll handler for active card updates
    let lastUpdateTime = 0;
    gallery.addEventListener('scroll', () => {
        const now = performance.now();
        if (now - lastUpdateTime < 16) return; // ~60fps
        lastUpdateTime = now;

        isScrolling = true;
        clearTimeout(scrollTimeout);
        
        updateActiveCard();
        updateScrollIndicators();

        scrollTimeout = setTimeout(() => {
            isScrolling = false;
            // Snap to nearest card when scrolling stops
            const centerCard = findCenterCard();
            if (centerCard && !isDragging) {
                scrollToCard(centerCard);
            }
        }, 150);
    });

    // Keyboard navigation
    gallery.addEventListener('keydown', (e) => {
        const centerCard = findCenterCard();
        if (!centerCard) return;
        
        const currentIndex = Array.from(cards).indexOf(centerCard);
        
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            e.preventDefault();
            scrollToCard(cards[currentIndex - 1]);
        } else if (e.key === 'ArrowRight' && currentIndex < cards.length - 1) {
            e.preventDefault();
            scrollToCard(cards[currentIndex + 1]);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            centerCard.click();
        }
    });

    // Make gallery focusable for keyboard navigation
    gallery.setAttribute('tabindex', '0');
    gallery.setAttribute('role', 'region');
    gallery.setAttribute('aria-label', 'Categories gallery');
    gallery.setAttribute('aria-live', 'polite');

    // Card click handlers - navigate to category
    cards.forEach((card) => {
        card.addEventListener('click', (e) => {
            // Only navigate if card is active or close to center
            const cardRect = card.getBoundingClientRect();
            const galleryRect = gallery.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const galleryCenter = galleryRect.left + galleryRect.width / 2;
            const distance = Math.abs(cardCenter - galleryCenter);
            
            if (distance > galleryRect.width * 0.3) {
                e.preventDefault();
                scrollToCard(card);
            }
        });
    });

    // Initial setup
    updateActiveCard();
    updateScrollIndicators();
    
    // Center first card on load
    if (cards.length > 0 && !prefersReducedMotion) {
        setTimeout(() => {
            scrollToCard(cards[0], false);
            setTimeout(() => scrollToCard(cards[0]), 100);
        }, 100);
    }
    
    // Update on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateActiveCard();
            updateScrollIndicators();
            const centerCard = findCenterCard();
            if (centerCard) {
                scrollToCard(centerCard, false);
            }
        }, 250);
    });

    // Listen for reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
        prefersReducedMotion = e.matches;
        if (prefersReducedMotion) {
            cards.forEach(card => {
                card.style.transform = '';
                card.style.opacity = '';
                card.style.filter = '';
                card.style.zIndex = '';
            });
        }
    });
}

// Export function for use in home.js
window.initCategoriesGallery = initCategoriesGallery;

// Initialize when DOM is ready (fallback)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (document.getElementById('categories-gallery')) {
                initCategoriesGallery();
            }
        }, 300);
    });
} else {
    setTimeout(() => {
        if (document.getElementById('categories-gallery')) {
            initCategoriesGallery();
        }
    }, 300);
}
