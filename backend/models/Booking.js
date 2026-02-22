const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // Users
    renter: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Renter is required']
    },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Owner is required']
    },
    listing: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Listing', 
        required: [true, 'Listing is required']
    },
    
    // Booking Details
    bookingNumber: { 
        type: String, 
        unique: true,
        required: true
    },
    checkIn: { 
        type: Date, 
        required: [true, 'Check-in date is required']
    },
    checkOut: { 
        type: Date, 
        required: [true, 'Check-out date is required']
    },
    duration: { 
        type: Number, 
        required: [true, 'Duration is required']
    },
    durationUnit: {
        type: String,
        enum: ['hours', 'days', 'weeks', 'months'],
        required: true
    },
    
    // Guests/Quantity
    guests: { 
        type: Number, 
        default: 1,
        min: [1, 'At least 1 guest required']
    },
    quantity: { 
        type: Number, 
        default: 1,
        min: [1, 'At least 1 quantity required']
    },
    
    // Pricing Breakdown
    pricing: {
        model: { type: String, required: true },
        rate: { type: Number, required: true },
        subtotal: { type: Number, required: true },
        serviceFee: { type: Number, default: 0 },
        deposit: { type: Number, default: 0 },
        total: { type: Number, required: true },
        currency: { type: String, default: 'PKR' },
        breakdown: [{
            date: Date,
            rate: Number,
            amount: Number
        }]
    },
    
    // Status
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'expired'],
        default: 'pending'
    },
    bookingType: {
        type: String,
        enum: ['instant', 'request'],
        default: 'request'
    },
    
    // Payment
    payment: {
        status: { 
            type: String, 
            enum: ['pending', 'paid', 'partial', 'refunded', 'failed'],
            default: 'pending'
        },
        method: {
            type: String,
            enum: ['jazzcash', 'easypaisa', 'card', 'bank_transfer']
        },
        transactionId: String,
        paidAt: Date,
        paidAmount: Number,
        refundAmount: { type: Number, default: 0 },
        refundedAt: Date
    },
    
    // Special Requests
    specialRequests: String,
    contactInfo: {
        phone: String,
        email: String
    },
    
    // Cancellation
    cancellation: {
        cancelledBy: { 
            type: String, 
            enum: ['renter', 'owner', 'system']
        },
        cancelledAt: Date,
        reason: String,
        refundAmount: Number,
        refundStatus: {
            type: String,
            enum: ['pending', 'processed', 'failed']
        }
    },
    
    // Reviews
    renterReview: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Review'
    },
    ownerReview: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Review'
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    confirmedAt: Date,
    completedAt: Date
}, {
    timestamps: true
});

// Generate booking number before saving
bookingSchema.pre('save', async function(next) {
    if (!this.bookingNumber) {
        const count = await mongoose.model('Booking').countDocuments();
        this.bookingNumber = `MR${Date.now()}${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Indexes
bookingSchema.index({ renter: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ listing: 1 });
// NOTE: bookingNumber already has { unique: true } on the field definition, so it automatically creates an index
// We don't need to create a duplicate index here
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);

