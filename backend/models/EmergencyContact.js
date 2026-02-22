const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
    // User who created the emergency contact
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    
    // Related booking (if emergency is related to a booking)
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        default: null
    },
    
    // Related listing (if emergency is related to a listing)
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        default: null
    },
    
    // Emergency contact details
    contactName: {
        type: String,
        required: [true, 'Contact name is required'],
        trim: true
    },
    
    contactPhone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true
    },
    
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    
    relationship: {
        type: String,
        enum: ['family', 'friend', 'colleague', 'neighbor', 'other'],
        default: 'other'
    },
    
    // Emergency type
    emergencyType: {
        type: String,
        enum: ['medical', 'safety', 'property_damage', 'theft', 'accident', 'other'],
        required: [true, 'Emergency type is required'],
        default: 'other'
    },
    
    // Emergency description
    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    // Location where emergency occurred
    location: {
        address: String,
        city: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'contacted', 'resolved', 'escalated'],
        default: 'pending'
    },
    
    // Priority level
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    
    // Response details
    response: {
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date,
        responseNotes: String,
        actionTaken: String
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
emergencyContactSchema.index({ user: 1, createdAt: -1 });
emergencyContactSchema.index({ booking: 1 });
emergencyContactSchema.index({ status: 1, priority: 1 });
emergencyContactSchema.index({ createdAt: -1 });

// Pre-save middleware
emergencyContactSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);

