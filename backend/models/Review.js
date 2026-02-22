const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // Users
    reviewer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Reviewer is required']
    },
    reviewee: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Reviewee is required']
    },
    listing: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Listing',
        required: [true, 'Listing is required']
    },
    booking: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking', 
        required: [true, 'Booking is required']
    },
    
    // Review Type
    reviewType: {
        type: String,
        enum: ['renter_to_owner', 'owner_to_renter'],
        required: true
    },
    
    // Ratings
    rating: { 
        type: Number, 
        required: [true, 'Rating is required'], 
        min: [1, 'Rating must be at least 1'], 
        max: [5, 'Rating cannot exceed 5']
    },
    categoryRatings: {
        cleanliness: { type: Number, min: 1, max: 5 },
        communication: { type: Number, min: 1, max: 5 },
        value: { type: Number, min: 1, max: 5 },
        accuracy: { type: Number, min: 1, max: 5 },
        checkIn: { type: Number, min: 1, max: 5 },
        location: { type: Number, min: 1, max: 5 }
    },
    
    // Review Content
    comment: { 
        type: String,
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    pros: [{ type: String }],
    cons: [{ type: String }],
    
    // Category
    category: { 
        type: String, 
        required: [true, 'Category is required']
    },
    
    // Status
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'hidden'],
        default: 'pending'
    },
    moderationNotes: String,
    
    // Helpful votes
    helpful: { type: Number, default: 0 },
    helpfulUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Response
    response: {
        text: String,
        respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        respondedAt: Date
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes - CRITICAL for query performance
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ listing: 1 });
reviewSchema.index({ listing: 1, status: 1 }); // Compound index for listing reviews
reviewSchema.index({ reviewee: 1, reviewType: 1, status: 1 }); // Compound index for owner stats
reviewSchema.index({ booking: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ status: 1 }); // For status filtering
reviewSchema.index({ rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);

