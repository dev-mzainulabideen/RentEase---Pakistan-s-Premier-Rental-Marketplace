const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
    // Users
    reporter: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Reporter is required']
    },
    reportedUser: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    listing: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Listing'
    },
    booking: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking'
    },
    
    // Dispute Info
    type: { 
        type: String, 
        enum: ['payment', 'safety', 'quality', 'behavior', 'fraud', 'other'],
        required: [true, 'Dispute type is required']
    },
    title: { type: String, required: [true, 'Title is required'] },
    description: { 
        type: String, 
        required: [true, 'Description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // Evidence
    evidence: [{ 
        url: String,
        fileType: String,
        fileName: String,
        description: String
    }],
    
    // Status
    status: { 
        type: String, 
        enum: ['open', 'in_review', 'resolved', 'closed', 'rejected'],
        default: 'open'
    },
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    
    // Resolution
    resolution: {
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        resolvedAt: Date,
        resolutionNotes: String,
        action: {
            type: String,
            enum: ['refund', 'warning', 'suspension', 'ban', 'no_action']
        },
        refundAmount: Number
    },
    
    // Updates/Notes
    updates: [{
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    resolvedAt: Date
}, {
    timestamps: true
});

// Indexes
disputeSchema.index({ reporter: 1 });
disputeSchema.index({ reportedUser: 1 });
disputeSchema.index({ status: 1, priority: 1 });
disputeSchema.index({ assignedTo: 1 });
disputeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Dispute', disputeSchema);

