const User = require('../models/User');
const Subscription = require('./subscriptionService');

class AccountService {
    /**
     * Get account type and status for a user
     * @param {String} userId - User ID
     * @returns {Object} Account information
     */
    async getAccountInfo(userId) {
        if (!userId) {
            return {
                accountType: 'free',
                subscriptionActive: false,
                verificationStatus: 'not_verified',
                features: this.getFeaturesForAccountType('free', false)
            };
        }
        
        const user = await User.findById(userId).select('accountType subscription verification accountCreatedAt adDisplaySettings');
        if (!user) {
            return {
                accountType: 'free',
                subscriptionActive: false,
                verificationStatus: 'not_verified',
                features: this.getFeaturesForAccountType('free', false)
            };
        }
        
        // Check if subscription is actually active
        const subscriptionService = new Subscription();
        const isSubscriptionActive = await subscriptionService.isSubscriptionActive(userId);
        
        // Ensure account type matches subscription status
        if (user.accountType === 'paid' && !isSubscriptionActive) {
            // Subscription expired, but account type might not be updated yet
            // This will be handled by subscription expiry handler
        }
        
        return {
            accountType: user.accountType || 'free',
            subscriptionActive: isSubscriptionActive,
            subscription: user.subscription,
            verificationStatus: user.verification?.status || 'not_verified',
            accountCreatedAt: user.accountCreatedAt,
            adDisplaySettings: user.adDisplaySettings,
            features: this.getFeaturesForAccountType(user.accountType || 'free', isSubscriptionActive)
        };
    }
    
    /**
     * Get features available for account type
     * @param {String} accountType - 'free' or 'paid'
     * @param {Boolean} subscriptionActive - Whether subscription is active
     * @returns {Object} Features object
     */
    getFeaturesForAccountType(accountType, subscriptionActive) {
        const isPaid = accountType === 'paid' && subscriptionActive;
        
        return {
            // Ad display
            adsEnabled: !isPaid, // Free accounts see ads (for 48 hours)
            adsExpiryHours: isPaid ? 0 : 48,
            
            // Verification
            verifiedBadge: isPaid,
            verificationStatus: isPaid ? 'verified' : 'not_verified',
            
            // Reviews
            canViewReviews: isPaid,
            canLeaveReviews: isPaid,
            
            // Listing features
            listingPromotion: isPaid,
            listingVisibilityDuration: isPaid ? 30 : 0, // 30 days for paid, 0 for free
            
            // Account limits
            maxListings: isPaid ? -1 : 10, // -1 = unlimited
            maxBookings: isPaid ? -1 : 50,
            
            // Support
            prioritySupport: isPaid,
            supportResponseTime: isPaid ? '24h' : '72h'
        };
    }
    
    /**
     * Check if user has a specific feature
     * @param {String} userId - User ID
     * @param {String} feature - Feature name
     * @returns {Boolean}
     */
    async hasFeature(userId, feature) {
        const accountInfo = await this.getAccountInfo(userId);
        return accountInfo.features[feature] === true || accountInfo.features[feature] > 0;
    }
    
    /**
     * Check if user can perform an action
     * @param {String} userId - User ID
     * @param {String} action - Action name (e.g., 'viewReviews', 'createListing')
     * @returns {Boolean}
     */
    async canPerformAction(userId, action) {
        const accountInfo = await this.getAccountInfo(userId);
        
        const actionMap = {
            'viewReviews': 'canViewReviews',
            'leaveReviews': 'canLeaveReviews',
            'createListing': true, // All users can create listings
            'promoteListing': 'listingPromotion',
            'viewAds': 'adsEnabled',
            'hideAds': !accountInfo.features.adsEnabled
        };
        
        const feature = actionMap[action];
        if (feature === true) return true;
        if (feature === false) return false;
        if (typeof feature === 'string') {
            return accountInfo.features[feature] === true;
        }
        
        return false;
    }
    
    /**
     * Validate account type transition
     * @param {String} userId - User ID
     * @param {String} newAccountType - New account type
     * @returns {Object} { valid: Boolean, reason: String }
     */
    async validateAccountTypeTransition(userId, newAccountType) {
        const user = await User.findById(userId).select('accountType subscription');
        if (!user) {
            return { valid: false, reason: 'User not found' };
        }
        
        // Only allow valid transitions
        const validTransitions = {
            'free': ['paid'], // Free can become paid
            'paid': ['free']  // Paid can become free (on expiry)
        };
        
        if (!validTransitions[user.accountType] || !validTransitions[user.accountType].includes(newAccountType)) {
            return {
                valid: false,
                reason: `Invalid transition from ${user.accountType} to ${newAccountType}`
            };
        }
        
        // Free -> Paid: Must have active subscription
        if (user.accountType === 'free' && newAccountType === 'paid') {
            if (user.subscription?.status !== 'active') {
                return {
                    valid: false,
                    reason: 'Active subscription required to upgrade to paid account'
                };
            }
        }
        
        return { valid: true };
    }
}

module.exports = AccountService;

