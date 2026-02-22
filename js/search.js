// Search page functionality
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';

// Initialize state
let currentView = 'grid';
let currentRating = 0;
let currentSort = 'relevance';
let currentRadiusKm = 500; // Default to 500km to show all listings across Pakistan
let mapInstance = null;
let mapLoaded = false;
let mapMarkers = [];
let mapClusterSource = null;
let googleMapsScriptLoading = false;
let autocomplete = null;
let currentTier = 'all';
let adFreeOnly = false;
let lastResults = [];

// Define global functions IMMEDIATELY so they're available for inline onclick handlers
// These will be enhanced later when the full code loads
window.setView = function(view) {
    currentView = view;
    const mapContainer = document.getElementById('map-view-container');
    const listingsContainer = document.getElementById('listings-container');
    const listingsGrid = document.getElementById('listings-grid');
    
    if (view === 'map') {
        if (mapContainer) mapContainer.style.display = 'block';
        if (listingsContainer) listingsContainer.style.display = 'none';
    } else {
        if (mapContainer) mapContainer.style.display = 'none';
        if (listingsContainer) listingsContainer.style.display = 'block';
        
        // Apply view class to listings container
        if (listingsContainer) {
            listingsContainer.classList.remove('view-grid', 'view-list');
            if (view === 'list') {
                listingsContainer.classList.add('view-list');
            } else {
                listingsContainer.classList.add('view-grid');
            }
        }
    }
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === view) btn.classList.add('active');
    });
    
    if (typeof ensureMapInitialized === 'function') {
        ensureMapInitialized();
        setTimeout(() => { if (typeof renderMapMarkers === 'function') renderMapMarkers(); }, 500);
    }
};

window.setRating = function(rating) {
    currentRating = rating;
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.classList.remove('active');
        const text = btn.textContent.trim();
        if (text.startsWith(String(rating))) btn.classList.add('active');
    });
    if (typeof window.performSearch === 'function') window.performSearch();
};

window.clearFilters = function() {
    ['search-input', 'search-location-input', 'category-filter', 'location-filter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['instant-booking', 'verified-only'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });
    const priceSlider = document.getElementById('price-slider');
    const priceValue = document.getElementById('price-value');
    const priceMin = document.getElementById('price-min');
    const priceMinDisplay = document.getElementById('price-min-display');
    if (priceSlider) priceSlider.value = 200000;
    if (priceValue) priceValue.textContent = '200,000';
    if (priceMin) priceMin.value = 0;
    if (priceMinDisplay) priceMinDisplay.textContent = '0';
    currentRating = 0;
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active'));
    if (typeof window.performSearch === 'function') window.performSearch();
};

window.setTier = function(tier, silent) {
    currentTier = tier;
    document.querySelectorAll('.tier-pill').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tier') === tier);
    });
    if (!silent) {
        if (typeof window.performSearch === 'function') window.performSearch();
        if (typeof updateActiveFilters === 'function') updateActiveFilters();
    }
};

window.toggleAdFreeOnly = function(val, silent) {
    adFreeOnly = val;
    const chk = document.getElementById('adfree-only');
    if (chk) chk.checked = val;
    if (!silent) {
        if (typeof window.performSearch === 'function') window.performSearch();
        if (typeof updateActiveFilters === 'function') updateActiveFilters();
    }
};

window.setRadius = function(val) {
    currentRadiusKm = parseInt(val) || 500;
    const radiusValue = document.getElementById('radius-value');
    const distanceDisplayValue = document.getElementById('distance-display-value');
    if (radiusValue) radiusValue.textContent = `${currentRadiusKm} km`;
    if (distanceDisplayValue) distanceDisplayValue.textContent = `${currentRadiusKm} km`;
    if (typeof window.performSearch === 'function') window.performSearch();
};

window.handleSort = function(sortValue) {
    currentSort = sortValue;
    if (typeof window.performSearch === 'function') window.performSearch();
};

window.removeFilter = function(type) {
    switch(type) {
        case 'category': const cat = document.getElementById('category-filter'); if (cat) cat.value = ''; break;
        case 'location': const loc = document.getElementById('location-filter'); if (loc) loc.value = ''; break;
        case 'price':
            const pMin = document.getElementById('price-min');
            const pMax = document.getElementById('price-max');
            const pSlider = document.getElementById('price-slider');
            if (pMin) pMin.value = 0;
            if (pMax) pMax.value = 200000;
            if (pSlider) pSlider.value = 200000;
            break;
        case 'instant': const inst = document.getElementById('instant-booking'); if (inst) inst.checked = false; break;
        case 'verified': const ver = document.getElementById('verified-only'); if (ver) ver.checked = false; break;
        case 'rating': currentRating = 0; document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active')); break;
        case 'tier': if (typeof window.setTier === 'function') window.setTier('all', true); break;
        case 'adfree': if (typeof window.toggleAdFreeOnly === 'function') window.toggleAdFreeOnly(false, true); break;
        case 'radius': if (typeof window.setRadius === 'function') window.setRadius(500); break;
    }
    if (typeof window.performSearch === 'function') window.performSearch();
    if (typeof updateActiveFilters === 'function') updateActiveFilters();
};

// Utility function to generate local placeholder image (SVG data URI)
function getPlaceholderImage(width = 400, height = 300, text = 'No Image') {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e9ecef"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Debounce search to prevent too many API calls
let searchTimeout = null;
let currentSearchController = null;

// Make performSearch globally available
window.performSearch = async function() {
    // Cancel previous search if still pending
    if (currentSearchController) {
        currentSearchController.abort();
    }
    
    // Clear existing timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Debounce search by 300ms
    return new Promise((resolve) => {
        searchTimeout = setTimeout(async () => {
            currentSearchController = new AbortController();
            try {
                await performSearchInternal();
                resolve();
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Search error:', error);
                }
                resolve();
            } finally {
                currentSearchController = null;
            }
        }, 300);
    });
};

// Internal search function
async function performSearchInternal() {
    const searchLocation = document.getElementById('search-location-input')?.value || '';
    const searchQuery = searchLocation || document.getElementById('search-input')?.value || '';
    const rawCategory = document.getElementById('category-filter')?.value || '';
    const location = document.getElementById('location-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || 'active';
    const instantBooking = document.getElementById('instant-booking')?.checked || false;
    const verifiedOnly = document.getElementById('verified-only')?.checked || false;
    const priceSliderEl = document.getElementById('price-slider');
    const priceMaxInput = document.getElementById('price-max');
    const priceMinInput = document.getElementById('price-min');
    const sliderMax = priceSliderEl ? parseInt(priceSliderEl.max || '0') : null;
    const maxPrice = priceSliderEl
        ? parseInt(priceSliderEl.value)
        : parseInt(priceMaxInput?.value || '');
    const minPrice = priceMinInput ? parseInt(priceMinInput.value || '0') : 0;
    const rating = currentRating;

    const params = new URLSearchParams();
    if (searchQuery) params.set('query', searchQuery);

    // Normalize category from UI / URL to backend enum (property, vehicles, clothes, equipment, service_providers, animals, boat, air_transport)
    if (rawCategory) {
        const categoryMap = {
            'service-providers': 'service_providers',
            'serviceProviders': 'service_providers',
            'air-transport': 'air_transport',
            'airTransport': 'air_transport',
        };
        const mapped = categoryMap[rawCategory] || rawCategory;
        const normalizedCategory = mapped.toLowerCase().replace(/-/g, '_');
        params.set('category', normalizedCategory);
    }
    
    // Handle subcategory filter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const rawSubCategory = urlParams.get('subcategory') || urlParams.get('subCategory');
    if (rawSubCategory) {
        const normalizedSubCategory = String(rawSubCategory).toLowerCase().replace(/-/g, '_');
        params.set('subCategory', normalizedSubCategory);
        console.log(`🔍 Subcategory filter: ${normalizedSubCategory}`);
    }
    if (location) params.set('city', location);
    if (instantBooking) params.set('instant', 'true');
    if (verifiedOnly) params.set('verified', 'true');
    if (!isNaN(minPrice) && minPrice > 0) params.set('priceMin', String(minPrice));
    if (!isNaN(maxPrice) && (!sliderMax || maxPrice < sliderMax)) params.set('priceMax', String(maxPrice));
    if (statusFilter) params.set('status', statusFilter);
    if (rating > 0) params.set('ratingMin', String(rating));
    params.set('sort', currentSort);

    try {
        console.log(`🔍 Searching listings: ${API_BASE_URL}/listings?${params.toString()}`);
        
        // Show loading state
        const container = document.getElementById('listings-grid');
        const resultsCount = document.getElementById('results-count');
        if (container && container.children.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-3 text-muted">Searching listings...</p></div>';
        }
        if (resultsCount) {
            resultsCount.textContent = '...';
        }
        
        // Use the current search controller if available, otherwise create new one
        const controller = currentSearchController || new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            if (resultsCount) resultsCount.textContent = '0';
            const emptyState = document.getElementById('empty-state');
            if (emptyState) {
                emptyState.style.display = 'flex';
                emptyState.innerHTML = `
                    <div class="empty-state-icon">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <h3>Slow Server Response</h3>
                    <p>The server is taking longer than expected. This is a backend performance issue.</p>
                    <button class="btn-clear-filters" onclick="performSearch()">Retry Search</button>
                `;
            }
        }, 30000); // 30 second timeout
        
        // Add limit to prevent fetching too many listings at once
        // Reduced to 20 for faster initial load on 25 Mbps connection
        if (!params.has('limit')) {
            params.set('limit', '20'); // Limit to 20 listings per request for faster loading
        }
        
        // Add pagination support
        if (!params.has('page')) {
            params.set('page', '1');
        }
        
        const startTime = Date.now();
        const response = await fetch(`${API_BASE_URL}/listings?${params.toString()}`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        
        const responseTime = Date.now() - startTime;
        const data = await response.json();
        
        // Log response time warning if slow
        if (responseTime > 5000) {
            console.warn(`⚠️ Slow API response: ${responseTime}ms - backend performance issue`);
        } else {
            console.log(`⏱️ API Response time: ${responseTime}ms`);
        }
        
        console.log(`📦 API Response:`, data.status, `- ${data.results || 0} listings returned`);
        
        if (!response.ok || data.status !== 'success') {
            console.error('Search listings failed:', data);
            displayListings([]);
            const resultsCount = document.getElementById('results-count');
            if (resultsCount) resultsCount.textContent = '0';
            updateActiveFilters();
            return;
        }

        // Debug: Log raw listings from API
        if (data.listings && data.listings.length > 0) {
            console.log(`📋 Raw listings from API:`, data.listings.map(l => ({
                id: l._id,
                title: l.title,
                category: l.category,
                status: l.status,
                price: l.pricing?.amount
            })));
        }

        // Map backend listings to frontend structure
        const mapped = (data.listings || []).map(l => {
            const locCity = l.location?.city || '';
            const locProv = l.location?.province || '';
            const locationText = [locCity, locProv].filter(Boolean).join(', ') || (l.location?.address || '');
            const owner = l.owner || {};
            const accountType = owner.accountType || 'free';
            const adFree = accountType === 'paid';
            const stats = l.stats || {};
            return {
                id: l._id,
                title: l.title,
                category: l.category,
                subCategory: l.subCategory,
                location: locationText,
                price: l.pricing?.amount || 0,
                period: l.pricing?.model || 'day',
                rating: stats.averageRating || 0,
                reviewCount: stats.totalReviews || 0,
                image: (l.images && l.images[0]?.url) || l.featuredImage || getPlaceholderImage(400, 300, 'Listing'),
                verified: !!l.verified,
                instant: !!l.availability?.instantBooking,
                accountType,
                ownerVerified: !!owner.verified || 
                              owner.verification?.status === 'verified' || 
                              accountType === 'paid',
                adFree,
                coords: l.location?.coordinates
                    ? { lat: l.location.coordinates.lat, lng: l.location.coordinates.lng }
                    : null,
            };
        });
        
        // Additional client-side category and subcategory filter to ensure strict matching
        // This is a safety net in case backend filtering has any issues
        let filteredByCategory = mapped;
        if (rawCategory) {
            const categoryMap = {
                'service-providers': 'service_providers',
                'serviceProviders': 'service_providers',
                'air-transport': 'air_transport',
                'airTransport': 'air_transport',
            };
            const mappedCategory = categoryMap[rawCategory] || rawCategory;
            const selectedCategory = mappedCategory.toLowerCase().replace(/-/g, '_');
            
            filteredByCategory = mapped.filter(listing => {
                const listingCategory = String(listing.category || '').toLowerCase().replace(/-/g, '_');
                const matches = listingCategory === selectedCategory;
                if (!matches && listing.category) {
                    console.warn(`⚠️ Listing "${listing.title}" has category "${listing.category}" but filter is "${selectedCategory}" - filtering out`);
                }
                return matches;
            });
            console.log(`🔍 Category filter: ${mapped.length} → ${filteredByCategory.length} listings (category: ${selectedCategory})`);
        }
        
        // Apply subcategory filter if provided
        if (rawSubCategory) {
            const normalizedSubCategory = String(rawSubCategory).toLowerCase().replace(/-/g, '_');
            const beforeSubFilter = filteredByCategory.length;
            filteredByCategory = filteredByCategory.filter(listing => {
                const listingSubCategory = String(listing.subCategory || '').toLowerCase().replace(/-/g, '_');
                const matches = listingSubCategory === normalizedSubCategory || 
                              listingSubCategory.replace(/-/g, '_') === normalizedSubCategory.replace(/-/g, '_');
                if (!matches && listing.subCategory) {
                    console.warn(`⚠️ Listing "${listing.title}" has subcategory "${listing.subCategory}" but filter is "${normalizedSubCategory}" - filtering out`);
                }
                return matches;
            });
            console.log(`🔍 Subcategory filter: ${beforeSubFilter} → ${filteredByCategory.length} listings (subcategory: ${normalizedSubCategory})`);
        }

        // Client-side filters that depend on currentTier / adFreeOnly / radius
        // Note: filteredByCategory already applied strict category filtering above
        let filtered = filteredByCategory.filter(listing => {
            if (currentTier !== 'all' && listing.accountType !== currentTier) return false;
            if (adFreeOnly && !listing.adFree) return false;
            if (!passRadiusFilter(listing)) return false;
            return true;
        });

        filtered = sortListings(filtered, currentSort);

        console.log(`✅ Displaying ${filtered.length} listings after filtering (tier: ${currentTier}, adFreeOnly: ${adFreeOnly}, radius: ${currentRadiusKm}km)`);
        if (filtered.length > 0) {
            console.log(`📋 Filtered listings:`, filtered.map(l => ({ id: l.id, title: l.title, price: l.price })));
        }

        lastResults = filtered;
        displayListings(filtered);
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) resultsCount.textContent = filtered.length;
        updateActiveFilters();
        
        // Geocode search location if provided (optional - for map centering)
        if (searchQuery && typeof geocodeSearchLocation === 'function') {
            geocodeSearchLocation(searchQuery);
        }
        
        if (currentView === 'map') {
            renderMapMarkers();
        }
    } catch (err) {
        console.error('Search error:', err);
        if (err.name === 'AbortError') {
            console.error('Request timeout: API took too long to respond');
        displayListings([]);
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) resultsCount.textContent = '0';
        updateActiveFilters();
            // Show error message to user
            const emptyState = document.getElementById('empty-state');
            if (emptyState) {
                emptyState.style.display = 'flex';
                emptyState.innerHTML = `
                    <div class="empty-state-icon">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <h3>Request Timeout</h3>
                    <p>The server is taking too long to respond. Please try again or check your network connection.</p>
                    <button class="btn-clear-filters" onclick="performSearch()">Retry</button>
                `;
    }
        } else {
            displayListings([]);
            const resultsCount = document.getElementById('results-count');
            if (resultsCount) resultsCount.textContent = '0';
            updateActiveFilters();
        }
    }
}

// Functions already defined at top of file

function displayListings(listings) {
    const container = document.getElementById('listings-grid');
    const emptyState = document.getElementById('empty-state');
    const listingsContainer = document.getElementById('listings-container');
    
    if (!container) {
        console.error('listings-grid container not found!');
        return;
    }

    // Ensure listings container is visible
    if (listingsContainer) {
        listingsContainer.style.display = 'block';
    }

    if (listings.length === 0) {
        container.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        console.log('No listings to display');
        return;
    }

    container.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    
    console.log(`Displaying ${listings.length} listings`);

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    if (currentView === 'list') {
        container.className = 'row g-4';
        listings.forEach(listing => {
            const listingDiv = document.createElement('div');
            listingDiv.className = 'col-12';
            listingDiv.innerHTML = `
                <a href="listing-detail.html?id=${listing.id}" class="listing-card-list" style="text-decoration: none; color: inherit;">
                    <div class="row g-0">
                        <div class="col-md-4">
                            <div class="listing-image-container">
                                <img src="${listing.image}" alt="${listing.title}" class="listing-image" loading="lazy" onerror="this.src='${getPlaceholderImage(400, 300, 'No Image')}'">
                                ${listing.verified ? '<span class="badge-verified"><i class="bi bi-check-circle-fill"></i> Verified</span>' : ''}
                                ${listing.instant ? '<span class="badge-instant"><i class="bi bi-lightning-charge-fill"></i> Instant</span>' : ''}
                                ${listing.accountType === 'paid' && listing.ownerVerified ? '<span class="badge-account-paid"><i class="bi bi-star-fill"></i> Premium</span>' : ''}
                                ${listing.accountType === 'paid' && listing.adFree ? '<span class="badge bg-success-subtle text-success-emphasis ms-1">Ad-free</span>' : ''}
                                ${listing.accountType === 'free' ? `<span class="badge bg-warning-subtle text-warning-emphasis badge-ad-timer" data-ad-expiry="${listing.adExpiresAt || ''}">Ad ends in ${formatCountdown(listing.adExpiresAt)}</span>` : ''}
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="listing-content">
                                <div class="listing-header">
                                    <h3 class="listing-title">${listing.title}</h3>
                                    ${listing.accountType === 'paid' ? '<span class="account-badge-paid" title="Verified Premium Account"><i class="bi bi-shield-check"></i></span>' : ''}
                                </div>
                                <p class="listing-location"><i class="bi bi-geo-alt"></i> ${listing.location}</p>
                <div class="listing-rating">
                    <i class="bi bi-star-fill"></i> ${listing.rating.toFixed ? listing.rating.toFixed(1) : listing.rating}
                    <span class="reviews-count">(${listing.reviewCount || 0} reviews)</span>
                </div>
                                <div class="listing-price">
                                    <span class="price-amount">Rs ${listing.price.toLocaleString()}</span>
                                    <span class="price-period">/${listing.period}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>
            `;
            fragment.appendChild(listingDiv);
        });
    } else {
        // Grid view - horizontal scroll gallery
        container.className = 'row listings-grid-animated';
        container.setAttribute('tabindex', '0');
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Listings gallery');
        
        listings.forEach(listing => {
            const listingDiv = document.createElement('div');
            listingDiv.className = 'col-md-4 col-sm-6';
            // Use smaller image size for thumbnails (optimize for 25 Mbps)
            const placeholder = getPlaceholderImage(400, 300, 'No Image');
            // Use data-src for lazy loading, src will be set by IntersectionObserver
            listingDiv.innerHTML = `
                <a href="listing-detail.html?id=${listing.id}" class="listing-card">
                    <div class="listing-image-container">
                        <div class="image-skeleton"></div>
                        <img src="${placeholder}" 
                             data-src="${listing.image}" 
                             alt="${listing.title}" 
                             class="listing-image lazy-load" 
                             loading="lazy"
                             decoding="async"
                             onerror="this.onerror=null; this.src='${placeholder}'; this.classList.add('loaded');">
                        ${listing.verified ? '<span class="badge-verified"><i class="bi bi-check-circle-fill"></i> Verified</span>' : ''}
                        ${listing.instant ? '<span class="badge-instant"><i class="bi bi-lightning-charge-fill"></i> Instant</span>' : ''}
                        ${listing.accountType === 'paid' && listing.ownerVerified ? '<span class="badge-account-paid"><i class="bi bi-star-fill"></i> Premium</span>' : ''}
                        ${listing.accountType === 'paid' && listing.adFree ? '<span class="badge bg-success-subtle text-success-emphasis ms-1">Ad-free</span>' : ''}
                        ${listing.accountType === 'free' ? `<span class="badge bg-warning-subtle text-warning-emphasis badge-ad-timer" data-ad-expiry="${listing.adExpiresAt || ''}">Ad ends in ${formatCountdown(listing.adExpiresAt)}</span>` : ''}
                    </div>
                    <div class="listing-content">
                        <div class="listing-header">
                            <h3 class="listing-title">${listing.title}</h3>
                            ${listing.accountType === 'paid' ? '<span class="account-badge-paid" title="Verified Premium Account"><i class="bi bi-shield-check"></i></span>' : ''}
                        </div>
                        <p class="listing-location"><i class="bi bi-geo-alt"></i> ${listing.location}</p>
                        <div class="listing-rating">
                            <i class="bi bi-star-fill"></i> ${listing.rating.toFixed ? listing.rating.toFixed(1) : listing.rating}
                            <span class="reviews-count">(${listing.reviewCount || 0} reviews)</span>
                        </div>
                        <div class="listing-price">
                            <span class="price-amount">Rs ${listing.price.toLocaleString()}</span>
                            <span class="price-period">/${listing.period}</span>
                        </div>
                    </div>
                </a>
            `;
            fragment.appendChild(listingDiv);
        });
    }

    // Clear container and append fragment in one operation
    container.innerHTML = '';
    container.appendChild(fragment);
    
    // Use requestAnimationFrame for smoother rendering
    requestAnimationFrame(() => {
    insertAdSlots(container);
    initAdCountdowns();
        // Initialize lazy loading for images
        initLazyLoading();
    });
}

// Lazy load images using Intersection Observer for better performance
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('.listing-image.lazy-load');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const dataSrc = img.getAttribute('data-src');
                    if (dataSrc) {
                        // Load image with fade-in effect
                        img.src = dataSrc;
                        img.classList.add('loaded');
                        img.classList.remove('lazy-load');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before image enters viewport
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for browsers without IntersectionObserver
        lazyImages.forEach(img => {
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
                img.src = dataSrc;
            }
        });
    }
}

// Functions are already defined at the top of the file
// Update them to use local variables and full functionality
(function() {
    const origSetView = window.setView;
    window.setView = function(view) {
        currentView = view;
        if (origSetView) origSetView(view);
        else {
            const mapContainer = document.getElementById('map-view-container');
            const listingsContainer = document.getElementById('listings-container');
            if (view === 'map') {
                if (mapContainer) mapContainer.style.display = 'block';
                if (listingsContainer) listingsContainer.style.display = 'none';
                if (typeof ensureMapInitialized === 'function') {
                    ensureMapInitialized();
                    setTimeout(() => { if (typeof renderMapMarkers === 'function') renderMapMarkers(); }, 500);
                }
            } else {
                if (mapContainer) mapContainer.style.display = 'none';
                if (listingsContainer) listingsContainer.style.display = 'block';
                
                // Apply view class to listings container
                if (listingsContainer) {
                    listingsContainer.classList.remove('view-grid', 'view-list');
                    if (view === 'list') {
                        listingsContainer.classList.add('view-list');
                    } else {
                        listingsContainer.classList.add('view-grid');
                    }
                }
            }
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-view') === view) btn.classList.add('active');
            });
        }
    };

    const origSetRating = window.setRating;
    window.setRating = function(rating) {
        currentRating = rating;
        if (origSetRating) origSetRating(rating);
        else {
            document.querySelectorAll('.rating-btn').forEach(btn => {
                btn.classList.remove('active');
                const text = btn.textContent.trim();
                if (text.startsWith(String(rating))) btn.classList.add('active');
            });
            if (typeof window.performSearch === 'function') window.performSearch();
        }
    };

    const origClearFilters = window.clearFilters;
    window.clearFilters = function() {
        currentRating = 0;
        if (origClearFilters) origClearFilters();
        else {
            ['search-input', 'search-location-input', 'category-filter', 'location-filter'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            ['instant-booking', 'verified-only'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.checked = false;
            });
            const priceSlider = document.getElementById('price-slider');
            const priceValue = document.getElementById('price-value');
            const priceMin = document.getElementById('price-min');
            const priceMinDisplay = document.getElementById('price-min-display');
            if (priceSlider) priceSlider.value = 200000;
            if (priceValue) priceValue.textContent = '200,000';
            if (priceMin) priceMin.value = 0;
            if (priceMinDisplay) priceMinDisplay.textContent = '0';
            document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active'));
            if (typeof window.performSearch === 'function') window.performSearch();
        }
    };

    const origSetTier = window.setTier;
    window.setTier = function(tier, silent) {
        currentTier = tier;
        if (origSetTier) origSetTier(tier, silent);
        else {
            document.querySelectorAll('.tier-pill').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-tier') === tier);
            });
            if (!silent) {
                if (typeof window.performSearch === 'function') window.performSearch();
                if (typeof updateActiveFilters === 'function') updateActiveFilters();
            }
        }
    };

    const origToggleAdFreeOnly = window.toggleAdFreeOnly;
    window.toggleAdFreeOnly = function(val, silent) {
        adFreeOnly = val;
        if (origToggleAdFreeOnly) origToggleAdFreeOnly(val, silent);
        else {
            const chk = document.getElementById('adfree-only');
            if (chk) chk.checked = val;
            if (!silent) {
                if (typeof window.performSearch === 'function') window.performSearch();
                if (typeof updateActiveFilters === 'function') updateActiveFilters();
            }
        }
    };

    // Initialize guests filter display
    const filterGuests = document.getElementById('filter-guests');
    const guestsDisplayValue = document.getElementById('guests-display-value');
    if (filterGuests && guestsDisplayValue) {
        filterGuests.addEventListener('input', function() {
            const guests = parseInt(this.value) || 1;
            guestsDisplayValue.textContent = guests === 1 ? '1 Guest' : `${guests} Guests`;
        });
        // Set initial display
        const initialGuests = parseInt(filterGuests.value) || 1;
        guestsDisplayValue.textContent = initialGuests === 1 ? '1 Guest' : `${initialGuests} Guests`;
    }

    // Initialize distance filter display
    const filterDistance = document.getElementById('filter-distance');
    const distanceDisplayValue = document.getElementById('distance-display-value');
    if (filterDistance && distanceDisplayValue) {
        filterDistance.addEventListener('input', function() {
            const distance = parseInt(this.value) || 50;
            distanceDisplayValue.textContent = `${distance} km`;
            // Sync with toolbar radius filter
            const radiusRange = document.getElementById('radius-range');
            const radiusValue = document.getElementById('radius-value');
            if (radiusRange) radiusRange.value = distance;
            if (radiusValue) radiusValue.textContent = `${distance} km`;
            if (typeof window.setRadius === 'function') window.setRadius(distance);
        });
        // Set initial display
        const initialDistance = parseInt(filterDistance.value) || 50;
        distanceDisplayValue.textContent = `${initialDistance} km`;
    }

    // Sync toolbar radius filter with filter panel distance filter
    const radiusRange = document.getElementById('radius-range');
    if (radiusRange && filterDistance) {
        radiusRange.addEventListener('input', function() {
            const distance = parseInt(this.value) || 50;
            filterDistance.value = distance;
            if (distanceDisplayValue) distanceDisplayValue.textContent = `${distance} km`;
            if (typeof window.setRadius === 'function') window.setRadius(distance);
        });
    }

    const origSetRadius = window.setRadius;
    window.setRadius = function(val) {
        currentRadiusKm = parseInt(val) || 500;
        if (origSetRadius) origSetRadius(val);
        else {
            const radiusValue = document.getElementById('radius-value');
            if (radiusValue) radiusValue.textContent = `${currentRadiusKm} km`;
            if (typeof window.performSearch === 'function') window.performSearch();
        }
    };

    const origHandleSort = window.handleSort;
    window.handleSort = function(sortValue) {
        currentSort = sortValue;
        if (origHandleSort) origHandleSort(sortValue);
        else {
            if (typeof window.performSearch === 'function') window.performSearch();
        }
    };
})();

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Price slider update
    const priceSlider = document.getElementById('price-slider');
    const priceValue = document.getElementById('price-value');
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    const priceMinDisplay = document.getElementById('price-min-display');
    
    const triggerPriceSearch = () => {
        if (typeof performSearch === 'function') performSearch();
        if (typeof updateActiveFilters === 'function') updateActiveFilters();
    };

    if (priceSlider && priceValue) {
        // Align defaults to "no max" by using the slider's max value
        const sliderMax = parseInt(priceSlider.max || '0');
        if (!priceSlider.value) priceSlider.value = sliderMax;
        if (priceMax && !priceMax.value) priceMax.value = sliderMax;
        const currentVal = parseInt(priceSlider.value) || sliderMax;
        priceValue.textContent = currentVal >= sliderMax ? 'Any' : currentVal.toLocaleString();

        priceSlider.addEventListener('input', function() {
            const value = parseInt(this.value) || sliderMax;
            priceValue.textContent = value >= sliderMax ? 'Any' : value.toLocaleString();
            if (priceMax) {
                priceMax.value = value;
            }
            triggerPriceSearch();
        });
    }

    if (priceMin && priceMinDisplay) {
        priceMin.addEventListener('input', function() {
            const minVal = parseInt(this.value || 0);
            priceMinDisplay.textContent = minVal.toLocaleString();
            if (priceSlider) {
                priceSlider.min = minVal;
                if (parseInt(priceSlider.value) < minVal) {
                    priceSlider.value = minVal;
                    if (priceValue) priceValue.textContent = minVal.toLocaleString();
                }
            }
            triggerPriceSearch();
        });
    }

    if (priceMax && priceSlider) {
        priceMax.addEventListener('input', function() {
            const value = parseInt(this.value || priceSlider.max || 0);
            priceSlider.value = value;
            if (priceValue) {
                const sliderMax = parseInt(priceSlider.max || '0');
                priceValue.textContent = value >= sliderMax ? 'Any' : value.toLocaleString();
            }
            triggerPriceSearch();
        });
    }

    // Price quick chips
    const priceChips = document.querySelectorAll('#price-chips .filter-chip');
    if (priceChips.length && priceSlider && priceMax) {
        const sliderMax = parseInt(priceSlider.max || '0');
        priceChips.forEach(chip => {
            chip.addEventListener('click', () => {
                priceChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const val = chip.getAttribute('data-price-max');
                let maxVal = sliderMax;
                if (val && val !== 'any') {
                    maxVal = parseInt(val) || sliderMax;
                }
                priceSlider.value = maxVal;
                priceMax.value = maxVal;
                if (priceValue) {
                    priceValue.textContent = maxVal >= sliderMax ? 'Any' : maxVal.toLocaleString();
                }
                triggerPriceSearch();
            });
        });
    }

    // Category chips
    const categoryChips = document.querySelectorAll('#category-chips .filter-chip');
    const categorySelect = document.getElementById('category-filter');
    if (categoryChips.length && categorySelect) {
        categoryChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const value = chip.getAttribute('data-category') || '';
                categorySelect.value = value;
                categoryChips.forEach(c => c.classList.toggle('active', c === chip));
                performSearch();
                updateActiveFilters();
            });
        });
    }

    // Status filter (active/pending/all)
    const statusSelect = document.getElementById('status-filter');
    if (statusSelect) {
        statusSelect.addEventListener('change', () => {
            performSearch();
            updateActiveFilters();
        });
    }

    // Collapsible filter sections
    const collapsibleSections = document.querySelectorAll('.filter-section[data-collapsible]');
    collapsibleSections.forEach(section => {
        const header = section.querySelector('.filter-section-header');
        if (!header) return;
        header.addEventListener('click', () => {
            section.classList.toggle('collapsed');
        });
    });

    // Pre-fill filters from URL (e.g. category-wise navigation)
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('category');
    const initialSubCategory = urlParams.get('subcategory') || urlParams.get('subCategory');
    const initialCity = urlParams.get('city');
    const categoryFilterEl = document.getElementById('category-filter');
    const locationFilterEl = document.getElementById('location-filter');

    if (initialCategory && categoryFilterEl) {
        // Normalize category for filter dropdown (service_providers -> service-providers)
        const categoryMap = {
            'service_providers': 'service-providers',
            'air_transport': 'air-transport',
        };
        const displayCategory = categoryMap[initialCategory] || initialCategory;
        categoryFilterEl.value = displayCategory;
    }
    if (initialCity && locationFilterEl) {
        locationFilterEl.value = initialCity;
    }
    
    // Log subcategory filter if present
    if (initialSubCategory) {
        console.log(`🔍 Subcategory filter from URL: ${initialSubCategory}`);
    }

    // Show loading state before initial search
    const container = document.getElementById('listings-grid');
    if (container) {
        container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-3 text-muted">Loading listings...</p></div>';
    }
    
    // Load initial listings (honouring any URL filters) with slight delay for better UX
    setTimeout(() => {
    performSearch();
    }, 100);

    // Enter key search
    const searchInput = document.getElementById('search-input');
    const searchLocationInput = document.getElementById('search-location-input');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    if (searchLocationInput) {
        searchLocationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Search button click
    const searchSubmitButton = document.getElementById('search-submit-button');
    if (searchSubmitButton) {
        searchSubmitButton.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch();
        });
    }

    // Radius slider (toolbar)
    const radiusRange = document.getElementById('radius-range');
    if (radiusRange) {
        radiusRange.addEventListener('input', function() {
            setRadius(this.value);
        });
    }

    // Distance filter (filter panel) - sync with toolbar radius
    const filterDistance = document.getElementById('filter-distance');
    const distanceDisplayValue = document.getElementById('distance-display-value');
    if (filterDistance && distanceDisplayValue) {
        filterDistance.addEventListener('input', function() {
            const distance = parseInt(this.value) || 50;
            distanceDisplayValue.textContent = `${distance} km`;
            // Sync with toolbar radius filter
            if (radiusRange) {
                radiusRange.value = distance;
                setRadius(distance);
            }
        });
        // Set initial display
        const initialDistance = parseInt(filterDistance.value) || 50;
        distanceDisplayValue.textContent = `${initialDistance} km`;
    }

    // Guests filter
    const filterGuests = document.getElementById('filter-guests');
    const guestsDisplayValue = document.getElementById('guests-display-value');
    if (filterGuests && guestsDisplayValue) {
        filterGuests.addEventListener('input', function() {
            const guests = parseInt(this.value) || 1;
            guestsDisplayValue.textContent = guests === 1 ? '1 Guest' : `${guests} Guests`;
        });
        // Set initial display
        const initialGuests = parseInt(filterGuests.value) || 1;
        guestsDisplayValue.textContent = initialGuests === 1 ? '1 Guest' : `${initialGuests} Guests`;
    }

    // Initialize view class on listings container
    const listingsContainer = document.getElementById('listings-container');
    if (listingsContainer) {
        listingsContainer.classList.add('view-grid'); // Default to grid view
    }

    // Filter checkboxes
    const instantBooking = document.getElementById('instant-booking');
    if (instantBooking) {
        instantBooking.addEventListener('change', function() {
            performSearch();
            updateActiveFilters();
        });
    }

    const verifiedOnly = document.getElementById('verified-only');
    if (verifiedOnly) {
        verifiedOnly.addEventListener('change', function() {
            performSearch();
            updateActiveFilters();
        });
    }

    const adfreeOnly = document.getElementById('adfree-only');
    if (adfreeOnly) {
        adfreeOnly.addEventListener('change', function() {
            toggleAdFreeOnly(this.checked);
        });
    }

    // Category filter (avoid duplicate declaration)
    const categoryFilterDropdown = document.getElementById('category-filter');
    if (categoryFilterDropdown) {
        categoryFilterDropdown.addEventListener('change', function() {
            performSearch();
            updateActiveFilters();
        });
    }

    // Location filter (avoid duplicate declaration)
    const locationFilterInput = document.getElementById('location-filter');
    if (locationFilterInput) {
        locationFilterInput.addEventListener('input', function() {
            // Debounce search on location input
            clearTimeout(window.locationFilterTimeout);
            window.locationFilterTimeout = setTimeout(() => {
                performSearch();
                updateActiveFilters();
            }, 500);
        });
    }

    // Initialize location autocomplete (independent of map)
    initializeLocationAutocomplete();

    // Update active filters display
    updateActiveFilters();
});

// Initialize location autocomplete for main search input
function initializeLocationAutocomplete() {
    const locationInput = document.getElementById('search-location-input');
    if (!locationInput) return;

    // Wait for Google Maps to load
    const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(checkGoogleMaps);
            try {
                const autocomplete = new google.maps.places.Autocomplete(locationInput, {
                    types: ['geocode'],
                    componentRestrictions: { country: 'pk' }
                });

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.geometry) {
                        // Update location filter
                        const locationFilter = document.getElementById('location-filter');
                        if (locationFilter) {
                            locationFilter.value = place.name || place.formatted_address;
                        }
                        // Trigger search after a short delay
                        setTimeout(() => {
                            performSearch();
                        }, 300);
                    }
                });
            } catch (err) {
                console.warn('Location autocomplete initialization failed:', err);
            }
        }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkGoogleMaps);
    }, 5000);
}

function formatCountdown(timestamp) {
    if (!timestamp) return '48h left';
    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Expired';
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
}

function initAdCountdowns() {
    const nodes = document.querySelectorAll('.badge-ad-timer[data-ad-expiry]');
    nodes.forEach(node => {
        const expiry = parseInt(node.getAttribute('data-ad-expiry'));
        if (!expiry) return;
        const update = () => {
            node.textContent = `Ad ends in ${formatCountdown(expiry)}`;
        };
        update();
        setInterval(update, 60 * 1000);
    });
}

function insertAdSlots(container) {
    const cards = Array.from(container.children);
    const frequency = 3;
    if (!cards.length) return;
    const adTemplate = `
        <div class="ad-banner rotation-slot bg-light border rounded p-3 h-100">
            <div class="d-flex align-items-center mb-2">
                <i class="bi bi-megaphone text-danger me-2"></i>
                <strong>Ad slot</strong>
                <span class="badge bg-warning-subtle text-warning-emphasis ms-2">Rotates</span>
            </div>
            <p class="mb-1 small text-muted">Ready for 120s rotation and multiple creatives.</p>
            <p class="mb-0 small text-muted">Free accounts see ads here.</p>
        </div>
    `;
    let inserted = 0;
    for (let i = frequency; i < cards.length; i += frequency + 1) {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6 ad-slot';
        col.innerHTML = adTemplate;
        if (cards[i]) {
            container.insertBefore(col, cards[i]);
        } else {
            container.appendChild(col);
        }
        inserted++;
    }
    if (inserted === 0 && cards.length >= 2) {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6 ad-slot';
        col.innerHTML = adTemplate;
        container.insertBefore(col, cards[1]);
    }
}

function setRadius(val) {
    currentRadiusKm = parseInt(val || 500);
    const radiusValue = document.getElementById('radius-value');
    if (radiusValue) {
        radiusValue.textContent = currentRadiusKm >= 500 ? 'All Pakistan' : `${currentRadiusKm} km`;
    }
    performSearch();
    if (currentView === 'map') {
        renderMapMarkers();
    }
}

function passRadiusFilter(listing) {
    // Disable radius filter if radius is set to max (500km) or if no coords
    if (currentRadiusKm >= 500) return true;
    if (!listing.coords) return true;
    const center = getRadiusCenter();
    if (!center) return true;
    const dist = haversineDistance(center, listing.coords);
    return dist <= currentRadiusKm;
}

function getRadiusCenter() {
    // Demo center (Lahore). In production tie this to geocoded search location or user location.
    return { lat: 31.5204, lng: 74.3587 };
}

function haversineDistance(a, b) {
    const R = 6371;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

// Load Google Maps API
function loadGoogleMaps() {
    if (window.google && window.google.maps) {
        return Promise.resolve(window.google.maps);
    }
    if (googleMapsScriptLoading) {
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(check);
                    resolve(window.google.maps);
                }
            }, 100);
        });
    }
    googleMapsScriptLoading = true;
    return new Promise((resolve, reject) => {
        // Wait for Google Maps to load (from search.html script)
        const checkInterval = setInterval(() => {
            if (window.google && window.google.maps) {
                clearInterval(checkInterval);
                googleMapsScriptLoading = false;
                resolve(window.google.maps);
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            googleMapsScriptLoading = false;
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
            } else {
                // Don't reject - just log warning and continue without map
                console.warn('Google Maps API not loaded. Map features disabled.');
                resolve(null); // Resolve with null so search still works
            }
        }, 10000);
    });
}

function ensureMapInitialized() {
    if (mapInstance) return;
    const mapViewContainer = document.getElementById('map-view-container');
    if (!mapViewContainer) return;
    const container = document.getElementById('google-map');
    if (!container) {
        console.warn('Google map container not found');
        return;
    }
    
    loadGoogleMaps().then((maps) => {
        if (!maps || !window.google || !window.google.maps) {
            container.innerHTML = '<div class="p-4 text-center text-warning"><i class="bi bi-exclamation-triangle"></i><br><p>Google Maps API key not configured.</p><p class="small">Search functionality works without map. Add your API key in search.html to enable map view.</p></div>';
            return;
        }
        
        // Initialize Google Map
        mapInstance = new google.maps.Map(container, {
            center: { lat: 31.5204, lng: 74.3587 }, // Default: Lahore
            zoom: 6,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
        });

        // Initialize autocomplete for map search
        const searchInput = document.getElementById('map-search-input');
        if (searchInput) {
            try {
                autocomplete = new google.maps.places.Autocomplete(searchInput, {
                    types: ['geocode'],
                    componentRestrictions: { country: 'pk' } // Restrict to Pakistan
                });

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.geometry && mapInstance) {
                        mapInstance.setCenter(place.geometry.location);
                        mapInstance.setZoom(12);
                        // Update search location input
                        const locationInput = document.getElementById('search-location-input');
                        if (locationInput) {
                            locationInput.value = place.formatted_address || place.name;
                        }
                        performSearch();
                    }
                });
            } catch (err) {
                console.warn('Places Autocomplete failed:', err);
            }
        }

        // Location autocomplete is initialized separately on page load

        // Render markers after map loads
        google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
            renderMapMarkers();
        });
    }).catch((err) => {
        console.error('Google Maps initialization error:', err);
        if (container) {
            container.innerHTML = '<div class="p-4 text-center text-warning"><i class="bi bi-exclamation-triangle"></i><br><p>Map failed to load.</p><p class="small">Search functionality still works without map.</p></div>';
        }
    });
}

function renderMapMarkers() {
    if (!mapInstance || !window.google || !window.google.maps) {
        console.warn('Cannot render map markers: Google Maps not initialized');
        return;
    }
    
    // Clear existing markers
    mapMarkers.forEach(m => m.setMap(null));
    mapMarkers = [];

    const filtered = lastResults.filter(l => passRadiusFilter(l) && l.coords);
    if (!filtered.length) {
        return;
    }

    const bounds = new google.maps.LatLngBounds();

    filtered.forEach(listing => {
        const position = { lat: listing.coords.lat, lng: listing.coords.lng };
        bounds.extend(position);

        // Create custom marker icon
        const markerIcon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 0C9.5 0 1 8.5 1 19c0 10.5 19 31 19 31s19-20.5 19-31C39 8.5 30.5 0 20 0z" 
                          fill="${listing.accountType === 'paid' ? '#FF385C' : '#6B7280'}" 
                          stroke="white" stroke-width="2"/>
                    <text x="20" y="28" font-size="10" font-weight="bold" fill="white" text-anchor="middle">
                        Rs${Math.floor(listing.price / 1000)}k
                    </text>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 50),
            anchor: new google.maps.Point(20, 50)
        };

        // Create marker
        const marker = new google.maps.Marker({
            position: position,
            map: mapInstance,
            icon: markerIcon,
            title: listing.title
        });

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="listing-popup-content" style="max-width: 300px;">
                    <img src="${listing.image}" alt="${listing.title}" 
                         style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px 8px 0 0;" 
                         onerror="this.src='${getPlaceholderImage(300, 200, 'No Image')}'">
                    <div style="padding: 12px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${escapeHtml(listing.title)}</h4>
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                            <i class="bi bi-geo-alt"></i> ${escapeHtml(listing.location)}
                        </p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            ${listing.rating > 0 ? `
                            <span style="color: #f59e0b;">
                                <i class="bi bi-star-fill"></i> ${listing.rating.toFixed(1)}
                                ${listing.reviewCount > 0 ? `(${listing.reviewCount})` : ''}
                            </span>
                            ` : ''}
                            <span style="font-weight: 700; color: #FF385C;">
                                Rs ${listing.price.toLocaleString()}/${listing.period}
                            </span>
                        </div>
                        <div style="margin-bottom: 8px;">
                            ${listing.verified ? '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px;"><i class="bi bi-shield-check"></i> Verified</span>' : ''}
                            ${listing.instant ? '<span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;"><i class="bi bi-lightning-fill"></i> Instant</span>' : ''}
                        </div>
                        <a href="listing-detail.html?id=${listing.id}" 
                           style="display: inline-block; background: #FF385C; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; width: 100%; text-align: center;">
                            View Details <i class="bi bi-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `
        });

        // Add click listener
        marker.addListener('click', () => {
            // Close all other info windows
            mapMarkers.forEach(m => {
                if (m.infoWindow) m.infoWindow.close();
            });
            infoWindow.open(mapInstance, marker);
            marker.infoWindow = infoWindow;
        });

        marker.infoWindow = infoWindow;
        mapMarkers.push(marker);
    });

    // Fit map to show all markers
    if (filtered.length > 0) {
        mapInstance.fitBounds(bounds, {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
        });
    } else {
        // Fallback to center if no markers
        const center = getRadiusCenter();
        if (center && mapInstance) {
            mapInstance.setCenter({ lat: center.lat, lng: center.lng });
            mapInstance.setZoom(8);
        }
    }
    
    // Draw radius circle if radius filter is active
    drawRadiusCircle();
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Draw radius circle on map (Google Maps implementation)
let radiusCircle = null;

function drawRadiusCircle() {
    if (!mapInstance || !window.google || currentRadiusKm >= 500) {
        // Remove circle if radius is max or map not initialized
        if (radiusCircle) {
            radiusCircle.setMap(null);
            radiusCircle = null;
        }
        return;
    }
    
    const center = getRadiusCenter();
    if (!center) return;
    
    // Remove existing circle
    if (radiusCircle) {
        radiusCircle.setMap(null);
    }
    
    // Create new circle for Google Maps
    radiusCircle = new google.maps.Circle({
        strokeColor: '#FF385C',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: '#FF385C',
        fillOpacity: 0.1,
        map: mapInstance,
        center: { lat: center.lat, lng: center.lng },
        radius: currentRadiusKm * 1000 // Convert km to meters
    });
}

function updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('active-filters');
    if (!activeFiltersContainer) return;

    const filters = [];
    const category = document.getElementById('category-filter')?.value;
    const location = document.getElementById('location-filter')?.value;
    const instantBooking = document.getElementById('instant-booking')?.checked;
    const verifiedOnly = document.getElementById('verified-only')?.checked;
    const minRating = currentRating;
    const radius = currentRadiusKm;

    if (category) {
        filters.push({ label: category.charAt(0).toUpperCase() + category.slice(1), type: 'category' });
    }
    if (location) {
        filters.push({ label: location, type: 'location' });
    }
    if (instantBooking) {
        filters.push({ label: 'Instant Booking', type: 'instant' });
    }
    if (verifiedOnly) {
        filters.push({ label: 'Verified Only', type: 'verified' });
    }
    if (minRating > 0) {
        filters.push({ label: `${minRating}+ Rating`, type: 'rating' });
    }
    if (currentTier !== 'all') {
        filters.push({ label: currentTier === 'paid' ? 'Paid only' : 'Free only', type: 'tier' });
    }
    if (adFreeOnly) {
        filters.push({ label: 'Ad-free only', type: 'adfree' });
    }
    if (radius && radius < 500) {
        filters.push({ label: `${radius} km`, type: 'radius' });
    }

    if (filters.length === 0) {
        activeFiltersContainer.innerHTML = '';
        return;
    }

    activeFiltersContainer.innerHTML = filters.map(filter => `
        <div class="active-filter-tag">
            <span>${filter.label}</span>
            <button onclick="removeFilter('${filter.type}')" aria-label="Remove filter">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `).join('');
}

// removeFilter is already defined at top, just enhance it
(function() {
    const origRemoveFilter = window.removeFilter;
    window.removeFilter = function(type) {
        if (origRemoveFilter) {
            origRemoveFilter(type);
        } else {
            switch(type) {
                case 'category': const cat = document.getElementById('category-filter'); if (cat) cat.value = ''; break;
                case 'location': const loc = document.getElementById('location-filter'); if (loc) loc.value = ''; break;
                case 'price':
                    const pMin = document.getElementById('price-min');
                    const pMax = document.getElementById('price-max');
                    const pSlider = document.getElementById('price-slider');
                    if (pMin) pMin.value = 0;
                    if (pMax) pMax.value = 200000;
                    if (pSlider) pSlider.value = 200000;
                    break;
                case 'instant': const inst = document.getElementById('instant-booking'); if (inst) inst.checked = false; break;
                case 'verified': const ver = document.getElementById('verified-only'); if (ver) ver.checked = false; break;
                case 'rating': currentRating = 0; document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active')); break;
                case 'tier': if (typeof setTier === 'function') setTier('all', true); break;
                case 'adfree': if (typeof toggleAdFreeOnly === 'function') toggleAdFreeOnly(false, true); break;
                case 'radius': if (typeof setRadius === 'function') setRadius(500); break;
            }
            if (typeof window.performSearch === 'function') window.performSearch();
            if (typeof updateActiveFilters === 'function') updateActiveFilters();
        }
    };
})();

window.handleSort = function(sortValue) {
    currentSort = sortValue;
    performSearch();
};

function sortListings(listings, sortBy) {
    const sorted = [...listings];
    
    // Helper function to check if listing owner is verified
    const isVerified = (listing) => {
        return listing.ownerVerified === true || 
               listing.accountType === 'paid' ||
               listing.verified === true;
    };
    
    // Helper function for multi-level sorting: verified first, then by selected criteria
    const compareWithVerification = (a, b, compareFn) => {
        const aVerified = isVerified(a) ? 1 : 0;
        const bVerified = isVerified(b) ? 1 : 0;
        
        // First sort by verification (verified first)
        if (aVerified !== bVerified) {
            return bVerified - aVerified; // 1 (verified) comes before 0 (not verified)
        }
        
        // If verification status is same, use the provided comparison function
        return compareFn(a, b);
    };
    
    switch(sortBy) {
        case 'price-low':
            sorted.sort((a, b) => compareWithVerification(a, b, (a, b) => a.price - b.price));
            break;
        case 'price-high':
            sorted.sort((a, b) => compareWithVerification(a, b, (a, b) => b.price - a.price));
            break;
        case 'rating':
            sorted.sort((a, b) => compareWithVerification(a, b, (a, b) => b.rating - a.rating));
            break;
        case 'newest':
            sorted.sort((a, b) => compareWithVerification(a, b, (a, b) => b.id - a.id));
            break;
        case 'verified-first':
            // Explicit verified-first sort
            sorted.sort((a, b) => {
                const aVerified = isVerified(a) ? 1 : 0;
                const bVerified = isVerified(b) ? 1 : 0;
                if (aVerified !== bVerified) {
                    return bVerified - aVerified;
                }
                // If both have same verification, sort by newest
                return b.id - a.id;
            });
            break;
        case 'relevance':
        default:
            // Default: verified first, then by creation date (newest first)
            sorted.sort((a, b) => {
                const aVerified = isVerified(a) ? 1 : 0;
                const bVerified = isVerified(b) ? 1 : 0;
                if (aVerified !== bVerified) {
                    return bVerified - aVerified;
                }
                // If both have same verification, keep original order (already sorted by backend)
                return 0;
            });
            break;
    }
    
    return sorted;
}



// ============================================
// Parallax Gallery Scroll Indicators
// ============================================

function initListingsGallery() {
    const gallery = document.getElementById('listings-grid');
    const scrollLeft = document.getElementById('listings-scroll-left');
    const scrollRight = document.getElementById('listings-scroll-right');
    
    if (!gallery || !scrollLeft || !scrollRight) return;
    
    function updateScrollIndicators() {
        const isAtStart = gallery.scrollLeft <= 10;
        const isAtEnd = gallery.scrollLeft >= gallery.scrollWidth - gallery.clientWidth - 10;
        
        // Use visible class like categories gallery
        if (isAtStart) {
            scrollLeft.classList.remove('visible');
        } else {
            scrollLeft.classList.add('visible');
        }
        
        if (isAtEnd) {
            scrollRight.classList.remove('visible');
        } else {
            scrollRight.classList.add('visible');
        }
    }
    
    scrollLeft.addEventListener('click', () => {
        const cardWidth = 320 + 32; // card width (320px) + gap (32px/2rem)
        gallery.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    });
    
    scrollRight.addEventListener('click', () => {
        const cardWidth = 320 + 32; // card width (320px) + gap (32px/2rem)
        gallery.scrollBy({ left: cardWidth, behavior: 'smooth' });
    });
    
    gallery.addEventListener('scroll', updateScrollIndicators);
    updateScrollIndicators();
    
    // Keyboard navigation
    gallery.addEventListener('keydown', (e) => {
        const cardWidth = 320 + 32; // card width (320px) + gap (32px/2rem)
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            gallery.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            gallery.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
    });
    
    gallery.setAttribute('tabindex', '0');
    gallery.setAttribute('role', 'region');
    gallery.setAttribute('aria-label', 'Listings gallery');
}

// Initialize gallery on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initListingsGallery();
        // Re-initialize after listings are loaded
        const listingsGrid = document.getElementById('listings-grid');
        if (listingsGrid) {
            const observer = new MutationObserver(() => {
                setTimeout(initListingsGallery, 100);
            });
            observer.observe(listingsGrid, { childList: true, subtree: true });
        }
    }, 500);
});

// Re-initialize when listings are loaded
if (typeof renderListings === 'function') {
    const originalRenderListings = renderListings;
    renderListings = function(...args) {
        originalRenderListings.apply(this, args);
        setTimeout(initListingsGallery, 100);
    };
}
