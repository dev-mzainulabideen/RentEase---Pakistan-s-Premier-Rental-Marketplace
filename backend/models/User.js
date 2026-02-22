const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Authentication
    email: { 
        type: String, 
        required: [true, 'Email is required'], 
        unique: true, 
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: { 
        type: String, 
        required: false,
        unique: true,
        sparse: true,
        trim: true
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't return password by default
    },
    
    // Personal Info
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    avatar: { 
        type: String,
        default: null
    },
    bio: { 
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    
    // Role & Account Type
    role: { 
        type: String, 
        enum: ['renter', 'owner', 'dual_role', 'admin', 'moderator'],
        default: 'renter',
        required: true
    },
    activeRole: { 
        type: String, 
        enum: ['renter', 'owner'],
        default: 'renter'
    },
    accountType: { 
        type: String, 
        enum: ['free', 'paid'],
        default: 'free',
        required: true
    },
    
    // Location
    location: {
        address: String,
        city: String,
        province: String,
        postalCode: String,
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    
    // Verification Status
    verified: { 
        type: Boolean, 
        default: false 
    },
    verificationStatus: {
        email: { type: Boolean, default: false },
        phone: { type: Boolean, default: false },
        id: { type: Boolean, default: false },
        biometric: { type: Boolean, default: false },
        face: { type: Boolean, default: false }
    },
    verificationDocuments: {
        idFront: String,
        idBack: String,
        biometricData: String,
        faceData: String,
        verifiedAt: Date
    },
    
    // Preferences
    categories: [{ 
        type: String,
        enum: ['property', 'vehicles', 'clothes', 'equipment', 'service_providers', 'animals', 'boat', 'air_transport']
    }],
    language: { 
        type: String, 
        enum: ['en', 'ur'], 
        default: 'en' 
    },
    
    // Subscription (for paid accounts)
    subscription: {
        status: { 
            type: String, 
            enum: ['active', 'expired', 'cancelled', 'none'], 
            default: 'none' 
        },
        plan: {
            type: String,
            enum: ['monthly_pkr', 'monthly_usd'],
            default: null
        },
        startDate: Date,
        endDate: Date,
        nextBillingDate: Date,
        paymentMethod: String,
        transactionId: String,
        autoRenew: { type: Boolean, default: true },
        lastPaymentDate: Date
    },
    
    // Account creation timestamp (for 48-hour ad rule)
    accountCreatedAt: {
        type: Date,
        default: Date.now
    },
    
    // Ad display settings
    adDisplaySettings: {
        adsEnabled: { type: Boolean, default: true },
        adsExpiryDate: Date, // 48 hours from account creation for free accounts
        lastAdDisplayTime: Date,
        adDisplayCount: { type: Number, default: 0 }
    },
    
    // Verification status (for account tier badges)
    verification: {
        status: {
            type: String,
            enum: ['not_verified', 'verified'],
            default: 'not_verified'
        },
        verifiedAt: Date,
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    
    // Statistics
    stats: {
        totalListings: { type: Number, default: 0 },
        activeListings: { type: Number, default: 0 },
        totalBookings: { type: Number, default: 0 },
        completedBookings: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 }
    },
    
    // Settings
    settings: {
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            bookingUpdates: { type: Boolean, default: true },
            messages: { type: Boolean, default: true },
            reviews: { type: Boolean, default: true }
        },
        privacy: {
            showEmail: { type: Boolean, default: false },
            showPhone: { type: Boolean, default: false },
            showLocation: { type: Boolean, default: true }
        }
    },
    
    // OAuth providers
    oauth: {
        googleId: String,
        facebookId: String,
        provider: String
    },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'suspended', 'banned', 'deleted'],
        default: 'active'
    },
    suspensionReason: String,
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLogin: Date,
    emailVerifiedAt: Date,
    phoneVerifiedAt: Date
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Pre-save hook: Set account defaults and hash password
userSchema.pre('save', async function(next) {
    // Set accountCreatedAt on new user creation
    if (this.isNew && !this.accountCreatedAt) {
        this.accountCreatedAt = new Date();
    }
    
    // SECURITY: For new users, always set to 'free' (security)
    // Account type changes for existing users are handled by subscription service
    // which directly updates the document, bypassing this hook's restrictions
    if (this.isNew) {
        this.accountType = 'free';
    }
    
    // Note: We don't validate accountType changes here because:
    // 1. Subscription service handles transitions securely
    // 2. Direct updates bypass pre-save hooks
    // 3. Database-level validation (enum) prevents invalid values
    
    // For free accounts, set ad expiry date if not set
    if (this.isNew && this.accountType === 'free') {
        if (!this.adDisplaySettings) {
            this.adDisplaySettings = {};
        }
        if (!this.adDisplaySettings.adsExpiryDate) {
            this.adDisplaySettings.adsExpiryDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
        }
        if (this.adDisplaySettings.adsEnabled === undefined) {
            this.adDisplaySettings.adsEnabled = true;
        }
    }
    
    // Set verification status based on account type
    if (this.isNew || this.isModified('accountType') || this.isModified('subscription.status')) {
        if (!this.verification) {
            this.verification = {};
        }
        if (this.accountType === 'paid' && this.subscription?.status === 'active') {
            this.verification.status = 'verified';
            this.verification.verifiedAt = new Date();
            this.verified = true;
        } else {
            this.verification.status = 'not_verified';
            if (this.isModified('accountType') && this.accountType === 'free') {
                this.verified = false;
            }
        }
    }
    
    // Only hash password if it's modified
    if (!this.isModified('password')) {
        return next();
    }
    
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Create indexes for faster queries
// NOTE: email already has { unique: true } on the field definition, so it automatically creates an index
// NOTE: phone already has { unique: true, sparse: true } on the field definition
// We intentionally do NOT create extra indexes for these fields to avoid duplicate index warnings
userSchema.index({ role: 1 });
userSchema.index({ accountType: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' }); // For location search
userSchema.index({ verified: 1 });
userSchema.index({ createdAt: -1 });

// Export the model
module.exports = mongoose.model('User', userSchema);

