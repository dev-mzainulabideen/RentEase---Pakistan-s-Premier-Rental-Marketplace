// Listing Detail Page Functionality
// Dynamic content loading and booking functionality

(function() {
    'use strict';

    let currentImageIndex = 0;
    let listingImages = [];
    let listingData = null;
    let bookedDates = []; // Array of {checkIn, checkOut} objects

    // Utility function to generate local placeholder image (SVG data URI)
    function getPlaceholderImage(width = 400, height = 300, text = 'No Image') {
        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#e9ecef"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }

    const CATEGORY_SAFETY_GUIDELINES = {
        property: [
            'Always inspect keys and locks on arrival; report any issue through the app chat.',
            'Never pay cash outside the platform; use MyRental secure payments only.',
            'Keep a copy of your CNIC and booking confirmation when checking in.'
        ],
        vehicles: [
            'Verify original documents (registration, token tax) before taking the vehicle.',
            'Photograph existing scratches/damage in front of the owner before driving.',
            'Use helmet/seat belt and follow local traffic laws at all times.'
        ],
        equipment: [
            'Test equipment before accepting it and note any existing faults.',
            'Use safety gear (gloves, goggles, etc.) for heavy or electrical items.',
            'Turn off main power and follow manufacturer instructions during use.'
        ],
        service_providers: [
            'Share exact job details only via app chat, not on personal messengers.',
            'Do not hand over full payment until the agreed work is completed.',
            'Avoid sharing sensitive documents or passwords with service providers.'
        ],
        animals: [
            'Handle animals gently and follow all welfare guidelines.',
            'Confirm vaccination/deworming record with the owner before handover.',
            'Never leave children unsupervised around large animals.'
        ],
        boat: [
            'Always wear a life jacket provided by the operator.',
            'Check local weather conditions before departure and avoid overloading.',
            'Follow crew safety briefings and do not stand at edges while boat is moving.'
        ],
        air_transport: [
            'Follow all crew safety instructions strictly.',
            'Share emergency contact details with the operator before takeoff.',
            'Do not carry prohibited items or dangerous goods on board.'
        ],
        default: [
            'Communicate and pay only through MyRental to stay protected.',
            'Use in-app dispute and emergency options if you ever feel unsafe.',
            'Save our 24/7 support contact for urgent help during a booking.'
        ]
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 DOM Content Loaded - Initializing listing detail page');
        console.log('Current URL:', window.location.href);
        console.log('API Base URL:', window.API_BASE_URL || 'http://localhost:4001/api');
        
        try {
            initListingDetail();
            
            // Initialize real-time service (only if WebSocket is properly configured)
            // Skip if WebSocket URL is a placeholder (not implemented)
            const WS_ENDPOINT = window.WS_ENDPOINT || 'wss://your-api.com/ws';
            const isPlaceholderUrl = WS_ENDPOINT.includes('your-api.com') || 
                                    WS_ENDPOINT.includes('example.com');
            
            if (!isPlaceholderUrl && window.initRealtimeService) {
                // Get user ID from auth if available
                const currentUserId = (() => {
                    try {
                        const userStr = localStorage.getItem('mr-user');
                        if (userStr) {
                            const user = JSON.parse(userStr);
                            return user.id || user._id || 1;
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                    return 1; // Fallback
                })();
                
                window.initRealtimeService(currentUserId);
            } else if (isPlaceholderUrl) {
                // Silently skip WebSocket initialization for placeholder URLs
                // This prevents console errors
            }
            
            console.log('✅ Listing detail page initialized');
        } catch (error) {
            console.error('❌ Error initializing listing detail page:', error);
        }
    });

    // Initialize listing detail page
    function initListingDetail() {
        console.log('📋 Initializing listing detail page...');
        
        // Get listing ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const listingId = urlParams.get('id') || urlParams.get('listingId') || '1';
        
        console.log('🔍 Listing ID from URL:', listingId);
        console.log('📝 Full URL params:', window.location.search);

        if (!listingId || listingId === '1') {
            console.warn('⚠️ No listing ID found in URL, using default: 1');
            console.warn('💡 Make sure the URL includes ?id=<listingId>');
        }

        // Show loading state
        showLoadingState();

        // Load listing data
        loadListingData(listingId).catch(error => {
            console.error('❌ Failed to load listing data:', error);
            showErrorState('Failed to load listing. Please check the console for details.');
        });
        
        // Load booked dates for availability checking
        loadBookedDates(listingId).catch(error => {
            console.error('❌ Failed to load booked dates:', error);
        });

        // Inject emergency help banner near booking card for renters
        injectEmergencyBanner();

        // Set minimum dates for booking
        const today = new Date().toISOString().split('T')[0];
        const checkInInput = document.getElementById('checkIn');
        const checkOutInput = document.getElementById('checkOut');

        if (checkInInput) {
            checkInInput.setAttribute('min', today);
            checkInInput.addEventListener('change', function() {
                if (this.value && checkOutInput) {
                    const nextDay = new Date(this.value);
                    nextDay.setDate(nextDay.getDate() + 1);
                    checkOutInput.setAttribute('min', nextDay.toISOString().split('T')[0]);
                    // Check availability and calculate price if check-out is already selected
                    if (checkOutInput.value) {
                        checkDateAvailability(this.value, 'checkIn');
                        // Only calculate if listing data is loaded
                        if (listingData && listingData.id) {
                            calculatePrice();
                        }
                    } else {
                        checkDateAvailability(this.value, 'checkIn');
                    }
                }
            });
        }

        if (checkOutInput) {
            checkOutInput.addEventListener('change', function() {
                if (checkInInput && this.value) {
                    checkDateAvailability(this.value, 'checkOut');
                    // Only calculate if listing data is loaded
                    if (listingData && listingData.id) {
                        calculatePrice();
                    }
                }
            });
        }

        // Calculate price on guest changes
        const adultsInput = document.getElementById('adults');
        const childrenInput = document.getElementById('children');
        if (adultsInput) {
            adultsInput.addEventListener('change', function() {
                if (listingData && listingData.id) {
                    calculatePrice();
                }
            });
        }
        if (childrenInput) {
            childrenInput.addEventListener('change', function() {
                if (listingData && listingData.id) {
                    calculatePrice();
                }
            });
        }

        // Ensure Contact Host button works (backup event listener)
        const contactButton = document.querySelector('.btn-contact-owner');
        if (contactButton) {
            contactButton.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                if (window.contactOwner) {
                    window.contactOwner(event);
                }
            });
        }
    }
    
    // Show loading state
    function showLoadingState() {
        const titleElement = document.getElementById('listingTitle');
        if (titleElement) {
            titleElement.textContent = 'Loading listing...';
        }
        
        const descriptionElement = document.getElementById('listingDescription');
        if (descriptionElement) {
            descriptionElement.textContent = 'Please wait while we load the listing details...';
        }
    }
    
    // Show error state
    function showErrorState(message) {
        const titleElement = document.getElementById('listingTitle');
        if (titleElement) {
            titleElement.textContent = 'Error Loading Listing';
        }
        
        const descriptionElement = document.getElementById('listingDescription');
        if (descriptionElement) {
            descriptionElement.textContent = message || 'Failed to load listing data. Please refresh the page or try again later.';
        }
    }

    function injectEmergencyBanner() {
        try {
            if (!window.isLoggedIn || !window.isLoggedIn()) return;
            if (!window.hasPermission || !window.hasPermission('book')) return;

            const bookingColumn = document.querySelector('.booking-column');
            if (!bookingColumn || document.querySelector('.emergency-banner')) return;

            const banner = document.createElement('div');
            banner.className = 'emergency-banner';
            banner.innerHTML = `
                <i class="bi bi-shield-exclamation"></i>
                <div>
                    <strong>Safety first while booking.</strong>
                    <span>If you ever feel unsafe during a booking, contact our 24/7 team at
                    <a href="tel:+923001234567">+92 300 1234567</a> or
                    <a href="mailto:support@myrental.pk">support@myrental.pk</a> and use the "Open Dispute" option.</span>
                </div>
            `;
            bookingColumn.insertBefore(banner, bookingColumn.firstChild);
        } catch (e) {
            console.warn('Emergency banner error:', e);
        }
    }

    // Show loading progress
    function showLoadingProgress(message) {
        const container = document.getElementById('loading-progress-container');
        const progressBar = document.getElementById('loading-progress');
        const progressText = document.getElementById('loading-progress-text');
        if (container) {
            container.style.display = 'block';
        }
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        if (progressText) {
            progressText.textContent = message || 'Loading...';
        }
    }
    
    function updateLoadingProgress(percent, message) {
        const progressBar = document.getElementById('loading-progress');
        const progressText = document.getElementById('loading-progress-text');
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
        if (progressText && message) {
            progressText.textContent = message;
        }
    }
    
    function hideLoadingProgress() {
        const container = document.getElementById('loading-progress-container');
        const progressBar = document.getElementById('loading-progress');
        const progressText = document.getElementById('loading-progress-text');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        setTimeout(() => {
            if (container) {
                container.style.display = 'none';
            }
            if (progressBar) {
                progressBar.style.width = '0%';
            }
            if (progressText) {
                progressText.textContent = '';
            }
        }, 500);
    }
    
    // Load listing data from API - SIMPLIFIED VERSION
    async function loadListingData(listingId) {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
        
        try {
            console.log(`Fetching listing: ${API_BASE_URL}/listings/${listingId}`);
            showLoadingProgress('Loading listing details...');
            
            // Simulate progress for long-running requests
            const progressInterval = setInterval(() => {
                updateLoadingProgress(30, 'Fetching listing data from server...');
            }, 1000);
            
            // Add timeout and abort controller
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                clearInterval(progressInterval);
                updateLoadingProgress(100, 'Request timeout - server is slow');
            }, 30000); // Increased to 30 seconds to match backend response times
            
            // Simple fetch with cache busting
            const url = `${API_BASE_URL}/listings/${listingId}?_=${Date.now()}`;
            const startTime = Date.now();
            
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            clearInterval(progressInterval);
            
            const responseTime = Date.now() - startTime;
            console.log(`⏱️ API Response time: ${responseTime}ms`);
            
            if (responseTime > 5000) {
                console.warn(`⚠️ Slow API response: ${responseTime}ms - backend performance issue`);
            }
            
            updateLoadingProgress(70, 'Processing data...');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            console.log('📥 API Response received:', {
                status: data?.status,
                hasListing: !!data?.listing,
                listingId: data?.listing?._id || data?.listing?.id,
                message: data?.message
            });
            
            if (!data || data.status !== 'success' || !data.listing) {
                const errorMsg = data?.message || 'Invalid listing data received';
                console.error('❌ API Error:', errorMsg, data);
                throw new Error(errorMsg);
            }
            
            updateLoadingProgress(90, 'Rendering content...');
            
            console.log('✅ Listing loaded successfully:', data.listing.title || 'Untitled');
            console.log('Raw listing data structure:', {
                hasOwner: !!data.listing.owner,
                ownerType: typeof data.listing.owner,
                ownerIsObject: data.listing.owner && typeof data.listing.owner === 'object',
                hasOwnerStats: !!data.listing.ownerStats,
                hasRating: !!data.listing.rating,
                hasPricing: !!data.listing.pricing,
                pricingStructure: data.listing.pricing ? {
                    hasModel: !!data.listing.pricing.model,
                    model: data.listing.pricing.model,
                    hasAmount: !!data.listing.pricing.amount,
                    amount: data.listing.pricing.amount,
                    hasCurrency: !!data.listing.pricing.currency,
                    currency: data.listing.pricing.currency,
                    hasDeposit: !!data.listing.pricing.deposit,
                    deposit: data.listing.pricing.deposit
                } : null,
                hasLocation: !!data.listing.location,
                hasImages: !!data.listing.images,
                imagesType: Array.isArray(data.listing.images) ? 'array' : typeof data.listing.images
            });

            // Normalize listing data for UI
            const rawListing = data.listing;
            listingData = {
                id: rawListing._id || rawListing.id,
                title: rawListing.title || 'Untitled Listing',
                location: rawListing.location?.city || rawListing.location?.address || 'Location not specified',
                locationFull: {
                    address: rawListing.location?.address || '',
                    city: rawListing.location?.city || '',
                    province: rawListing.location?.province || '',
                    area: rawListing.location?.area || '',
                    coordinates: rawListing.location?.coordinates || null
                },
                category: rawListing.category || 'property',
                subcategory: rawListing.subCategory || rawListing.subcategory || '',
                price: (() => {
                    // Try multiple possible price fields
                    const price = rawListing.pricing?.amount || 
                                 rawListing.pricing?.price || 
                                 rawListing.price || 
                                 0;
                    const parsedPrice = parseFloat(price);
                    if (!parsedPrice || parsedPrice === 0 || isNaN(parsedPrice)) {
                        console.error('❌ CRITICAL: Listing has no valid price!', {
                            pricing: rawListing.pricing,
                            price: price,
                            parsedPrice: parsedPrice
                        });
                        return 0;
                    }
                    console.log('✅ Price extracted:', parsedPrice);
                    return parsedPrice;
                })(),
                period: (() => {
                    const period = rawListing.pricing?.model || 
                                  rawListing.pricing?.period || 
                                  rawListing.period || 
                                  'day';
                    console.log('✅ Period extracted:', period);
                    return period;
                })(),
                currency: (() => {
                    const currency = rawListing.pricing?.currency || 
                                    rawListing.currency || 
                                    'PKR';
                    console.log('✅ Currency extracted:', currency);
                    return currency;
                })(),
                deposit: (() => {
                    const deposit = rawListing.pricing?.deposit || 
                                   rawListing.deposit || 
                                   0;
                    const parsedDeposit = parseFloat(deposit) || 0;
                    console.log('✅ Deposit extracted:', parsedDeposit);
                    return parsedDeposit;
                })(),
                negotiable: rawListing.pricing?.negotiable === true || 
                           rawListing.pricing?.negotiable === 'true' || 
                           rawListing.negotiable === true || 
                           false,
                maxGuests: rawListing.features?.maxGuests || rawListing.features?.capacity || 10,
                minDuration: rawListing.availability?.minDuration || 1,
                maxDuration: rawListing.availability?.maxDuration || 30,
                rating: rawListing.rating?.average || rawListing.stats?.averageRating || 0,
                reviews: rawListing.rating?.count || rawListing.stats?.totalReviews || 0,
                verified: rawListing.verified === true,
                instant: rawListing.availability?.instantBooking === true,
                description: rawListing.description || '',
                images: (() => {
                    // Handle different image formats from API
                    let imageArray = rawListing.images || [];
                    
                    // If images is not an array, try to convert it
                    if (!Array.isArray(imageArray)) {
                        if (typeof imageArray === 'string') {
                            imageArray = [imageArray];
                        } else if (imageArray && typeof imageArray === 'object') {
                            imageArray = Object.values(imageArray);
                        } else {
                            imageArray = [];
                        }
                    }
                    
                    const featuredImg = rawListing.featuredImage;
                    
                    // Extract URLs from image objects or use strings directly
                    let imageUrls = imageArray.map(img => {
                        if (typeof img === 'string') return img;
                        if (img && typeof img === 'object') {
                            if (img.url) return img.url;
                            if (img.src) return img.src;
                            if (img.path) return img.path;
                            if (img.data) return img.data; // Base64
                        }
                        return null;
                    }).filter(Boolean);
                    
                    // Add featured image if it exists and not already in array
                    if (featuredImg && !imageUrls.includes(featuredImg)) {
                        if (typeof featuredImg === 'string') {
                            imageUrls.unshift(featuredImg);
                        } else if (featuredImg && typeof featuredImg === 'object') {
                            const featuredUrl = featuredImg.url || featuredImg.src || featuredImg.path || featuredImg.data;
                            if (featuredUrl && !imageUrls.includes(featuredUrl)) {
                                imageUrls.unshift(featuredUrl);
                            }
                        }
                    }
                    
                    // Fallback to placeholder if no images
                    if (imageUrls.length === 0) {
                        console.warn('⚠️ No images found for listing, using placeholder');
                        imageUrls = [getPlaceholderImage(800, 600, 'No Image Available')];
                    }
                    
                    console.log('✅ Images normalized:', imageUrls.length, 'images found');
                    return imageUrls;
                })(),
                features: rawListing.features || {},
                amenities: rawListing.amenities || [],
                owner: (() => {
                    // Handle owner data - can be populated object or just ID
                    if (!rawListing.owner) {
                        console.warn('⚠️ No owner data in listing');
                        return null;
                    }
                    
                    // If owner is just an ID string, we can't get details
                    if (typeof rawListing.owner === 'string') {
                        console.warn('⚠️ Owner is just an ID string, not populated:', rawListing.owner);
                        return {
                            id: rawListing.owner,
                            name: 'Owner',
                            email: '',
                            avatar: null,
                            verified: false,
                            accountType: 'free',
                            joined: '',
                            rating: 0,
                            reviewCount: 0,
                            responseTime: 'N/A',
                            responseRate: 'N/A'
                        };
                    }
                    
                    // Owner is populated object
                    const ownerId = rawListing.owner._id || rawListing.owner.id || null;
                    const ownerName = rawListing.owner.name || 'Anonymous';
                    const ownerEmail = rawListing.owner.email || '';
                    const ownerAvatar = rawListing.owner.avatar || null;
                    const ownerVerified = rawListing.owner.verified === true || 
                                        rawListing.owner.verificationStatus?.email === true ||
                                        false;
                    const ownerAccountType = rawListing.owner.accountType || 'free';
                    
                    // Handle createdAt - can be Date object or string
                    let ownerJoined = '';
                    if (rawListing.owner.createdAt) {
                        try {
                            const createdAtDate = rawListing.owner.createdAt instanceof Date 
                                ? rawListing.owner.createdAt 
                                : new Date(rawListing.owner.createdAt);
                            ownerJoined = createdAtDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        } catch (e) {
                            console.warn('⚠️ Could not parse owner createdAt:', rawListing.owner.createdAt);
                            ownerJoined = '';
                        }
                    }
                    
                    // Get owner stats from listing (added by backend)
                    const ownerStats = rawListing.ownerStats || {};
                    const ownerRating = parseFloat(ownerStats.rating) || 0;
                    const ownerReviewCount = parseInt(ownerStats.reviewCount) || 0;
                    const ownerResponseTime = ownerStats.responseTime || 'N/A';
                    const ownerResponseRate = ownerStats.responseRate || 'N/A';
                    
                    console.log('✅ Owner data normalized:', {
                        id: ownerId,
                        name: ownerName,
                        verified: ownerVerified,
                        accountType: ownerAccountType,
                        rating: ownerRating,
                        reviewCount: ownerReviewCount
                    });
                    
                    return {
                        id: ownerId,
                        name: ownerName,
                        email: ownerEmail,
                        avatar: ownerAvatar,
                        verified: ownerVerified,
                        accountType: ownerAccountType,
                        joined: ownerJoined,
                        rating: ownerRating,
                        reviewCount: ownerReviewCount,
                        responseTime: ownerResponseTime,
                        responseRate: ownerResponseRate
                    };
                })(),
                reviews: [] // Reviews loaded separately if needed
            };

            console.log('📝 About to populate listing data:', {
                id: listingData.id,
                title: listingData.title,
                price: listingData.price,
                period: listingData.period,
                currency: listingData.currency,
                imagesCount: listingData.images?.length || 0,
                hasOwner: !!listingData.owner,
                ownerName: listingData.owner?.name
            });
            
            // Validate critical data before populating
            if (!listingData.id) {
                console.error('❌ Critical error: Listing ID is missing');
                throw new Error('Listing ID is missing');
            }
            
            if (!listingData.title) {
                console.warn('⚠️ Warning: Listing title is missing, using default');
                listingData.title = 'Untitled Listing';
            }
            
            if (!listingData.price || listingData.price === 0) {
                console.warn('⚠️ Warning: Listing price is missing or zero:', listingData.price);
                console.warn('⚠️ This may cause price calculation to fail');
            }
            
            // CRITICAL: Populate the data - this sets listingData globally
            populateListingData(listingData);
            
            // Verify listingData is set after population
            if (!listingData || !listingData.id) {
                console.error('❌ CRITICAL: listingData not set after populateListingData!');
                throw new Error('Failed to set listingData');
            }
            
            console.log('✅ listingData verified after population:', {
                id: listingData.id,
                price: listingData.price,
                period: listingData.period
            });
            
            console.log('✅ Listing data populated successfully');
            
            updateLoadingProgress(100, 'Complete!');
            hideLoadingProgress();
            
            // Load non-critical data in parallel (don't block UI)
            Promise.all([
                // Load reviews (non-blocking)
            loadListingReviews(listingData.id).catch(error => {
                console.error('❌ Failed to load reviews:', error);
                }),
                // Load availability (non-blocking)
                loadBookedDates(listingId).catch(error => {
                    console.error('❌ Failed to load booked dates:', error);
                })
            ]).then(() => {
                console.log('✅ All background data loaded');
            });
            
            // Initialize map with listing location (non-blocking)
            if (typeof initListingMap === 'function') {
                setTimeout(() => {
                try {
                    initListingMap(listingData);
                } catch (error) {
                    console.error('❌ Error initializing map:', error);
                }
                }, 100);
            }
            
            // Recalculate price if dates are already selected (after data is loaded)
            setTimeout(() => {
                const checkIn = document.getElementById('checkIn')?.value;
                const checkOut = document.getElementById('checkOut')?.value;
                if (checkIn && checkOut && listingData && listingData.id) {
                    console.log('✅ Data loaded, recalculating price with existing dates');
                    calculatePrice();
                }
            }, 300);
        } catch (error) {
            console.error('Error loading listing:', error);
            listingData = null;
            hideLoadingProgress();
            
            // Show error message to user
            const titleElement = document.getElementById('listingTitle');
            if (titleElement) {
                if (error.name === 'AbortError') {
                    titleElement.textContent = 'Request Timeout - Server is taking too long';
                    // Show retry button
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'alert alert-warning mt-3';
                    errorDiv.innerHTML = `
                        <strong>Slow Server Response</strong><br>
                        The server is taking longer than expected. This is a backend performance issue.<br>
                        <button class="btn btn-primary mt-2" onclick="location.reload()">Retry</button>
                    `;
                    titleElement.parentElement.appendChild(errorDiv);
                } else {
                titleElement.textContent = 'Failed to load listing';
                }
            }
            
            // Show error in console with more details
            console.error('Full error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                listingId: listingId,
                API_BASE_URL: API_BASE_URL
            });
            
            populateListingData(null);
        }
    }

    // Load booked dates for availability checking
    async function loadBookedDates(listingId) {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
        
        try {
            const response = await fetch(`${API_BASE_URL}/listings/${listingId}/availability`);
            const data = await response.json();

            if (data.status === 'success' && Array.isArray(data.bookedDates)) {
                bookedDates = data.bookedDates;
                updateDatePickerAvailability();
                
                // Re-check availability if dates are already selected
                const checkIn = document.getElementById('checkIn')?.value;
                const checkOut = document.getElementById('checkOut')?.value;
                if (checkIn && checkOut) {
                    setTimeout(() => {
                        checkDateAvailability(checkIn, 'checkIn');
                        // Only calculate if listing data is loaded
                        if (listingData && listingData.id) {
                            calculatePrice();
                        }
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Error loading booked dates:', error);
            bookedDates = [];
        }
    }

    // Update date picker to disable booked dates
    function updateDatePickerAvailability() {
        const checkInInput = document.getElementById('checkIn');
        const checkOutInput = document.getElementById('checkOut');
        
        if (!checkInInput || !checkOutInput) return;

        // Get all dates that are booked
        const unavailableDates = [];
        bookedDates.forEach(booking => {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            const currentDate = new Date(checkIn);
            
            // Add all dates in the range (excluding check-out date)
            while (currentDate < checkOut) {
                unavailableDates.push(currentDate.toISOString().split('T')[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        // Add event listeners to validate dates
        checkInInput.addEventListener('change', function() {
            checkDateAvailability(this.value, 'checkIn');
        });
        
        checkOutInput.addEventListener('change', function() {
            checkDateAvailability(this.value, 'checkOut');
        });
    }

    // Check if selected dates are available
    function checkDateAvailability(selectedDate, inputType) {
        if (!selectedDate) return true;

        const selected = new Date(selectedDate);
        const checkInInput = document.getElementById('checkIn');
        const checkOutInput = document.getElementById('checkOut');
        const checkIn = checkInInput?.value ? new Date(checkInInput.value) : null;
        const checkOut = checkOutInput?.value ? new Date(checkOutInput.value) : null;
        
        // Check if the selected date is in any booked range
        const isBooked = bookedDates.some(booking => {
            const bookingCheckIn = new Date(booking.checkIn);
            const bookingCheckOut = new Date(booking.checkOut);
            return selected >= bookingCheckIn && selected < bookingCheckOut;
        });

        // Check if the date range overlaps with any booking
        let isRangeAvailable = true;
        if (checkIn && checkOut) {
            isRangeAvailable = !bookedDates.some(booking => {
                const bookingCheckIn = new Date(booking.checkIn);
                const bookingCheckOut = new Date(booking.checkOut);
                // Check if ranges overlap
                return (checkIn < bookingCheckOut && checkOut > bookingCheckIn);
            });
        }

        // Show availability status
        const availabilityStatus = document.getElementById('availabilityStatus');
        if (!availabilityStatus) {
            // Create availability status element if it doesn't exist
            const bookingForm = document.getElementById('bookingForm');
            if (bookingForm) {
                const statusDiv = document.createElement('div');
                statusDiv.id = 'availabilityStatus';
                statusDiv.className = 'availability-status';
                bookingForm.insertBefore(statusDiv, bookingForm.querySelector('.price-breakdown-enhanced'));
            }
        }

        const statusElement = document.getElementById('availabilityStatus');
        if (statusElement) {
            if (checkIn && checkOut) {
                if (isRangeAvailable) {
                    statusElement.innerHTML = `
                        <div class="availability-available">
                            <i class="bi bi-check-circle"></i>
                            <span>These dates are available</span>
                        </div>
                    `;
                    statusElement.className = 'availability-status availability-available';
                } else {
                    statusElement.innerHTML = `
                        <div class="availability-unavailable">
                            <i class="bi bi-x-circle"></i>
                            <span>These dates are not available. Please select different dates.</span>
                        </div>
                    `;
                    statusElement.className = 'availability-status availability-unavailable';
                }
            } else {
                statusElement.innerHTML = '';
                statusElement.className = 'availability-status';
            }
        }

        // Disable booking button if dates are not available
        const bookButton = document.getElementById('bookNowBtn');
        if (bookButton && checkIn && checkOut) {
            bookButton.disabled = !isRangeAvailable;
            if (!isRangeAvailable) {
                bookButton.style.opacity = '0.6';
                bookButton.style.cursor = 'not-allowed';
            } else {
                bookButton.style.opacity = '1';
                bookButton.style.cursor = 'pointer';
            }
        }

        // Return true if range is available (for single date checks, return true if not booked)
        if (checkIn && checkOut) {
            return isRangeAvailable;
        } else {
            return !isBooked;
        }
    }

    // Load reviews for listing (only approved reviews)
    async function loadListingReviews(listingId) {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
        
        try {
            const response = await fetch(`${API_BASE_URL}/reviews?listingId=${listingId}`);
            const data = await response.json();

            if (data.status === 'success' && Array.isArray(data.reviews)) {
                // Filter only approved reviews and reviews for this listing
                const approvedReviews = data.reviews.filter(review => 
                    review.status === 'approved' && 
                    (review.listing?._id === listingId || review.listing?.id === listingId || String(review.listing) === String(listingId))
                );
                
                displayReviews(approvedReviews);
                
                // Update review count and rating
                if (approvedReviews.length > 0) {
                    const avgRating = approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / approvedReviews.length;
                    updateReviewStats(approvedReviews.length, avgRating);
                } else {
                    // No reviews yet
                    updateReviewStats(0, 0);
                }
            } else {
                updateReviewStats(0, 0);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            updateReviewStats(0, 0);
        }
    }

    // Display reviews
    function displayReviews(reviews) {
        const reviewsList = document.getElementById('reviewsList');
        if (!reviewsList) return;

        if (reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <i class="bi bi-star"></i>
                    <p>No reviews yet. Be the first to review this listing!</p>
                    <small>Reviews are only available after completing a reservation.</small>
                </div>
            `;
            return;
        }

        // Sort reviews by date (newest first) and limit to 10
        const sortedReviews = reviews
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        reviewsList.innerHTML = sortedReviews.map(review => {
            const hasResponse = review.response && review.response.text;
            const responseDate = review.response?.respondedAt
                ? formatReviewDate(review.response.respondedAt)
                : '';
            
            const reviewer = review.reviewer || {};
            const booking = review.booking || {};
            const rating = review.rating || 0;
            const comment = review.comment || '';
            
            // Escape HTML in comment
            const safeComment = comment.replace(/</g, '&lt;').replace(/>/g, '&gt;');

            return `
                <div class="review-item" data-review-id="${review._id || review.id}">
                    <div class="review-header">
                        <img src="${reviewer.avatar || getPlaceholderImage(48, 48, 'User')}" 
                             alt="${reviewer.name || 'Reviewer'}" 
                             class="reviewer-avatar"
                             onerror="this.src='${getPlaceholderImage(48, 48, 'User')}'">
                        <div class="reviewer-info">
                            <div class="reviewer-name">
                                ${reviewer.name || 'Anonymous'}
                                ${reviewer.verified ? '<i class="bi bi-patch-check-fill verified-badge" title="Verified"></i>' : ''}
                            </div>
                            <div class="review-date">${formatReviewDate(review.createdAt)}</div>
                            ${booking.bookingNumber ? `<div class="review-booking-ref">Booking: ${booking.bookingNumber}</div>` : ''}
                        </div>
                        <div class="review-rating-stars">
                            ${Array(Math.floor(rating)).fill(0).map(() => '<i class="bi bi-star-fill"></i>').join('')}
                            ${rating % 1 >= 0.5 ? '<i class="bi bi-star-half"></i>' : ''}
                            ${Array(5 - Math.ceil(rating)).fill(0).map(() => '<i class="bi bi-star"></i>').join('')}
                            <span class="rating-value">${rating.toFixed(1)}</span>
                        </div>
                    </div>
                    ${comment ? `<p class="review-text">${safeComment}</p>` : ''}
                    
                    ${review.categoryRatings ? `
                        <div class="category-ratings">
                            ${review.categoryRatings.cleanliness ? `<span><strong>Cleanliness:</strong> ${review.categoryRatings.cleanliness}/5</span>` : ''}
                            ${review.categoryRatings.communication ? `<span><strong>Communication:</strong> ${review.categoryRatings.communication}/5</span>` : ''}
                            ${review.categoryRatings.value ? `<span><strong>Value:</strong> ${review.categoryRatings.value}/5</span>` : ''}
                        </div>
                    ` : ''}
                    
                    ${hasResponse ? `
                        <div class="owner-response listing-response">
                            <div class="owner-response-header">
                                <i class="bi bi-reply-fill"></i>
                                <strong>Owner response</strong>
                                ${responseDate ? `<span class="response-date">${responseDate}</span>` : ''}
                            </div>
                            <p class="owner-response-text">${review.response.text}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // Update review stats
    function updateReviewStats(count, avgRating) {
        const ratingElement = document.getElementById('listingRating');
        const reviewCount = document.getElementById('reviewCount');
        const reviewStars = document.getElementById('reviewStars');
        const bookingRating = document.getElementById('bookingRating');
        const bookingReviewCount = document.getElementById('bookingReviewCount');
        const reviewRating = document.getElementById('reviewRating');

        const rating = avgRating > 0 ? avgRating.toFixed(1) : '0.0';
        
        // Update all rating displays
        if (ratingElement) ratingElement.textContent = rating;
        if (bookingRating) bookingRating.textContent = rating;
        if (reviewRating) reviewRating.textContent = rating;
        
        // Update all review count displays
        const reviewText = count > 0 ? `(${count} ${count === 1 ? 'review' : 'reviews'})` : '(No reviews yet)';
        if (reviewCount) reviewCount.textContent = reviewText;
        if (bookingReviewCount) bookingReviewCount.textContent = reviewText;

        if (reviewStars) {
            const fullStars = Math.floor(avgRating);
            const hasHalfStar = avgRating % 1 >= 0.5;
            let starsHTML = '';
            for (let i = 0; i < fullStars; i++) {
                starsHTML += '<i class="bi bi-star-fill"></i>';
            }
            if (hasHalfStar) {
                starsHTML += '<i class="bi bi-star-half"></i>';
            }
            for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
                starsHTML += '<i class="bi bi-star"></i>';
            }
            reviewStars.innerHTML = starsHTML;
        }
    }

    // Format review date
    function formatReviewDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // Populate listing data
    function populateListingData(data) {
        if (!data) {
            console.error('No listing data provided to populateListingData');
            // Show error state
            const titleElement = document.getElementById('listingTitle');
            if (titleElement) titleElement.textContent = 'Listing not found';
            listingData = null;
            return;
        }
        
        // Update global listingData variable
        listingData = data;
        console.log('✅ Global listingData updated:', {
            id: listingData.id,
            title: listingData.title,
            price: listingData.price,
            period: listingData.period,
            currency: listingData.currency,
            hasOwner: !!listingData.owner,
            ownerName: listingData.owner?.name,
            imagesCount: listingData.images?.length || 0
        });
        
        // Validate critical fields
        console.log('🔍 Validating listingData after update:', {
            id: listingData.id,
            price: listingData.price,
            priceType: typeof listingData.price,
            period: listingData.period,
            currency: listingData.currency,
            deposit: listingData.deposit
        });
        
        if (!listingData.price || listingData.price === 0 || isNaN(listingData.price)) {
            console.error('❌ CRITICAL: listingData has no valid price!', {
                price: listingData.price,
                priceType: typeof listingData.price,
                isNaN: isNaN(listingData.price),
                rawData: data
            });
            // Try to get price from raw data as fallback
            if (data && data.price && data.price > 0) {
                console.log('🔄 Attempting to recover price from data object...');
                listingData.price = parseFloat(data.price);
            }
        }
        
        if (!listingData.period) {
            console.warn('⚠️ Warning: listingData has no period, defaulting to "day"');
            listingData.period = 'day';
        }
        
        // Final validation
        if (listingData.price && listingData.price > 0 && !isNaN(listingData.price)) {
            console.log('✅ Price validation passed:', listingData.price);
        } else {
            console.error('❌ Price validation FAILED - price will not display correctly!');
        }
        
        console.log('Populating listing data:', {
            title: data.title,
            price: data.price,
            imagesCount: data.images?.length || 0
        });
        
        // Set images
        listingImages = data.images || [];
        console.log('Listing images:', listingImages);
        
        if (listingImages.length > 0) {
            displayImages();
        } else {
            console.warn('No images found for listing');
            // Set placeholder image
            const mainImage = document.getElementById('mainImage');
            if (mainImage) {
                mainImage.src = getPlaceholderImage(800, 600, 'No Image Available');
            }
        }

        // Set title
        const titleElement = document.getElementById('listingTitle');
        if (titleElement) {
            titleElement.textContent = data.title || 'Untitled Listing';
            console.log('✅ Title set to:', data.title);
        } else {
            console.error('❌ listingTitle element not found');
        }

        // Set location
        const locationElement = document.getElementById('listingLocation');
        if (locationElement) locationElement.textContent = data.location;
        
        // Set location address
        const locationAddressElement = document.getElementById('locationAddress');
        if (locationAddressElement && data.locationFull) {
            const addressParts = [
                data.locationFull.address,
                data.locationFull.area,
                data.locationFull.city,
                data.locationFull.province
            ].filter(Boolean);
            locationAddressElement.textContent = addressParts.join(', ') || data.location;
        }

        // Set description
        const descriptionElement = document.getElementById('listingDescription');
        if (descriptionElement) descriptionElement.textContent = data.description;

        // Set badges
        const badgesContainer = document.getElementById('listingBadges');
        if (badgesContainer) {
            let badgesHTML = '';
            if (data.verified) {
                badgesHTML += '<span class="listing-badge badge-verified"><i class="bi bi-shield-check-fill"></i> Verified</span>';
            }
            if (data.instant) {
                badgesHTML += '<span class="listing-badge badge-instant"><i class="bi bi-lightning-fill"></i> Instant Booking</span>';
            }
            badgesContainer.innerHTML = badgesHTML;
        }

        // Set features
        const featuresContainer = document.getElementById('listingFeatures');
        if (featuresContainer && data.features) {
            const features = [];
            if (data.features.bedrooms) features.push({ icon: 'bi-door-open', label: 'Bedrooms', value: data.features.bedrooms });
            if (data.features.bathrooms) features.push({ icon: 'bi-droplet', label: 'Bathrooms', value: data.features.bathrooms });
            if (data.features.area) features.push({ icon: 'bi-rulers', label: 'Area', value: data.features.area });
            if (data.features.furnished) features.push({ icon: 'bi-house-check', label: 'Furnishing', value: data.features.furnished });

            featuresContainer.innerHTML = features.map(feature => `
                <div class="feature-item">
                    <div class="feature-icon">
                        <i class="bi ${feature.icon}"></i>
                    </div>
                    <div class="feature-content">
                        <div class="feature-label">${feature.label}</div>
                        <div class="feature-value">${feature.value}</div>
                    </div>
                </div>
            `).join('');
        }

        // Set amenities
        const amenitiesContainer = document.getElementById('amenitiesGrid');
        if (amenitiesContainer && data.amenities) {
            const amenityIcons = {
                'WiFi': 'bi-wifi',
                'Parking': 'bi-car-front',
                'Air Conditioning': 'bi-snow',
                'Heating': 'bi-thermometer-sun',
                'Kitchen': 'bi-egg-fried',
                'Pool': 'bi-water',
                'Gym': 'bi-activity',
                'Security': 'bi-shield-check'
            };

            amenitiesContainer.innerHTML = data.amenities.map(amenity => `
                <div class="amenity-item">
                    <i class="bi ${amenityIcons[amenity] || 'bi-check-circle'}"></i>
                    <span>${amenity}</span>
                </div>
            `).join('');
        }

        // Set owner information
        populateOwnerInfo(data.owner);
        
        // Set booking price and period in header (CRITICAL: Must be set here with listing data)
        // Try multiple possible element IDs/selectors
        const bookingPrice = document.getElementById('bookingPrice') || 
                            document.querySelector('[data-price]') ||
                            document.querySelector('.booking-price');
        const bookingPeriod = document.getElementById('bookingPeriod') || 
                             document.querySelector('[data-period]') ||
                             document.querySelector('.booking-period');
        
        console.log('💰 Setting booking price:', {
            bookingPriceElement: !!bookingPrice,
            bookingPeriodElement: !!bookingPeriod,
            price: data.price,
            priceType: typeof data.price,
            period: data.period,
            currency: data.currency,
            dataKeys: Object.keys(data),
            fullData: {
                price: data.price,
                period: data.period,
                currency: data.currency,
                deposit: data.deposit
            }
        });
        
        if (bookingPrice) {
            if (data.price && data.price > 0 && !isNaN(data.price)) {
                const currencySymbol = data.currency === 'USD' ? '$' : 'Rs';
                const formattedPrice = `${currencySymbol} ${parseFloat(data.price).toLocaleString()}`;
                
                // Try multiple methods to set the price
                bookingPrice.textContent = formattedPrice;
                bookingPrice.innerHTML = formattedPrice;
                
                // Force update by removing and re-adding
                if (bookingPrice.textContent !== formattedPrice && bookingPrice.innerHTML !== formattedPrice) {
                    const parent = bookingPrice.parentNode;
                    const newElement = bookingPrice.cloneNode(false);
                    newElement.textContent = formattedPrice;
                    parent.replaceChild(newElement, bookingPrice);
                }
                
                console.log('✅ Booking price set to:', bookingPrice.textContent || bookingPrice.innerHTML);
                console.log('✅ Price element after setting:', {
                    textContent: bookingPrice.textContent,
                    innerHTML: bookingPrice.innerHTML,
                    innerText: bookingPrice.innerText
                });
            } else {
                bookingPrice.textContent = '-';
                console.error('❌ CRITICAL: Invalid price data!', {
                    price: data.price,
                    priceType: typeof data.price,
                    isNaN: isNaN(data.price),
                    priceValue: data.price
                });
            }
        } else {
            console.error('❌ bookingPrice element not found. Available elements:', {
                byId: !!document.getElementById('bookingPrice'),
                byDataAttr: !!document.querySelector('[data-price]'),
                byClass: !!document.querySelector('.booking-price'),
                allPriceElements: document.querySelectorAll('[id*="price"], [class*="price"]').length,
                allElements: Array.from(document.querySelectorAll('*')).filter(el => 
                    el.id && el.id.includes('price')
                ).map(el => el.id)
            });
        }
        
        if (bookingPeriod) {
            if (data.period) {
                const periodLabels = {
                    hourly: '/hour',
                    daily: '/day',
                    weekly: '/week',
                    monthly: '/month'
                };
                const periodText = periodLabels[data.period] || `/${data.period}`;
                
                // Try multiple methods to set the period
                bookingPeriod.textContent = periodText;
                bookingPeriod.innerHTML = periodText;
                
                console.log('✅ Booking period set to:', bookingPeriod.textContent || bookingPeriod.innerHTML);
            } else {
                bookingPeriod.textContent = '/day';
                console.warn('⚠️ No period data, defaulting to "/day"');
            }
        } else {
            console.error('❌ bookingPeriod element not found. Available elements:', {
                byId: !!document.getElementById('bookingPeriod'),
                byDataAttr: !!document.querySelector('[data-period]'),
                byClass: !!document.querySelector('.booking-period')
            });
        }
        
        // Set rating and review count - use actual data from API
        const bookingRating = document.getElementById('bookingRating');
        const reviewRating = document.getElementById('reviewRating');
        const reviewCount = document.getElementById('reviewCount');
        const reviewLink = document.querySelector('.review-link');
        
        const ratingValue = parseFloat(data.rating) || 0;
        const reviewCountValue = parseInt(data.reviews) || 0;
        
        if (bookingRating) {
            bookingRating.textContent = ratingValue > 0 ? ratingValue.toFixed(1) : '0.0';
        }
        if (reviewRating) {
            reviewRating.textContent = ratingValue > 0 ? ratingValue.toFixed(1) : '0.0';
        }
        // Update all review count displays
        const reviewText = reviewCountValue > 0 ? `(${reviewCountValue} ${reviewCountValue === 1 ? 'review' : 'reviews'})` : '(No reviews yet)';
        if (reviewCount) {
            reviewCount.textContent = reviewText;
        }
        const bookingReviewCount = document.getElementById('bookingReviewCount');
        if (bookingReviewCount) {
            bookingReviewCount.textContent = reviewText;
        }
        if (reviewLink) {
            reviewLink.textContent = reviewText;
        }
        
        // Set guest limits
        updateGuestLimits(data.maxGuests || 10);
        
        // Debug: Log listing data to console
        console.log('Listing data loaded:', {
            price: data.price,
            period: data.period,
            currency: data.currency,
            maxGuests: data.maxGuests,
            rating: data.rating,
            reviews: data.reviews
        });
        
        // Set breadcrumb
        const categoryBreadcrumb = document.getElementById('categoryBreadcrumb');
        if (categoryBreadcrumb && data.category) {
            categoryBreadcrumb.textContent = data.category;
            categoryBreadcrumb.href = `category.html?id=${data.category.toLowerCase().replace(' ', '-')}`;
        }

        // Render category safety guidelines
        renderSafetyGuidelines(data);

        // Load similar listings
        loadSimilarListings(data.category, data.id);
        
        // Ensure price calculation is triggered if dates are already selected
        setTimeout(() => {
            const checkIn = document.getElementById('checkIn')?.value;
            const checkOut = document.getElementById('checkOut')?.value;
            if (checkIn && checkOut) {
                if (listingData && listingData.id && listingData.price) {
                    console.log('✅ Triggering price calculation with dates:', { checkIn, checkOut });
                    calculatePrice();
                } else {
                    console.warn('⏳ Dates selected but listingData not ready yet. Price calculation will happen when data loads.');
                }
            }
        }, 500);
    }

    // Populate owner information section
    function populateOwnerInfo(owner) {
        if (!owner) {
            // Hide owner section if no owner data
            const ownerSection = document.querySelector('.owner-info');
            if (ownerSection) {
                ownerSection.innerHTML = '<p class="text-muted">Owner information not available</p>';
            }
            return;
        }

        const ownerName = document.getElementById('ownerName');
        const ownerAvatar = document.getElementById('ownerAvatar');
        const ownerJoined = document.getElementById('ownerJoined');
        const ownerRating = document.getElementById('ownerRating');
        const ownerResponse = document.getElementById('ownerResponse');
        const ownerResponseTime = document.getElementById('ownerResponseTime');
        const ownerVerified = document.getElementById('ownerVerified');
        const ownerInfoContainer = document.querySelector('.owner-info');

        // Set owner name
        if (ownerName) {
            ownerName.innerHTML = owner.name || 'Anonymous';
            if (owner.verified) {
                ownerName.innerHTML += ' <i class="bi bi-patch-check-fill verified-badge" title="Verified Owner" style="color: #1DA1F2; margin-left: 0.25rem;"></i>';
            }
        }

        // Set owner avatar
        if (ownerAvatar) {
            if (owner.avatar) {
                ownerAvatar.src = owner.avatar;
                ownerAvatar.alt = owner.name || 'Owner';
                ownerAvatar.onerror = function() {
                    this.src = getPlaceholderImage(80, 80, owner.name?.charAt(0) || 'O');
                };
            } else {
                ownerAvatar.src = getPlaceholderImage(80, 80, owner.name?.charAt(0) || 'O');
                ownerAvatar.alt = owner.name || 'Owner';
            }
        }

        // Set verified badge
        if (ownerVerified) {
            if (owner.verified) {
                ownerVerified.style.display = 'block';
                ownerVerified.innerHTML = '<i class="bi bi-shield-check-fill"></i>';
                ownerVerified.title = 'Verified Owner';
            } else {
                ownerVerified.style.display = 'none';
            }
        }

        // Set joined date
        if (ownerJoined) {
            if (owner.joined) {
                ownerJoined.textContent = `Joined in ${owner.joined}`;
            } else {
                ownerJoined.textContent = 'Member';
            }
        }

        // Set owner rating
        if (ownerRating) {
            if (owner.rating && parseFloat(owner.rating) > 0) {
                ownerRating.textContent = owner.rating;
            } else {
                ownerRating.textContent = 'New';
            }
        }

        // Set response rate
        if (ownerResponse) {
            if (owner.responseRate && owner.responseRate !== 'N/A') {
                ownerResponse.textContent = `Response rate: ${owner.responseRate}`;
            } else {
                ownerResponse.textContent = 'Response rate: N/A';
            }
        }

        // Set response time
        if (ownerResponseTime) {
            if (owner.responseTime && owner.responseTime !== 'N/A') {
                ownerResponseTime.textContent = owner.responseTime;
            } else {
                ownerResponseTime.textContent = 'Response time: N/A';
            }
        }

        // Set owner ID for contact functionality
        if (ownerInfoContainer && owner.id) {
            ownerInfoContainer.setAttribute('data-owner-id', owner.id);
        }

        // Generate review stars (use listingData, not data)
        const reviewStars = document.getElementById('reviewStars');
        if (reviewStars && listingData && listingData.rating) {
            const rating = parseFloat(listingData.rating) || 0;
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            let starsHTML = '';
            for (let i = 0; i < fullStars; i++) {
                starsHTML += '<i class="bi bi-star-fill"></i>';
            }
            if (hasHalfStar) {
                starsHTML += '<i class="bi bi-star-half"></i>';
            }
            for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
                starsHTML += '<i class="bi bi-star"></i>';
            }
            reviewStars.innerHTML = starsHTML;
        }

        // Reviews will be loaded separately via loadListingReviews()
    }

    function renderSafetyGuidelines(data) {
        const safetyContainer = document.querySelector('.safety-info');
        if (!safetyContainer) return;

        const catKey = String(data.category || '').toLowerCase().replace('-', '_');
        const guidelines = CATEGORY_SAFETY_GUIDELINES[catKey] || CATEGORY_SAFETY_GUIDELINES.default;

        safetyContainer.innerHTML = guidelines.map(text => `
            <div class="safety-item">
                <i class="bi bi-shield-check"></i>
                <div>
                    <strong>Safety tip</strong>
                    <small>${text}</small>
                </div>
            </div>
        `).join('');
    }

    // Display images
    function displayImages() {
        const mainImage = document.getElementById('mainImage');
        const thumbnailGallery = document.getElementById('thumbnailGallery');

        console.log('🖼️ Displaying images. Count:', listingImages.length);
        console.log('🖼️ Image URLs:', listingImages);

        if (!mainImage) {
            console.error('❌ Main image element not found in DOM');
            return;
        }

        if (listingImages.length > 0) {
            const firstImage = listingImages[0];
            console.log('🖼️ Setting main image to:', firstImage);
            mainImage.src = firstImage;
            mainImage.alt = 'Listing Image';
            mainImage.onload = function() {
                console.log('✅ Main image loaded successfully:', firstImage);
            };
            mainImage.onerror = function() {
                console.error('❌ Failed to load main image:', firstImage);
                this.src = getPlaceholderImage(800, 600, 'Image Not Available');
            };
            currentImageIndex = 0;
        } else {
            console.warn('⚠️ No images to display, using placeholder');
            mainImage.src = getPlaceholderImage(800, 600, 'No Image Available');
        }

        if (thumbnailGallery) {
            if (listingImages.length > 0) {
                console.log('🖼️ Creating thumbnail gallery with', listingImages.length, 'images');
                // Use DocumentFragment for better performance
                const fragment = document.createDocumentFragment();
                listingImages.forEach((img, index) => {
                    const thumbDiv = document.createElement('div');
                    thumbDiv.className = `thumbnail-item ${index === 0 ? 'active' : ''}`;
                    thumbDiv.onclick = () => selectImage(index);
                    thumbDiv.innerHTML = `<img src="${img}" alt="Thumbnail ${index + 1}" loading="lazy" onerror="this.src='${getPlaceholderImage(150, 150, 'Image Error')}'">`;
                    fragment.appendChild(thumbDiv);
                });
                thumbnailGallery.innerHTML = '';
                thumbnailGallery.appendChild(fragment);
            } else {
                console.warn('⚠️ No thumbnails to display');
                thumbnailGallery.innerHTML = '';
            }
        } else {
            console.error('❌ Thumbnail gallery element not found in DOM');
        }
    }

    // Select image
    window.selectImage = function(index) {
        currentImageIndex = index;
        const mainImage = document.getElementById('mainImage');
        if (mainImage && listingImages[index]) {
            // Smooth fade transition
            mainImage.classList.add('fade-out');
            setTimeout(() => {
                mainImage.src = listingImages[index];
                mainImage.classList.remove('fade-out');
                mainImage.classList.add('fade-in');
                setTimeout(() => {
                    mainImage.classList.remove('fade-in');
                }, 500);
            }, 250);
        }

        // Update active thumbnail
        document.querySelectorAll('.thumbnail-item').forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };

    // Change image
    window.changeImage = function(direction) {
        currentImageIndex += direction;
        if (currentImageIndex < 0) {
            currentImageIndex = listingImages.length - 1;
        } else if (currentImageIndex >= listingImages.length) {
            currentImageIndex = 0;
        }
        selectImage(currentImageIndex);
    };

    // Update guest limits
    function updateGuestLimits(maxGuests) {
        const adultsInput = document.getElementById('adults');
        const childrenInput = document.getElementById('children');
        const guestLimitInfo = document.getElementById('guestLimitInfo');
        const guestLimitText = document.getElementById('guestLimitText');
        
        if (adultsInput) {
            adultsInput.setAttribute('max', maxGuests);
        }
        
        if (guestLimitInfo && guestLimitText) {
            guestLimitText.textContent = `Maximum ${maxGuests} guests allowed`;
            guestLimitInfo.style.display = 'block';
        }
    }

    // Change guest type (adults or children)
    window.changeGuestType = function(type, delta) {
        const input = document.getElementById(type);
        if (!input) return;
        
        const maxGuests = listingData?.maxGuests || 10;
        const adultsInput = document.getElementById('adults');
        const childrenInput = document.getElementById('children');
        const totalGuestsInput = document.getElementById('guests');
        
        let currentValue = parseInt(input.value) || 0;
        let newValue = currentValue + delta;
        
        // Get total guests
        const adults = parseInt(adultsInput?.value) || 1;
        const children = parseInt(childrenInput?.value) || 0;
        const totalGuests = (type === 'adults' ? newValue : adults) + (type === 'children' ? newValue : children);
        
        // Validate limits
        if (type === 'adults') {
            if (newValue < 1) newValue = 1;
            if (newValue > maxGuests) newValue = maxGuests;
        } else {
            if (newValue < 0) newValue = 0;
            if (totalGuests > maxGuests) {
                // Adjust children to fit within limit
                newValue = Math.max(0, maxGuests - adults);
            }
        }
        
        // Final validation
        const finalTotal = (type === 'adults' ? newValue : adults) + (type === 'children' ? newValue : children);
        if (finalTotal > maxGuests) {
            alert(`Maximum ${maxGuests} guests allowed. Please adjust your selection.`);
            return;
        }
        
        input.value = newValue;
        
        // Update total guests
        if (totalGuestsInput) {
            const finalAdults = type === 'adults' ? newValue : parseInt(adultsInput?.value) || 1;
            const finalChildren = type === 'children' ? newValue : parseInt(childrenInput?.value) || 0;
            totalGuestsInput.value = finalAdults + finalChildren;
        }
        
        // Only calculate if listing data is loaded
        if (listingData && listingData.id) {
            calculatePrice();
        } else {
            console.warn('⏳ Guest count changed but listingData not loaded yet');
        }
    };

    // Calculate price based on pricing model
    function calculatePrice() {
        // CRITICAL: Don't calculate if listing data isn't loaded yet
        if (!listingData || !listingData.id) {
            console.warn('⏳ calculatePrice called but listingData not loaded yet. Will retry after data loads.');
            // Show loading state
            const breakdownPlaceholder = document.getElementById('breakdownPlaceholder');
            const breakdownItems = document.getElementById('breakdownItems');
            const totalPriceElement = document.getElementById('totalPrice');
            
            if (breakdownPlaceholder) {
                breakdownPlaceholder.style.display = 'flex';
                breakdownPlaceholder.innerHTML = `
                    <i class="bi bi-hourglass-split"></i>
                    <span>Loading listing data...</span>
                `;
            }
            if (breakdownItems) breakdownItems.style.display = 'none';
            if (totalPriceElement) {
                totalPriceElement.textContent = 'Rs 0';
            }
            return;
        }
        
        const checkIn = document.getElementById('checkIn')?.value;
        const checkOut = document.getElementById('checkOut')?.value;
        const adultsInput = document.getElementById('adults');
        const childrenInput = document.getElementById('children');
        const totalGuests = (parseInt(adultsInput?.value) || 1) + (parseInt(childrenInput?.value) || 0);

        console.log('calculatePrice called:', {
            checkIn,
            checkOut,
            listingDataLoaded: !!listingData,
            listingId: listingData?.id,
            listingPrice: listingData?.price,
            listingPeriod: listingData?.period,
            listingCurrency: listingData?.currency
        });

        if (!checkIn || !checkOut) {
            // Show placeholder if no dates
            const breakdownPlaceholder = document.getElementById('breakdownPlaceholder');
            const breakdownItems = document.getElementById('breakdownItems');
            const totalPriceElement = document.getElementById('totalPrice');
            const testPaymentSection = document.getElementById('testPaymentSection');
            
            if (breakdownPlaceholder) {
                breakdownPlaceholder.style.display = 'flex';
                breakdownPlaceholder.innerHTML = `
                    <i class="bi bi-calendar"></i>
                    <span>Select dates to see pricing</span>
                `;
            }
            if (breakdownItems) breakdownItems.style.display = 'none';
            if (totalPriceElement) {
                const currencySymbol = listingData?.currency === 'USD' ? '$' : 'Rs';
                totalPriceElement.textContent = `${currencySymbol} 0`;
            }
            if (testPaymentSection) testPaymentSection.style.display = 'none';
            return;
        }

        if (!listingData || !listingData.price) {
            console.error('❌ Cannot calculate price: listingData is missing or has no price', {
                listingData: !!listingData,
                price: listingData?.price
            });
            // Show placeholder if no listing data
            const breakdownPlaceholder = document.getElementById('breakdownPlaceholder');
            const breakdownItems = document.getElementById('breakdownItems');
            const totalPriceElement = document.getElementById('totalPrice');
            const testPaymentSection = document.getElementById('testPaymentSection');
            
            if (breakdownPlaceholder) {
                breakdownPlaceholder.style.display = 'flex';
                breakdownPlaceholder.innerHTML = `
                    <i class="bi bi-exclamation-triangle"></i>
                    <span style="color: var(--error-color);">Listing data not loaded. Please refresh the page.</span>
                `;
            }
            if (breakdownItems) breakdownItems.style.display = 'none';
            if (totalPriceElement) {
                const currencySymbol = listingData?.currency === 'USD' ? '$' : 'Rs';
                totalPriceElement.textContent = `${currencySymbol} 0`;
            }
            if (testPaymentSection) testPaymentSection.style.display = 'none';
            return;
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const timeDiff = checkOutDate - checkInDate;
        
        if (timeDiff <= 0) {
            const breakdownPlaceholder = document.getElementById('breakdownPlaceholder');
            const breakdownItems = document.getElementById('breakdownItems');
            const totalPriceElement = document.getElementById('totalPrice');
            
            if (breakdownPlaceholder) {
                breakdownPlaceholder.style.display = 'flex';
                breakdownPlaceholder.innerHTML = `
                    <i class="bi bi-exclamation-triangle"></i>
                    <span style="color: var(--error-color);">Invalid dates - Check-out must be after check-in</span>
                `;
            }
            if (breakdownItems) breakdownItems.style.display = 'none';
            if (totalPriceElement) {
                const currencySymbol = listingData?.currency === 'USD' ? '$' : 'Rs';
                totalPriceElement.textContent = `${currencySymbol} 0`;
            }
            return;
        }
        
        // Check availability - check the full date range
        let isRangeAvailable = true;
        if (bookedDates && bookedDates.length > 0) {
            isRangeAvailable = !bookedDates.some(booking => {
                const bookingCheckIn = new Date(booking.checkIn);
                const bookingCheckOut = new Date(booking.checkOut);
                // Check if ranges overlap
                return (checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn);
            });
        }
        
        // Update availability status display
        checkDateAvailability(checkIn, 'checkIn');
        
        if (!isRangeAvailable) {
            const breakdownPlaceholder = document.getElementById('breakdownPlaceholder');
            const breakdownItems = document.getElementById('breakdownItems');
            const totalPriceElement = document.getElementById('totalPrice');
            
            if (breakdownPlaceholder) {
                breakdownPlaceholder.style.display = 'flex';
                breakdownPlaceholder.innerHTML = `
                    <i class="bi bi-x-circle"></i>
                    <span style="color: var(--error-color);">Selected dates are not available</span>
                `;
            }
            if (breakdownItems) breakdownItems.style.display = 'none';
            if (totalPriceElement) {
                const currencySymbol = listingData?.currency === 'USD' ? '$' : 'Rs';
                totalPriceElement.textContent = `${currencySymbol} 0`;
            }
            return;
        }

        // Calculate duration based on pricing model
        let duration = 0;
        let durationLabel = '';
        const period = listingData.period || 'day';
        const currencySymbol = listingData.currency === 'USD' ? '$' : 'Rs';

        switch (period) {
            case 'hourly':
                duration = Math.ceil(timeDiff / (1000 * 60 * 60)); // Hours
                durationLabel = duration === 1 ? 'hour' : 'hours';
                break;
            case 'daily':
                duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Days
                durationLabel = duration === 1 ? 'day' : 'days';
                break;
            case 'weekly':
                duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 7)); // Weeks
                durationLabel = duration === 1 ? 'week' : 'weeks';
                break;
            case 'monthly':
                duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30)); // Months (approximate)
                durationLabel = duration === 1 ? 'month' : 'months';
                break;
            default:
                duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Default to days
                durationLabel = duration === 1 ? 'day' : 'days';
        }

        // Validate minimum duration
        if (listingData.minDuration && duration < listingData.minDuration) {
            const breakdownPlaceholder = document.getElementById('breakdownPlaceholder');
            const breakdownItems = document.getElementById('breakdownItems');
            const totalPriceElement = document.getElementById('totalPrice');
            
            if (breakdownPlaceholder) {
                breakdownPlaceholder.style.display = 'flex';
                breakdownPlaceholder.innerHTML = `
                    <i class="bi bi-exclamation-triangle"></i>
                    <span style="color: var(--error-color);">Minimum ${listingData.minDuration} ${durationLabel} required</span>
                `;
            }
            if (breakdownItems) breakdownItems.style.display = 'none';
            if (totalPriceElement) {
                totalPriceElement.textContent = `${currencySymbol} 0`;
            }
            return;
        }

        // Calculate base price
        const basePrice = listingData.price * duration;
        const serviceFee = Math.round(basePrice * 0.05); // 5% service fee
        const deposit = listingData.deposit || 0;
        const subtotal = basePrice + serviceFee;
        const total = subtotal + deposit;

        const breakdownContainer = document.getElementById('priceBreakdown');
        const breakdownPlaceholder = document.getElementById('breakdownPlaceholder');
        const breakdownItems = document.getElementById('breakdownItems');
        const totalPriceElement = document.getElementById('totalPrice');
        const testPaymentSection = document.getElementById('testPaymentSection');
        const testPaymentAmount = document.getElementById('testPaymentAmount');
        
        if (breakdownContainer) {
            if (breakdownPlaceholder) breakdownPlaceholder.style.display = 'none';
            if (breakdownItems) breakdownItems.style.display = 'block';
            
            let breakdownHTML = `
                <div class="breakdown-item-enhanced">
                    <div class="breakdown-item-left">
                        <i class="bi bi-tag"></i>
                        <div>
                            <span class="breakdown-label">Base Price</span>
                            <span class="breakdown-detail">${currencySymbol} ${listingData.price.toLocaleString()} × ${duration} ${durationLabel}</span>
                        </div>
                    </div>
                    <span class="breakdown-value">${currencySymbol} ${basePrice.toLocaleString()}</span>
                </div>
            `;
            
            if (serviceFee > 0) {
                breakdownHTML += `
                    <div class="breakdown-item-enhanced">
                        <div class="breakdown-item-left">
                            <i class="bi bi-percent"></i>
                            <div>
                                <span class="breakdown-label">Service Fee</span>
                                <span class="breakdown-detail">5% of base price</span>
                            </div>
                        </div>
                        <span class="breakdown-value">${currencySymbol} ${serviceFee.toLocaleString()}</span>
                    </div>
                `;
            }
            
            if (deposit > 0) {
                breakdownHTML += `
                    <div class="breakdown-item-enhanced">
                        <div class="breakdown-item-left">
                            <i class="bi bi-shield-lock"></i>
                            <div>
                                <span class="breakdown-label">Security Deposit</span>
                                <span class="breakdown-detail">Refundable</span>
                            </div>
                        </div>
                        <span class="breakdown-value">${currencySymbol} ${deposit.toLocaleString()}</span>
                    </div>
                `;
            }
            
            if (breakdownItems) {
                breakdownItems.innerHTML = breakdownHTML;
            }
            
            if (totalPriceElement) {
                totalPriceElement.textContent = `${currencySymbol} ${total.toLocaleString()}`;
            }
            
            // Show test payment section when price is calculated
            if (testPaymentSection && total > 0) {
                testPaymentSection.style.display = 'block';
            }
            
            if (testPaymentAmount) {
                testPaymentAmount.textContent = `${currencySymbol} ${total.toLocaleString()}`;
            }
        }
    }

    // Handle booking submission (real API)
    window.handleBookingSubmit = async function(event) {
        event.preventDefault();

        const checkIn = document.getElementById('checkIn')?.value;
        const checkOut = document.getElementById('checkOut')?.value;
        const adultsInput = document.getElementById('adults');
        const childrenInput = document.getElementById('children');
        const adults = parseInt(adultsInput?.value) || 1;
        const children = parseInt(childrenInput?.value) || 0;
        const totalGuests = adults + children;

        if (!checkIn || !checkOut) {
            alert('Please select check-in and check-out dates');
            return;
        }

        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (checkOutDate <= checkInDate) {
            alert('Check-out date must be after check-in date');
            return;
        }

        // Validate minimum duration
        const timeDiff = checkOutDate - checkInDate;
        const period = listingData?.period || 'day';
        let duration = 0;
        
        switch (period) {
            case 'hourly':
                duration = Math.ceil(timeDiff / (1000 * 60 * 60));
                break;
            case 'daily':
                duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                break;
            case 'weekly':
                duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 7));
                break;
            case 'monthly':
                duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30));
                break;
        }
        
        if (listingData?.minDuration && duration < listingData.minDuration) {
            alert(`Minimum booking duration is ${listingData.minDuration} ${period}${listingData.minDuration > 1 ? 's' : ''}`);
            return;
        }

        // Validate guest limits
        const maxGuests = listingData?.maxGuests || 10;
        if (totalGuests > maxGuests) {
            alert(`Maximum ${maxGuests} guests allowed. Please adjust your selection.`);
            return;
        }
        
        // Check availability before submitting
        const isRangeAvailable = !bookedDates.some(booking => {
            const bookingCheckIn = new Date(booking.checkIn);
            const bookingCheckOut = new Date(booking.checkOut);
            return (checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn);
        });
        
        if (!isRangeAvailable) {
            alert('The selected dates are not available. Please choose different dates.');
            return;
        }
        
        if (totalGuests < 1) {
            alert('Please select at least 1 guest');
            return;
        }

        // Validate price calculation
        const totalPriceElement = document.getElementById('totalPrice');
        const totalPriceText = totalPriceElement?.textContent || '';
        if (!totalPriceElement || totalPriceText.includes('Rs 0') || totalPriceText.includes('$0') || totalPriceText.includes('-')) {
            alert('Please select valid dates to see pricing before booking.\n\nMake sure:\n- Check-in date is selected\n- Check-out date is after check-in\n- Dates are available');
            return;
        }
        
        // Extract numeric value from total price
        const priceMatch = totalPriceText.match(/[\d,]+/);
        if (!priceMatch || parseFloat(priceMatch[0].replace(/,/g, '')) <= 0) {
            alert('Invalid price calculated. Please refresh the page and try again.');
            return;
        }

        // Get listing ID
        const listingId = listingData?.id || getListingIdFromUrl();
        if (!listingId) {
            alert('Listing information not available. Please refresh the page.');
            console.error('No listing ID available');
            return;
        }

        const submitBtn = document.getElementById('bookNowBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinning"></i> Processing...';
        }

        try {
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
            const token = localStorage.getItem('mr-token');

            if (!token) {
                // Not logged in: send to login and come back here
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'login.html';
                return;
            }

            const bookingPayload = {
                listingId: listingId,
                checkIn,
                checkOut,
                guests: totalGuests,
                adults: adults,
                children: children,
            };
            
            console.log('📤 Creating booking with payload:', bookingPayload);
            console.log('📤 API URL:', `${API_BASE_URL}/bookings`);
            console.log('📤 Token present:', !!token);

            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(bookingPayload),
            });
            
            console.log('📥 Booking API response status:', response.status, response.statusText);

            let data;
            try {
                const responseText = await response.text();
                console.log('📦 Raw booking response:', responseText);
                
                if (!responseText || responseText.trim() === '') {
                    throw new Error('Empty response from server');
                }
                
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                console.error('Response status:', response.status);
                console.error('Response headers:', response.headers);
                throw new Error('Invalid response from server. Please try again.');
            }

            console.log('📦 Booking API response:', {
                status: data.status,
                hasBooking: !!data.booking,
                bookingId: data.booking?.id || data.booking?._id,
                message: data.message,
                fullData: data
            });

            if (!response.ok) {
                const message = data.message || data.error || `Server error: ${response.status} ${response.statusText}`;
                console.error('❌ Booking failed - Response not OK:', {
                    status: response.status,
                    statusText: response.statusText,
                    message: message,
                    data: data
                });
                alert(`Booking failed: ${message}\n\nPlease check:\n- Your dates are valid\n- You're logged in\n- The listing is available`);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-calendar-check"></i> Reserve now';
                }
                return;
            }

            if (data.status !== 'success' || !data.booking) {
                const message = data.message || data.error || 'Booking failed. Please try again.';
                console.error('❌ Booking failed - Invalid response:', {
                    status: data.status,
                    hasBooking: !!data.booking,
                    message: message,
                    data: data
                });
                alert(`Booking failed: ${message}\n\nResponse: ${JSON.stringify(data, null, 2)}`);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-calendar-check"></i> Reserve now';
                }
                return;
            }

            const bookingId = data.booking.id || data.booking._id;
            const listingIdForPayment = data.booking.listing?._id || data.booking.listing?.id || listingId;

            if (!bookingId) {
                console.error('❌ No booking ID in response:', data);
                alert('Booking created but no booking ID received. Please contact support.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-calendar-check"></i> Reserve now';
                }
                return;
            }

            console.log('✅ Booking successful! Redirecting to payment:', { 
                bookingId, 
                listingIdForPayment,
                bookingNumber: data.booking.bookingNumber 
            });

            // Small delay to ensure user sees success
            setTimeout(() => {
                window.location.href = `payment.html?bookingId=${encodeURIComponent(bookingId)}&listingId=${encodeURIComponent(listingIdForPayment)}`;
            }, 500);
        } catch (error) {
            console.error('❌ Booking error caught:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            let errorMessage = 'An error occurred while creating your booking. Please try again.';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error instanceof TypeError && error.message.includes('fetch')) {
                errorMessage = 'Network error: Could not connect to server. Please check your internet connection and try again.';
            } else if (error instanceof SyntaxError) {
                errorMessage = 'Server response error: Invalid data received. Please try again.';
            }
            
            alert(`Booking Error:\n\n${errorMessage}\n\nPlease check:\n- Your internet connection\n- The backend server is running\n- Your dates and guest selection are valid`);
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-calendar-check"></i> Reserve now';
            }
        }
    };

    function getListingIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // Contact Owner - Create or open conversation
    window.contactOwner = async function(event) {
        // Prevent default button behavior
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        console.log('Contact Host button clicked');
        console.log('Listing data:', listingData);

        // Get listing ID from URL if listingData is not available
        let listingId = null;
        if (listingData && listingData.id) {
            listingId = listingData.id;
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            listingId = urlParams.get('id');
        }

        if (!listingId) {
            alert('Listing information not available. Please refresh the page.');
            console.error('No listing ID available');
            return false;
        }

        console.log('Listing ID:', listingId);

        // Check authentication
        const token = localStorage.getItem('mr-token');
        if (!token) {
            console.log('No token found, redirecting to login');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return false;
        }

        // Check if user is the owner
        const currentUser = window.getCurrentUser?.();
        if (currentUser && listingData && listingData.owner) {
            const ownerId = listingData.owner.id || listingData.owner;
            if (String(currentUser.id) === String(ownerId)) {
                alert('You cannot message yourself.');
                return false;
            }
        }

        // Show loading state
        const button = event?.target?.closest('.btn-contact-owner') || document.querySelector('.btn-contact-owner');
        if (button) {
            const originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="bi bi-hourglass-split"></i> Opening chat...';
        }

        try {
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
            console.log('Creating conversation for listing:', listingId);
            
            const response = await fetch(`${API_BASE_URL}/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ listingId: listingId }),
            });

            const data = await response.json();
            console.log('Conversation response:', data);

            if (!response.ok || data.status !== 'success') {
                console.error('Error creating conversation:', data);
                alert('Failed to start conversation. ' + (data.message || 'Please try again.'));
                if (button) {
                    button.disabled = false;
                    button.innerHTML = originalText;
                }
                return false;
            }

            // Navigate to messages page with the conversation
            const conversationId = data.conversation?.id || data.conversation?._id;
            if (conversationId) {
                console.log('Navigating to messages page with conversation:', conversationId);
                window.location.href = `messages.html?conversationId=${conversationId}`;
            } else {
                console.error('No conversation ID in response:', data);
                alert('Failed to get conversation ID. Please try again.');
                if (button) {
                    button.disabled = false;
                    button.innerHTML = originalText;
                }
            }
        } catch (error) {
            console.error('Error contacting owner:', error);
            alert('Failed to start conversation. Please check your connection and try again.');
            if (button) {
                button.disabled = false;
                button.innerHTML = originalText;
            }
        }

        return false;
    };

    // Scroll to reviews
    window.scrollToReviews = function() {
        const reviewsSection = document.querySelector('.detail-card:has(.review-summary)');
        if (reviewsSection) {
            reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Show all reviews
    window.showAllReviews = function() {
        alert('Show all reviews: This will expand to show all reviews.\n\nIn production, this will load more reviews or redirect to a reviews page.');
    };

    // Report listing
    window.reportListing = function() {
        if (confirm('Are you sure you want to report this listing?')) {
            alert('Report submitted. Our team will review this listing.\n\nIn production, this will submit a report to the moderation team.');
        }
    };

    window.submitDispute = function submitDispute() {
        const form = document.getElementById('disputeForm');
        if (!form) return;
        const formData = new FormData(form);
        const issueType = formData.get('issueType');
        const details = formData.get('details');
        if (!issueType || !details) {
            alert('Please select an issue type and provide details.');
            return;
        }
        // In production, send to backend
        alert('Dispute submitted. Our team will follow up.\n\n(Replace with API call)');
        const modalEl = document.getElementById('disputeModal');
        if (modalEl && window.bootstrap) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
        form.reset();
    };

    // Load similar listings with graceful states
    function loadSimilarListings(category, currentListingId) {
        const similarContainer = document.getElementById('similarListings');
        const loadingEl = document.getElementById('similarLoading');
        const emptyEl = document.getElementById('similarEmpty');
        if (!similarContainer) return;

        const showLoading = () => {
            if (loadingEl) loadingEl.style.display = 'flex';
            if (emptyEl) emptyEl.style.display = 'none';
            similarContainer.innerHTML = '';
        };

        const showEmpty = () => {
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'flex';
            similarContainer.innerHTML = '';
        };

        const render = (list) => {
            if (!list || !list.length) {
                showEmpty();
                return;
            }
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'none';
            similarContainer.innerHTML = list.map(listing => `
                <a href="listing-detail.html?id=${listing.id}" class="similar-listing-card">
                    <img src="${listing.image || getPlaceholderImage(400, 300, 'No Image')}" 
                         alt="${listing.title}" 
                         class="similar-listing-image"
                         onerror="this.src='${getPlaceholderImage(400, 300, 'No Image')}'">
                    <div class="similar-listing-content">
                        <h4 class="similar-listing-title">${escapeHtml(listing.title)}</h4>
                        <p class="similar-listing-location">
                            <i class="bi bi-geo-alt"></i>
                            ${escapeHtml(listing.location || 'Location not specified')}
                        </p>
                        <div class="similar-listing-meta">
                            ${listing.rating > 0 ? `
                            <span class="similar-listing-rating">
                                <i class="bi bi-star-fill"></i> ${listing.rating.toFixed(1)}
                                ${listing.reviewCount > 0 ? `(${listing.reviewCount})` : ''}
                            </span>
                            ` : ''}
                            <div class="similar-listing-price">
                                Rs ${listing.price.toLocaleString()}/${listing.period}
                            </div>
                        </div>
                        ${listing.verified ? '<span class="similar-badge verified"><i class="bi bi-shield-check"></i> Verified</span>' : ''}
                        ${listing.instant ? '<span class="similar-badge instant"><i class="bi bi-lightning-fill"></i> Instant</span>' : ''}
                    </div>
                </a>
            `).join('');
        };

        showLoading();

        const fallbackData = [
            {
                id: 2,
                title: 'Modern Villa with Pool',
                location: 'F-7, Islamabad',
                price: 50000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'
            },
            {
                id: 3,
                title: 'Cozy 2-Bedroom Apartment',
                location: 'Gulberg, Lahore',
                price: 18000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
            },
            {
                id: 4,
                title: 'Luxury Penthouse',
                location: 'Clifton, Karachi',
                price: 75000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=400&h=300&fit=crop'
            }
        ].filter(listing => listing.id !== parseInt(currentListingId));

        // In production, fetch from recommendations endpoint
        fetchSimilarFromApi(category, currentListingId)
            .then(apiList => {
                if (apiList && apiList.length) {
                    render(apiList);
                } else {
                    render(fallbackData);
                }
            })
            .catch(() => render(fallbackData));
    }

    function fetchSimilarFromApi(category, listingId) {
        const API_BASE = window.API_BASE_URL || 'http://localhost:4001/api';
        return fetch(`${API_BASE}/listings/${listingId}/similar`)
            .then(res => res.ok ? res.json() : Promise.reject(res.status))
            .then(data => {
                if (data.status === 'success' && Array.isArray(data.listings)) {
                    return data.listings;
                }
                return [];
            })
            .catch(err => {
                console.error('Error fetching similar listings:', err);
                return [];
            });
    }

    // Test Payment Modal Functions
    window.openTestPaymentModal = function() {
        const modalElement = document.getElementById('testPaymentModal');
        if (!modalElement) return;
        
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Update payment amount
        const totalPriceElement = document.getElementById('totalPrice');
        const testPaymentAmount = document.getElementById('testPaymentAmount');
        if (totalPriceElement && testPaymentAmount) {
            testPaymentAmount.textContent = totalPriceElement.textContent;
        }
        
        // Reset form to card method
        const cardRadio = document.querySelector('input[name="testPaymentMethod"][value="card"]');
        if (cardRadio) cardRadio.checked = true;
        const cardForm = document.getElementById('testCardForm');
        const jazzCashForm = document.getElementById('testJazzCashForm');
        const easypaisaForm = document.getElementById('testEasypaisaForm');
        if (cardForm) cardForm.style.display = 'block';
        if (jazzCashForm) jazzCashForm.style.display = 'none';
        if (easypaisaForm) easypaisaForm.style.display = 'none';
    };

    // Handle payment method change in test modal
    document.addEventListener('change', function(e) {
        if (e.target && e.target.name === 'testPaymentMethod') {
            const method = e.target.value;
            const cardForm = document.getElementById('testCardForm');
            const jazzCashForm = document.getElementById('testJazzCashForm');
            const easypaisaForm = document.getElementById('testEasypaisaForm');
            
            if (cardForm) cardForm.style.display = method === 'card' ? 'block' : 'none';
            if (jazzCashForm) jazzCashForm.style.display = method === 'jazzcash' ? 'block' : 'none';
            if (easypaisaForm) easypaisaForm.style.display = method === 'easypaisa' ? 'block' : 'none';
        }
    });

    // Process test payment
    window.processTestPayment = function() {
        const form = document.getElementById('testPaymentForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const paymentMethod = formData.get('testPaymentMethod');
        const totalPriceElement = document.getElementById('totalPrice');
        const amount = totalPriceElement?.textContent || 'Rs 0';

        // Simulate payment processing
        const submitBtn = document.querySelector('#testPaymentModal .btn-primary');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinning"></i> Processing...';
        }

        // Simulate API call delay
        setTimeout(() => {
            // Show success message
            alert(`✅ Test Payment Successful!\n\nPayment Method: ${paymentMethod.toUpperCase()}\nAmount: ${amount}\n\nThis is a demo payment - no real transaction was processed.`);
            
            // Close modal
            const modalElement = document.getElementById('testPaymentModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
            
            // Reset button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Process Test Payment';
            }
        }, 2000);
    };

    // Prevent form submission
    window.handleTestPayment = function(event) {
        if (event) event.preventDefault();
        processTestPayment();
    };

    // Add spinning animation
    const style = document.createElement('style');
    style.textContent = `
        .spinning {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Diagnostic function - can be called from browser console
    window.debugListingDetail = function() {
        console.log('=== Listing Detail Page Diagnostics ===');
        console.log('Current URL:', window.location.href);
        console.log('API Base URL:', window.API_BASE_URL || 'http://localhost:4001/api');
        console.log('Listing Data:', listingData);
        console.log('Listing Images:', listingImages);
        console.log('Current Image Index:', currentImageIndex);
        console.log('Booked Dates:', bookedDates);
        
        const urlParams = new URLSearchParams(window.location.search);
        const listingId = urlParams.get('id') || urlParams.get('listingId') || '1';
        console.log('Listing ID from URL:', listingId);
        
        // Test API connection
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
        console.log('Testing API connection to:', `${API_BASE_URL}/listings/${listingId}`);
        fetch(`${API_BASE_URL}/listings/${listingId}`)
            .then(res => {
                console.log('API Response Status:', res.status);
                return res.json();
            })
            .then(data => {
                console.log('✅ API Test Response:', data);
            })
            .catch(error => {
                console.error('❌ API Test Failed:', error);
            });
    };
    
    // Auto-run diagnostics if page shows hardcoded values after 3 seconds
    setTimeout(() => {
        const titleElement = document.getElementById('listingTitle');
        if (titleElement && titleElement.textContent === 'Luxury 3-Bedroom Apartment in DHA Lahore') {
            console.warn('⚠️ Page still showing hardcoded values after 3 seconds');
            console.warn('⚠️ This indicates the API call may have failed or data is not loading');
            console.warn('⚠️ Run debugListingDetail() in console for more info');
            if (window.debugListingDetail) {
                window.debugListingDetail();
            }
        }
    }, 3000);

})();

