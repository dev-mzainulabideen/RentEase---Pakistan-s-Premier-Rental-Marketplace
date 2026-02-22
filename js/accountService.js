// Account Service - Handles account type and subscription status
(function() {
    'use strict';
    
    const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
    
    window.AccountService = {
        // Get account type and subscription status
        async getAccountInfo() {
            try {
                const token = localStorage.getItem('mr-token');
                if (!token) {
                    return {
                        accountType: 'free',
                        subscriptionActive: false,
                        verificationStatus: 'not_verified'
                    };
                }
                
                const response = await fetch(`${API_BASE_URL}/subscriptions/status`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.data || {
                        accountType: 'free',
                        subscriptionActive: false,
                        verificationStatus: 'not_verified'
                    };
                }
                
                return {
                    accountType: 'free',
                    subscriptionActive: false,
                    verificationStatus: 'not_verified'
                };
            } catch (error) {
                console.error('Error fetching account info:', error);
                return {
                    accountType: 'free',
                    subscriptionActive: false,
                    verificationStatus: 'not_verified'
                };
            }
        },
        
        // Check if ads should be displayed
        async shouldDisplayAds() {
            const accountInfo = await this.getAccountInfo();
            return accountInfo.accountType === 'free' && !accountInfo.subscriptionActive;
        },
        
        // Get ads for current page
        async getAdsForPage(page = 'home') {
            try {
                const token = localStorage.getItem('mr-token');
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                const response = await fetch(`${API_BASE_URL}/ad-display/ads?page=${page}`, {
                    headers
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.data || { ads: [], shouldDisplay: false };
                }
                
                return { ads: [], shouldDisplay: false };
            } catch (error) {
                console.error('Error fetching ads:', error);
                return { ads: [], shouldDisplay: false };
            }
        },
        
        // Cache account info
        _cache: null,
        _cacheTime: null,
        _cacheDuration: 60000, // 1 minute cache
        
        // Get cached account info
        async getCachedAccountInfo() {
            const now = Date.now();
            if (this._cache && this._cacheTime && (now - this._cacheTime) < this._cacheDuration) {
                return this._cache;
            }
            
            this._cache = await this.getAccountInfo();
            this._cacheTime = now;
            return this._cache;
        },
        
        // Clear cache
        clearCache() {
            this._cache = null;
            this._cacheTime = null;
        }
    };
    
    // Clear cache on auth state changes
    window.addEventListener('authStateChanged', () => {
        window.AccountService.clearCache();
    });
    
    // Clear cache on login/logout
    const originalLogout = window.logout;
    if (originalLogout) {
        window.logout = function() {
            window.AccountService.clearCache();
            return originalLogout.apply(this, arguments);
        };
    }
})();

