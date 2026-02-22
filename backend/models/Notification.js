const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'User is required']
    },
    
    // Notification Info
    type: {
        type: String,
        enum: [
            'booking_request',
            'booking_confirmed',
            'booking_cancelled',
            'message',
            'review',
            'payment',
            'verification',
            'dispute',
            'system'
        ],
        required: [true, 'Notification type is required']
    },
    title: { type: String, required: [true, 'Title is required'] },
    message: { type: String, required: [true, 'Message is required'] },
    
    // Related Entities
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    relatedMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    
    // Status
    read: { type: Boolean, default: false },
    readAt: Date,
    
    // Action
    actionUrl: String,
    actionText: String,
    
    // Priority
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: false
});

// Indexes
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

