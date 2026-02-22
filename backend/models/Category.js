const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Category name is required'],
        unique: true
    },
    slug: { 
        type: String, 
        unique: true,
        lowercase: true
    },
    icon: String,
    image: String,
    description: String,
    
    // Subcategories
    subCategories: [{
        name: { type: String, required: true },
        slug: String,
        icon: String,
        description: String
    }],
    
    // Dynamic Fields Schema
    fieldsSchema: {
        type: Map,
        of: {
            type: { 
                type: String,
                enum: ['text', 'number', 'boolean', 'select', 'multiselect', 'date']
            },
            required: Boolean,
            options: [String],
            label: String,
            placeholder: String
        }
    },
    
    // Safety Guidelines
    safetyGuidelines: [String],
    
    // Status
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    
    // Statistics
    stats: {
        totalListings: { type: Number, default: 0 },
        activeListings: { type: Number, default: 0 }
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Generate slug before saving
categorySchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    next();
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ active: 1, order: 1 });

module.exports = mongoose.model('Category', categorySchema);

