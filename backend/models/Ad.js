const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    // Ad Info
    title: { type: String, required: [true, 'Title is required'] },
    content: String,
    image: String, // Optional - for image ads (required if adType is 'image')
    video: String, // Optional - for video ads (required if adType is 'video')
    videoThumbnail: String, // Thumbnail for video ads
    videoAutoplay: { type: Boolean, default: false }, // Autoplay for video ads
    videoMuted: { type: Boolean, default: true }, // Muted by default for autoplay
    videoLoop: { type: Boolean, default: true }, // Loop video ads
    adType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    },
    link: String,
    advertiser: String,
    
    // Targeting
    targetCategories: [{ 
        type: String,
        enum: ['property', 'vehicles', 'clothes', 'equipment', 'service_providers', 'animals', 'boat', 'air_transport', 'all']
    }],
    targetLocations: [{ 
        city: String,
        province: String
    }],
    targetAccountTypes: [{
        type: String,
        enum: ['free', 'paid', 'all']
    }],
    
    // Display Rules
    displayRules: {
        rotationInterval: { type: Number, default: 120 },
        maxDisplays: Number,
        maxDisplaysPerUser: { type: Number, default: 10 },
        priority: { type: Number, default: 0 },
        position: {
            type: String,
            enum: ['header', 'sidebar', 'footer', 'inline', 'popup'],
            default: 'inline'
        }
    },
    
    // Statistics
    stats: {
        displays: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
        uniqueViews: { type: Number, default: 0 }
    },
    
    // Status
    status: { 
        type: String, 
        enum: ['active', 'paused', 'expired', 'scheduled'],
        default: 'active'
    },
    
    // Timestamps
    startDate: Date,
    endDate: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes
adSchema.index({ status: 1, startDate: 1, endDate: 1 });
adSchema.index({ targetCategories: 1 });
adSchema.index({ 'displayRules.priority': -1 });

module.exports = mongoose.model('Ad', adSchema);

