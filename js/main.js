// Dynamically ensure auth and rbac are loaded before i18n
(function ensureAuth() {
    const authScript = document.querySelector('script[src$="js/auth.js"]');
    const rbacScript = document.querySelector('script[src$="js/rbac.js"]');
    
    if (!authScript) {
        const script = document.createElement('script');
        script.src = 'js/auth.js';
        script.defer = true;
        document.head.appendChild(script);
    }
    
    if (!rbacScript) {
        const script = document.createElement('script');
        script.src = 'js/rbac.js';
        script.defer = true;
        document.head.appendChild(script);
    }
})();

// Dynamically ensure i18n is available on every page that loads main.js
(function ensureI18n() {
    const existing = document.querySelector('script[src$="js/i18n.js"]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = 'js/i18n.js';
    script.defer = true;
    script.onload = function() {
        if (window.applyTranslations) {
            window.applyTranslations();
        }
    };
    document.head.appendChild(script);
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Header and Footer are now embedded directly in HTML
    // Initialize header functionality
    initHeader();

    // Initialize language from saved preference
    const applyLang = () => {
        if (window.applyTranslations) {
            window.applyTranslations();
        }
    };
    applyLang();
    window.addEventListener('load', applyLang);
    
    // Handle scroll for header and search bar
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        const searchBarWrapper = document.querySelector('.global-search-bar-wrapper');
        const currentScroll = window.scrollY;
        
        if (currentScroll > 20) {
            if (header) header.classList.add('scrolled');
            if (searchBarWrapper) searchBarWrapper.classList.add('scrolled');
        } else {
            if (header) header.classList.remove('scrolled');
            if (searchBarWrapper) searchBarWrapper.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });

    // Update header + hero CTA based on auth state (handled by auth.js now)
    // Wait for auth to initialize
    setTimeout(() => {
        if (window.updateHeaderForAuth) {
            window.updateHeaderForAuth();
        }

        // Also toggle hero buttons on home page
        const heroLogin = document.querySelector('.hero-btn-login');
        const heroSignup = document.querySelector('.hero-btn-signup');
        const heroProfile = document.querySelector('.hero-btn-profile');
        const heroLogout = document.querySelector('.hero-btn-logout');
        const loggedIn = typeof window.isLoggedIn === 'function' && window.isLoggedIn();

        if (heroLogin && heroSignup && heroProfile && heroLogout) {
            if (loggedIn) {
                heroLogin.style.display = 'none';
                heroSignup.style.display = 'none';
                heroProfile.style.display = '';
                heroLogout.style.display = '';
            } else {
                heroLogin.style.display = '';
                heroSignup.style.display = '';
                heroProfile.style.display = '';
                heroLogout.style.display = 'none';
            }
        }
    }, 200);
});

