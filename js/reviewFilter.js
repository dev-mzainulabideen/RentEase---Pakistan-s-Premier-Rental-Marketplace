// Review Filter - Hides reviews for free accounts
(function() {
    'use strict';
    
    window.ReviewFilter = {
        // Filter reviews based on account type
        async filterReviews() {
            try {
                const accountInfo = await window.AccountService.getCachedAccountInfo();
                
                // Free accounts: hide reviews
                if (accountInfo.accountType === 'free' && !accountInfo.subscriptionActive) {
                    // Hide review sections
                    document.querySelectorAll('.review-section, .reviews-container, [data-reviews]').forEach(el => {
                        el.style.display = 'none';
                    });
                    
                    // Show upgrade message if not already shown
                    const existingMessage = document.querySelector('.review-disabled-message');
                    if (!existingMessage) {
                        const message = document.createElement('div');
                        message.className = 'review-disabled-message';
                        message.innerHTML = `
                            <div class="review-disabled-content">
                                <i class="bi bi-lock-fill"></i>
                                <h3>Reviews are only available for verified paid accounts</h3>
                                <p>Upgrade to Premium to view and leave reviews</p>
                                <a href="subscription.html" class="btn-upgrade">Upgrade to Premium</a>
                            </div>
                        `;
                        
                        // Insert message where reviews would be
                        const reviewContainers = document.querySelectorAll('.review-section, .reviews-container, [data-reviews]');
                        if (reviewContainers.length > 0) {
                            reviewContainers[0].parentNode.insertBefore(message, reviewContainers[0]);
                        } else {
                            // Try to find a common location
                            const listingDetail = document.querySelector('.listing-detail-content');
                            if (listingDetail) {
                                listingDetail.appendChild(message);
                            }
                        }
                    }
                } else {
                    // Paid accounts: show reviews
                    document.querySelectorAll('.review-section, .reviews-container, [data-reviews]').forEach(el => {
                        el.style.display = '';
                    });
                    
                    // Remove upgrade message
                    document.querySelectorAll('.review-disabled-message').forEach(el => {
                        el.remove();
                    });
                }
            } catch (error) {
                console.error('Error filtering reviews:', error);
            }
        },
        
        // Initialize
        init() {
            this.filterReviews();
            
            // Update when account info changes
            window.addEventListener('accountInfoUpdated', () => {
                this.filterReviews();
            });
            
            // Update when auth state changes
            window.addEventListener('authStateChanged', () => {
                setTimeout(() => {
                    this.filterReviews();
                }, 500);
            });
        }
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ReviewFilter.init();
        });
    } else {
        window.ReviewFilter.init();
    }
})();

