const User = require('../models/User');
const Ad = require('../models/Ad');
// AdDisplayLog is optional - handle if model exists
let AdDisplayLog;
try {
    AdDisplayLog = require('../models/AdDisplayLog');
} catch (e) {
    // Model doesn't exist, that's okay - we'll skip logging
    AdDisplayLog = null;
}

class AdDisplayService {
    // Check if ads should be displayed for user
    async shouldDisplayAds(userId) {
        if (!userId) {
            // Guest users: show ads
            return true;
        }
        
        const user = await User.findById(userId);
        if (!user) return false;
        
        // Paid accounts: no ads
        if (user.accountType === 'paid' && user.subscription.status === 'active') {
            const now = new Date();
            if (user.subscription.endDate && user.subscription.endDate > now) {
                return false;
            }
        }
        
        // Free accounts: always show ads (every 2 minutes)
        if (user.accountType === 'free') {
            // Check if ads are explicitly disabled
            if (user.adDisplaySettings && user.adDisplaySettings.adsEnabled === false) {
                return false;
            }
            
            // Check if ads expiry date has passed
            if (user.adDisplaySettings && user.adDisplaySettings.adsExpiryDate) {
                const now = new Date();
                if (new Date(user.adDisplaySettings.adsExpiryDate) < now) {
                    return false;
                }
            }
            
            // Free accounts should see ads every 2 minutes
            return true;
        }
        
        return false;
    }
    
    // Get ads to display (every 2 minutes rule)
    async getAdsForUser(userId, page = 'home') {
        const shouldDisplay = await this.shouldDisplayAds(userId);
        
        if (!shouldDisplay) {
            return [];
        }
        
        const user = userId ? await User.findById(userId) : null;
        
        if (user) {
            // Check last ad display time (2 minutes rule)
            const lastDisplayTime = user.adDisplaySettings?.lastAdDisplayTime;
            const now = new Date();
            
            if (lastDisplayTime) {
                const minutesSinceLastAd = (now - new Date(lastDisplayTime)) / (1000 * 60);
                if (minutesSinceLastAd < 2) {
                    return []; // Too soon, don't show ads
                }
            }
        }
        
        // Get random ads - prioritize ads targeting free users
        const now = new Date();
        let ads = await Ad.find({
            status: 'active',
            $or: [
                { targetAccountTypes: { $in: ['free', 'all'] } },
                { targetAccountTypes: { $exists: false } },
                { targetAccountTypes: { $size: 0 } }
            ],
            $and: [
                {
                    $or: [
                        { startDate: { $lte: now } },
                        { startDate: { $exists: false } }
                    ]
                },
                {
                    $or: [
                        { endDate: { $gte: now } },
                        { endDate: { $exists: false } }
                    ]
                }
            ]
        })
        .sort({ 'displayRules.priority': -1, createdAt: -1 })
        .limit(10);
        
        // If no ads found, try to get any active ads
        if (ads.length === 0) {
            ads = await Ad.find({
                status: 'active',
                $and: [
                    {
                        $or: [
                            { startDate: { $lte: now } },
                            { startDate: { $exists: false } }
                        ]
                    },
                    {
                        $or: [
                            { endDate: { $gte: now } },
                            { endDate: { $exists: false } }
                        ]
                    }
                ]
            })
            .sort({ 'displayRules.priority': -1, createdAt: -1 })
            .limit(10);
        }
        
        // Shuffle and select random ads
        const shuffled = ads.sort(() => 0.5 - Math.random());
        const selectedAds = shuffled.slice(0, Math.min(2, shuffled.length)); // Max 2 ads at once
        
        // Log ad display
        if (userId && selectedAds.length > 0) {
            try {
            for (const ad of selectedAds) {
                    // Update ad stats
                    await Ad.findByIdAndUpdate(ad._id, {
                        $inc: { 
                            'stats.displays': 1,
                            'stats.impressions': 1
                        }
                    });
                    
                    // Log display if AdDisplayLog model exists
                    try {
                        if (AdDisplayLog) {
                await AdDisplayLog.create({
                    user: userId,
                    adId: ad._id,
                    page,
                    adType: this.getAdTypeForPage(page),
                    accountType: user.accountType
                });
                        }
                    } catch (logError) {
                        // Ignore logging errors, continue with ad display
                        console.warn('Could not log ad display:', logError.message);
                    }
            }
            
            // Update user's last ad display time
            await User.findByIdAndUpdate(userId, {
                    $set: {
                        'adDisplaySettings.lastAdDisplayTime': new Date()
                    },
                    $inc: {
                        'adDisplaySettings.adDisplayCount': selectedAds.length
                    }
                }, { upsert: true });
            } catch (error) {
                console.error('Error logging ad display:', error);
                // Continue even if logging fails
            }
        }
        
        return selectedAds;
    }
    
    // Get ad type based on page
    getAdTypeForPage(page) {
        const pageAdMap = {
            'home': 'banner',
            'listing-detail': 'sidebar',
            'search': 'inline',
            'last-page': 'popup'
        };
        return pageAdMap[page] || 'inline';
    }
    
    // Check if should show ads on last page
    async shouldShowAdsOnLastPage(userId) {
        return await this.shouldDisplayAds(userId);
    }
}

module.exports = AdDisplayService;

