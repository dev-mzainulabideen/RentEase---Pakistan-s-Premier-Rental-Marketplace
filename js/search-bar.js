// Search Bar Component - Context-Aware Initialization
(function() {
    'use strict';
    
    /**
     * Initialize search bar based on page context
     */
    function initSearchBar() {
        const searchBarWrapper = document.querySelector('.global-search-bar-wrapper');
        if (!searchBarWrapper) return;
        
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const searchBar = searchBarWrapper.querySelector('.global-search-bar');
        
        // Determine context and apply appropriate variant
        if (currentPage === 'index.html' || currentPage === '' || currentPage === 'search.html') {
            // Expanded variant for landing and search pages
            searchBarWrapper.classList.add('search-bar-expanded');
            searchBarWrapper.classList.remove('search-bar-compact', 'search-bar-inline');
        } else if (currentPage.includes('category.html') || currentPage.includes('listing')) {
            // Compact variant for category and listing pages
            searchBarWrapper.classList.add('search-bar-compact');
            searchBar.classList.add('search-bar-compact');
            searchBarWrapper.classList.remove('search-bar-expanded', 'search-bar-inline');
        } else {
            // Inline variant for other pages (profile, dashboard, etc.)
            searchBarWrapper.classList.add('search-bar-inline');
            searchBar.classList.add('search-bar-inline');
            searchBarWrapper.classList.remove('search-bar-expanded', 'search-bar-compact');
        }
        
        // Add keyboard navigation
        const searchItems = searchBarWrapper.querySelectorAll('.search-item');
        searchItems.forEach((item, index) => {
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = 'search.html';
                } else if (e.key === 'ArrowRight' && index < searchItems.length - 1) {
                    e.preventDefault();
                    searchItems[index + 1].focus();
                } else if (e.key === 'ArrowLeft' && index > 0) {
                    e.preventDefault();
                    searchItems[index - 1].focus();
                }
            });
        });
    }
    
    /**
     * Handle search bar interactions
     */
    function setupSearchBarInteractions() {
        const searchBar = document.querySelector('.global-search-bar');
        if (!searchBar) return;
        
        // Add focus states
        const searchItems = searchBar.querySelectorAll('.search-item');
        searchItems.forEach(item => {
            item.addEventListener('focus', function() {
                this.classList.add('focused');
            });
            
            item.addEventListener('blur', function() {
                this.classList.remove('focused');
            });
        });
        
        // Enhanced hover effects
        searchBar.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initSearchBar();
            setupSearchBarInteractions();
        });
    } else {
        initSearchBar();
        setupSearchBarInteractions();
    }
    
    // Re-initialize on page navigation (for SPAs)
    window.addEventListener('popstate', function() {
        initSearchBar();
    });
})();

