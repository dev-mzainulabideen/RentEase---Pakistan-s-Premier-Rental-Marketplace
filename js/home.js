// Home page functionality

// Utility function to generate local placeholder image (SVG data URI)
function getPlaceholderImage(width = 400, height = 300, text = 'No Image') {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e9ecef"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Helper function to get darker color for gradients
function getDarkerColor(color) {
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const darkerR = Math.max(0, r - 30);
        const darkerG = Math.max(0, g - 30);
        const darkerB = Math.max(0, b - 30);
        return `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
    }
    return color;
}

const categories = [
    { 
        id: 'property', 
        name: 'Property', 
        icon: 'bi-house-door-fill', 
        count: 1250, 
        description: 'Apartments, Houses, Commercial Spaces',
        subCategories: ['Apartments', 'Houses/Villas', 'Commercial Spaces', 'Event Spaces', 'Farmhouses', 'Rooms & Hostels'],
        image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
        color: '#FF385C'
    },
    { 
        id: 'vehicles', 
        name: 'Vehicles', 
        icon: 'bi-car-front-fill', 
        count: 890, 
        description: 'Cars, Motorcycles, Trucks',
        subCategories: ['Cars', 'Motorcycles', 'Bicycles', 'Trucks & Loaders', 'Rickshaws', 'Heavy Machinery'],
        image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&h=300&fit=crop',
        color: '#667eea'
    },
    { 
        id: 'clothes', 
        name: 'Clothes', 
        icon: 'bi-bag-fill', 
        count: 650, 
        description: 'Wedding Wear, Designer Outfits',
        subCategories: ['Wedding & Formal Wear', 'Designer Outfits', 'Seasonal Clothing', 'Costumes', 'Accessories', 'Maternity & Kids'],
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop',
        color: '#f5576c'
    },
    { 
        id: 'equipment', 
        name: 'Equipment', 
        icon: 'bi-tools', 
        count: 420, 
        description: 'Farming, Electronics, Medical',
        subCategories: ['Farming Equipment', 'Electronics', 'Medical Equipment', 'Kitchen & Catering', 'Sports & Fitness', 'Gaming Items'],
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
        color: '#764ba2'
    },
    { 
        id: 'serviceProviders', 
        name: 'Service Providers', 
        icon: 'bi-person-workspace', 
        count: 1100, 
        description: 'Skilled Workers, Technical Staff',
        subCategories: ['Skilled Workers', 'Technical Staff', 'Event Staff', 'Agricultural Labor', 'Domestic Help', 'Drivers', 'Medical Services', 'Pilot Services'],
        image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop',
        color: '#00b894'
    },
    { 
        id: 'animals', 
        name: 'Animals', 
        icon: 'bi-heart-fill', 
        count: 180, 
        description: 'Pets, Working Animals',
        subCategories: ['Pets for Breeding', 'Working Animals', 'Veterinary Services'],
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
        color: '#fdcb6e'
    },
    { 
        id: 'boat', 
        name: 'Boat', 
        icon: 'bi-water', 
        count: 95, 
        description: 'Fishing Boats, Ferries, Yachts',
        subCategories: ['Fishing Boats', 'Passenger Ferries', 'Recreational Boats', 'Yachts & Speedboats', 'Cargo Vessels', 'Boat Equipment'],
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        color: '#0984e3'
    },
    { 
        id: 'airTransport', 
        name: 'Air Transport', 
        icon: 'bi-airplane-fill', 
        count: 45, 
        description: 'Charter Planes, Helicopters',
        subCategories: ['Charter Planes', 'Helicopter Services', 'Air Ambulance', 'Cargo Aircraft', 'Pilot Services'],
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop',
        color: '#6c5ce7'
    }
];

const featuredListings = [
    { 
        id: 1, 
        title: 'Luxury Apartment in Lahore', 
        location: 'Lahore, Punjab', 
        price: 15000, 
        period: 'day', 
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
        rating: 4.8,
        reviews: 124,
        verified: true,
        instant: true,
        accountType: 'paid',
        ownerVerified: true,
        category: 'Property',
        categoryIcon: 'bi-house-door-fill'
    },
    { 
        id: 2, 
        title: 'Honda Civic 2023', 
        location: 'Karachi, Sindh', 
        price: 5000, 
        period: 'day', 
        image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&h=400&fit=crop',
        rating: 4.9,
        reviews: 89,
        verified: true,
        instant: false,
        accountType: 'paid',
        ownerVerified: true,
        category: 'Vehicles',
        categoryIcon: 'bi-car-front-fill'
    },
    { 
        id: 3, 
        title: 'Wedding Hall - Grand Venue', 
        location: 'Islamabad', 
        price: 50000, 
        period: 'day', 
        image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop',
        rating: 4.7,
        reviews: 203,
        verified: false,
        instant: true,
        accountType: 'free',
        ownerVerified: false,
        category: 'Property',
        categoryIcon: 'bi-building'
    },
    { 
        id: 4, 
        title: 'Professional Camera Equipment', 
        location: 'Lahore, Punjab', 
        price: 3000, 
        period: 'day', 
        image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&h=400&fit=crop',
        rating: 4.6,
        reviews: 67,
        verified: true,
        instant: true,
        accountType: 'paid',
        ownerVerified: true,
        category: 'Equipment',
        categoryIcon: 'bi-camera-fill'
    }
];

function loadCategories() {
    const categoriesGallery = document.getElementById('categories-gallery');
    if (!categoriesGallery) return;

    categoriesGallery.innerHTML = categories.map((category, index) => `
        <a href="category.html?id=${category.id}" class="category-card" data-category="${category.id}" data-index="${index}" style="animation-delay: ${index * 0.1}s;">
            <div class="category-image-wrapper">
                <img src="${category.image}" alt="${category.name}" class="category-image" loading="lazy">
                <div class="category-icon-overlay">
                    <i class="bi ${category.icon}"></i>
                </div>
                <div class="category-gradient" style="background: linear-gradient(135deg, ${category.color}15 0%, ${category.color}05 100%);"></div>
            </div>
            <div class="category-content">
                <h3 class="category-name">${category.name}</h3>
                <p class="category-description">${category.description}</p>
                <div class="category-footer">
                    <div class="category-count">
                        <i class="bi bi-grid-3x3-gap"></i>
                        <span>${category.count} listings</span>
                    </div>
                    <i class="bi bi-arrow-right category-arrow"></i>
                </div>
            </div>
        </a>
    `).join('');

    // Initialize horizontal scrolling and parallax
    if (typeof initCategoriesGallery === 'function') {
        setTimeout(() => initCategoriesGallery(), 100);
    }
}

// Load Featured Listings from API (Dynamic)
async function loadFeaturedListings() {
    const featuredContainer = document.getElementById('featured-listings');
    if (!featuredContainer) return;

    // Show loading state
    featuredContainer.innerHTML = `
        <div class="col-12">
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading featured listings...</span>
                </div>
                <p class="mt-3 text-muted">Loading featured listings...</p>
            </div>
        </div>
    `;

    try {
        const API_BASE = window.API_BASE_URL || 'http://localhost:4001/api';
        const params = new URLSearchParams({
            featured: 'true',
            status: 'active',
            limit: '8',
            sort: 'newest'
        });

        const response = await fetch(`${API_BASE}/listings?${params.toString()}`);
        const data = await response.json();

        if (response.ok && data.status === 'success' && data.listings && data.listings.length > 0) {
            const listings = data.listings;
            
            featuredContainer.innerHTML = listings.map((listing, index) => {
                const image = (listing.images && listing.images[0]?.url) || listing.featuredImage || getPlaceholderImage(600, 400, 'No Image');
                const locCity = listing.location?.city || '';
                const locProv = listing.location?.province || '';
                const locationText = [locCity, locProv].filter(Boolean).join(', ') || (listing.location?.address || 'Location not specified');
                const price = listing.pricing?.amount || 0;
                const period = listing.pricing?.period || 'day';
                const rating = listing.stats?.averageRating || 0;
                const reviewsCount = listing.stats?.totalReviews || 0;
                
                // Get category icon
                const categoryIcons = {
                    'property': 'bi-house-door-fill',
                    'vehicles': 'bi-car-front-fill',
                    'clothes': 'bi-bag-fill',
                    'equipment': 'bi-tools',
                    'service_providers': 'bi-person-workspace',
                    'animals': 'bi-heart-fill',
                    'boat': 'bi-water',
                    'air_transport': 'bi-airplane-fill'
                };
                const categoryIcon = categoryIcons[listing.category] || 'bi-grid-3x3-gap';

                return `
                    <div class="col-lg-3 col-md-4 col-sm-6">
                        <a href="listing-detail.html?id=${listing._id || listing.id}" class="listing-card" data-listing="${listing._id || listing.id}">
                            <div class="listing-image-wrapper">
                                <img src="${image}" alt="${listing.title}" class="listing-image" loading="lazy" onerror="this.src='${getPlaceholderImage(600, 400, 'No Image')}'">
                                <div class="listing-icon-overlay">
                                    <i class="bi ${categoryIcon}"></i>
                                </div>
                                <div class="listing-badges">
                                    ${listing.verified ? '<span class="badge-verified"><i class="bi bi-shield-check"></i> Verified</span>' : ''}
                                    ${listing.availability?.instantBooking ? '<span class="badge-instant"><i class="bi bi-lightning-fill"></i> Instant</span>' : ''}
                                    ${listing.featured ? '<span class="badge-featured"><i class="bi bi-star-fill"></i> Featured</span>' : ''}
                                </div>
                                <div class="listing-gradient"></div>
                            </div>
                            <div class="listing-content">
                                <h3 class="listing-title">${listing.title}</h3>
                                <p class="listing-location">
                                    <i class="bi bi-geo-alt"></i>
                                    <span>${locationText}</span>
                                </p>
                                <div class="listing-meta">
                                    ${rating > 0 ? `
                                    <div class="listing-rating">
                                        <i class="bi bi-star-fill"></i>
                                        <span>${rating.toFixed(1)}</span>
                                        ${reviewsCount > 0 ? `<span class="rating-count">(${reviewsCount})</span>` : ''}
                                    </div>
                                    ` : ''}
                                    <div class="listing-price">
                                        <span class="price-amount">Rs ${price.toLocaleString()}</span>
                                        <span class="price-period">/${period}</span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                `;
            }).join('');

            // Dispatch event for animations initialization
            setTimeout(() => {
                const event = new CustomEvent('featuredListingsLoaded');
                window.dispatchEvent(event);
                
                if (window.pageAnimations && typeof window.pageAnimations.init === 'function') {
                    setTimeout(() => {
                        window.pageAnimations.init();
                    }, 200);
                }
            }, 100);
        } else {
            // No featured listings found, show message
            featuredContainer.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                        <p class="mt-3 text-muted">No featured listings available at the moment.</p>
                        <a href="search.html" class="btn btn-primary mt-3">Browse All Listings</a>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading featured listings:', error);
        featuredContainer.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: #ffc107;"></i>
                    <p class="mt-3 text-muted">Unable to load featured listings. Please try again later.</p>
                    <a href="search.html" class="btn btn-primary mt-3">Browse All Listings</a>
                </div>
            </div>
        `;
    }
}

// Load Dynamic Reviews from API
async function loadDynamicReviews() {
    const testimonialsGrid = document.getElementById('testimonials-grid');
    if (!testimonialsGrid) return;

    // Show loading state
    testimonialsGrid.innerHTML = `
        <div class="col-12">
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading reviews...</span>
                </div>
            </div>
        </div>
    `;

    try {
        const API_BASE = window.API_BASE_URL || 'http://localhost:4001/api';
        const params = new URLSearchParams({
            status: 'approved',
            limit: '100', // Get more reviews, we'll display all
            sort: 'newest'
        });

        const response = await fetch(`${API_BASE}/reviews?${params.toString()}`);
        const data = await response.json();

        if (response.ok && data.status === 'success' && data.reviews && data.reviews.length > 0) {
            const reviews = data.reviews; // Display all approved reviews
            
            testimonialsGrid.innerHTML = reviews.map((review) => {
                const reviewer = review.reviewer || {};
                const reviewerName = reviewer.name || 'Anonymous User';
                const reviewerAvatar = reviewer.avatar || null;
                const rating = review.rating || 5;
                const comment = review.comment || 'Great experience!';
                const listing = review.listing || {};
                const listingTitle = listing.title || 'Listing';
                const createdAt = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently';
                
                // Generate star rating
                const stars = Array.from({ length: 5 }, (_, i) => 
                    i < Math.floor(rating) 
                        ? '<i class="bi bi-star-fill"></i>' 
                        : (i < rating ? '<i class="bi bi-star-half"></i>' : '<i class="bi bi-star"></i>')
                ).join('');

                return `
                    <div class="col-lg-4 col-md-6">
                        <div class="testimonial-card">
                            <div class="testimonial-rating">
                                ${stars}
                            </div>
                            <p class="testimonial-text">"${comment}"</p>
                            <div class="testimonial-listing">
                                <i class="bi bi-tag"></i>
                                <span>${listingTitle}</span>
                            </div>
                            <div class="testimonial-author">
                                <div class="testimonial-avatar">
                                    ${reviewerAvatar 
                                        ? `<img src="${reviewerAvatar}" alt="${reviewerName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                           <i class="bi bi-person-fill" style="display:none;"></i>`
                                        : `<i class="bi bi-person-fill"></i>`
                                    }
                                </div>
                                <div class="testimonial-info">
                                    <h5 class="testimonial-name">${reviewerName}</h5>
                                    <p class="testimonial-location">${createdAt}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            // Fallback to static testimonials if no reviews
            testimonialsGrid.innerHTML = `
                <div class="col-lg-4 col-md-6">
                    <div class="testimonial-card">
                        <div class="testimonial-rating">
                            <i class="bi bi-star-fill"></i>
                            <i class="bi bi-star-fill"></i>
                            <i class="bi bi-star-fill"></i>
                            <i class="bi bi-star-fill"></i>
                            <i class="bi bi-star-fill"></i>
                        </div>
                        <p class="testimonial-text">"RentEase made finding a wedding venue so easy! The platform is user-friendly and the verification process gave me confidence in my booking."</p>
                        <div class="testimonial-author">
                            <div class="testimonial-avatar">
                                <i class="bi bi-person-fill"></i>
                            </div>
                            <div class="testimonial-info">
                                <h5 class="testimonial-name">Sarah Ahmed</h5>
                                <p class="testimonial-location">Lahore, Punjab</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        // Keep existing static testimonials on error
    }
}

// Load Hero Categories
function loadHeroCategories() {
    const heroCategoriesGrid = document.getElementById('hero-categories-grid');
    if (!heroCategoriesGrid) return;

    heroCategoriesGrid.innerHTML = categories.map(category => `
        <a href="category.html?id=${category.id}" class="hero-category-item" data-category="${category.id}" style="--category-color: ${category.color}; --category-color-dark: ${getDarkerColor(category.color)};">
            <div class="hero-category-icon">
                <i class="bi ${category.icon}"></i>
            </div>
            <div class="hero-category-info">
                <span class="hero-category-name">${category.name}</span>
                <span class="hero-category-count">${category.count.toLocaleString()}+ listing${category.count !== 1 ? 's' : ''}</span>
            </div>
        </a>
    `).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadFeaturedListings(); // Now loads from API
    loadHeroCategories();
    loadDynamicReviews(); // Load dynamic reviews
    
    // Optimize image loading
    const images = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
});

