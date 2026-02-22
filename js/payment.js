// Payment Page Functionality
// Payment method selection and processing

(function() {
    'use strict';

    let paymentData = null;

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
        initPaymentPage();
        console.log('✅ Payment page initialized');
    });

    // Initialize payment page
    function initPaymentPage() {
        // Get booking data from URL
        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('bookingId') || '1';
        const listingId = urlParams.get('listingId') || '1';

        // Load payment data
        loadPaymentData(bookingId, listingId);

        // Handle payment method selection
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', handlePaymentMethodChange);
            // Trigger on page load if already selected
            if (method.checked) {
                handlePaymentMethodChange({ target: method });
            }
        });

        // Format card number input
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', formatCardNumber);
        }

        // Format card expiry input
        const cardExpiry = document.getElementById('cardExpiry');
        if (cardExpiry) {
            cardExpiry.addEventListener('input', formatCardExpiry);
        }

        // Format phone number inputs
        const jazzcashNumber = document.getElementById('jazzcashNumber');
        const easypaisaNumber = document.getElementById('easypaisaNumber');
        if (jazzcashNumber) {
            jazzcashNumber.addEventListener('input', formatPhoneNumber);
        }
        if (easypaisaNumber) {
            easypaisaNumber.addEventListener('input', formatPhoneNumber);
        }
    }

    // Load payment data from API
    function loadPaymentData(bookingId, listingId) {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
        const token = localStorage.getItem('mr-token');

        if (!token) {
            // Not logged in; redirect to login
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                if (!data || data.status !== 'success' || !data.booking) {
                    throw new Error(data?.message || 'Failed to load booking');
                }

                const b = data.booking;
                const l = b.listing || {};

                paymentData = {
                    bookingId: b.id || b._id,
                    listingId: l._id || listingId,
                    checkIn: b.checkIn,
                    checkOut: b.checkOut,
                    guests: b.guests || 1,
                    total: b.pricing?.total || 0,
                    breakdown: {
                        base: b.pricing?.subtotal || 0,
                        serviceFee: b.pricing?.serviceFee || 0,
                        deposit: b.pricing?.deposit || 0,
                    },
                    listing: {
                        title: l.title || 'Listing',
                        location: l.location?.city || '',
                        image:
                            (Array.isArray(l.images) && l.images[0]?.url) ||
                            getPlaceholderImage(600, 400, 'Listing'),
                    },
                };

                populatePaymentData(paymentData);
            })
            .catch(error => {
                console.error('Error loading payment data:', error);
                alert('Failed to load booking details for payment. Please try again.');
            });
    }

    // Populate payment data
    function populatePaymentData(data) {
        // Set booking details
        const summaryCheckIn = document.getElementById('summaryCheckIn');
        const summaryCheckOut = document.getElementById('summaryCheckOut');
        const summaryGuests = document.getElementById('summaryGuests');

        if (summaryCheckIn && data.checkIn) {
            summaryCheckIn.textContent = formatDate(data.checkIn);
        }
        if (summaryCheckOut && data.checkOut) {
            summaryCheckOut.textContent = formatDate(data.checkOut);
        }
        if (summaryGuests && data.guests) {
            summaryGuests.textContent = `${data.guests} guest${data.guests > 1 ? 's' : ''}`;
        }

        // Set price breakdown
        const breakdownContainer = document.getElementById('priceBreakdown');
        if (breakdownContainer && data.breakdown) {
            breakdownContainer.innerHTML = `
                <div class="breakdown-item">
                    <span>Base price</span>
                    <span>Rs ${data.breakdown.base.toLocaleString()}</span>
                </div>
                <div class="breakdown-item">
                    <span>Service fee</span>
                    <span>Rs ${data.breakdown.serviceFee.toLocaleString()}</span>
                </div>
                <div class="breakdown-item">
                    <span>Security deposit</span>
                    <span>Rs ${data.breakdown.deposit.toLocaleString()}</span>
                </div>
            `;
        }

        // Set total amount
        const totalAmount = document.getElementById('totalAmount');
        if (totalAmount && data.total) {
            totalAmount.textContent = `Rs ${data.total.toLocaleString()}`;
        }

        // Set listing preview
        const listingImage = document.getElementById('listingImage');
        const summaryListingTitle = document.getElementById('summaryListingTitle');
        const summaryLocation = document.getElementById('summaryLocation');

        if (listingImage && data.listing) listingImage.src = data.listing.image;
        if (summaryListingTitle && data.listing) summaryListingTitle.textContent = data.listing.title;
        if (summaryLocation && data.listing) {
            summaryLocation.innerHTML = `<i class="bi bi-geo-alt"></i> ${data.listing.location}`;
        }
    }

    // Handle payment method change
    window.handlePaymentMethodChange = function(event) {
        const selectedMethod = event.target.value;
        
        // Hide all payment forms
        document.querySelectorAll('.payment-details').forEach(form => {
            form.style.display = 'none';
        });

        // Show selected payment form with animation
        const selectedForm = document.getElementById(`${selectedMethod}Form`);
        if (selectedForm) {
            selectedForm.style.display = 'block';
            selectedForm.style.animation = 'fadeIn 0.3s ease';
            
            // Scroll to form if on mobile
            if (window.innerWidth < 768) {
                selectedForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    };

    // Format card number
    function formatCardNumber(event) {
        let value = event.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        if (formattedValue.length > 19) {
            formattedValue = formattedValue.substring(0, 19);
        }
        event.target.value = formattedValue;
    }

    // Format card expiry
    function formatCardExpiry(event) {
        let value = event.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        if (value.length > 5) {
            value = value.substring(0, 5);
        }
        event.target.value = value;
    }

    // Format phone number - Allow 11 digits
    function formatPhoneNumber(event) {
        let value = event.target.value.replace(/\D/g, ''); // Remove all non-digits
        // Allow maximum 11 digits
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        // Format as 0300 1234567 (4 digits + space + 7 digits)
        if (value.length > 4) {
            value = value.substring(0, 4) + ' ' + value.substring(4, 11);
        }
        event.target.value = value;
        // Update maxlength dynamically to allow space
        event.target.setAttribute('maxlength', '12'); // 11 digits + 1 space
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

    // Handle payment submission
    window.handlePaymentSubmit = async function(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const paymentMethod = formData.get('paymentMethod');

        // Validate payment method specific fields
        if (!validatePaymentMethod(paymentMethod, formData)) {
            return;
        }

        const submitBtn = document.getElementById('payBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinning"></i> Processing...';
        }

        // Collect payment data
        const paymentInfo = {
            bookingId: paymentData.bookingId,
            paymentMethod: paymentMethod,
        };

        // Add method-specific data
        if (paymentMethod === 'jazzcash') {
            paymentInfo.jazzcashNumber = formData.get('jazzcashNumber');
            paymentInfo.jazzcashPin = formData.get('jazzcashPin');
        } else if (paymentMethod === 'easypaisa') {
            paymentInfo.easypaisaNumber = formData.get('easypaisaNumber');
            paymentInfo.easypaisaPin = formData.get('easypaisaPin');
        } else if (paymentMethod === 'card') {
            paymentInfo.cardNumber = formData.get('cardNumber');
            paymentInfo.cardExpiry = formData.get('cardExpiry');
            paymentInfo.cardCVV = formData.get('cardCVV');
            paymentInfo.cardName = formData.get('cardName');
        } else if (paymentMethod === 'bank') {
            paymentInfo.bankName = formData.get('bankName');
            paymentInfo.accountNumber = formData.get('accountNumber');
        }

        // Make real API call to process payment
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
        const token = localStorage.getItem('mr-token');

        if (!token) {
            alert('Please login to continue payment');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(paymentInfo),
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                console.error('Payment failed:', data);
                alert(data.message || 'Payment failed. Please try again.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-lock-fill"></i> Pay Now';
                }
                return;
            }

            // Payment successful!
            alert(`Payment successful! Your booking ${data.payment.booking.bookingNumber} is confirmed.`);
            window.location.href = `my-bookings.html?bookingId=${paymentData.bookingId}&status=confirmed`;
        } catch (error) {
            console.error('Payment error:', error);
            alert('An error occurred while processing payment. Please try again.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-lock-fill"></i> Pay Now';
            }
        }
    };

    // Validate payment method
    function validatePaymentMethod(method, formData) {
        if (method === 'jazzcash') {
            const accountNumber = formData.get('jazzcashNumber');
            const mpin = formData.get('jazzcashPin');
            
            if (!accountNumber || accountNumber.replace(/\s/g, '').length !== 11) {
                alert('Please enter a valid JazzCash account number (11 digits)');
                return false;
            }
            if (!mpin || mpin.length !== 6) {
                alert('Please enter a valid MPIN (6 digits)');
                return false;
            }
        } else if (method === 'easypaisa') {
            const accountNumber = formData.get('easypaisaNumber');
            const mpin = formData.get('easypaisaPin');
            
            if (!accountNumber || accountNumber.replace(/\s/g, '').length !== 11) {
                alert('Please enter a valid Easypaisa account number (11 digits)');
                return false;
            }
            if (!mpin || mpin.length !== 6) {
                alert('Please enter a valid MPIN (6 digits)');
                return false;
            }
        } else if (method === 'card') {
            const cardNumber = formData.get('cardNumber');
            const cardExpiry = formData.get('cardExpiry');
            const cardCVV = formData.get('cardCVV');
            const cardName = formData.get('cardName');
            
            if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
                alert('Please enter a valid card number');
                return false;
            }
            if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
                alert('Please enter a valid expiry date (MM/YY)');
                return false;
            }
            if (!cardCVV || cardCVV.length < 3) {
                alert('Please enter a valid CVV');
                return false;
            }
            if (!cardName || cardName.length < 3) {
                alert('Please enter the cardholder name');
                return false;
            }
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
