const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    plan: {
        type: String,
        enum: ['monthly_pkr', 'monthly_usd'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'pending'],
        default: 'pending'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        enum: ['PKR', 'USD'],
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    nextBillingDate: Date,
    autoRenew: {
        type: Boolean,
        default: true
    },
    paymentHistory: [{
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
        amount: Number,
        currency: String,
        paidAt: Date,
        status: String
    }],
    cancellationRequestedAt: Date,
    cancellationReason: String
}, {
    timestamps: true
});

// Indexes
// user index is redundant because the `user` field has `unique: true`; removed to prevent duplicate index warnings
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);

