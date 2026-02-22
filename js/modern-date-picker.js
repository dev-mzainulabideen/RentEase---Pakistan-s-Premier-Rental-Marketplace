// Modern Date Picker with Unique Wheel Scroll Interaction
// Premium, non-traditional scrolling experience

(function() {
    'use strict';

    // Month names
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Initialize date pickers
    let activePicker = null;
    let checkinDate = null;
    let checkoutDate = null;

    // Generate days for a month
    function getDaysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    // Generate years (current year ± 2 years)
    function generateYears() {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 1; i <= currentYear + 2; i++) {
            years.push(i);
        }
        return years;
    }

    // Initialize wheel picker
    function initWheelPicker(field, pickerId) {
        const picker = document.getElementById(pickerId);
        if (!picker) return;

        const monthWheel = picker.querySelector('[data-wheel="month"]');
        const dayWheel = picker.querySelector('[data-wheel="day"]');
        const yearWheel = picker.querySelector('[data-wheel="year"]');

        const today = new Date();
        let selectedMonth = today.getMonth();
        let selectedDay = today.getDate();
        let selectedYear = today.getFullYear();

        // Initialize year wheel
        const years = generateYears();
        yearWheel.innerHTML = years.map(year => 
            `<div class="wheel-item" data-value="${year}">${year}</div>`
        ).join('');

        // Update day wheel when month/year changes
        function updateDayWheel() {
            const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
            dayWheel.innerHTML = '';
            for (let i = 1; i <= daysInMonth; i++) {
                const dayItem = document.createElement('div');
                dayItem.className = 'wheel-item';
                dayItem.setAttribute('data-value', i);
                dayItem.textContent = i;
                dayWheel.appendChild(dayItem);
            }
            
            // Set selected day (ensure it's valid for the month)
            if (selectedDay > daysInMonth) {
                selectedDay = daysInMonth;
            }
            
            initWheelScroll(dayWheel, selectedDay - 1, () => {
                selectedDay = parseInt(dayWheel.querySelector('.selected')?.getAttribute('data-value') || selectedDay);
                updateDateDisplay(field, selectedMonth, selectedDay, selectedYear);
            });
        }

        // Initialize month wheel
        initWheelScroll(monthWheel, selectedMonth, () => {
            selectedMonth = parseInt(monthWheel.querySelector('.selected')?.getAttribute('data-value') || selectedMonth);
            updateDayWheel();
        });

        // Initialize year wheel
        const yearIndex = years.indexOf(selectedYear);
        initWheelScroll(yearWheel, yearIndex >= 0 ? yearIndex : 1, () => {
            selectedYear = parseInt(yearWheel.querySelector('.selected')?.getAttribute('data-value') || selectedYear);
            updateDayWheel();
        });

        // Initial day wheel setup
        updateDayWheel();
    }

    // Unique Wheel Scroll Interaction - Non-traditional scrolling
    function initWheelScroll(wheelContainer, initialIndex, onSelect) {
        const items = wheelContainer.querySelectorAll('.wheel-item');
        if (items.length === 0) return;

        let currentIndex = Math.max(0, Math.min(initialIndex, items.length - 1));
        let isScrolling = false;
        let scrollVelocity = 0;
        let lastScrollTime = Date.now();
        let targetIndex = currentIndex;

        // Set initial selection
        updateSelection();

        // Calculate item position
        function getItemPosition(index) {
            const itemHeight = 60; // Height of each item including padding
            const centerOffset = wheelContainer.offsetHeight / 2 - itemHeight / 2;
            return index * itemHeight - centerOffset;
        }

        // Update visual selection
        function updateSelection() {
            items.forEach((item, index) => {
                const distance = Math.abs(index - currentIndex);
                const position = getItemPosition(index);
                
                item.classList.remove('selected');
                wheelContainer.scrollTop = getItemPosition(currentIndex);

                if (distance === 0) {
                    item.classList.add('selected');
                }

                // Apply scale and opacity based on distance
                const scale = 1 - (distance * 0.1);
                const opacity = 1 - (distance * 0.3);
                item.style.transform = `scale(${Math.max(0.7, scale)})`;
                item.style.opacity = Math.max(0.3, opacity);
            });

            if (onSelect) {
                onSelect();
            }
        }

        // Smooth scroll to index
        function scrollToIndex(index, smooth = true) {
            targetIndex = Math.max(0, Math.min(index, items.length - 1));
            currentIndex = targetIndex;
            
            if (smooth) {
                wheelContainer.scrollTo({
                    top: getItemPosition(currentIndex),
                    behavior: 'smooth'
                });
            } else {
                wheelContainer.scrollTop = getItemPosition(currentIndex);
            }
            
            setTimeout(updateSelection, smooth ? 300 : 0);
        }

        // Handle wheel scroll (unique interaction)
        let wheelTimeout;
        wheelContainer.addEventListener('wheel', function(e) {
            e.preventDefault();
            clearTimeout(wheelTimeout);

            const delta = e.deltaY;
            const now = Date.now();
            const timeDelta = now - lastScrollTime;
            lastScrollTime = now;

            // Calculate velocity
            scrollVelocity = Math.abs(delta) / Math.max(timeDelta, 1);

            // Determine scroll direction and amount
            if (delta > 0) {
                // Scroll down - next item
                scrollToIndex(currentIndex + 1);
            } else {
                // Scroll up - previous item
                scrollToIndex(currentIndex - 1);
            }

            // Momentum scrolling
            wheelTimeout = setTimeout(() => {
                scrollVelocity = 0;
            }, 150);

            isScrolling = true;
            setTimeout(() => {
                isScrolling = false;
            }, 300);
        }, { passive: false });

        // Touch support for mobile
        let touchStartY = 0;
        let touchStartIndex = currentIndex;

        wheelContainer.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
            touchStartIndex = currentIndex;
            isScrolling = true;
        }, { passive: true });

        wheelContainer.addEventListener('touchmove', function(e) {
            if (!isScrolling) return;
            e.preventDefault();

            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;
            const itemHeight = 60;
            const indexDelta = Math.round(deltaY / itemHeight);
            const newIndex = touchStartIndex + indexDelta;

            scrollToIndex(newIndex, false);
        }, { passive: false });

        wheelContainer.addEventListener('touchend', function() {
            isScrolling = false;
            // Snap to nearest item
            scrollToIndex(currentIndex, true);
        }, { passive: true });

        // Click to select
        items.forEach((item, index) => {
            item.addEventListener('click', function() {
                scrollToIndex(index, true);
            });
        });

        // Keyboard navigation
        wheelContainer.setAttribute('tabindex', '0');
        wheelContainer.addEventListener('keydown', function(e) {
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    scrollToIndex(currentIndex - 1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    scrollToIndex(currentIndex + 1);
                    break;
                case 'Home':
                    e.preventDefault();
                    scrollToIndex(0);
                    break;
                case 'End':
                    e.preventDefault();
                    scrollToIndex(items.length - 1);
                    break;
            }
        });
    }

    // Update date display
    function updateDateDisplay(field, month, day, year) {
        const date = new Date(year, month, day);
        const display = field === 'checkin' ? 
            document.getElementById('checkin-display') : 
            document.getElementById('checkout-display');
        
        const input = field === 'checkin' ? 
            document.getElementById('checkin-input') : 
            document.getElementById('checkout-input');

        if (display) {
            const daySpan = display.querySelector('.date-day');
            const monthSpan = display.querySelector('.date-month');
            
            if (daySpan) daySpan.textContent = day;
            if (monthSpan) monthSpan.textContent = MONTHS[month];
        }

        if (input) {
            input.value = `${MONTHS_FULL[month]} ${day}, ${year}`;
        }

        // Store date
        if (field === 'checkin') {
            checkinDate = date;
            // Ensure checkout is after checkin
            if (checkoutDate && checkoutDate <= checkinDate) {
                const nextDay = new Date(checkinDate);
                nextDay.setDate(nextDay.getDate() + 1);
                checkoutDate = nextDay;
                updateDateDisplay('checkout', nextDay.getMonth(), nextDay.getDate(), nextDay.getFullYear());
            }
        } else {
            checkoutDate = date;
        }
    }

    // Initialize field interactions
    function initFieldInteractions() {
        const fields = document.querySelectorAll('.search-field[data-field]');
        
        fields.forEach(field => {
            const fieldType = field.getAttribute('data-field');
            
            // Click to activate
            field.addEventListener('click', function(e) {
                // Don't close if clicking inside the picker
                if (e.target.closest('.date-picker-container') || 
                    e.target.closest('.location-suggestions')) {
                    return;
                }

                // Close other fields
                fields.forEach(f => {
                    if (f !== field) {
                        f.classList.remove('active');
                    }
                });

                // Toggle current field
                field.classList.toggle('active');
                activePicker = field.classList.contains('active') ? fieldType : null;

                // Initialize picker if date field
                if (fieldType === 'checkin' && field.classList.contains('active')) {
                    initWheelPicker('checkin', 'checkin-picker');
                } else if (fieldType === 'checkout' && field.classList.contains('active')) {
                    initWheelPicker('checkout', 'checkout-picker');
                }
            });
        });

        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-field')) {
                fields.forEach(field => {
                    field.classList.remove('active');
                });
                activePicker = null;
            }
        });

        // Location input
        const locationInput = document.getElementById('location-input');
        const locationField = document.querySelector('.location-field');
        
        if (locationInput) {
            locationInput.addEventListener('focus', function() {
                locationField.classList.add('active');
            });

            locationInput.addEventListener('input', function(e) {
                const query = e.target.value.toLowerCase();
                showLocationSuggestions(query);
            });

            // Sample location suggestions
            const sampleLocations = [
                { name: 'Lahore, Punjab', icon: 'bi-geo-alt' },
                { name: 'Karachi, Sindh', icon: 'bi-geo-alt' },
                { name: 'Islamabad, Capital', icon: 'bi-geo-alt' },
                { name: 'Rawalpindi, Punjab', icon: 'bi-geo-alt' },
                { name: 'Faisalabad, Punjab', icon: 'bi-geo-alt' },
                { name: 'Multan, Punjab', icon: 'bi-geo-alt' },
            ];

            function showLocationSuggestions(query) {
                const suggestions = document.getElementById('location-suggestions');
                if (!suggestions) return;

                if (!query) {
                    suggestions.innerHTML = '';
                    return;
                }

                const filtered = sampleLocations.filter(loc => 
                    loc.name.toLowerCase().includes(query)
                );

                suggestions.innerHTML = filtered.map(loc => `
                    <div class="location-suggestion-item" onclick="selectLocation('${loc.name}')">
                        <i class="bi ${loc.icon}"></i>
                        <span>${loc.name}</span>
                    </div>
                `).join('');
            }

            window.selectLocation = function(location) {
                locationInput.value = location;
                const suggestions = document.getElementById('location-suggestions');
                if (suggestions) {
                    suggestions.innerHTML = '';
                }
                locationField.classList.remove('active');
            };
        }
    }

    // Initialize search button
    function initSearchButton() {
        const searchBtn = document.getElementById('hero-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Build search URL
                const location = document.getElementById('location-input')?.value || '';
                const checkin = checkinDate ? 
                    `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, '0')}-${String(checkinDate.getDate()).padStart(2, '0')}` : '';
                const checkout = checkoutDate ? 
                    `${checkoutDate.getFullYear()}-${String(checkoutDate.getMonth() + 1).padStart(2, '0')}-${String(checkoutDate.getDate()).padStart(2, '0')}` : '';

                const params = new URLSearchParams();
                if (location) params.append('location', location);
                if (checkin) params.append('checkin', checkin);
                if (checkout) params.append('checkout', checkout);

                window.location.href = `search.html?${params.toString()}`;
            });
        }
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initFieldInteractions();
        initSearchButton();
        console.log('✅ Modern Date Picker with Wheel Scroll initialized');
    });

})();



