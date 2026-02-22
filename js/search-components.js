/**
 * Modern Search Page Components
 * React-like component structure in vanilla JavaScript
 */

(function() {
    'use strict';

    // ============================================
    // Component: ActiveFilters
    // ============================================
    class ActiveFilters {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.filters = new Map();
        }

        addFilter(key, label, value) {
            this.filters.set(key, { label, value });
            this.render();
        }

        removeFilter(key) {
            this.filters.delete(key);
            this.render();
            // Trigger search update
            if (typeof window.performSearch === 'function') {
                window.performSearch();
            }
        }

        clearAll() {
            this.filters.clear();
            this.render();
        }

        render() {
            if (!this.container) return;

            if (this.filters.size === 0) {
                this.container.innerHTML = '';
                return;
            }

            const chips = Array.from(this.filters.entries()).map(([key, { label, value }]) => {
                return `
                    <div class="filter-chip">
                        <span>${label}: ${value}</span>
                        <button class="filter-chip-remove" onclick="activeFiltersComponent.removeFilter('${key}')" aria-label="Remove filter">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                `;
            }).join('');

            this.container.innerHTML = chips;
        }
    }

    // ============================================
    // Component: ListingCard
    // ============================================
    class ListingCard {
        constructor(listing) {
            this.listing = listing;
        }

        render() {
            const image = this.listing.images?.[0]?.url || 
                         this.listing.featuredImage || 
                         `https://via.placeholder.com/600x400?text=${encodeURIComponent(this.listing.title || 'No Image')}`;
            
            const location = this.formatLocation(this.listing.location);
            const price = this.formatPrice(this.listing.pricing?.price || this.listing.price || 0);
            const period = this.listing.pricing?.period || this.listing.period || 'day';
            const rating = this.listing.rating || this.listing.stats?.averageRating || 0;
            const reviews = this.listing.reviews?.length || this.listing.stats?.totalReviews || 0;

            const badges = this.renderBadges();

            return `
                <div class="col-md-4 col-sm-6 mb-4">
                    <a href="listing-detail.html?id=${this.listing._id || this.listing.id}" 
                       class="listing-card" 
                       data-listing-id="${this.listing._id || this.listing.id}">
                        <div class="listing-image-container">
                            <img src="${image}" 
                                 alt="${this.listing.title || 'Listing image'}" 
                                 class="listing-image" 
                                 loading="lazy"
                                 onerror="this.onerror=null; this.src='https://via.placeholder.com/600x450/FF385C/ffffff?text=No+Image'">
                            ${badges}
                        </div>
                        <div class="listing-content">
                            <div class="listing-header">
                                <h3 class="listing-title">${this.listing.title || 'Untitled Listing'}</h3>
                            </div>
                            <p class="listing-location">
                                <i class="bi bi-geo-alt"></i>
                                <span>${location}</span>
                            </p>
                            <div class="listing-rating">
                                <i class="bi bi-star-fill"></i>
                                <span>${rating.toFixed(1)}</span>
                                ${reviews > 0 ? `<span class="reviews-count">(${reviews})</span>` : ''}
                            </div>
                            <div class="listing-price">
                                <span class="price-amount">Rs ${price}</span>
                                <span class="price-period">/${period}</span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        }

        renderBadges() {
            const badges = [];
            
            if (this.listing.verified) {
                badges.push('<span class="badge-verified"><i class="bi bi-shield-check"></i> Verified</span>');
            }
            
            if (this.listing.availability?.instantBooking || this.listing.instant) {
                badges.push('<span class="badge-instant"><i class="bi bi-lightning-fill"></i> Instant</span>');
            }
            
            if (this.listing.accountType === 'paid' && this.listing.ownerVerified) {
                badges.push('<span class="badge-account-paid"><i class="bi bi-star-fill"></i> Premium</span>');
            }
            
            if (this.listing.accountType === 'free') {
                badges.push('<span class="badge-account-free"><i class="bi bi-info-circle"></i> Free</span>');
            }

            return badges.length > 0 ? `<div class="listing-badges">${badges.join('')}</div>` : '';
        }

        formatLocation(location) {
            if (!location) return 'Location not specified';
            
            if (typeof location === 'string') return location;
            
            const parts = [];
            if (location.city) parts.push(location.city);
            if (location.province) parts.push(location.province);
            if (location.address && parts.length === 0) parts.push(location.address);
            
            return parts.length > 0 ? parts.join(', ') : 'Location not specified';
        }

        formatPrice(price) {
            return new Intl.NumberFormat('en-PK').format(price);
        }
    }

    // ============================================
    // Component: SearchResults
    // ============================================
    class SearchResults {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.emptyState = document.getElementById('empty-state');
            this.resultsCount = document.getElementById('results-count');
        }

        render(listings) {
            if (!this.container) return;

            if (listings.length === 0) {
                this.container.innerHTML = '';
                if (this.emptyState) this.emptyState.style.display = 'block';
                if (this.resultsCount) this.resultsCount.textContent = '0';
                return;
            }

            if (this.emptyState) this.emptyState.style.display = 'none';
            if (this.resultsCount) this.resultsCount.textContent = listings.length;

            const cards = listings.map(listing => {
                const card = new ListingCard(listing);
                return card.render();
            }).join('');

            this.container.innerHTML = cards;

            // Re-initialize animations for new cards
            this.animateCards();
        }

        animateCards() {
            const cards = this.container.querySelectorAll('.listing-card');
            cards.forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
            });
        }
    }

    // ============================================
    // Component: FilterPanel
    // ============================================
    class FilterPanel {
        constructor() {
            this.initSticky();
            this.initCollapsible();
        }

        initSticky() {
            const filterPanel = document.querySelector('.filter-panel');
            if (!filterPanel) return;

            // Only make sticky on desktop
            if (window.innerWidth >= 992) {
                let ticking = false;

                function updateSticky() {
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const headerHeight = 72;
                    const topOffset = 20;
                    
                    // Keep filter panel sticky with consistent top position
                    filterPanel.style.top = `${headerHeight + topOffset}px`;
                    
                    ticking = false;
                }

                window.addEventListener('scroll', () => {
                    if (!ticking) {
                        window.requestAnimationFrame(updateSticky);
                        ticking = true;
                    }
                }, { passive: true });
                
                // Initial call
                updateSticky();
            }
        }

        initCollapsible() {
            const filterSections = document.querySelectorAll('.filter-section-header');
            filterSections.forEach(header => {
                header.addEventListener('click', () => {
                    const section = header.closest('.filter-section');
                    const content = section.querySelector('.filter-section > *:not(.filter-section-header)');
                    if (content) {
                        content.style.display = content.style.display === 'none' ? 'block' : 'none';
                    }
                });
            });
        }
    }

    // ============================================
    // Initialize Components
    // ============================================
    function init() {
        // Initialize Active Filters Component
        window.activeFiltersComponent = new ActiveFilters('active-filters');
        
        // Initialize Search Results Component
        window.searchResultsComponent = new SearchResults('listings-grid');
        
        // Initialize Filter Panel
        new FilterPanel();

        // Update active filters when filters change
        if (typeof updateActiveFilters === 'function') {
            const originalUpdate = updateActiveFilters;
            window.updateActiveFilters = function() {
                originalUpdate();
                // Sync with component
                if (window.activeFiltersComponent) {
                    // Re-render based on current filter state
                    const filters = new Map();
                    
                    const category = document.getElementById('category-filter')?.value;
                    if (category) {
                        filters.set('category', { label: 'Category', value: category });
                    }
                    
                    const location = document.getElementById('location-filter')?.value;
                    if (location) {
                        filters.set('location', { label: 'Location', value: location });
                    }
                    
                    const minRating = currentRating || 0;
                    if (minRating > 0) {
                        filters.set('rating', { label: 'Rating', value: `${minRating}+` });
                    }
                    
                    const instant = document.getElementById('instant-booking')?.checked;
                    if (instant) {
                        filters.set('instant', { label: 'Instant Booking', value: 'Yes' });
                    }
                    
                    const verified = document.getElementById('verified-only')?.checked;
                    if (verified) {
                        filters.set('verified', { label: 'Verified', value: 'Yes' });
                    }
                    
                    const tier = currentTier || 'all';
                    if (tier !== 'all') {
                        filters.set('tier', { label: 'Account Type', value: tier });
                    }

                    // Clear and re-add filters
                    window.activeFiltersComponent.filters.clear();
                    filters.forEach((value, key) => {
                        window.activeFiltersComponent.addFilter(key, value.label, value.value);
                    });
                }
            };
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for global use
    window.SearchComponents = {
        ActiveFilters,
        ListingCard,
        SearchResults,
        FilterPanel
    };

})();

