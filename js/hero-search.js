// Clean Hero Search Functionality
// Simple, production-ready implementation

(function() {
    'use strict';

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initDateInputs();
        initSearchButton();
        initLocationInput();
        console.log('✅ Hero search initialized');
    });

    // Initialize date inputs
    function initDateInputs() {
        const checkinInput = document.getElementById('checkin-input');
        const checkoutInput = document.getElementById('checkout-input');

        if (!checkinInput || !checkoutInput) return;

        // Set minimum date to today
        const today = new Date();
        const minDate = today.toISOString().split('T')[0];
        checkinInput.setAttribute('min', minDate);
        checkoutInput.setAttribute('min', minDate);

        // Update checkout min date when checkin changes
        checkinInput.addEventListener('change', function() {
            const checkinDate = new Date(this.value);
            if (checkinDate) {
                const nextDay = new Date(checkinDate);
                nextDay.setDate(nextDay.getDate() + 1);
                const minCheckout = nextDay.toISOString().split('T')[0];
                checkoutInput.setAttribute('min', minCheckout);
                
                // If checkout is before new checkin, clear it
                if (checkoutInput.value && checkoutInput.value <= this.value) {
                    checkoutInput.value = '';
                }
            }
        });

        // Validate checkout is after checkin
        checkoutInput.addEventListener('change', function() {
            const checkinValue = checkinInput.value;
            if (checkinValue && this.value <= checkinValue) {
                alert('Check-out date must be after check-in date');
                this.value = '';
            }
        });
    }

    // Initialize search button
    function initSearchButton() {
        const searchBtn = document.getElementById('hero-search-btn');
        const searchBar = document.querySelector('.hero-search-bar');
        if (!searchBtn) return;

        // Prevent form submission if it's inside a form
        if (searchBar && searchBar.closest('form')) {
            searchBar.closest('form').addEventListener('submit', function(e) {
                e.preventDefault();
                handleSearch();
            });
        }

        // Handle button click
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleSearch();
        });

        // Handle Enter key in inputs
        const inputs = document.querySelectorAll('.hero-search-bar .hero-search-input');
        inputs.forEach(input => {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearch();
                }
            });
        });

        function handleSearch() {
            // Prevent any scroll jumps or page movement
            const scrollY = window.scrollY;
            
            // Get form values
            const location = document.getElementById('location-input')?.value.trim() || '';
            const checkin = document.getElementById('checkin-input')?.value || '';
            const checkout = document.getElementById('checkout-input')?.value || '';
            const guests = document.getElementById('guests-input')?.value || '1';

            // Build search URL
            const params = new URLSearchParams();
            if (location) params.append('location', location);
            if (checkin) params.append('checkin', checkin);
            if (checkout) params.append('checkout', checkout);
            if (guests && guests !== '1') params.append('guests', guests);

            // Navigate to search page smoothly without page jumps
            const searchUrl = params.toString() 
                ? `search.html?${params.toString()}` 
                : 'search.html';
            
            // Smooth navigation without scroll jumps
            window.location.href = searchUrl;
        }
    }

    // Initialize location input with simple autocomplete
    function initLocationInput() {
        const locationInput = document.getElementById('location-input');
        if (!locationInput) return;

        // Sample locations
        const locations = [
            'Lahore, Punjab',
            'Karachi, Sindh',
            'Islamabad, Capital',
            'Rawalpindi, Punjab',
            'Faisalabad, Punjab',
            'Multan, Punjab',
            'Peshawar, KPK',
            'Quetta, Balochistan',
            'Gujranwala, Punjab',
            'Sialkot, Punjab'
        ];

        // Create datalist for autocomplete
        const datalist = document.createElement('datalist');
        datalist.id = 'location-options';
        
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            datalist.appendChild(option);
        });

        locationInput.setAttribute('list', 'location-options');
        locationInput.parentElement.appendChild(datalist);
    }

})();

