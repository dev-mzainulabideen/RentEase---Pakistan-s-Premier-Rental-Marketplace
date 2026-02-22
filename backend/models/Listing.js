const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    // Basic Info
    title: { 
        type: String, 
        required: [true, 'Title is required'],
        trim: true,
        minlength: [10, 'Title must be at least 10 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: { 
        type: String, 
        required: [true, 'Description is required'],
        minlength: [50, 'Description must be at least 50 characters'],
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    slug: { 
        type: String, 
        unique: true,
        lowercase: true
    },
    
    // Category
    category: { 
        type: String, 
        required: [true, 'Category is required'],
        enum: ['property', 'vehicles', 'clothes', 'equipment', 'service_providers', 'animals', 'boat', 'air_transport']
    },
    subCategory: { 
        type: String, 
        required: [true, 'Subcategory is required']
    },
    
    // Owner
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Owner is required']
    },
    
    // Location
    location: {
        address: { type: String, required: [true, 'Address is required'] },
        city: { type: String, required: [true, 'City is required'] },
        province: { type: String, required: [true, 'Province is required'] },
        postalCode: String,
        coordinates: {
            lat: { type: Number, required: [true, 'Latitude is required'] },
            lng: { type: Number, required: [true, 'Longitude is required'] }
        },
        area: String,
        landmark: String
    },
    
    // Pricing
    pricing: {
        model: { 
            type: String, 
            enum: ['hourly', 'daily', 'weekly', 'monthly'],
            required: [true, 'Pricing model is required']
        },
        amount: { 
            type: Number, 
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative']
        },
        currency: { 
            type: String, 
            enum: ['PKR', 'USD'],
            default: 'PKR'
        },
        deposit: { 
            type: Number, 
            default: 0,
            min: [0, 'Deposit cannot be negative']
        },
        negotiable: { type: Boolean, default: false }
    },
    
    // Availability
    availability: {
        calendar: [{
            date: { type: Date, required: true },
            available: { type: Boolean, default: true },
            price: Number,
            booked: { type: Boolean, default: false }
        }],
        instantBooking: { type: Boolean, default: false },
        advanceNotice: { type: Number, default: 24 },
        minDuration: { type: Number, default: 1 },
        maxDuration: { type: Number, default: 30 },
        unavailableDates: [Date]
    },
    
    // Media
    images: [{ 
        url: { type: String, required: true },
        thumbnail: String,
        caption: String,
        order: { type: Number, default: 0 }
    }],
    videos: [{ 
        url: { type: String, required: true },
        thumbnail: String,
        duration: Number
    }],
    featuredImage: String,
    
    // Category-specific Dynamic Fields
    categoryFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    
    // Features & Amenities
    features: [{ type: String }],
    amenities: [{ type: String }],
    tags: [{ type: String }],
    
    // Rules & Policies
    rules: [{ type: String }],
    cancellationPolicy: { 
        type: String, 
        enum: ['flexible', 'moderate', 'strict'],
        default: 'moderate'
    },
    houseRules: [{ type: String }],
    
    // Status
    status: { 
        type: String, 
        enum: ['draft', 'pending', 'active', 'inactive', 'suspended', 'deleted'],
        default: 'draft'
    },
    verified: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    
    // Ad System
    adStatus: {
        active: { type: Boolean, default: false },
        expiresAt: Date,
        adType: { 
            type: String, 
            enum: ['free_48h', 'paid_30d', null],
            default: null
        },
        displayCount: { type: Number, default: 0 },
        lastDisplayed: Date
    },
    
    // Statistics
    stats: {
        views: { type: Number, default: 0 },
        uniqueViews: { type: Number, default: 0 },
        bookings: { type: Number, default: 0 },
        completedBookings: { type: Number, default: 0 },
        reviews: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        wishlistCount: { type: Number, default: 0 }
    },
    
    // SEO
    meta: {
        keywords: [{ type: String }],
        description: String
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    publishedAt: Date,
    lastBookedAt: Date
}, {
    timestamps: true
});

// Generate slug before saving
listingSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-' + Date.now();
    }
    next();
});

// Indexes for performance - CRITICAL for query speed
listingSchema.index({ owner: 1 });
listingSchema.index({ category: 1, subCategory: 1 });
listingSchema.index({ status: 1, verified: 1 });
listingSchema.index({ status: 1, featured: 1 }); // Compound index for featured listings search
listingSchema.index({ status: 1, createdAt: -1 }); // Compound index for status + date sorting
listingSchema.index({ status: 1, category: 1 }); // Compound index for status + category filtering
listingSchema.index({ 'location.coordinates': '2dsphere' });
listingSchema.index({ 'location.city': 1 }); // Index for city filtering
listingSchema.index({ 'pricing.amount': 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ 'stats.averageRating': -1 });
listingSchema.index({ 'stats.views': -1 });
// NOTE: slug already has { unique: true } on the field definition, so it automatically creates an index
// We don't need to create a duplicate index here
listingSchema.index({ 'adStatus.active': 1, 'adStatus.expiresAt': 1 });
listingSchema.index({ verified: 1, status: 1, createdAt: -1 }); // For verified-first sorting

module.exports = mongoose.model('Listing', listingSchema);

