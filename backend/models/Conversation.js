const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }],
    listing: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Listing'
    },
    booking: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking'
    },
    
    // Last message info
    lastMessage: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Message'
    },
    lastMessageAt: Date,
    lastMessageText: String,
    
    // Unread counts per user
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },
    
    // Status
    archived: {
        type: Map,
        of: Boolean,
        default: {}
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes - CRITICAL for query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, lastMessageAt: -1 }); // Compound index for user conversations
conversationSchema.index({ listing: 1 });
conversationSchema.index({ listing: 1, participants: 1 }); // Compound index for listing conversations
conversationSchema.index({ booking: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ 'archived': 1 }); // For archived filtering

module.exports = mongoose.model('Conversation', conversationSchema);

