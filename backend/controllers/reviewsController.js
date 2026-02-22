const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

// POST /api/reviews - Create a review (renter only, for completed bookings)
exports.create = async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;

        // Validation
        if (!bookingId || !rating) {
            return res.status(400).json({
                status: 'error',
                message: 'bookingId and rating are required',
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                status: 'error',
                message: 'Rating must be between 1 and 5',
            });
        }

        // Find the booking
        const booking = await Booking.findById(bookingId).populate('listing');
        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }

        // Check authorization - must be the renter of this booking
        const userId = String(req.user._id);
        if (String(booking.renter) !== userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Only the renter can review this booking',
            });
        }

        // Check if booking is completed
        if (booking.status !== 'completed') {
            return res.status(400).json({
                status: 'error',
                message: 'You can only review completed bookings',
            });
        }

        // Check if review already exists for this booking
        const existingReview = await Review.findOne({ booking: bookingId });
        if (existingReview) {
            return res.status(400).json({
                status: 'error',
                message: 'You have already reviewed this booking',
            });
        }

        // Create review
        const review = await Review.create({
            reviewer: req.user._id,
            reviewee: booking.owner,
            listing: booking.listing._id,
            booking: booking._id,
            rating: parseInt(rating, 10),
            comment: (comment || '').trim(),
            reviewType: 'renter_to_owner',
            category: booking.listing.category || 'property',
            status: 'pending', // Requires admin approval before showing on homepage
        });

        // Update listing stats
        await updateListingStats(booking.listing._id);

        console.log('✅ Review created:', review._id, '| Booking:', booking.bookingNumber);

        res.status(201).json({
            status: 'success',
            review: {
                id: review._id,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
                booking: {
                    id: booking._id,
                    bookingNumber: booking.bookingNumber,
                },
            },
            message: 'Review submitted successfully',
        });
    } catch (err) {
        console.error('Create review error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to submit review' });
    }
};

// GET /api/reviews?listingId=xxx or ?ownerId=xxx or ?renterId=xxx or ?category=xxx&status=approved
exports.list = async (req, res) => {
    try {
        const { listingId, ownerId, renterId, bookingId, category, status } = req.query;

        const filter = {};

        if (listingId) {
            filter.listing = listingId;
        } else if (ownerId) {
            filter.reviewee = ownerId;
        } else if (renterId) {
            filter.reviewer = renterId;
        } else if (bookingId) {
            filter.booking = bookingId;
        }

        // Category filter - can be used alone or with other filters
        if (category) {
            const normalizedCategory = String(category).toLowerCase().replace(/-/g, '_');
            filter.category = normalizedCategory;
        }

        // Status filter - default to 'approved' for public display, unless admin specifies otherwise
        // If status is 'all', don't filter by status (show all reviews including pending)
        if (status && status !== 'all') {
            filter.status = status;
        } else if (!status) {
            // For public API, only show approved reviews by default
            filter.status = 'approved';
        }
        // If status === 'all', no status filter is applied (shows all reviews)

        const reviews = await Review.find(filter)
            .sort({ createdAt: -1 })
            .populate('reviewer', 'name avatar verified')
            .populate('listing', 'title')
            .populate('booking', 'bookingNumber checkIn checkOut');

        res.json({
            status: 'success',
            count: reviews.length,
            reviews: reviews.map(buildReviewResponse),
        });
    } catch (err) {
        console.error('List reviews error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load reviews' });
    }
};

// GET /api/reviews/:id - Get single review
exports.getById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('reviewer', 'name avatar verified')
            .populate('reviewee', 'name avatar')
            .populate('listing', 'title')
            .populate('booking', 'bookingNumber checkIn checkOut');

        if (!review) {
            return res.status(404).json({ status: 'error', message: 'Review not found' });
        }

        res.json({ status: 'success', review: buildReviewResponse(review) });
    } catch (err) {
        console.error('Get review error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load review' });
    }
};

// PATCH /api/reviews/:id/respond - Owner responds to a review
exports.respond = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                status: 'error',
                message: 'Response text is required',
            });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ status: 'error', message: 'Review not found' });
        }

        // Only the reviewee (owner) can respond
        const userId = String(req.user._id);
        if (String(review.reviewee) !== userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Only the owner can respond to this review',
            });
        }

        const now = new Date();

        // If response exists, update it (allow multiple edits)
        if (review.response && review.response.text) {
            review.response.text = text.trim().slice(0, 1000);
            review.response.respondedBy = req.user._id;
            review.response.respondedAt = now;
        } else {
            // Add first response
            review.response = {
                text: text.trim().slice(0, 1000),
                respondedBy: req.user._id,
                respondedAt: now,
            };
        }
        await review.save();

        console.log('✅ Owner responded to review:', review._id);

        res.json({
            status: 'success',
            message: 'Response saved successfully',
            review: buildReviewResponse(review),
        });
    } catch (err) {
        console.error('Respond to review error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to add response' });
    }
};

// DELETE /api/reviews/:id/response - Owner deletes their response
exports.deleteResponse = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ status: 'error', message: 'Review not found' });
        }

        const userId = String(req.user._id);
        if (String(review.reviewee) !== userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Only the owner can delete this response',
            });
        }

        // If no response, nothing to delete
        if (!review.response || !review.response.text) {
            return res.status(400).json({
                status: 'error',
                message: 'No response to delete',
            });
        }

        review.response = undefined;
        await review.save();

        res.json({
            status: 'success',
            message: 'Response deleted successfully',
            review: buildReviewResponse(review),
        });
    } catch (err) {
        console.error('Delete review response error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to delete response' });
    }
};

// Helper: Build review response
function buildReviewResponse(review) {
    if (!review) return null;
    return {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        type: review.type,
        reviewer: review.reviewer ? {
            id: review.reviewer._id,
            name: review.reviewer.name,
            avatar: review.reviewer.avatar,
            verified: review.reviewer.verified,
        } : null,
        reviewee: review.reviewee ? {
            id: review.reviewee._id,
            name: review.reviewee.name,
        } : null,
        listing: review.listing ? {
            id: review.listing._id,
            title: review.listing.title,
        } : null,
        booking: review.booking ? {
            id: review.booking._id,
            bookingNumber: review.booking.bookingNumber,
        } : null,
        response: review.response ? {
            text: review.response.text,
            respondedAt: review.response.respondedAt,
        } : null,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
    };
}

// Helper: Update listing stats after review (only counts approved reviews)
async function updateListingStats(listingId) {
    try {
        const reviews = await Review.find({ 
            listing: listingId,
            status: 'approved' // Only count approved reviews
        });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
            : 0;

        await Listing.findByIdAndUpdate(listingId, {
            'stats.totalReviews': totalReviews,
            'stats.averageRating': Math.round(averageRating * 10) / 10,
        });
    } catch (err) {
        console.warn('Failed to update listing stats:', err.message);
    }
}

module.exports = exports;

