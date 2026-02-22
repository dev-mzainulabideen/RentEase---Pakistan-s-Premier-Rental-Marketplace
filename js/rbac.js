// Role-Based Access Control Utilities
// Provides helper functions for checking permissions and restricting UI elements

(function() {
    'use strict';

    // Restrict element based on permission
    window.restrictElement = function(element, permission, hide = true) {
        if (!element) return;
        
        if (typeof window.hasPermission !== 'function' || !window.hasPermission(permission)) {
            if (hide) {
                element.style.display = 'none';
            } else {
                element.disabled = true;
                element.classList.add('disabled');
                element.title = 'You do not have permission to access this feature';
            }
        }
    };

    // Restrict multiple elements
    window.restrictElements = function(selector, permission, hide = true) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => restrictElement(el, permission, hide));
    };

    // Show element only if user has permission
    window.showIfPermitted = function(element, permission) {
        if (!element) return;
        if (typeof window.hasPermission === 'function' && window.hasPermission(permission)) {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    };

    // Add click handler that checks permission
    window.addPermissionCheck = function(element, permission, callback, redirectUrl = 'login.html') {
        if (!element) return;
        
        element.addEventListener('click', function(e) {
            if (typeof window.hasPermission !== 'function' || !window.hasPermission(permission)) {
                e.preventDefault();
                e.stopPropagation();
                
                if (!window.isLoggedIn()) {
                    sessionStorage.setItem('redirectAfterLogin', window.location.href);
                    window.location.href = redirectUrl;
                } else {
                    alert('You do not have permission to perform this action.');
                }
                return false;
            }
            
            if (callback) {
                callback(e);
            }
        });
    };

    // Initialize page-level restrictions
    window.initPageRestrictions = function() {
        // Restrict booking buttons
        restrictElements('[data-require="book"]', 'book');
        
        // Restrict message buttons
        restrictElements('[data-require="message"]', 'message');
        
        // Restrict review buttons
        restrictElements('[data-require="review"]', 'review');
        
        // Restrict create listing buttons
        restrictElements('[data-require="createListing"]', 'createListing');
        
        // Restrict admin links
        restrictElements('[data-require="adminAccess"]', 'adminAccess');
        
        // Restrict owner-only features
        if (typeof window.hasPermission === 'function' && !window.hasPermission('createListing')) {
            restrictElements('.owner-only', 'createListing');
        }
        
        // Restrict renter-only features
        if (typeof window.hasPermission === 'function' && !window.hasPermission('book')) {
            restrictElements('.renter-only', 'book');
        }
    };

    // Add role badge to element
    window.addRoleBadge = function(element, role) {
        if (!element) return;
        
        const badge = document.createElement('span');
        badge.className = `badge ${window.getRoleBadgeClass(role)} ms-2`;
        badge.textContent = window.getRoleDisplayName(role);
        badge.style.fontSize = '0.7rem';
        element.appendChild(badge);
    };

    // Check and redirect on page load
    window.checkPageAccess = function(requiredPermission, requiredRole = null, redirectUrl = 'index.html') {
        if (requiredRole && !window.hasRole(requiredRole)) {
            window.requireRole(requiredRole, redirectUrl);
            return false;
        }
        
        if (requiredPermission && (typeof window.hasPermission !== 'function' || !window.hasPermission(requiredPermission))) {
            if (typeof window.requirePermission === 'function') {
                window.requirePermission(requiredPermission, redirectUrl);
            }
            return false;
        }
        
        return true;
    };

    // Initialize restrictions when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageRestrictions);
    } else {
        initPageRestrictions();
    }

    // Re-initialize when auth state changes
    window.addEventListener('authStateChanged', function() {
        setTimeout(initPageRestrictions, 100);
    });
})();

