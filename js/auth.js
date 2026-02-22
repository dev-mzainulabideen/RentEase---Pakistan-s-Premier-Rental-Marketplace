// User Authentication & Role Management System
// Handles user sessions, roles, and permissions

(function() {
    'use strict';

    // User roles and permissions
    const ROLES = {
        GUEST: 'guest',
        RENTER: 'renter',
        OWNER: 'owner',
        DUAL_ROLE: 'dual_role',
        ADMIN: 'admin',
        MODERATOR: 'moderator'
    };

    // Role permissions mapping
    const PERMISSIONS = {
        [ROLES.GUEST]: {
            browseCategories: true,
            browseListings: true,
            search: true,
            filter: true,
            book: false,
            message: false,
            review: false,
            createListing: false,
            editListing: false,
            deleteListing: false,
            adminAccess: false
        },
        [ROLES.RENTER]: {
            browseCategories: true,
            browseListings: true,
            search: true,
            filter: true,
            book: true,
            message: true,
            viewBookingHistory: true,
            review: false, // Only for paid users
            createListing: false,
            editListing: false,
            deleteListing: false,
            adminAccess: false
        },
        [ROLES.OWNER]: {
            browseCategories: true,
            browseListings: true,
            search: true,
            filter: true,
            book: false,
            message: true,
            createListing: true,
            editListing: true,
            deleteListing: true,
            setPricing: true,
            setAvailability: true,
            acceptBooking: true,
            rejectBooking: true,
            viewEarnings: true,
            viewReviews: true,
            adminAccess: false
        },
        [ROLES.DUAL_ROLE]: {
            // Combines RENTER and OWNER permissions
            browseCategories: true,
            browseListings: true,
            search: true,
            filter: true,
            book: true,
            message: true,
            viewBookingHistory: true,
            review: false, // Only for paid users
            createListing: true,
            editListing: true,
            deleteListing: true,
            setPricing: true,
            setAvailability: true,
            acceptBooking: true,
            rejectBooking: true,
            viewEarnings: true,
            viewReviews: true,
            switchRole: true,
            adminAccess: false
        },
        [ROLES.ADMIN]: {
            // Full access
            browseCategories: true,
            browseListings: true,
            search: true,
            filter: true,
            book: true,
            message: true,
            createListing: true,
            editListing: true,
            deleteListing: true,
            adminAccess: true,
            verifyUsers: true,
            manageCategories: true,
            manageListings: true,
            manageAds: true,
            manageSubscriptions: true,
            handleDisputes: true,
            handleReports: true,
            manageContent: true,
            viewStatistics: true
        },
        [ROLES.MODERATOR]: {
            browseCategories: true,
            browseListings: true,
            search: true,
            filter: true,
            book: false,
            message: true,
            review: false,
            createListing: false,
            editListing: true, // Can edit reported listings
            deleteListing: true, // Can delete reported listings
            handleReports: true,
            assistDisputes: true,
            adminAccess: false
        }
    };

    // Storage keys
    const STORAGE_KEYS = {
        USER: 'mr-user',
        CURRENT_ROLE: 'mr-current-role',
        SESSION: 'mr-session'
    };

    // API base URL for backend authentication
    const API_BASE_URL = 'http://localhost:4001/api';

    // Current user state
    let currentUser = null;
    let currentRole = null;

    // Initialize auth system
    function initAuth() {
        loadUserFromStorage();
        updateUI();
        checkSessionExpiry();
    }

    // Load user from localStorage
    function loadUserFromStorage() {
        try {
            const userData = localStorage.getItem(STORAGE_KEYS.USER);
            const roleData = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
            
            if (userData) {
                currentUser = JSON.parse(userData);
                currentRole = roleData || currentUser.role;
                
                // Validate role
                if (!Object.values(ROLES).includes(currentRole)) {
                    currentRole = ROLES.GUEST;
                }
            } else {
                currentUser = null;
                currentRole = ROLES.GUEST;
            }
        } catch (error) {
            console.error('Error loading user:', error);
            currentUser = null;
            currentRole = ROLES.GUEST;
        }
    }

    // Save user to localStorage
    function saveUserToStorage(user, role) {
        try {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
            localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, role);
            currentUser = user;
            currentRole = role;
            updateUI();
        } catch (error) {
            console.error('Error saving user:', error);
        }
    }

    // Check session expiry
    function checkSessionExpiry() {
        const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION);
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
                    logout();
                }
            } catch (error) {
                console.error('Error checking session:', error);
            }
        }
    }

    // Login function (uses backend API)
    window.login = async function(email, password, rememberMe = false) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                console.error('Login failed:', data);
                const errorMessage =
                    (Array.isArray(data.errors) && data.errors.length && data.errors[0]) ||
                    data.message ||
                    'Login failed';
                return { success: false, error: errorMessage };
            }

            const user = data.user;
            const role = user.role || ROLES.RENTER;

            // Save JWT token
            try {
                localStorage.setItem('mr-token', data.token);
            } catch (e) {
                console.warn('Could not save auth token:', e);
            }

            // Create session
            const session = {
                userId: user._id,
                expiresAt: rememberMe 
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            };
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

            saveUserToStorage(user, role);
            
            // Trigger custom event
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user, role } }));
            
            return { success: true, user, role, token: data.token };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    // Register function (uses backend API)
    window.register = async function(userData) {
        try {
            const payload = {
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                mobile: userData.mobile, // backend accepts mobile/phone
                password: userData.password,
                confirmPassword: userData.confirmPassword,
                role: userData.role || ROLES.RENTER
                // Note: accountType is always set to 'free' by backend for security
            };

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                console.error('Registration failed:', data);
                const errorMessage =
                    (Array.isArray(data.errors) && data.errors.length && data.errors[0]) ||
                    data.message ||
                    'Registration failed';
                return { success: false, error: errorMessage };
            }

            const user = data.user;
            const role = user.role || ROLES.RENTER;

            try {
                localStorage.setItem('mr-token', data.token);
            } catch (e) {
                console.warn('Could not save auth token:', e);
            }

            const session = {
                userId: user._id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

            saveUserToStorage(user, role);

            window.dispatchEvent(new CustomEvent('userRegistered', { detail: { user, role } }));
            
            return { success: true, user, role, token: data.token };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    // Logout function
    window.logout = function() {
        currentUser = null;
        currentRole = ROLES.GUEST;
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        try {
            localStorage.removeItem('mr-token');
        } catch (e) {
            console.warn('Could not remove auth token:', e);
        }
        updateUI();
        window.dispatchEvent(new CustomEvent('userLoggedOut'));

        // Redirect after logout:
        // - If on a protected/admin page, go to login
        // - Otherwise, go to home
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/admin') || path.includes('dashboard') || path.includes('profile') || path.includes('my-bookings') || path.includes('my-listings') || path.includes('messages') || path.includes('create-listing')) {
            window.location.href = 'login.html';
        } else {
            window.location.href = 'index.html';
        }
    };

    // Get current user
    window.getCurrentUser = function() {
        return currentUser;
    };

    // Get current role
    window.getCurrentRole = function() {
        return currentRole;
    };

    // Check if user is logged in
    window.isLoggedIn = function() {
        return currentUser !== null && currentRole !== ROLES.GUEST;
    };

    // Check permission
    window.hasPermission = function(permission) {
        if (!currentUser) {
            return PERMISSIONS[ROLES.GUEST][permission] || false;
        }
        return PERMISSIONS[currentRole] && PERMISSIONS[currentRole][permission] || false;
    };

    // Check if user has role
    window.hasRole = function(role) {
        if (role === ROLES.GUEST) {
            return !currentUser;
        }
        return currentRole === role || (currentUser && currentUser.role === role);
    };

    // Switch role (for dual-role users)
    window.switchRole = function(newRole) {
        if (!currentUser || currentUser.role !== ROLES.DUAL_ROLE) {
            return false;
        }

        if (newRole === ROLES.RENTER || newRole === ROLES.OWNER) {
            currentRole = newRole;
            if (currentUser) {
                currentUser.activeRole = newRole;
            }
            saveUserToStorage(currentUser, newRole);
            window.dispatchEvent(new CustomEvent('roleSwitched', { detail: { role: newRole } }));
            updateUI();
            return true;
        }
        return false;
    };

    // Require permission (redirects if not authorized)
    window.requirePermission = function(permission, redirectUrl = 'login.html') {
        if (!hasPermission(permission)) {
            if (!isLoggedIn()) {
                // Store intended destination
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = redirectUrl;
            } else {
                // User is logged in but doesn't have permission
                alert('You do not have permission to access this feature.');
                window.history.back();
            }
            return false;
        }
        return true;
    };

    // Require role (redirects if not authorized)
    window.requireRole = function(role, redirectUrl = 'index.html') {
        if (!hasRole(role)) {
            if (!isLoggedIn()) {
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'login.html';
            } else {
                alert('You do not have permission to access this page.');
                window.location.href = redirectUrl;
            }
            return false;
        }
        return true;
    };

    // Update UI based on user state
    function updateUI() {
        // Update header
        if (window.updateHeaderForAuth) {
            updateHeaderForAuth(currentUser, currentRole);
        }

        // Update navigation
        if (window.updateNavigationForAuth) {
            updateNavigationForAuth(currentUser, currentRole);
        }

        // Trigger custom event
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: currentUser, role: currentRole } 
        }));
    }

    // Get role display name
    window.getRoleDisplayName = function(role) {
        const names = {
            [ROLES.GUEST]: 'Guest',
            [ROLES.RENTER]: 'Renter',
            [ROLES.OWNER]: 'Owner',
            [ROLES.DUAL_ROLE]: 'Dual Role',
            [ROLES.ADMIN]: 'Admin',
            [ROLES.MODERATOR]: 'Moderator'
        };
        return names[role] || 'Unknown';
    };

    // Get role badge class
    window.getRoleBadgeClass = function(role) {
        const classes = {
            [ROLES.GUEST]: 'bg-secondary',
            [ROLES.RENTER]: 'bg-info',
            [ROLES.OWNER]: 'bg-primary',
            [ROLES.DUAL_ROLE]: 'bg-success',
            [ROLES.ADMIN]: 'bg-danger',
            [ROLES.MODERATOR]: 'bg-warning'
        };
        return classes[role] || 'bg-secondary';
    };

    // Export roles for use in other files
    window.ROLES = ROLES;
    window.PERMISSIONS = PERMISSIONS;

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }

    // Also initialize immediately if script loads after DOM
    initAuth();
})();

