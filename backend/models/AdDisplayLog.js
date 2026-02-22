const mongoose = require('mongoose');

const adDisplayLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ad'
    },
    page: {
        type: String,
        required: true // e.g., 'home', 'listing-detail', 'search', 'last-page'
    },
    displayedAt: {
        type: Date,
        default: Date.now
    },
    adType: {
        type: String,
        enum: ['banner', 'sidebar', 'inline', 'popup', 'last-page']
    },
    accountType: {
        type: String,
        enum: ['free', 'paid']
    }
}, {
    timestamps: true
});

// Indexes
adDisplayLogSchema.index({ user: 1, displayedAt: -1 });
adDisplayLogSchema.index({ adId: 1 });
adDisplayLogSchema.index({ page: 1 });

module.exports = mongoose.model('AdDisplayLog', adDisplayLogSchema);

