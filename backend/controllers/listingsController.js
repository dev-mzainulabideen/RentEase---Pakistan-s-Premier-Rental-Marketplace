const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { validateCategorySubcategory } = require('../utils/categoryValidator');

// Helper to build listing response - optimized to exclude heavy data
function buildListingResponse(listing) {
    if (!listing) return null;
    
    // Optimize images - only return URLs, not full data
    let optimizedImages = [];
    if (listing.images && Array.isArray(listing.images)) {
        optimizedImages = listing.images.map(img => {
            if (typeof img === 'object' && img.url) {
                return { url: img.url, thumbnail: img.thumbnail || img.url, caption: img.caption || '', order: img.order || 0 };
            }
            return typeof img === 'string' ? { url: img, order: 0 } : img;
        });
    }
    
    return {
        id: listing._id,
        title: listing.title,
        description: listing.description,
        slug: listing.slug,
        category: listing.category,
        subCategory: listing.subCategory,
        owner: listing.owner,
        location: listing.location,
        pricing: listing.pricing,
        availability: listing.availability,
        images: optimizedImages, // Optimized images (URLs only)
        featuredImage: listing.featuredImage,
        features: listing.features,
        amenities: listing.amenities,
        rules: listing.rules,
        cancellationPolicy: listing.cancellationPolicy,
        houseRules: listing.houseRules,
        status: listing.status,
        verified: listing.verified,
        featured: listing.featured,
        stats: listing.stats,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        publishedAt: listing.publishedAt,
        // Exclude heavy fields: videos, categoryFields, meta
    };
}

exports.list = async (req, res) => {
    try {
        const {
            query,
            q,
            category,
            priceMin,
            priceMax,
            city,
            ratingMin,
            instant,
            verified,
            sort,
            page = 1,
            limit = 20,
        } = req.query;

        const text = (query || q || '').trim();
        // Default: show only active listings in public search
        // Allow overriding via ?status=all (excludes only deleted/suspended/inactive) or ?status=pending for moderation flows
        const filter = {};
        const statusParam = (req.query.status || '').toLowerCase();
        if (statusParam === 'all') {
            filter.status = { $nin: ['deleted', 'suspended', 'inactive'] };
        } else if (statusParam === 'pending') {
            filter.status = { $in: ['active', 'pending'] };
        } else {
            filter.status = 'active';
        }

        // Text search in title / description / city / address
        if (text) {
            const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { title: regex },
                { description: regex },
                { 'location.city': regex },
                { 'location.address': regex },
            ];
        }

        // Category filter (normalize hyphenated values to enum style)
        if (category) {
            const normalizedCategory = String(category).toLowerCase().replace(/-/g, '_');
            filter.category = normalizedCategory;
        }

        // Subcategory filter - ensure it belongs to the category if both are provided
        const subCategory = req.query.subCategory || req.query.subcategory;
        if (subCategory) {
            const normalizedSubCategory = String(subCategory).toLowerCase().replace(/-/g, '_');
            // If category is also specified, validate the relationship
            if (filter.category) {
                const validation = validateCategorySubcategory(filter.category, normalizedSubCategory);
                if (!validation.valid) {
                    return res.status(400).json({
                        status: 'error',
                        message: validation.error,
                    });
                }
            }
            filter.subCategory = { $regex: new RegExp(`^${normalizedSubCategory.replace(/_/g, '[-_]')}$`, 'i') };
        }

        // City filter
        if (city) {
            const cityRegex = new RegExp(String(city).trim(), 'i');
            filter['location.city'] = cityRegex;
        }

        // Price range
        if (priceMin || priceMax) {
            filter['pricing.amount'] = {};
            if (priceMin) {
                filter['pricing.amount'].$gte = Number(priceMin);
            }
            if (priceMax) {
                filter['pricing.amount'].$lte = Number(priceMax);
            }
        }

        // Rating minimum
        if (ratingMin) {
            filter['stats.averageRating'] = { $gte: Number(ratingMin) };
        }

        // Instant booking only
        if (instant === 'true') {
            filter['availability.instantBooking'] = true;
        }

        // Verified listings only
        if (verified === 'true') {
            filter.verified = true;
        }

        // Featured listings only
        if (req.query.featured === 'true') {
            filter.featured = true;
        }

        // Pagination
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        // Use aggregation to prioritize verified users in search results
        const aggregationPipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'ownerData'
                }
            },
            {
                $unwind: {
                    path: '$ownerData',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    // Create verification priority: 1 for verified, 0 for not verified
                    verificationPriority: {
                        $cond: {
                            if: {
                                $and: [
                                    { $ne: ['$ownerData', null] },
                                    {
                                        $or: [
                                            { $eq: ['$ownerData.verification.status', 'verified'] },
                                            { $eq: ['$ownerData.accountType', 'paid'] }
                                        ]
                                    }
                                ]
                            },
                            then: 1,
                            else: 0
                        }
                    },
                    // Preserve owner data for response (or keep original owner ID if lookup failed)
                    owner: {
                        $cond: {
                            if: { $ne: ['$ownerData', null] },
                            then: {
                                _id: '$ownerData._id',
                                name: '$ownerData.name',
                                email: '$ownerData.email',
                                avatar: '$ownerData.avatar',
                                accountType: '$ownerData.accountType',
                                verified: '$ownerData.verified',
                                verificationStatus: '$ownerData.verificationStatus',
                                verification: '$ownerData.verification'
                            },
                            else: '$owner' // Keep original owner ObjectId if lookup failed
                        }
                    }
                }
            },
            {
                $project: {
                    ownerData: 0 // Remove temporary ownerData field
                }
            }
        ];

        // Add sorting based on sort parameter
        let sortStage = {};
        switch (sort) {
            case 'price-low':
                sortStage = { verificationPriority: -1, 'pricing.amount': 1 };
                break;
            case 'price-high':
                sortStage = { verificationPriority: -1, 'pricing.amount': -1 };
                break;
            case 'rating':
                sortStage = { verificationPriority: -1, 'stats.averageRating': -1 };
                break;
            case 'newest':
                sortStage = { verificationPriority: -1, createdAt: -1 };
                break;
            case 'verified-first':
                // Explicit verified-first sort
                sortStage = { verificationPriority: -1, createdAt: -1 };
                break;
            case 'relevance':
            default:
                // Default: verified first, then by creation date (newest first)
                sortStage = { verificationPriority: -1, createdAt: -1 };
                break;
        }

        aggregationPipeline.push({ $sort: sortStage });
        aggregationPipeline.push({ $skip: skip });
        aggregationPipeline.push({ $limit: limitNum });

        // Add projection to limit fields and optimize images
        aggregationPipeline.push({
            $project: {
                // Only include essential fields
                title: 1,
                description: 1,
                category: 1,
                subCategory: 1,
                owner: 1,
                location: 1,
                pricing: 1,
                availability: 1,
                // Optimize images - only first image URL for list view
                images: { $slice: ['$images', 1] }, // Only first image
                featuredImage: 1,
                status: 1,
                verified: 1,
                featured: 1,
                stats: 1,
                createdAt: 1,
                updatedAt: 1,
                publishedAt: 1,
                // Exclude heavy fields
                videos: 0,
                categoryFields: 0,
                meta: 0,
                __v: 0
            }
        });

        const [listings, totalResult] = await Promise.all([
            Listing.aggregate(aggregationPipeline),
            Listing.countDocuments(filter),
        ]);

        // Optimize images in response - only return URLs
        const listingsWithIds = listings.map(listing => {
            const listingObj = { ...listing };
            
            // Ensure _id is properly set
            if (!listingObj._id && listing._id) {
                listingObj._id = listing._id;
            }
            
            // Optimize images - extract only URLs
            if (listingObj.images && Array.isArray(listingObj.images)) {
                listingObj.images = listingObj.images.map(img => {
                    if (typeof img === 'object' && img.url) {
                        return { url: img.url }; // Only URL, not full data
                    }
                    return typeof img === 'string' ? { url: img } : img;
                });
            }
            
            // Ensure owner is properly set
            if (!listingObj.owner || (typeof listingObj.owner === 'object' && !listingObj.owner._id)) {
                if (listing.owner) {
                    listingObj.owner = listing.owner;
                }
            }
            
            return listingObj;
        });

        // Log for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Search query: ${text || 'none'}, Category: ${category || 'all'}, Status: ${filter.status}, Results: ${listingsWithIds.length}/${totalResult}`);
        }

        res.json({
            status: 'success',
            results: listingsWithIds.length,
            total: totalResult,
            page: pageNum,
            pages: Math.ceil(totalResult / limitNum),
            listings: listingsWithIds,
        });
    } catch (err) {
        console.error('List listings error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load listings' });
    }
};

exports.create = async (req, res) => {
    try {
        // Verify user has permission to create listings (owner, dual_role, or admin)
        const allowedRoles = ['owner', 'dual_role', 'admin'];
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Only property owners can create listings. Please register as an owner.',
            });
        }

        const {
            title,
            description,
            category,
            subCategory,
            pricingModel,
            pricingAmount,
            currency,
            deposit,
            negotiable,
            address,
            city,
            province,
            postalCode,
            area,
            landmark,
            lat,
            lng,
            // Availability
            instantBooking,
            advanceNotice,
            minDuration,
            maxDuration,
            availableFrom,
            availableTo,
            // Additional
            features,
            amenities,
            rules,
            houseRules,
            cancellationPolicy,
            images,
            // Status
            status: requestedStatus,
        } = req.body;

        // Validate required fields
        const errors = [];
        if (!title || title.trim().length < 10) {
            errors.push('Title is required and must be at least 10 characters');
        }
        if (!description || description.trim().length < 50) {
            errors.push('Description is required and must be at least 50 characters');
        }
        if (!category) {
            errors.push('Category is required');
        }
        if (!subCategory) {
            errors.push('Subcategory is required');
        }
        if (!pricingModel) {
            errors.push('Pricing model is required');
        }
        if (!pricingAmount || pricingAmount <= 0) {
            errors.push('Price must be a positive number');
        }
        if (!address) {
            errors.push('Address is required');
        }
        if (!city) {
            errors.push('City is required');
        }
        if (!province) {
            errors.push('Province is required');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors,
            });
        }

        // Normalize category enum values
        const normalizedCategory = category.toLowerCase().replace(/-/g, '_');
        const normalizedSubCategory = subCategory.toLowerCase().replace(/-/g, '_');

        // Validate category-subcategory relationship
        const validation = validateCategorySubcategory(normalizedCategory, normalizedSubCategory);
        if (!validation.valid) {
            return res.status(400).json({
                status: 'error',
                message: validation.error,
                errors: [validation.error],
            });
        }

        // Default coordinates for major Pakistani cities if not provided
        const defaultCoords = {
            'lahore': { lat: 31.5204, lng: 74.3587 },
            'karachi': { lat: 24.8607, lng: 67.0011 },
            'islamabad': { lat: 33.6844, lng: 73.0479 },
            'rawalpindi': { lat: 33.5651, lng: 73.0169 },
            'faisalabad': { lat: 31.4504, lng: 73.1350 },
            'multan': { lat: 30.1575, lng: 71.5249 },
            'peshawar': { lat: 34.0151, lng: 71.5249 },
        };
        const cityLower = city.toLowerCase();
        const coords = defaultCoords[cityLower] || { lat: 31.5204, lng: 74.3587 };
        const latitude = lat !== undefined && lat !== null ? parseFloat(lat) : coords.lat;
        const longitude = lng !== undefined && lng !== null ? parseFloat(lng) : coords.lng;

        // Process images array
        const processedImages = [];
        if (Array.isArray(images) && images.length > 0) {
            images.forEach((img, index) => {
                if (typeof img === 'string') {
                    processedImages.push({ url: img, order: index });
                } else if (img && img.url) {
                    processedImages.push({ url: img.url, caption: img.caption || '', order: index });
                }
            });
        }

        // Determine status: default to 'active' for immediate visibility
        const listingStatus = requestedStatus === 'draft' ? 'draft' : 'active';

        const listing = await Listing.create({
            owner: req.user._id,
            title: title.trim(),
            description: description.trim(),
            category: normalizedCategory,
            subCategory: normalizedSubCategory,
            location: {
                address: address.trim(),
                city: city.trim(),
                province: province.trim(),
                postalCode: postalCode || '',
                area: area || '',
                landmark: landmark || '',
                coordinates: { lat: latitude, lng: longitude },
            },
            pricing: {
                model: pricingModel,
                amount: parseFloat(pricingAmount),
                currency: currency || 'PKR',
                deposit: deposit ? parseFloat(deposit) : 0,
                negotiable: negotiable === true || negotiable === 'true',
            },
            availability: {
                instantBooking: instantBooking === true || instantBooking === 'true',
                advanceNotice: advanceNotice ? parseInt(advanceNotice, 10) : 24,
                minDuration: minDuration ? parseInt(minDuration, 10) : 1,
                maxDuration: maxDuration ? parseInt(maxDuration, 10) : 30,
                unavailableDates: [],
            },
            images: processedImages,
            features: Array.isArray(features) ? features : [],
            amenities: Array.isArray(amenities) ? amenities : [],
            rules: Array.isArray(rules) ? rules : [],
            houseRules: Array.isArray(houseRules) ? houseRules : [],
            cancellationPolicy: cancellationPolicy || 'moderate',
            status: listingStatus,
            verified: false,
            featured: false,
            publishedAt: listingStatus === 'active' ? new Date() : null,
        });

        console.log(`✅ Listing created: ${listing._id} by user ${req.user._id} (${req.user.email})`);
        console.log(`📊 Listing status: ${listing.status}, Featured: ${listing.featured}, Published: ${listing.publishedAt ? 'Yes' : 'No'}`);

        res.status(201).json({
            status: 'success',
            listing: buildListingResponse(listing),
            message: listingStatus === 'active' 
                ? 'Listing published successfully!' 
                : 'Listing saved as draft.',
        });
    } catch (err) {
        console.error('Create listing error:', err);
        
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: messages,
            });
        }
        
        res.status(500).json({ status: 'error', message: 'Failed to create listing' });
    }
};

// GET /api/listings/:id/availability - Get booked dates for a listing
exports.getAvailability = async (req, res) => {
    try {
        const listingId = req.params.id;
        
        // Validate ObjectId format
        if (!listingId || !/^[0-9a-fA-F]{24}$/.test(listingId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid listing ID format',
            });
        }

        // Find all confirmed/pending bookings for this listing
        const bookings = await Booking.find({
            listing: listingId,
            status: { $in: ['pending', 'confirmed', 'completed'] }
        }).select('checkIn checkOut status');

        // Extract booked date ranges
        const bookedDates = bookings.map(booking => ({
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            status: booking.status
        }));

        res.json({
            status: 'success',
            bookedDates,
            count: bookedDates.length
        });
    } catch (err) {
        console.error('Get availability error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load availability' });
    }
};

exports.getById = async (req, res) => {
    try {
        const listingId = req.params.id;
        const startTime = Date.now();
        
        // Validate ObjectId format
        if (!listingId || !/^[0-9a-fA-F]{24}$/.test(listingId)) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Invalid listing ID format' 
            });
        }

        // Use lean() for faster queries and select only needed fields
        const listing = await Listing.findById(listingId)
            .populate('owner', 'name email avatar verified createdAt accountType verificationStatus')
            .select('-__v') // Exclude version key
            .lean(); // Use lean() for read-only queries (much faster)
        
        if (!listing) {
            return res.status(404).json({ status: 'error', message: 'Listing not found' });
        }

        // Optimize images - only return URLs, not full data
        if (listing.images && Array.isArray(listing.images)) {
            listing.images = listing.images.map(img => {
                // If image is an object with url, return only url and essential fields
                if (typeof img === 'object' && img.url) {
                    return {
                        url: img.url, // Only URL, not base64 data
                        thumbnail: img.thumbnail || img.url,
                        caption: img.caption || '',
                        order: img.order || 0
                    };
                }
                // If it's a string URL, return as is
                return typeof img === 'string' ? { url: img, order: 0 } : img;
            });
        }

        // Run non-critical queries in parallel (don't block response)
        const [ownerStats, listingRating] = await Promise.all([
            // Get owner statistics (non-blocking)
            (async () => {
                if (!listing.owner || !listing.owner._id) {
                    return { rating: 0, reviewCount: 0, responseRate: 'N/A', responseTime: 'N/A' };
                }
                
                try {
            const ownerReviews = await Review.find({ 
                reviewee: listing.owner._id,
                reviewType: 'renter_to_owner',
                status: 'approved'
                    }).select('rating').lean();
            
            if (ownerReviews.length > 0) {
                const totalRating = ownerReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
                        return {
                            rating: parseFloat((totalRating / ownerReviews.length).toFixed(1)),
                            reviewCount: ownerReviews.length,
                            responseRate: '95%', // Simplified
                            responseTime: 'Within 1 hour'
                        };
                    }
                } catch (err) {
                    console.error('Error fetching owner stats:', err);
                }
                
                return { rating: 0, reviewCount: 0, responseRate: 'N/A', responseTime: 'N/A' };
            })(),
            
            // Get listing rating (non-blocking)
            (async () => {
                try {
        const listingReviews = await Review.find({
                        listing: listingId,
            status: 'approved'
                    }).select('rating').lean();
        
        if (listingReviews.length > 0) {
            const totalRating = listingReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
                        return {
                            average: Math.round((totalRating / listingReviews.length) * 10) / 10,
                            count: listingReviews.length
                        };
                    }
                } catch (err) {
                    console.error('Error fetching listing reviews:', err);
                }
                
                return {
                    average: listing.stats?.averageRating || 0,
                    count: listing.stats?.totalReviews || 0
                };
            })()
        ]);

        // Add owner stats and listing rating
        listing.ownerStats = ownerStats;
        listing.rating = listingRating;

        const responseTime = Date.now() - startTime;
        if (responseTime > 1000) {
            console.warn(`⚠️ Slow listing query: ${responseTime}ms for listing ${listingId}`);
        }

        res.json({ status: 'success', listing });
    } catch (err) {
        console.error('Get listing error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load listing' });
    }
};

// GET /api/listings/:id/similar - Get similar listings
exports.getSimilarListings = async (req, res) => {
    try {
        const listingId = req.params.id;
        const limit = parseInt(req.query.limit) || 6;

        // Validate ObjectId format
        if (!listingId || !/^[0-9a-fA-F]{24}$/.test(listingId)) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Invalid listing ID format' 
            });
        }

        // Get the current listing
        const currentListing = await Listing.findById(listingId);
        if (!currentListing) {
            return res.status(404).json({ status: 'error', message: 'Listing not found' });
        }

        // Build similarity criteria
        const similarityCriteria = {
            _id: { $ne: listingId }, // Exclude current listing
            status: 'active'
        };

        // Primary: Same category and subcategory
        if (currentListing.category) {
            similarityCriteria.category = currentListing.category;
        }
        if (currentListing.subCategory) {
            similarityCriteria.subCategory = currentListing.subCategory;
        }

        // Find similar listings
        let similarListings = await Listing.find(similarityCriteria)
            .populate('owner', 'name avatar verified accountType')
            .limit(limit * 2) // Get more to filter and sort
            .sort({ createdAt: -1 });

        // If not enough results, expand to same category only
        if (similarListings.length < limit && currentListing.category) {
            const expandedCriteria = {
                _id: { $ne: listingId },
                category: currentListing.category,
                status: 'active'
            };
            const expanded = await Listing.find(expandedCriteria)
                .populate('owner', 'name avatar verified accountType')
                .limit(limit * 2)
                .sort({ createdAt: -1 });
            
            // Merge and deduplicate
            const existingIds = new Set(similarListings.map(l => l._id.toString()));
            expanded.forEach(listing => {
                if (!existingIds.has(listing._id.toString())) {
                    similarListings.push(listing);
                }
            });
        }

        // Score and sort by similarity
        similarListings = similarListings.map(listing => {
            let score = 0;

            // Category match (highest weight)
            if (listing.category === currentListing.category) score += 10;
            if (listing.subCategory === currentListing.subCategory) score += 5;

            // Price similarity (within 30% range)
            if (currentListing.pricing?.amount && listing.pricing?.amount) {
                const priceDiff = Math.abs(currentListing.pricing.amount - listing.pricing.amount);
                const priceRange = currentListing.pricing.amount * 0.3;
                if (priceDiff <= priceRange) score += 3;
            }

            // Location similarity (same city)
            if (currentListing.location?.city && listing.location?.city) {
                if (currentListing.location.city === listing.location.city) score += 2;
            }

            // Rating similarity (similar ratings)
            const currentRating = currentListing.stats?.averageRating || 0;
            const listingRating = listing.stats?.averageRating || 0;
            if (Math.abs(currentRating - listingRating) <= 1) score += 1;

            // Verified status bonus
            if (listing.owner?.verified || listing.owner?.accountType === 'paid') score += 1;

            return { listing, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => {
            const listing = item.listing.toObject();
            return {
                id: listing._id,
                title: listing.title,
                image: listing.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTllY2VmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2ZjNzU3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+',
                location: `${listing.location?.city || ''}, ${listing.location?.province || ''}`.trim(),
                price: listing.pricing?.amount || 0,
                period: listing.pricing?.period || 'day',
                rating: listing.stats?.averageRating || 0,
                reviewCount: listing.stats?.totalReviews || 0,
                verified: listing.owner?.verified || listing.owner?.accountType === 'paid',
                instant: listing.availability === 'instant'
            };
        });

        res.json({
            status: 'success',
            count: similarListings.length,
            listings: similarListings
        });
    } catch (err) {
        console.error('Get similar listings error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load similar listings' });
    }
};

// GET /api/listings/owner/me - Get listings for current owner
exports.getOwnerListings = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const ownerId = req.user._id;

        const filter = { owner: ownerId };
        
        // Filter by status if provided
        if (status && status !== 'all') {
            filter.status = status;
        } else {
            // By default, don't show deleted listings
            filter.status = { $ne: 'deleted' };
        }

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [listings, total] = await Promise.all([
            Listing.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Listing.countDocuments(filter),
        ]);

        // Get booking counts for each listing
        const listingsWithStats = await Promise.all(
            listings.map(async (listing) => {
                const [totalBookings, pendingBookings, activeBookings] = await Promise.all([
                    Booking.countDocuments({ listing: listing._id }),
                    Booking.countDocuments({ listing: listing._id, status: 'pending' }),
                    Booking.countDocuments({ listing: listing._id, status: { $in: ['confirmed', 'active'] } }),
                ]);
                
                return {
                    ...buildListingResponse(listing),
                    bookingStats: {
                        total: totalBookings,
                        pending: pendingBookings,
                        active: activeBookings,
                    },
                };
            })
        );

        res.json({
            status: 'success',
            results: listingsWithStats.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            listings: listingsWithStats,
        });
    } catch (err) {
        console.error('Get owner listings error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load listings' });
    }
};

// PUT /api/listings/:id - Update listing
exports.update = async (req, res) => {
    try {
        const listingId = req.params.id;
        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({ status: 'error', message: 'Listing not found' });
        }

        // Authorization: only owner can update
        if (String(listing.owner) !== String(req.user._id)) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to update this listing' });
        }

        const {
            title,
            description,
            category,
            subCategory,
            pricingModel,
            pricingAmount,
            deposit,
            negotiable,
            currency,
            address,
            city,
            province,
            postalCode,
            lat,
            lng,
            area,
            landmark,
            instantBooking,
            advanceNotice,
            minDuration,
            maxDuration,
            cancellationPolicy,
            features,
            amenities,
            rules,
            houseRules,
            images,
        } = req.body;

        // Update fields if provided
        if (title) listing.title = title;
        if (description) listing.description = description;
        
        // Validate category-subcategory relationship if either is being updated
        if (category || subCategory) {
            const newCategory = category || listing.category;
            const newSubCategory = subCategory || listing.subCategory;
            
            const normalizedCategory = String(newCategory).toLowerCase().replace(/-/g, '_');
            const normalizedSubCategory = String(newSubCategory).toLowerCase().replace(/-/g, '_');
            
            const validation = validateCategorySubcategory(normalizedCategory, normalizedSubCategory);
            if (!validation.valid) {
                return res.status(400).json({
                    status: 'error',
                    message: validation.error,
                });
            }
            
            if (category) listing.category = normalizedCategory;
            if (subCategory) listing.subCategory = normalizedSubCategory;
        }

        // Location updates
        if (address || city || province || lat || lng) {
            listing.location = listing.location || {};
            if (address) listing.location.address = address;
            if (city) listing.location.city = city;
            if (province) listing.location.province = province;
            if (postalCode) listing.location.postalCode = postalCode;
            if (area) listing.location.area = area;
            if (landmark) listing.location.landmark = landmark;
            if (lat !== undefined && lng !== undefined) {
                listing.location.coordinates = { lat, lng };
            }
        }

        // Pricing updates
        if (pricingModel || pricingAmount !== undefined) {
            listing.pricing = listing.pricing || {};
            if (pricingModel) listing.pricing.model = pricingModel;
            if (pricingAmount !== undefined) listing.pricing.amount = pricingAmount;
            if (deposit !== undefined) listing.pricing.deposit = deposit;
            if (negotiable !== undefined) listing.pricing.negotiable = negotiable;
            if (currency) listing.pricing.currency = currency;
        }

        // Availability updates
        if (instantBooking !== undefined || advanceNotice !== undefined || minDuration !== undefined || maxDuration !== undefined) {
            listing.availability = listing.availability || {};
            if (instantBooking !== undefined) listing.availability.instantBooking = instantBooking;
            if (advanceNotice !== undefined) listing.availability.advanceNotice = advanceNotice;
            if (minDuration !== undefined) listing.availability.minDuration = minDuration;
            if (maxDuration !== undefined) listing.availability.maxDuration = maxDuration;
        }

        // Other updates
        if (cancellationPolicy) listing.cancellationPolicy = cancellationPolicy;
        if (features) listing.features = features;
        if (amenities) listing.amenities = amenities;
        if (rules) listing.rules = rules;
        if (houseRules) listing.houseRules = houseRules;
        if (images) listing.images = images;

        listing.updatedAt = new Date();
        await listing.save();

        res.json({
            status: 'success',
            listing: buildListingResponse(listing),
            message: 'Listing updated successfully',
        });
    } catch (err) {
        console.error('Update listing error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to update listing' });
    }
};

// PATCH /api/listings/:id/status - Update listing status (publish/pause/archive/delete)
exports.updateStatus = async (req, res) => {
    try {
        const listingId = req.params.id;
        const { status } = req.body;

        const validStatuses = ['draft', 'pending', 'active', 'inactive', 'suspended', 'deleted'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ status: 'error', message: 'Listing not found' });
        }

        // Authorization: only owner can change status
        if (String(listing.owner) !== String(req.user._id)) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to update this listing' });
        }

        // Status transition rules
        const previousStatus = listing.status;
        
        // Cannot change deleted listings
        if (previousStatus === 'deleted') {
            return res.status(400).json({ status: 'error', message: 'Cannot modify a deleted listing' });
        }

        // Cannot change suspended listings (only admin can)
        if (previousStatus === 'suspended' && req.user.role !== 'admin') {
            return res.status(400).json({ status: 'error', message: 'Cannot modify a suspended listing' });
        }

        listing.status = status;
        listing.updatedAt = new Date();

        // Set publishedAt when first published
        if (status === 'active' && !listing.publishedAt) {
            listing.publishedAt = new Date();
        }

        await listing.save();

        res.json({
            status: 'success',
            listing: buildListingResponse(listing),
            message: `Listing ${status === 'active' ? 'published' : status === 'inactive' ? 'paused' : status === 'deleted' ? 'deleted' : 'updated'} successfully`,
        });
    } catch (err) {
        console.error('Update listing status error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to update listing status' });
    }
};

// DELETE /api/listings/:id - Soft delete listing
exports.deleteListing = async (req, res) => {
    try {
        const listingId = req.params.id;
        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({ status: 'error', message: 'Listing not found' });
        }

        // Authorization: only owner can delete
        if (String(listing.owner) !== String(req.user._id)) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to delete this listing' });
        }

        // Check for active bookings
        const activeBookings = await Booking.countDocuments({
            listing: listingId,
            status: { $in: ['pending', 'confirmed', 'active'] },
        });

        if (activeBookings > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Cannot delete listing with ${activeBookings} active booking(s). Please cancel or complete them first.`,
            });
        }

        // Soft delete
        listing.status = 'deleted';
        listing.updatedAt = new Date();
        await listing.save();

        res.json({
            status: 'success',
            message: 'Listing deleted successfully',
        });
    } catch (err) {
        console.error('Delete listing error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to delete listing' });
    }
};
