// Route Protection - Prevents unauthorized access and URL manipulation
(function() {
    'use strict';

    // Protected routes configuration
    const PROTECTED_ROUTES = {
        // Admin routes
        '/admin/': {
            requireAuth: true,
            requireRole: 'admin',
            redirectTo: 'login.html'
        },
        'admin/dashboard.html': {
            requireAuth: true,
            requireRole: 'admin',
            redirectTo: 'login.html'
        },
        'admin/users.html': {
            requireAuth: true,
            requireRole: 'admin',
            redirectTo: 'login.html'
        },
        'admin/listings.html': {
            requireAuth: true,
            requireRole: 'admin',
            redirectTo: 'login.html'
        },
        'admin/categories.html': {
            requireAuth: true,
            requireRole: 'admin',
            redirectTo: 'login.html'
        },
        'admin/ads.html': {
            requireAuth: true,
            requireRole: 'admin',
            redirectTo: 'login.html'
        },
        'admin/subscriptions.html': {
            requireAuth: true,
            requireRole: 'admin',
            redirectTo: 'login.html'
        },
        'admin/disputes.html': {
            requireAuth: true,
            requireRole: 'admin',
            redirectTo: 'login.html'
        },
        'admin/content.html': {
            requireAuth: true,
            requireRole: 'admin',
            redirectTo: 'login.html'
        },
        'admin/statistics.html': {
            requireAuth: true,
            requireRole: 'admin',
            redirectTo: 'login.html'
        },
        
        // User dashboard routes
        'dashboard.html': {
            requireAuth: true,
            redirectTo: 'login.html'
        },
        'my-listings.html': {
            requireAuth: true,
            requirePermission: 'createListing',
            redirectTo: 'login.html'
        },
        'my-bookings.html': {
            requireAuth: true,
            requirePermission: 'viewBookingHistory',
            redirectTo: 'login.html'
        },
        'messages.html': {
            requireAuth: true,
            requirePermission: 'message',
            redirectTo: 'login.html'
        },
        'profile.html': {
            requireAuth: true,
            redirectTo: 'login.html'
        },
        'settings.html': {
            requireAuth: true,
            redirectTo: 'login.html'
        },
        'create-listing.html': {
            requireAuth: true,
            requirePermission: 'createListing',
            redirectTo: 'login.html'
        },
        'disputes.html': {
            requireAuth: true,
            redirectTo: 'login.html'
        },
        'emergency-contacts.html': {
            requireAuth: true,
            redirectTo: 'login.html'
        },
        'safety-guidelines.html': {
            requireAuth: false // Public page
        },
        'verification.html': {
            requireAuth: true,
            redirectTo: 'login.html'
        }
    };

    // Check if current route is protected
    function getCurrentRoute() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename;
    }

    // Check route protection
    function checkRouteProtection() {
        const currentFile = getCurrentRoute();
        const currentPath = window.location.pathname;
        
        // Check exact file match first
        let routeConfig = PROTECTED_ROUTES[currentFile];
        
        // Check path-based matches
        if (!routeConfig) {
            for (const [route, config] of Object.entries(PROTECTED_ROUTES)) {
                if (currentPath.includes(route) || currentFile.includes(route.replace('/', ''))) {
                    routeConfig = config;
                    break;
                }
            }
        }
        
        if (!routeConfig) {
            return true; // Route not protected
        }
        
        // Check authentication requirement
        if (routeConfig.requireAuth) {
            if (typeof window.isLoggedIn !== 'function' || !window.isLoggedIn()) {
                // Store intended destination
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = routeConfig.redirectTo || 'login.html';
                return false;
            }
        }
        
        // Check role requirement
        if (routeConfig.requireRole) {
            if (typeof window.hasRole !== 'function' || !window.hasRole(routeConfig.requireRole)) {
                alert('You do not have permission to access this page.');
                window.location.href = routeConfig.redirectTo || 'index.html';
                return false;
            }
        }
        
        // Check permission requirement
        if (routeConfig.requirePermission) {
            if (typeof window.hasPermission !== 'function' || !window.hasPermission(routeConfig.requirePermission)) {
                alert('You do not have permission to access this feature.');
                window.location.href = routeConfig.redirectTo || 'index.html';
                return false;
            }
        }
        
        return true;
    }

    // Validate URL parameters to prevent injection
    function validateURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\(/i,
            /expression\(/i
        ];
        
        for (const [key, value] of urlParams.entries()) {
            // Check for dangerous patterns
            if (dangerousPatterns.some(pattern => pattern.test(value))) {
                console.warn('Potentially dangerous URL parameter detected:', key);
                // Remove dangerous parameter
                urlParams.delete(key);
                const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                window.history.replaceState({}, '', newUrl);
            }
            
            // Limit parameter length
            if (value.length > 1000) {
                console.warn('URL parameter too long:', key);
                urlParams.set(key, value.substring(0, 1000));
                const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                window.history.replaceState({}, '', newUrl);
            }
        }
    }

    // Prevent direct access to sensitive files
    function preventDirectFileAccess() {
        const currentPath = window.location.pathname.toLowerCase();
        const sensitiveFiles = [
            '.env',
            'config.js',
            'auth.js',
            'package.json',
            'node_modules'
        ];
        
        for (const file of sensitiveFiles) {
            if (currentPath.includes(file)) {
                console.error('Access denied to sensitive file');
                window.location.href = 'index.html';
                return false;
            }
        }
        return true;
    }

    // Sanitize and validate redirect URLs
    function sanitizeRedirectUrl(url) {
        if (!url) return 'index.html';
        
        // Only allow relative URLs or same origin
        try {
            const urlObj = new URL(url, window.location.origin);
            if (urlObj.origin !== window.location.origin) {
                return 'index.html'; // Prevent open redirect
            }
            return urlObj.pathname + urlObj.search;
        } catch (e) {
            // Invalid URL, return default
            return 'index.html';
        }
    }

    // Initialize route protection
    function initRouteProtection() {
        // Wait for auth system to load
        if (typeof window.isLoggedIn === 'undefined') {
            setTimeout(initRouteProtection, 100);
            return;
        }
        
        // Validate URL parameters
        validateURLParams();
        
        // Prevent direct file access
        preventDirectFileAccess();
        
        // Check route protection
        checkRouteProtection();
    }

    // Export functions
    window.RouteProtection = {
        checkRoute: checkRouteProtection,
        validateParams: validateURLParams,
        sanitizeRedirect: sanitizeRedirectUrl,
        init: initRouteProtection
    };

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRouteProtection);
    } else {
        setTimeout(initRouteProtection, 100);
    }

    // Re-check on navigation (for SPAs)
    window.addEventListener('popstate', function() {
        setTimeout(checkRouteProtection, 100);
    });

})();

