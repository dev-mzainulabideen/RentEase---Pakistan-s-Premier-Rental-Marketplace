const AdDisplayService = require('../services/adDisplayService');
const User = require('../models/User');

// Get ads for page
exports.getAdsForPage = async (req, res) => {
    try {
        const { page } = req.query || {};
        const userId = req.user?._id || null;
        
        const adDisplayService = new AdDisplayService();
        
        if (!userId) {
            // Guest users: show ads
            const Ad = require('../models/Ad');
            const now = new Date();
            const ads = await Ad.find({ 
                status: 'active',
                $or: [
                    { targetAccountTypes: { $in: ['all', 'free'] } },
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
            .limit(2);
            
            return res.json({
                status: 'success',
                data: { 
                    ads: ads.map(ad => ({
                        _id: ad._id,
                        title: ad.title,
                        image: ad.image,
                        video: ad.video,
                        videoThumbnail: ad.videoThumbnail,
                        videoAutoplay: ad.videoAutoplay,
                        videoMuted: ad.videoMuted,
                        videoLoop: ad.videoLoop,
                        adType: ad.adType || 'image',
                        link: ad.link,
                        content: ad.content
                    })),
                    shouldDisplay: ads.length > 0,
                    accountType: 'guest'
                }
            });
        }
        
        const user = await User.findById(userId).select('accountType subscription adDisplaySettings');
        const shouldDisplay = await adDisplayService.shouldDisplayAds(userId);
        
        let ads = [];
        if (shouldDisplay) {
            ads = await adDisplayService.getAdsForUser(userId, page || 'home');
        }
        
        // For free users, always try to show ads even if shouldDisplay is false initially
        // (this handles edge cases where timing might prevent ad display)
        if (ads.length === 0 && (user?.accountType === 'free' || !user?.accountType)) {
            // Try fetching ads without the 2-minute check
            const Ad = require('../models/Ad');
            const now = new Date();
            const fallbackAds = await Ad.find({
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
            .limit(2);
            
            if (fallbackAds.length > 0) {
                ads = fallbackAds;
            }
        }
        
        res.json({
            status: 'success',
            data: {
                ads: ads.map(ad => ({
                    _id: ad._id,
                    title: ad.title,
                    image: ad.image,
                    video: ad.video,
                    videoThumbnail: ad.videoThumbnail,
                    videoAutoplay: ad.videoAutoplay,
                    videoMuted: ad.videoMuted,
                    videoLoop: ad.videoLoop,
                    adType: ad.adType || 'image',
                    link: ad.link,
                    content: ad.content
                })),
                shouldDisplay: ads.length > 0 || shouldDisplay,
                accountType: user?.accountType || 'free'
            }
        });
    } catch (error) {
        console.error('Error getting ads:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get ads'
        });
    }
};

// Check ad display status
exports.checkAdDisplayStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const adDisplayService = new AdDisplayService();
        
        const shouldDisplay = await adDisplayService.shouldDisplayAds(userId);
        const user = await User.findById(userId).select('accountType adDisplaySettings');
        
        res.json({
            status: 'success',
            data: {
                shouldDisplay,
                accountType: user?.accountType || 'free',
                adsEnabled: user?.adDisplaySettings?.adsEnabled !== false
            }
        });
    } catch (error) {
        console.error('Error checking ad display status:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to check ad display status'
        });
    }
};

