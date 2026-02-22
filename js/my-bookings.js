// My Bookings Page Functionality
// Booking history and management for both Renters and Owners

(function() {
    'use strict';

    const API_BASE_URL = 'http://localhost:4001/api';
    let allBookings = [];
    let currentFilter = 'all';
    let currentRole = 'renter'; // 'renter' or 'owner'

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initMyBookings();
        console.log('✅ My bookings page initialized');
    });

    // Initialize my bookings page
    function initMyBookings() {
        injectEmergencyBanner();

        // Check if user has owner permissions to show role toggle
        checkAndShowRoleToggle();

        // Get filter from URL
        const urlParams = new URLSearchParams(window.location.search);
        const filter = urlParams.get('filter') || 'all';
        const bookingId = urlParams.get('bookingId');
        const status = urlParams.get('status');
        const role = urlParams.get('role');

        // Set initial role from URL if provided
        if (role === 'owner') {
            currentRole = 'owner';
            updateRoleToggleUI();
        }

        // Load bookings
        loadBookings();

        // Set active filter
        if (filter) {
            filterBookings(filter);
        }

        // Show success message if booking was just confirmed
        if (bookingId && status === 'confirmed') {
            showSuccessMessage('Booking confirmed successfully!');
        }
    }

    // Check if user has owner permissions and show role toggle
    function checkAndShowRoleToggle() {
        const roleToggleContainer = document.getElementById('roleToggleContainer');
        if (!roleToggleContainer) return;

        // Check if user is an owner or dual_role
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = user.role || user.activeRole || 'renter';

        if (userRole === 'owner' || userRole === 'dual_role' || userRole === 'admin') {
            roleToggleContainer.style.display = 'block';
        }
    }

    // Update role toggle UI
    function updateRoleToggleUI() {
        const renterToggle = document.getElementById('renterToggle');
        const ownerToggle = document.getElementById('ownerToggle');

        if (renterToggle && ownerToggle) {
            renterToggle.classList.toggle('active', currentRole === 'renter');
            ownerToggle.classList.toggle('active', currentRole === 'owner');
        }
    }

    // Switch booking role view
    window.switchBookingRole = function(role) {
        if (role === currentRole) return;

        currentRole = role;
        updateRoleToggleUI();
        currentFilter = 'all';

        // Update active filter tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === 'all');
        });

        // Reload bookings
        loadBookings();
    };

    function injectEmergencyBanner() {
        try {
            if (!window.isLoggedIn || !window.isLoggedIn()) return;
            if (!window.hasPermission || !window.hasPermission('viewBookingHistory')) return;

            const section = document.querySelector('.my-bookings-section .container');
            if (!section || document.querySelector('.emergency-banner')) return;

            const banner = document.createElement('div');
            banner.className = 'emergency-banner';
            banner.innerHTML = `
                <i class="bi bi-shield-exclamation"></i>
                <div>
                    <strong>Need urgent help during a booking?</strong>
                    <span>For safety or emergency issues, call <a href="tel:+923001234567">+92 300 1234567</a> or email <a href="mailto:support@myrental.pk">support@myrental.pk</a>. Our team is available 24/7.</span>
                </div>
            `;
            section.insertBefore(banner, section.firstChild);
        } catch (e) {
            console.warn('Emergency banner error:', e);
        }
    }

    // Load bookings (API first, then fallback to demo data)
    async function loadBookings() {
        const container = document.getElementById('bookingsList');
        const emptyState = document.getElementById('emptyState');

        // Show loading state
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="loading-text">Loading your bookings...</div>
                </div>
            `;
        }
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        try {
            const token = localStorage.getItem('mr-token');
            if (!token) {
                // Not logged in (should already be guarded) – show empty state
                allBookings = [];
                displayBookings(allBookings);
                updateCounts(allBookings);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/bookings?role=${currentRole}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success' || !Array.isArray(data.bookings)) {
                console.error('Bookings API error:', data);
                showErrorMessage(data.message || 'Unable to load your bookings.');
                allBookings = [];
                displayBookings(allBookings);
                updateCounts(allBookings);
            } else {
                // Normalize API data into UI-friendly bookings
                allBookings = data.bookings.map(normalizeBookingFromApi);
                displayBookings(allBookings);
                updateCounts(allBookings);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            showErrorMessage('Network error while loading bookings. Please try again.');
            allBookings = [];
            displayBookings(allBookings);
            updateCounts(allBookings);
        }
    }

    // Fallback: use sample/demo data
    function loadDemoBookings() {
        allBookings = [
            {
                id: 1,
                listingId: 1,
                title: 'Luxury 3-Bedroom Apartment in DHA Lahore',
                location: 'DHA Phase 5, Lahore',
                image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=400&fit=crop',
                checkIn: '2025-02-15',
                checkOut: '2025-02-18',
                guests: 2,
                price: 25000,
                period: 'day',
                total: 88750,
                status: 'upcoming',
                bookingDate: '2025-01-20',
                paymentMethod: 'JazzCash'
            },
            {
                id: 2,
                listingId: 2,
                title: 'Modern Villa with Pool in Islamabad',
                location: 'F-7, Islamabad',
                image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=400&fit=crop',
                checkIn: '2025-01-25',
                checkOut: '2025-01-28',
                guests: 4,
                price: 50000,
                period: 'day',
                total: 165000,
                status: 'active',
                bookingDate: '2025-01-15',
                paymentMethod: 'Card'
            },
            {
                id: 3,
                listingId: 3,
                title: 'Cozy 2-Bedroom Apartment',
                location: 'Gulberg, Lahore',
                image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=400&fit=crop',
                checkIn: '2024-12-20',
                checkOut: '2024-12-25',
                guests: 2,
                price: 18000,
                period: 'day',
                total: 108000,
                status: 'completed',
                bookingDate: '2024-12-10',
                paymentMethod: 'Easypaisa'
            },
            {
                id: 4,
                listingId: 4,
                title: 'Luxury Penthouse',
                location: 'Clifton, Karachi',
                image: 'https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=400&h=400&fit=crop',
                checkIn: '2025-03-01',
                checkOut: '2025-03-05',
                guests: 3,
                price: 75000,
                period: 'day',
                total: 315000,
                status: 'cancelled',
                bookingDate: '2025-01-18',
                paymentMethod: 'Card'
            }
        ];

        displayBookings(allBookings);
        updateCounts(allBookings);
    }

    // Display bookings
    function displayBookings(bookings) {
        const container = document.getElementById('bookingsList');
        const emptyState = document.getElementById('emptyState');

        if (!container) return;

        if (bookings.length === 0) {
            container.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
                // Update empty state text based on role
                const emptyTitle = emptyState.querySelector('.empty-title');
                const emptyDesc = emptyState.querySelector('.empty-description');
                if (currentRole === 'owner') {
                    if (emptyTitle) emptyTitle.textContent = 'No booking requests';
                    if (emptyDesc) emptyDesc.textContent = 'You haven\'t received any booking requests yet. Make sure your listings are published!';
                } else {
                    if (emptyTitle) emptyTitle.textContent = 'No bookings found';
                    if (emptyDesc) emptyDesc.textContent = 'You don\'t have any bookings in this category yet.';
                }
            }
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = bookings.map(booking => {
            const checkInDate = formatDate(booking.checkIn);
            const checkOutDate = formatDate(booking.checkOut);
            const bookingDate = formatDate(booking.bookingDate);
            const days = calculateDays(booking.checkIn, booking.checkOut);

            // Owner view: show renter info
            const renterInfoHtml = currentRole === 'owner' && booking.renter ? `
                <div class="renter-info">
                    <div class="renter-avatar">${(booking.renter.name || 'R').charAt(0).toUpperCase()}</div>
                    <div class="renter-details">
                        <div class="renter-name">${booking.renter.name || 'Renter'}</div>
                        <div class="renter-email">${booking.renter.email || ''}</div>
                    </div>
                </div>
            ` : '';

            return `
                <div class="booking-card" data-booking-id="${booking.id}">
                    <div class="booking-card-header">
                        <div class="booking-status status-${booking.status}">
                            <i class="bi ${getStatusIcon(booking.status)}"></i>
                            <span>${getStatusText(booking.status)}</span>
                        </div>
                        <div class="booking-id">Booking #${booking.bookingNumber || booking.id}</div>
                    </div>
                    <div class="booking-card-body">
                        <img src="${booking.image}" alt="${booking.title}" class="booking-image">
                        <div class="booking-details">
                            ${renterInfoHtml}
                            <h3 class="booking-title">${booking.title}</h3>
                            <div class="booking-location">
                                <i class="bi bi-geo-alt-fill"></i>
                                <span>${booking.location}</span>
                            </div>
                            <div class="booking-dates">
                                <div class="date-item">
                                    <i class="bi bi-calendar-event"></i>
                                    <span><strong>Check-in:</strong> ${checkInDate}</span>
                                </div>
                                <div class="date-item">
                                    <i class="bi bi-calendar-check"></i>
                                    <span><strong>Check-out:</strong> ${checkOutDate}</span>
                                </div>
                            </div>
                            <div class="booking-meta">
                                <div class="meta-item">
                                    <i class="bi bi-people"></i>
                                    <span>${booking.guests} guest${booking.guests > 1 ? 's' : ''}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="bi bi-calendar"></i>
                                    <span>${days} ${booking.period}${days > 1 ? 's' : ''}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="bi bi-credit-card"></i>
                                    <span>Paid via ${booking.paymentMethod}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="bi bi-clock"></i>
                                    <span>Booked on ${bookingDate}</span>
                                </div>
                            </div>
                        </div>
                        <div class="booking-actions">
                            <div class="booking-price">
                                <div class="price-amount">Rs ${booking.total.toLocaleString()}</div>
                                <div class="price-period">Total amount</div>
                            </div>
                            ${currentRole === 'owner' ? getOwnerActionButtons(booking) : getActionButtons(booking.status, booking.id)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Get status icon
    function getStatusIcon(status) {
        const icons = {
            'upcoming': 'bi-calendar-event',
            'active': 'bi-check-circle',
            'completed': 'bi-check-circle-fill',
            'cancelled': 'bi-x-circle'
        };
        return icons[status] || 'bi-circle';
    }

    // Get status text
    function getStatusText(status) {
        const texts = {
            'upcoming': 'Upcoming',
            'active': 'Active',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return texts[status] || status;
    }

    // Get action buttons based on status (for renter view)
    function getActionButtons(status, bookingId) {
        let buttons = '';

        if (status === 'upcoming') {
            buttons += `
                <a href="listing-detail.html?id=${bookingId}" class="btn-action">
                    <i class="bi bi-eye"></i>
                    <span>View Details</span>
                </a>
                <button class="btn-action" onclick="cancelBooking('${bookingId}')">
                    <i class="bi bi-x-circle"></i>
                    <span>Cancel Booking</span>
                </button>
            `;
        } else if (status === 'active') {
            buttons += `
                <a href="listing-detail.html?id=${bookingId}" class="btn-action">
                    <i class="bi bi-eye"></i>
                    <span>View Details</span>
                </a>
                <a href="messages.html?bookingId=${bookingId}" class="btn-action primary" data-require="message">
                    <i class="bi bi-chat-dots"></i>
                    <span>Message Host</span>
                </a>
            `;
        } else if (status === 'completed') {
            buttons += `
                <a href="listing-detail.html?id=${bookingId}" class="btn-action">
                    <i class="bi bi-eye"></i>
                    <span>View Details</span>
                </a>
                <button class="btn-action primary btn-leave-review" data-require="review" onclick="writeReview('${bookingId}')">
                    <i class="bi bi-star"></i>
                    <span>Write Review</span>
                </button>
            `;
        } else {
            buttons += `
                <a href="listing-detail.html?id=${bookingId}" class="btn-action">
                    <i class="bi bi-eye"></i>
                    <span>View Details</span>
                </a>
            `;
        }

        return buttons;
    }

    // Get action buttons for owner view
    function getOwnerActionButtons(booking) {
        const bookingId = booking.id;
        const rawStatus = booking.rawStatus || booking.status;
        let buttons = '';

        // Pending bookings: Accept / Decline
        if (rawStatus === 'pending') {
            buttons += `
                <button class="owner-action-btn accept" onclick="acceptBooking('${bookingId}')">
                    <i class="bi bi-check-lg"></i>
                    <span>Accept</span>
                </button>
                <button class="owner-action-btn decline" onclick="declineBooking('${bookingId}')">
                    <i class="bi bi-x-lg"></i>
                    <span>Decline</span>
                </button>
            `;
        } 
        // Confirmed bookings: Mark Complete / Cancel
        else if (rawStatus === 'confirmed') {
            buttons += `
                <button class="owner-action-btn complete" onclick="completeBooking('${bookingId}')">
                    <i class="bi bi-check-circle"></i>
                    <span>Mark Complete</span>
                </button>
                <button class="owner-action-btn decline" onclick="ownerCancelBooking('${bookingId}')">
                    <i class="bi bi-x-circle"></i>
                    <span>Cancel</span>
                </button>
            `;
        }

        // Common actions for all statuses
        buttons += `
            <a href="messages.html?bookingId=${bookingId}" class="btn-action" data-require="message">
                <i class="bi bi-chat-dots"></i>
                <span>Message</span>
            </a>
        `;

        return buttons;
    }

    // Filter bookings
    window.filterBookings = function(filter) {
        currentFilter = filter;

        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            if (tab.dataset.filter === filter) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Filter bookings
        let filtered = allBookings;
        if (filter !== 'all') {
            filtered = allBookings.filter(booking => booking.status === filter);
        }

        displayBookings(filtered);
    };

    // Update counts
    function updateCounts(bookings) {
        const counts = {
            all: bookings.length,
            upcoming: bookings.filter(b => b.status === 'upcoming').length,
            active: bookings.filter(b => b.status === 'active').length,
            completed: bookings.filter(b => b.status === 'completed').length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length
        };

        Object.keys(counts).forEach(key => {
            const countElement = document.getElementById(`count-${key}`);
            if (countElement) {
                countElement.textContent = counts[key];
            }
        });
    }

    // Normalize booking coming from API into UI model
    function normalizeBookingFromApi(raw) {
        if (!raw) return {};

        const listing = raw.listing || {};
        const pricing = raw.pricing || {};
        const payment = raw.payment || {};
        const renter = raw.renter || {};
        const owner = raw.owner || {};

        // Map backend status values to UI buckets
        let uiStatus = 'upcoming';
        switch (raw.status) {
            case 'confirmed':
            case 'pending':
                uiStatus = 'upcoming';
                break;
            case 'completed':
                uiStatus = 'completed';
                break;
            case 'cancelled':
            case 'rejected':
            case 'expired':
                uiStatus = 'cancelled';
                break;
            default:
                uiStatus = 'active';
        }

        // Get listing image
        let listingImage = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=400&fit=crop';
        if (Array.isArray(listing.images) && listing.images.length > 0) {
            listingImage = listing.images[0].url || listing.images[0];
        } else if (Array.isArray(listing.media) && listing.media.length > 0) {
            listingImage = listing.media[0].url || listing.media[0];
        }

        return {
            // Use MongoDB _id for API operations, bookingNumber for display
            id: raw._id || raw.id || '',
            bookingNumber: raw.bookingNumber || '',
            listingId: listing._id || raw.listing,
            title: listing.title || 'Booking',
            location: listing.location && listing.location.city 
                ? `${listing.location.city}${listing.location.area ? ', ' + listing.location.area : ''}`
                : (listing.city || 'Unknown location'),
            image: listingImage,
            checkIn: raw.checkIn,
            checkOut: raw.checkOut,
            guests: raw.guests || raw.quantity || 1,
            price: pricing.rate || pricing.total || 0,
            period: pricing.model || 'day',
            total: pricing.total || 0,
            status: uiStatus,
            rawStatus: raw.status, // Keep original status for owner actions
            bookingDate: raw.createdAt || raw.confirmedAt || new Date().toISOString(),
            paymentMethod: payment.method 
                ? payment.method.charAt(0).toUpperCase() + payment.method.slice(1)
                : 'Card',
            // Include renter info for owner view
            renter: {
                id: renter._id || renter.id || '',
                name: renter.name || '',
                email: renter.email || '',
            },
            // Include owner info for renter view
            owner: {
                id: owner._id || owner.id || '',
                name: owner.name || '',
                email: owner.email || '',
            },
        };
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // Calculate days
    function calculateDays(checkIn, checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // Cancel booking (real API)
    window.cancelBooking = async function(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showErrorMessage('Please login to cancel a booking.');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        try {
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success') {
                const message = data.message || 'Failed to cancel booking.';
                showErrorMessage(message);
                return;
            }

            showSuccessMessage('Booking cancelled successfully.');
            // Reload bookings from API so status & counts are correct
            loadBookings();
        } catch (error) {
            console.error('Cancel booking error:', error);
            showErrorMessage('An error occurred while cancelling booking. Please try again.');
        }
    };

    // Owner: Accept booking
    window.acceptBooking = async function(bookingId) {
        if (!confirm('Accept this booking request?')) return;

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showErrorMessage('Please login to manage bookings.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/accept`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to accept booking');
            }

            showSuccessMessage('Booking accepted successfully!');
            loadBookings();
        } catch (error) {
            console.error('Accept booking error:', error);
            showErrorMessage(error.message || 'Failed to accept booking');
        }
    };

    // Owner: Decline booking
    window.declineBooking = async function(bookingId) {
        const reason = prompt('Reason for declining (optional):');
        if (reason === null) return; // User cancelled

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showErrorMessage('Please login to manage bookings.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/decline`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to decline booking');
            }

            showSuccessMessage('Booking declined.');
            loadBookings();
        } catch (error) {
            console.error('Decline booking error:', error);
            showErrorMessage(error.message || 'Failed to decline booking');
        }
    };

    // Owner: Complete booking
    window.completeBooking = async function(bookingId) {
        if (!confirm('Mark this booking as completed?')) return;

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showErrorMessage('Please login to manage bookings.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/complete`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to complete booking');
            }

            showSuccessMessage('Booking marked as completed!');
            loadBookings();
        } catch (error) {
            console.error('Complete booking error:', error);
            showErrorMessage(error.message || 'Failed to complete booking');
        }
    };

    // Owner: Cancel booking
    window.ownerCancelBooking = async function(bookingId) {
        const reason = prompt('Reason for cancellation (required):');
        if (!reason || !reason.trim()) {
            showErrorMessage('Please provide a cancellation reason.');
            return;
        }

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showErrorMessage('Please login to manage bookings.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel-by-owner`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to cancel booking');
            }

            showSuccessMessage('Booking cancelled.');
            loadBookings();
        } catch (error) {
            console.error('Owner cancel booking error:', error);
            showErrorMessage(error.message || 'Failed to cancel booking');
        }
    };

    // Write review
    window.writeReview = async function(bookingId) {
        // Check if review already exists
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) {
                alert('Please login to write a review');
                return;
            }

            const checkResponse = await fetch(`${API_BASE_URL}/reviews?bookingId=${bookingId}`);
            const checkData = await checkResponse.json();
            
            if (checkData.status === 'success' && checkData.reviews && checkData.reviews.length > 0) {
                alert('You have already reviewed this booking');
                return;
            }
        } catch (err) {
            console.warn('Could not check existing review:', err);
        }

        // Show review modal
        showReviewModal(bookingId);
    };

    function showReviewModal(bookingId) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'review-modal-overlay';
        modal.innerHTML = `
            <div class="review-modal">
                <div class="review-modal-header">
                    <h3>Write a Review</h3>
                    <button class="modal-close" onclick="closeReviewModal()">&times;</button>
                </div>
                <div class="review-modal-body">
                    <form id="reviewForm" onsubmit="submitReview(event, '${bookingId}')">
                        <div class="form-group">
                            <label>Rating <span class="required">*</span></label>
                            <div class="rating-input">
                                <input type="radio" id="star5" name="rating" value="5" required>
                                <label for="star5" title="5 stars">★</label>
                                <input type="radio" id="star4" name="rating" value="4">
                                <label for="star4" title="4 stars">★</label>
                                <input type="radio" id="star3" name="rating" value="3">
                                <label for="star3" title="3 stars">★</label>
                                <input type="radio" id="star2" name="rating" value="2">
                                <label for="star2" title="2 stars">★</label>
                                <input type="radio" id="star1" name="rating" value="1">
                                <label for="star1" title="1 star">★</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="reviewComment">Your Review</label>
                            <textarea id="reviewComment" name="comment" rows="5" 
                                placeholder="Share your experience with this listing..."
                                maxlength="1000"></textarea>
                            <small class="form-text">Optional - up to 1000 characters</small>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="closeReviewModal()">Cancel</button>
                            <button type="submit" class="btn-primary">Submit Review</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add modal styles
        if (!document.getElementById('review-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'review-modal-styles';
            styles.textContent = `
                .review-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.2s ease;
                }
                .review-modal {
                    background: white;
                    border-radius: 16px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.3s ease;
                }
                .review-modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .review-modal-header h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    line-height: 1;
                    cursor: pointer;
                    color: #6c757d;
                }
                .review-modal-body {
                    padding: 1.5rem;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #212529;
                }
                .required {
                    color: #dc3545;
                }
                .rating-input {
                    display: flex;
                    flex-direction: row-reverse;
                    justify-content: flex-end;
                    gap: 0.25rem;
                }
                .rating-input input {
                    display: none;
                }
                .rating-input label {
                    cursor: pointer;
                    font-size: 2rem;
                    color: #ddd;
                    transition: color 0.2s;
                }
                .rating-input label:hover,
                .rating-input label:hover ~ label,
                .rating-input input:checked ~ label {
                    color: #ffc107;
                }
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ced4da;
                    border-radius: 8px;
                    font-family: inherit;
                    resize: vertical;
                }
                .form-text {
                    display: block;
                    margin-top: 0.25rem;
                    color: #6c757d;
                    font-size: 0.875rem;
                }
                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    padding-top: 1rem;
                }
                .btn-secondary, .btn-primary {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-secondary {
                    background: #e9ecef;
                    color: #495057;
                }
                .btn-secondary:hover {
                    background: #dee2e6;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #FF385C 0%, #FF6B9D 100%);
                    color: white;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 56, 92, 0.4);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    window.closeReviewModal = function() {
        const modal = document.querySelector('.review-modal-overlay');
        if (modal) {
            modal.remove();
        }
    };

    window.submitReview = async function(event, bookingId) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const rating = formData.get('rating');
        const comment = formData.get('comment');

        if (!rating) {
            alert('Please select a rating');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const token = localStorage.getItem('mr-token');
            const response = await fetch(`${API_BASE_URL}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    bookingId,
                    rating: parseInt(rating, 10),
                    comment: comment || '',
                }),
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to submit review');
            }

            closeReviewModal();
            showSuccessMessage('Review submitted successfully!');
            
            // Reload bookings to reflect review status
            setTimeout(() => {
                loadBookings();
            }, 1000);
        } catch (error) {
            console.error('Review submission error:', error);
            alert(error.message || 'Failed to submit review. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }
    };

    // Toggle filters
    window.toggleFilters = function() {
        alert('Advanced filters: This will show additional filter options like date range, price range, etc.\n\nIn production, this will open a filter panel.');
    };

    // Show success message
    function showSuccessMessage(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.innerHTML = `
            <i class="bi bi-check-circle-fill"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Show error message
    function showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification error';
        toast.innerHTML = `
            <i class="bi bi-exclamation-circle-fill"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Add toast + loading styles
    const style = document.createElement('style');
    style.textContent = `
        .toast-notification {
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 10000;
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.3s ease;
        }
        
        .toast-notification.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .toast-notification.success {
            border-left: 4px solid var(--success-color);
        }
        
        .toast-notification.success i {
            color: var(--success-color);
            font-size: 1.25rem;
        }

        .toast-notification.error {
            border-left: 4px solid var(--danger-color, #dc3545);
        }
        
        .toast-notification.error i {
            color: var(--danger-color, #dc3545);
            font-size: 1.25rem;
        }
        
        .toast-notification span {
            font-size: 0.9375rem;
            font-weight: 600;
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
        }

        .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2.5rem 1.5rem;
            gap: 0.75rem;
            color: var(--text-muted, #6c757d);
        }

        .loading-state .loading-text {
            font-size: 0.95rem;
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);

})();

