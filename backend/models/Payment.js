const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // Users
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'User is required']
    },
    booking: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking'
    },
    
    // Payment Info
    paymentId: { 
        type: String, 
        unique: true,
        required: true
    },
    type: {
        type: String,
        enum: ['booking', 'subscription', 'deposit', 'refund'],
        required: [true, 'Payment type is required']
    },
    
    // Amount
    amount: { 
        type: Number, 
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    currency: { 
        type: String, 
        enum: ['PKR', 'USD'],
        default: 'PKR'
    },
    
    // Payment Method
    method: {
        type: String,
        enum: ['jazzcash', 'easypaisa', 'card', 'bank_transfer'],
        required: [true, 'Payment method is required']
    },
    paymentDetails: {
        accountNumber: String,
        transactionId: String,
        referenceNumber: String,
        cardLast4: String
    },
    
    // Status
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    
    // Gateway Response
    gatewayResponse: {
        success: Boolean,
        message: String,
        transactionId: String,
        rawResponse: mongoose.Schema.Types.Mixed
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    completedAt: Date,
    failedAt: Date
}, {
    timestamps: true
});

// Generate payment ID before saving
paymentSchema.pre('save', async function(next) {
    if (!this.paymentId) {
        try {
            const PaymentModel = this.constructor;
            const count = await PaymentModel.countDocuments();
            this.paymentId = `PAY${Date.now()}${String(count + 1).padStart(6, '0')}`;
        } catch (error) {
            // Fallback if count fails
            this.paymentId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        }
    }
    next();
});

// Indexes
paymentSchema.index({ user: 1 });
paymentSchema.index({ booking: 1 });
// paymentId has `unique: true` on the field; explicit index removed to avoid duplicate index warnings
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

