const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'User is required']
    },
    
    // Verification Type
    type: {
        type: String,
        enum: ['email', 'phone', 'id', 'biometric', 'face'],
        required: [true, 'Verification type is required']
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'expired'],
        default: 'pending'
    },
    
    // Verification Data
    data: {
        code: String,
        token: String,
        documentUrl: String,
        documentType: String,
        biometricData: String,
        faceData: String
    },
    
    // Verification Result
    result: {
        verified: Boolean,
        verifiedAt: Date,
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        confidence: Number,
        notes: String
    },
    
    // Expiry
    expiresAt: Date,
    
    // Attempts
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes
verificationSchema.index({ user: 1, type: 1 });
verificationSchema.index({ status: 1 });
verificationSchema.index({ expiresAt: 1 });
verificationSchema.index({ 'data.code': 1 });
verificationSchema.index({ 'data.token': 1 });

module.exports = mongoose.model('Verification', verificationSchema);

