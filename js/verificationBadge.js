// Verification Badge Component - Updates verification badge based on account type
(function() {
    'use strict';
    
    window.VerificationBadge = {
        // Update verification badge based on account type
        async updateBadge() {
            try {
                const accountInfo = await window.AccountService.getCachedAccountInfo();
                
                const badgeElements = document.querySelectorAll('.verification-badge, .account-badge, [data-verification-badge]');
                
                badgeElements.forEach(badge => {
                    if (accountInfo.accountType === 'paid' && accountInfo.subscriptionActive) {
                        badge.className = 'verification-badge verified';
                        badge.innerHTML = `
                            <i class="bi bi-shield-check-fill"></i>
                            <span>Verified Customer</span>
                        `;
                        badge.setAttribute('data-verified', 'true');
                    } else {
                        badge.className = 'verification-badge not-verified';
                        badge.innerHTML = `
                            <i class="bi bi-shield-exclamation"></i>
                            <span>Not Verified</span>
                        `;
                        badge.setAttribute('data-verified', 'false');
                    }
                });
                
                // Also update profile page badges
                const profileBadges = document.querySelectorAll('.profile-verification-badge, .user-verification-badge');
                profileBadges.forEach(badge => {
                    if (accountInfo.accountType === 'paid' && accountInfo.subscriptionActive) {
                        badge.classList.add('verified');
                        badge.classList.remove('not-verified');
                        badge.innerHTML = `
                            <i class="bi bi-shield-check-fill"></i>
                            <span>Verified Customer</span>
                        `;
                    } else {
                        badge.classList.add('not-verified');
                        badge.classList.remove('verified');
                        badge.innerHTML = `
                            <i class="bi bi-shield-exclamation"></i>
                            <span>Not Verified</span>
                        `;
                    }
                });
            } catch (error) {
                console.error('Error updating verification badge:', error);
            }
        },
        
        // Initialize on page load
        init() {
            this.updateBadge();
            
            // Update when account info changes
            window.addEventListener('accountInfoUpdated', () => {
                this.updateBadge();
            });
            
            // Update when auth state changes
            window.addEventListener('authStateChanged', () => {
                setTimeout(() => {
                    this.updateBadge();
                }, 500);
            });
        }
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.VerificationBadge.init();
        });
    } else {
        window.VerificationBadge.init();
    }
})();

