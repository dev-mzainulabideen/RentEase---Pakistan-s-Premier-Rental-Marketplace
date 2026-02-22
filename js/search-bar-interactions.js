// Search Bar Interactive Functionality
(function() {
    'use strict';
    
    let searchState = {
        location: '',
        checkIn: '',
        checkOut: '',
        guests: 1,
        children: 0
    };
    
    /**
     * Initialize search bar interactions
     */
    function initSearchBarInteractions() {
        const searchBar = document.querySelector('.global-search-bar');
        if (!searchBar) return;
        
        // Location field
        const locationField = searchBar.querySelector('.search-item-location');
        if (locationField) {
            locationField.addEventListener('click', function(e) {
                e.stopPropagation();
                openLocationSearch(this);
            });
        }
        
        // Check-in field
        const checkInField = searchBar.querySelector('.search-item-checkin');
        if (checkInField) {
            checkInField.addEventListener('click', function(e) {
                e.stopPropagation();
                openDatePicker('checkin', this);
            });
        }
        
        // Check-out field
        const checkOutField = searchBar.querySelector('.search-item-checkout');
        if (checkOutField) {
            checkOutField.addEventListener('click', function(e) {
                e.stopPropagation();
                openDatePicker('checkout', this);
            });
        }
        
        // Guests field
        const guestsField = searchBar.querySelector('.search-item-guests');
        if (guestsField) {
            guestsField.addEventListener('click', function(e) {
                e.stopPropagation();
                openGuestsSelector(this);
            });
        }
        
        // Search button
        const searchButton = searchBar.querySelector('.search-button');
        if (searchButton) {
            searchButton.addEventListener('click', function(e) {
                e.stopPropagation();
                performSearch();
            });
        }
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchBar.contains(e.target)) {
                closeAllDropdowns();
            }
        });
    }
    
    /**
     * Open location search
     */
    function openLocationSearch(field) {
        closeAllDropdowns();
        const dropdown = createLocationDropdown(field);
        field.classList.add('active');
        field.appendChild(dropdown);
        
        // Focus on input
        setTimeout(() => {
            const input = dropdown.querySelector('input');
            if (input) input.focus();
        }, 100);
    }
    
    /**
     * Open date picker
     */
    function openDatePicker(type, field) {
        closeAllDropdowns();
        const dropdown = createDatePickerDropdown(type, field);
        field.classList.add('active');
        field.appendChild(dropdown);
    }
    
    /**
     * Open guests selector
     */
    function openGuestsSelector(field) {
        closeAllDropdowns();
        const dropdown = createGuestsDropdown(field);
        field.classList.add('active');
        field.appendChild(dropdown);
    }
    
    /**
     * Create location dropdown
     */
    function createLocationDropdown(field) {
        const dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown location-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-content">
                <input type="text" 
                       class="location-input" 
                       placeholder="Where are you going?"
                       value="${searchState.location}"
                       autocomplete="off">
                <div class="location-suggestions">
                    <div class="suggestion-item" data-location="Lahore, Pakistan">
                        <i class="bi bi-geo-alt"></i>
                        <span>Lahore, Pakistan</span>
                    </div>
                    <div class="suggestion-item" data-location="Karachi, Pakistan">
                        <i class="bi bi-geo-alt"></i>
                        <span>Karachi, Pakistan</span>
                    </div>
                    <div class="suggestion-item" data-location="Islamabad, Pakistan">
                        <i class="bi bi-geo-alt"></i>
                        <span>Islamabad, Pakistan</span>
                    </div>
                    <div class="suggestion-item" data-location="Rawalpindi, Pakistan">
                        <i class="bi bi-geo-alt"></i>
                        <span>Rawalpindi, Pakistan</span>
                    </div>
                </div>
            </div>
        `;
        
        const input = dropdown.querySelector('.location-input');
        const suggestions = dropdown.querySelectorAll('.suggestion-item');
        
        // Handle input
        input.addEventListener('input', function() {
            filterSuggestions(this.value, suggestions);
        });
        
        // Handle suggestion clicks
        suggestions.forEach(item => {
            item.addEventListener('click', function() {
                const location = this.dataset.location;
                searchState.location = location;
                updateFieldValue(field, location);
                closeAllDropdowns();
            });
        });
        
        // Handle Enter key
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const location = this.value.trim();
                if (location) {
                    searchState.location = location;
                    updateFieldValue(field, location);
                    closeAllDropdowns();
                }
            } else if (e.key === 'Escape') {
                closeAllDropdowns();
            }
        });
        
        return dropdown;
    }
    
    /**
     * Create date picker dropdown
     */
    function createDatePickerDropdown(type, field) {
        const today = new Date().toISOString().split('T')[0];
        let minDate = today;
        
        // For checkout, minimum date should be day after checkin
        if (type === 'checkout' && searchState.checkIn) {
            const checkinDate = new Date(searchState.checkIn);
            checkinDate.setDate(checkinDate.getDate() + 1);
            minDate = checkinDate.toISOString().split('T')[0];
        }
        
        const dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown date-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-content">
                <div class="date-picker-header">
                    <h4>Select ${type === 'checkin' ? 'Check-in' : 'Check-out'} Date</h4>
                </div>
                <div class="date-picker-calendar">
                    <input type="date" 
                           class="date-input" 
                           value="${type === 'checkin' ? searchState.checkIn : searchState.checkOut}"
                           min="${minDate}">
                </div>
                <div class="date-picker-actions">
                    <button class="btn-clear" onclick="window.searchBarInteractions.clearDate('${type}')">Clear</button>
                    <button class="btn-apply" onclick="window.searchBarInteractions.applyDate('${type}')">Apply</button>
                </div>
            </div>
        `;
        
        const dateInput = dropdown.querySelector('.date-input');
        dateInput.addEventListener('change', function() {
            const date = this.value;
            if (type === 'checkin') {
                searchState.checkIn = date;
                // If checkout exists and is before new checkin, clear it
                if (searchState.checkOut && searchState.checkOut <= date) {
                    searchState.checkOut = '';
                    const checkoutField = document.querySelector('.search-item-checkout');
                    if (checkoutField) {
                        const valueElement = checkoutField.querySelector('.search-value');
                        if (valueElement) {
                            valueElement.textContent = 'Add dates';
                            valueElement.style.color = '#717171';
                        }
                    }
                }
            } else {
                // Validate checkout is after checkin
                if (searchState.checkIn && date <= searchState.checkIn) {
                    alert('Check-out date must be after check-in date');
                    this.value = '';
                    return;
                }
                searchState.checkOut = date;
            }
        });
        
        return dropdown;
    }
    
    /**
     * Create guests dropdown
     */
    function createGuestsDropdown(field) {
        const dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown guests-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-content">
                <div class="guests-control">
                    <div class="guests-row">
                        <div class="guests-label">
                            <span class="label-text">Adults</span>
                            <span class="label-subtext">Ages 13+</span>
                        </div>
                        <div class="guests-counter">
                            <button class="counter-btn minus" onclick="window.searchBarInteractions.adjustGuests('adults', -1)">−</button>
                            <span class="counter-value" id="adults-count">${searchState.guests}</span>
                            <button class="counter-btn plus" onclick="window.searchBarInteractions.adjustGuests('adults', 1)">+</button>
                        </div>
                    </div>
                    <div class="guests-row">
                        <div class="guests-label">
                            <span class="label-text">Children</span>
                            <span class="label-subtext">Ages 2-12</span>
                        </div>
                        <div class="guests-counter">
                            <button class="counter-btn minus" onclick="window.searchBarInteractions.adjustGuests('children', -1)" ${(searchState.children || 0) === 0 ? 'disabled' : ''}>−</button>
                            <span class="counter-value" id="children-count">${searchState.children || 0}</span>
                            <button class="counter-btn plus" onclick="window.searchBarInteractions.adjustGuests('children', 1)">+</button>
                        </div>
                    </div>
                </div>
                <div class="guests-actions">
                    <button class="btn-apply" onclick="window.searchBarInteractions.applyGuests()">Done</button>
                </div>
            </div>
        `;
        
        return dropdown;
    }
    
    /**
     * Filter location suggestions
     */
    function filterSuggestions(query, suggestions) {
        const lowerQuery = query.toLowerCase();
        suggestions.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(lowerQuery)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * Update field value display
     */
    function updateFieldValue(field, value) {
        const valueElement = field.querySelector('.search-value');
        if (valueElement) {
            valueElement.textContent = value;
            valueElement.style.color = '#222222';
        }
    }
    
    /**
     * Close all dropdowns
     */
    function closeAllDropdowns() {
        const activeFields = document.querySelectorAll('.search-item.active');
        activeFields.forEach(field => {
            field.classList.remove('active');
            const dropdown = field.querySelector('.search-dropdown');
            if (dropdown) dropdown.remove();
        });
    }
    
    /**
     * Adjust guests count
     */
    function adjustGuests(type, delta) {
        const currentCount = type === 'adults' ? searchState.guests : (searchState.children || 0);
        const newCount = Math.max(0, currentCount + delta);
        
        if (type === 'adults') {
            searchState.guests = Math.max(1, newCount);
            const adultsCountEl = document.getElementById('adults-count');
            if (adultsCountEl) adultsCountEl.textContent = searchState.guests;
        } else {
            searchState.children = newCount;
            const childrenCountEl = document.getElementById('children-count');
            if (childrenCountEl) {
                childrenCountEl.textContent = searchState.children;
                // Update minus button state
                const minusBtn = childrenCountEl.previousElementSibling;
                if (minusBtn) {
                    minusBtn.disabled = searchState.children === 0;
                }
            }
        }
        
        updateGuestsDisplay();
    }
    
    /**
     * Apply guests selection
     */
    function applyGuests() {
        const totalGuests = searchState.guests + (searchState.children || 0);
        const guestsField = document.querySelector('.search-item-guests');
        if (guestsField) {
            const valueElement = guestsField.querySelector('.search-value');
            if (valueElement) {
                const guestText = totalGuests === 1 ? '1 guest' : `${totalGuests} guests`;
                valueElement.textContent = guestText;
                valueElement.style.color = '#222222';
            }
        }
        closeAllDropdowns();
    }
    
    /**
     * Apply date selection
     */
    function applyDate(type) {
        const date = type === 'checkin' ? searchState.checkIn : searchState.checkOut;
        if (date) {
            const field = document.querySelector(`.search-item-${type}`);
            if (field) {
                const formattedDate = formatDate(date);
                updateFieldValue(field, formattedDate);
            }
        }
        closeAllDropdowns();
    }
    
    /**
     * Clear date
     */
    function clearDate(type) {
        if (type === 'checkin') {
            searchState.checkIn = '';
        } else {
            searchState.checkOut = '';
        }
        const field = document.querySelector(`.search-item-${type}`);
        if (field) {
            const valueElement = field.querySelector('.search-value');
            if (valueElement) {
                valueElement.textContent = type === 'checkin' ? 'Add dates' : 'Add dates';
                valueElement.style.color = '#717171';
            }
        }
        closeAllDropdowns();
    }
    
    /**
     * Update guests display
     */
    function updateGuestsDisplay() {
        // This will be called when guests are adjusted
    }
    
    /**
     * Format date for display
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    /**
     * Perform search
     */
    function performSearch() {
        const params = new URLSearchParams();
        if (searchState.location) params.set('location', searchState.location);
        if (searchState.checkIn) params.set('checkin', searchState.checkIn);
        if (searchState.checkOut) params.set('checkout', searchState.checkOut);
        if (searchState.guests) params.set('guests', searchState.guests);
        if (searchState.children) params.set('children', searchState.children || 0);
        
        const queryString = params.toString();
        window.location.href = `search.html${queryString ? '?' + queryString : ''}`;
    }
    
    // Expose functions globally
    window.searchBarInteractions = {
        adjustGuests,
        applyGuests,
        applyDate,
        clearDate,
        performSearch
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearchBarInteractions);
    } else {
        initSearchBarInteractions();
    }
})();

