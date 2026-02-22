// Header functionality with role-based access
function initHeader() {
    // User menu toggle
    const userMenuButton = document.querySelector('.user-menu-button');
    const userDropdown = document.getElementById('user-dropdown-menu');
    
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
    
    // Update header based on auth state
    updateHeaderForAuth();
}

// Update header UI based on authentication state
window.updateHeaderForAuth = function(user, role) {
    if (!user && !role) {
        // Safety check: ensure functions exist before calling
        if (typeof window.getCurrentUser === 'function') {
            user = window.getCurrentUser();
        }
        if (typeof window.getCurrentRole === 'function') {
            role = window.getCurrentRole();
        }
    }
    
    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');
    const userNameEl = document.querySelector('.user-name');
    const userEmailEl = document.querySelector('.user-email');
    const userAvatar = document.querySelector('.user-avatar');
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');
    const profileBtn = document.querySelector('.btn-profile');
    const logoutBtn = document.querySelector('.btn-logout');
    
    if (user && window.isLoggedIn()) {
        // Show user menu
        if (userMenu) {
            userMenu.classList.add('logged-in');
            userMenu.classList.remove('logged-out');
        }
        // Toggle top-right buttons: show only Logout pill when logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'flex';
        if (profileBtn) profileBtn.style.display = 'none';
        
        // Update user info
        if (userNameEl) {
            userNameEl.textContent = user.name || 'User';
        }
        if (userEmailEl) {
            userEmailEl.textContent = user.email || '';
        }
        
        // Update mobile menu user info
        const mobileUserInfo = document.querySelector('.mobile-menu-user-info');
        const mobileUserName = document.querySelector('.mobile-user-name');
        const mobileUserEmail = document.querySelector('.mobile-user-email');
        const mobileMenuLogin = document.querySelector('.mobile-menu-login');
        const mobileMenuSignup = document.querySelector('.mobile-menu-signup');
        const mobileMenuLogout = document.querySelector('.mobile-menu-logout');
        
        if (mobileUserInfo) {
            mobileUserInfo.classList.add('logged-in');
            mobileUserInfo.classList.remove('logged-out');
        }
        if (mobileUserName) {
            mobileUserName.textContent = user.name || 'User';
        }
        if (mobileUserEmail) {
            mobileUserEmail.textContent = user.email || '';
        }
        if (mobileMenuLogin) mobileMenuLogin.style.display = 'none';
        if (mobileMenuSignup) mobileMenuSignup.style.display = 'none';
        if (mobileMenuLogout) mobileMenuLogout.style.display = 'block';
        
        // Show secondary navigation for tablet screens
        const secondaryNav = document.querySelector('.secondary-navigation.tablet-nav');
        if (secondaryNav) {
            secondaryNav.classList.add('logged-in');
            secondaryNav.classList.remove('logged-out');
        }
        
        // Show notifications toggle
        const notificationToggle = document.querySelector('.notification-toggle');
        if (notificationToggle) {
            notificationToggle.classList.add('logged-in');
            notificationToggle.classList.remove('logged-out');
        }
        
        // Add role badge
        const existingBadge = document.querySelector('.user-role-badge');
        if (existingBadge) existingBadge.remove();
        
        if (userNameEl && role && role !== 'guest') {
            const badge = document.createElement('span');
            badge.className = `badge ${window.getRoleBadgeClass(role)} ms-2 user-role-badge`;
            badge.textContent = window.getRoleDisplayName(role);
            badge.style.fontSize = '0.7rem';
            userNameEl.appendChild(badge);
        }
        
        // Update navigation based on role
        updateNavigationForAuth(user, role);
    } else {
        // Show auth buttons, hide user menu
        if (userMenu) {
            userMenu.classList.add('logged-out');
            userMenu.classList.remove('logged-in');
        }
        // Toggle top-right buttons: show Login/Signup, hide Profile/Logout
        if (loginBtn) loginBtn.style.display = 'flex';
        if (signupBtn) signupBtn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
        
        // Update mobile menu user info
        const mobileUserInfo = document.querySelector('.mobile-menu-user-info');
        const mobileMenuLogin = document.querySelector('.mobile-menu-login');
        const mobileMenuSignup = document.querySelector('.mobile-menu-signup');
        const mobileMenuLogout = document.querySelector('.mobile-menu-logout');
        
        if (mobileUserInfo) {
            mobileUserInfo.classList.add('logged-out');
            mobileUserInfo.classList.remove('logged-in');
        }
        if (mobileMenuLogin) mobileMenuLogin.style.display = 'block';
        if (mobileMenuSignup) mobileMenuSignup.style.display = 'block';
        if (mobileMenuLogout) mobileMenuLogout.style.display = 'none';
        
        // Hide secondary navigation for tablet screens
        const secondaryNav = document.querySelector('.secondary-navigation.tablet-nav');
        if (secondaryNav) {
            secondaryNav.classList.add('logged-out');
            secondaryNav.classList.remove('logged-in');
        }
        
        // Hide notifications toggle
        const notificationToggle = document.querySelector('.notification-toggle');
        if (notificationToggle) {
            notificationToggle.classList.add('logged-out');
            notificationToggle.classList.remove('logged-in');
        }
    }
};

// Update navigation based on user role
window.updateNavigationForAuth = function(user, role) {
    if (!user && !role) {
        // Safety check: ensure functions exist before calling
        if (typeof window.getCurrentUser === 'function') {
            user = window.getCurrentUser();
        }
        if (typeof window.getCurrentRole === 'function') {
            role = window.getCurrentRole();
        }
    }
    
    // Show/hide "Host" link based on createListing permission
    const hostLinks = document.querySelectorAll('[href*="create-listing"], .host-link');
    hostLinks.forEach(link => {
        if (typeof window.hasPermission === 'function' && window.hasPermission('createListing')) {
            link.style.display = '';
        } else {
            link.style.display = 'none';
        }
    });
    
    // Show/hide admin link
    const adminLinks = document.querySelectorAll('[href*="admin"], .admin-link');
    adminLinks.forEach(link => {
        if (typeof window.hasPermission === 'function' && window.hasPermission('adminAccess')) {
            link.style.display = '';
        } else {
            link.style.display = 'none';
        }
    });
    
    // Role-based navigation: Hide "My Listings" for renters, show only booking options
    const listingLinks = document.querySelectorAll('[href*="my-listings"], .owner-only');
    const bookingLinks = document.querySelectorAll('[href*="my-bookings"], .bookings-link, .renter-only');
    
    if (role === 'renter' || (role === 'guest' && !user)) {
        // For renters: Hide listings, show bookings
        listingLinks.forEach(link => {
            link.style.display = 'none';
        });
        bookingLinks.forEach(link => {
            if (typeof window.hasPermission === 'function' && window.hasPermission('viewBookingHistory')) {
                link.style.display = '';
            }
        });
    } else if (role === 'owner' || (typeof window.hasPermission === 'function' && window.hasPermission('createListing'))) {
        // For owners: Show listings, hide renter-only bookings
        listingLinks.forEach(link => {
            link.style.display = '';
        });
        bookingLinks.forEach(link => {
            // Owners can see bookings but only their own (host bookings)
            if (link.classList.contains('renter-only')) {
                link.style.display = 'none';
            } else if (link.getAttribute('href') && link.getAttribute('href').includes('my-bookings')) {
                // Show bookings link for owners (they see host bookings)
                link.style.display = '';
            }
        });
    } else {
        // Default: Use permission-based visibility
        listingLinks.forEach(link => {
            if (typeof window.hasPermission === 'function' && window.hasPermission('createListing')) {
                link.style.display = '';
            } else {
                link.style.display = 'none';
            }
        });
        bookingLinks.forEach(link => {
            if (typeof window.hasPermission === 'function' && window.hasPermission('viewBookingHistory')) {
                link.style.display = '';
            } else {
                link.style.display = 'none';
            }
        });
    }
    
    // Update dashboard links to route to role-specific dashboards
    const dashboardLinks = document.querySelectorAll('[href="dashboard.html"], [href*="dashboard.html"]');
    dashboardLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            routeToDashboard(role, user);
        });
    });
    
    // Add role switcher for dual-role users
    if (user && user.role === 'dual_role') {
        addRoleSwitcher();
    } else {
        removeRoleSwitcher();
    }
};

// Route to appropriate dashboard based on user role
window.routeToDashboard = function(role, user) {
    if (!role && typeof window.getCurrentRole === 'function') {
        role = window.getCurrentRole();
    }
    if (!user && typeof window.getCurrentUser === 'function') {
        user = window.getCurrentUser();
    }
    
    // Check if user is logged in
    if (!user || !window.isLoggedIn || !window.isLoggedIn()) {
        sessionStorage.setItem('redirectAfterLogin', 'dashboard.html');
        window.location.href = 'login.html';
        return;
    }
    
    // Route based on role
    if (role === 'admin' || (typeof window.hasPermission === 'function' && window.hasPermission('adminAccess'))) {
        window.location.href = 'admin/dashboard.html';
    } else if (role === 'owner' || (typeof window.hasPermission === 'function' && window.hasPermission('createListing'))) {
        // Owner dashboard - show listings, earnings, bookings as host
        window.location.href = 'my-listings.html';
    } else if (role === 'renter' || (typeof window.hasPermission === 'function' && window.hasPermission('viewBookingHistory'))) {
        // Renter dashboard - show bookings, favorites, search history
        window.location.href = 'my-bookings.html';
    } else if (role === 'dual_role') {
        // Dual role: default to renter view, but can switch
        const activeRole = user.activeRole || 'renter';
        if (activeRole === 'owner') {
            window.location.href = 'my-listings.html';
        } else {
            window.location.href = 'my-bookings.html';
        }
    } else {
        // Default fallback
        window.location.href = 'profile.html';
    }
};

// Add role switcher dropdown for dual-role users
function addRoleSwitcher() {
    const userDropdown = document.getElementById('user-dropdown-menu');
    if (!userDropdown) return;
    
    // Check if switcher already exists
    if (document.getElementById('role-switcher')) return;
    
    const currentRole = window.getCurrentRole();
    const switcher = document.createElement('div');
    switcher.id = 'role-switcher';
    switcher.className = 'dropdown-divider';
    switcher.innerHTML = `
        <div class="px-3 py-2">
            <small class="text-muted d-block mb-2">Switch Role:</small>
            <div class="btn-group w-100" role="group">
                <button type="button" class="btn btn-sm ${currentRole === 'renter' ? 'btn-primary' : 'btn-outline-primary'}" 
                        onclick="switchToRole('renter')">
                    Renter
                </button>
                <button type="button" class="btn btn-sm ${currentRole === 'owner' ? 'btn-primary' : 'btn-outline-primary'}" 
                        onclick="switchToRole('owner')">
                    Owner
                </button>
            </div>
        </div>
    `;
    
    // Insert before logout button
    const logoutBtn = userDropdown.querySelector('[onclick*="logout"]');
    if (logoutBtn) {
        userDropdown.insertBefore(switcher, logoutBtn);
    } else {
        userDropdown.appendChild(switcher);
    }
}

// Remove role switcher
function removeRoleSwitcher() {
    const switcher = document.getElementById('role-switcher');
    if (switcher) {
        switcher.remove();
    }
}

// Switch role function
window.switchToRole = function(newRole) {
    if (window.switchRole(newRole)) {
        // Reload page to update UI
        window.location.reload();
    }
};

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown') || document.getElementById('user-dropdown-menu');
    const avatarLink = document.querySelector('.user-avatar-link');
    
    if (dropdown && avatarLink) {
        const isShowing = dropdown.classList.contains('show');
        
        if (!isShowing) {
            // Calculate position relative to viewport
            const rect = avatarLink.getBoundingClientRect();
            const dropdownWidth = 300; // min-width from CSS
            const dropdownHeight = dropdown.offsetHeight || 400; // approximate height
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Calculate right position (distance from right edge)
            let rightPos = viewportWidth - rect.right;
            
            // If dropdown would overflow on the right, align to right edge with margin
            if (rightPos + dropdownWidth > viewportWidth - 16) {
                rightPos = 16; // 1rem margin
            }
            
            // Calculate top position
            let topPos = rect.bottom + 12;
            
            // If dropdown would overflow on the bottom, position above avatar
            if (topPos + dropdownHeight > viewportHeight - 16) {
                topPos = rect.top - dropdownHeight - 12;
            }
            
            dropdown.style.top = topPos + 'px';
            dropdown.style.right = rightPos + 'px';
            dropdown.style.left = 'auto';
            dropdown.classList.add('show');
        } else {
            dropdown.classList.remove('show');
        }
    } else if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function toggleLanguage() {
    const langText = document.getElementById('lang-text') || document.querySelector('.lang-text');
    const current = (langText?.textContent || '').trim();
    const nextLang = current === 'EN' ? 'en' : 'ur';
    if (typeof window.setLanguage === 'function') {
        window.setLanguage(nextLang);
        } else {
        // Fallback: just flip direction/lang attributes
        document.documentElement.setAttribute('lang', nextLang === 'ur' ? 'ur' : 'en');
        document.documentElement.setAttribute('dir', nextLang === 'ur' ? 'rtl' : 'ltr');
    }
}

function toggleNotifications() {
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    const toggleButton = document.querySelector('.notification-toggle');
    
    if (notificationsDropdown && toggleButton) {
        const isOpening = !notificationsDropdown.classList.contains('show');
        notificationsDropdown.classList.toggle('show');
        
        toggleButton.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
        
        if (isOpening) {
            // Calculate position relative to toggle button
            const rect = toggleButton.getBoundingClientRect();
            const dropdownWidth = 360;
            const dropdownHeight = 500;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Calculate right position (distance from right edge)
            let rightPos = viewportWidth - rect.right;
            
            // If dropdown would overflow on the right, align to right edge with margin
            if (rightPos + dropdownWidth > viewportWidth - 16) {
                rightPos = 16; // 1rem margin
            }
            
            // Calculate top position
            let topPos = rect.bottom + 12;
            
            // If dropdown would overflow on the bottom, position above button
            if (topPos + dropdownHeight > viewportHeight - 16) {
                topPos = rect.top - dropdownHeight - 12;
            }
            
            notificationsDropdown.style.top = topPos + 'px';
            notificationsDropdown.style.right = rightPos + 'px';
            notificationsDropdown.style.left = 'auto';
        }
        
        // Close other dropdowns
        const userDropdown = document.getElementById('user-dropdown-menu');
        if (userDropdown && userDropdown.classList.contains('show')) {
            userDropdown.classList.remove('show');
        }
    }
}

function markAllNotificationsRead() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    unreadItems.forEach(item => {
        item.classList.remove('unread');
    });
    
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
    }
}

// Close notifications dropdown when clicking outside
document.addEventListener('click', function(e) {
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    const notificationToggle = document.querySelector('.notification-toggle');
    
    if (notificationsDropdown && notificationToggle && notificationsDropdown.classList.contains('show')) {
        if (!notificationsDropdown.contains(e.target) && !notificationToggle.contains(e.target)) {
            notificationsDropdown.classList.remove('show');
            if (notificationToggle) {
                notificationToggle.setAttribute('aria-expanded', 'false');
            }
        }
    }
});

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu') || document.getElementById('mobile-menu');
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    
    if (mobileMenu) {
        const isOpening = !mobileMenu.classList.contains('show');
        mobileMenu.classList.toggle('show');
        
        // Update ARIA attributes
        if (toggleButton) {
            toggleButton.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
        }
        
        // Prevent body scroll when menu is open
        if (isOpening) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('mobile-menu-open');
        } else {
            document.body.style.overflow = '';
            document.body.classList.remove('mobile-menu-open');
        }
        
        // Set animation delays for menu items
        if (isOpening) {
            const menuItems = mobileMenu.querySelectorAll('.mobile-menu-item');
            menuItems.forEach((item, index) => {
                item.style.setProperty('--item-index', index);
                item.style.animationDelay = `${index * 0.05}s`;
            });
        }
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('userDropdown') || document.getElementById('user-dropdown-menu');
    const avatarLink = document.querySelector('.user-avatar-link');
    
    if (dropdown && avatarLink && dropdown.classList.contains('show')) {
        if (!dropdown.contains(e.target) && !avatarLink.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    }
    
    // Close mobile menu when clicking outside
    const mobileMenu = document.getElementById('mobileMenu') || document.getElementById('mobile-menu');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (mobileMenu && mobileMenu.classList.contains('show')) {
        if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            mobileMenu.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
});

// Reposition dropdown on window resize
window.addEventListener('resize', function() {
    const dropdown = document.getElementById('userDropdown') || document.getElementById('user-dropdown-menu');
    const avatarLink = document.querySelector('.user-avatar-link');
    
    if (dropdown && avatarLink && dropdown.classList.contains('show')) {
        const rect = avatarLink.getBoundingClientRect();
        const dropdownWidth = 300;
        const dropdownHeight = dropdown.offsetHeight || 400;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let rightPos = viewportWidth - rect.right;
        if (rightPos + dropdownWidth > viewportWidth - 16) {
            rightPos = 16;
        }
        
        let topPos = rect.bottom + 12;
        if (topPos + dropdownHeight > viewportHeight - 16) {
            topPos = rect.top - dropdownHeight - 12;
        }
        
        dropdown.style.top = topPos + 'px';
        dropdown.style.right = rightPos + 'px';
        dropdown.style.left = 'auto';
    }
});

// Initialize navigation highlighting when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setActiveNavLink();
    
    // Add dashboard routing handler to all dashboard links
    document.querySelectorAll('[href="dashboard.html"], [href*="dashboard.html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const role = window.getCurrentRole ? window.getCurrentRole() : null;
            const user = window.getCurrentUser ? window.getCurrentUser() : null;
            routeToDashboard(role, user);
        });
    });
    
    // Update navigation visibility based on role
    if (window.updateNavigationForAuth) {
        window.updateNavigationForAuth();
    }
});

// Set active navigation link based on current page
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        const href = link.getAttribute('href');
        
        // Remove active class from all links
        link.classList.remove('active');
        
        // Check if current page matches
        if (currentPage === 'index.html' && linkPage === 'home') {
            link.classList.add('active');
        } else if (currentPage.includes('category') && linkPage === 'categories') {
            link.classList.add('active');
        } else if (currentPage.includes('create-listing') && linkPage === 'host') {
            link.classList.add('active');
        } else if (href && currentPage === href.split('/').pop()) {
            link.classList.add('active');
        }
    });
}

// Enhanced Header scroll effect with smooth transitions
(function() {
    let lastScrollTop = 0;
    let ticking = false;
    const header = document.querySelector('.header');
    
    if (!header) return;
    
    function updateHeader() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 30) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });
    
    // Initial check
    updateHeader();
})();

// Smooth scroll for anchor links (How It Works, Categories, etc.)
(function() {
    // Handle all anchor links with hash
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href*="#"]');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href || !href.includes('#')) return;
        
        // Check if it's an anchor link to a section on the same page or index.html
        const hash = href.split('#')[1];
        if (!hash) return;
        
        // If link points to index.html#section, handle navigation
        if (href.startsWith('index.html#') || href.startsWith('/index.html#')) {
            const currentPage = window.location.pathname.split('/').pop();
            
            // If we're not on index.html, navigate first then scroll
            if (currentPage !== 'index.html' && currentPage !== '') {
                e.preventDefault();
                window.location.href = href;
                return;
            }
        }
        
        // If we're on the same page, handle smooth scroll
        const targetId = hash;
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            e.preventDefault();
            
            // Calculate offset for fixed header
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 80;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            
            // Smooth scroll
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Update URL without triggering scroll
            if (history.pushState) {
                history.pushState(null, null, '#' + targetId);
            }
        }
    });
    
    // Handle initial page load with hash
    if (window.location.hash) {
        window.addEventListener('load', function() {
            const hash = window.location.hash.substring(1);
            const targetElement = document.getElementById(hash);
            
            if (targetElement) {
                setTimeout(function() {
                    const header = document.querySelector('.header');
                    const headerHeight = header ? header.offsetHeight : 80;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        });
    }
})();

