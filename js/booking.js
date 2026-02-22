// Booking Page Functionality
// Complete booking form and validation

(function() {
    'use strict';

    let bookingData = null;

    // Utility function to generate local placeholder image (SVG data URI)
    function getPlaceholderImage(width = 400, height = 300, text = 'No Image') {
        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#e9ecef"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initBookingPage();
        console.log('✅ Booking page initialized');
    });

    // Initialize booking page
    function initBookingPage() {
        // Get booking data from URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const listingId = urlParams.get('listingId') || '1';

        // Load booking data
        loadBookingData(listingId);

        // Set minimum dates
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
                    calculatePrice();
                }
            });
        }

        if (checkOutInput) {
            checkOutInput.addEventListener('change', function() {
                if (checkInInput && this.value) {
                    calculatePrice();
                }
            });
        }

        // Calculate price on guest changes
        const guestsInput = document.getElementById('guests');
        if (guestsInput) {
            guestsInput.addEventListener('change', calculatePrice);
        }
    }

    // Load booking data (simulate API call)
    function loadBookingData(listingId) {
        // In production, fetch from API:
        // fetch(`/api/listings/${listingId}`)
        //     .then(response => response.json())
        //     .then(data => {
        //         bookingData = data;
        //         populateBookingData(data);
        //     })
        //     .catch(error => {
        //         console.error('Error loading booking data:', error);
        //     });

        // Demo: Use sample data
        bookingData = {
            id: listingId,
            title: 'Luxury 3-Bedroom Apartment in DHA Lahore',
            location: 'DHA Phase 5, Lahore, Pakistan',
            image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
            price: 25000,
            period: 'day',
            rating: 4.9,
            reviews: 156,
            deposit: 10000,
            host: {
                name: 'John Doe',
                avatar: getPlaceholderImage(60, 60, 'User'),
                verified: true
            }
        };

        populateBookingData(bookingData);
    }

    // Populate booking data
    function populateBookingData(data) {
        // Set listing preview
        const listingImage = document.getElementById('listingImage');
        const summaryListingTitle = document.getElementById('summaryListingTitle');
        const summaryLocation = document.getElementById('summaryLocation');
        const summaryRating = document.getElementById('summaryRating');

        if (listingImage) listingImage.src = data.image;
        if (summaryListingTitle) summaryListingTitle.textContent = data.title;
        if (summaryLocation) {
            summaryLocation.innerHTML = `<i class="bi bi-geo-alt"></i> ${data.location}`;
        }
        if (summaryRating) summaryRating.textContent = data.rating;

        // Set host information
        const hostAvatar = document.getElementById('hostAvatar');
        const hostName = document.getElementById('hostName');
        if (hostAvatar && data.host) hostAvatar.src = data.host.avatar;
        if (hostName && data.host) hostName.textContent = data.host.name;

        // Calculate initial price
        calculatePrice();
    }

    // Change guests
    window.changeGuests = function(delta) {
        const guestsInput = document.getElementById('guests');
        if (!guestsInput) return;

        let currentValue = parseInt(guestsInput.value) || 1;
        let newValue = currentValue + delta;

        if (newValue < 1) newValue = 1;
        if (newValue > 10) newValue = 10;

        guestsInput.value = newValue;
        calculatePrice();
    };

    // Calculate price
    function calculatePrice() {
        if (!bookingData) return;

        const checkIn = document.getElementById('checkIn')?.value;
        const checkOut = document.getElementById('checkOut')?.value;
        const guests = parseInt(document.getElementById('guests')?.value) || 1;

        if (!checkIn || !checkOut) {
            return;
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        if (days <= 0) {
            return;
        }

        const basePrice = bookingData.price * days;
        const serviceFee = basePrice * 0.05; // 5% service fee
        const deposit = bookingData.deposit || 0;
        const total = basePrice + serviceFee + deposit;

        const breakdownContainer = document.getElementById('priceBreakdown');
        if (breakdownContainer) {
            breakdownContainer.innerHTML = `
                <div class="breakdown-item">
                    <span>Rs ${bookingData.price.toLocaleString()} x ${days} ${bookingData.period}${days > 1 ? 's' : ''}</span>
                    <span>Rs ${basePrice.toLocaleString()}</span>
                </div>
                <div class="breakdown-item">
                    <span>Service fee</span>
                    <span>Rs ${serviceFee.toLocaleString()}</span>
                </div>
                ${deposit > 0 ? `
                <div class="breakdown-item">
                    <span>Security deposit</span>
                    <span>Rs ${deposit.toLocaleString()}</span>
                </div>
                ` : ''}
            `;
        }

        const totalAmount = document.getElementById('totalAmount');
        if (totalAmount) {
            totalAmount.textContent = `Rs ${total.toLocaleString()}`;
        }
    }

    // Handle booking submission
    window.handleBookingSubmit = function(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // Validate form
        if (!validateBookingForm()) {
            return;
        }

        const submitBtn = document.getElementById('continueBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinning"></i> Processing...';
        }

        // Collect booking data
        const bookingInfo = {
            listingId: bookingData.id,
            checkIn: formData.get('checkIn'),
            checkOut: formData.get('checkOut'),
            guests: formData.get('guests'),
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            specialRequests: formData.get('specialRequests'),
            acceptTerms: formData.get('acceptTerms')
        };

        // Simulate API call
        setTimeout(() => {
            // In production, make actual API call:
            // fetch('/api/bookings/create', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(bookingInfo)
            // })
            // .then(response => response.json())
            // .then(data => {
            //     if (data.success) {
            //         window.location.href = `payment.html?bookingId=${data.bookingId}`;
            //     } else {
            //         alert(data.message || 'Booking failed. Please try again.');
            //         if (submitBtn) {
            //             submitBtn.disabled = false;
            //             submitBtn.innerHTML = 'Continue to Payment <i class="bi bi-arrow-right"></i>';
            //         }
            //     }
            // })
            // .catch(error => {
            //     console.error('Booking error:', error);
            //     alert('An error occurred. Please try again.');
            //     if (submitBtn) {
            //         submitBtn.disabled = false;
            //         submitBtn.innerHTML = 'Continue to Payment <i class="bi bi-arrow-right"></i>';
            //     }
            // });

            // Demo: Redirect to payment
            window.location.href = `payment.html?bookingId=1&listingId=${bookingData.id}`;
        }, 1500);
    };

    // Validate booking form
    function validateBookingForm() {
        const checkIn = document.getElementById('checkIn')?.value;
        const checkOut = document.getElementById('checkOut')?.value;
        const fullName = document.getElementById('fullName')?.value;
        const email = document.getElementById('email')?.value;
        const phone = document.getElementById('phone')?.value;
        const acceptTerms = document.getElementById('acceptTerms')?.checked;

        if (!checkIn || !checkOut) {
            alert('Please select check-in and check-out dates');
            return false;
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (checkOutDate <= checkInDate) {
            alert('Check-out date must be after check-in date');
            return false;
        }

        if (!fullName || !email || !phone) {
            alert('Please fill in all required contact information');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return false;
        }

        if (!acceptTerms) {
            alert('Please accept the terms and conditions to continue');
            return false;
        }

        return true;
    }

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

})();
