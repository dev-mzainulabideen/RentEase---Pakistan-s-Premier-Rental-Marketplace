const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Payment = require('../models/Payment');

// GET /api/owner/stats - Get owner statistics
exports.getStats = async (req, res) => {
    try {
        const ownerId = req.user._id;

        // Count listings by status
        const [
            totalListings,
            activeListings,
            draftListings,
            pausedListings,
        ] = await Promise.all([
            Listing.countDocuments({ owner: ownerId, status: { $ne: 'deleted' } }),
            Listing.countDocuments({ owner: ownerId, status: 'active' }),
            Listing.countDocuments({ owner: ownerId, status: 'draft' }),
            Listing.countDocuments({ owner: ownerId, status: 'inactive' }),
        ]);

        // Count bookings by status (as owner)
        const [
            totalBookings,
            pendingBookings,
            confirmedBookings,
            completedBookings,
            cancelledBookings,
        ] = await Promise.all([
            Booking.countDocuments({ owner: ownerId }),
            Booking.countDocuments({ owner: ownerId, status: 'pending' }),
            Booking.countDocuments({ owner: ownerId, status: 'confirmed' }),
            Booking.countDocuments({ owner: ownerId, status: 'completed' }),
            Booking.countDocuments({ owner: ownerId, status: 'cancelled' }),
        ]);

        // Count reviews received (as owner/reviewee)
        const reviewsReceived = await Review.countDocuments({ reviewee: ownerId });

        // Calculate average rating from reviews
        const reviews = await Review.find({ reviewee: ownerId }).select('rating');
        const averageRating = reviews.length > 0
            ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) * 10) / 10
            : 0;

        // Calculate total earnings from completed bookings
        const completedBookingsData = await Booking.find({
            owner: ownerId,
            status: 'completed',
            'payment.status': 'paid',
        }).select('pricing.total pricing.serviceFee');

        let totalEarnings = 0;
        let platformFees = 0;
        completedBookingsData.forEach((b) => {
            const total = b.pricing?.total || 0;
            const fee = b.pricing?.serviceFee || 0;
            totalEarnings += (total - fee);
            platformFees += fee;
        });

        // Get pending payouts (future: implement payout system)
        const pendingPayout = 0; // Placeholder for payout system

        res.json({
            status: 'success',
            stats: {
                // Listings
                totalListings,
                activeListings,
                draftListings,
                pausedListings,
                // Bookings
                totalBookings,
                pendingBookings,
                confirmedBookings,
                completedBookings,
                cancelledBookings,
                // Reviews & Rating
                reviewsReceived,
                averageRating,
                // Earnings
                totalEarnings,
                platformFees,
                pendingPayout,
                currency: 'PKR',
            },
        });
    } catch (err) {
        console.error('Get owner stats error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load owner statistics' });
    }
};

// GET /api/owner/earnings - Get detailed earnings breakdown
exports.getEarnings = async (req, res) => {
    try {
        const ownerId = req.user._id;
        const { period = 'all', listingId } = req.query;

        // Build date filter based on period
        let dateFilter = {};
        const now = new Date();
        if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { completedAt: { $gte: weekAgo } };
        } else if (period === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter = { completedAt: { $gte: monthAgo } };
        } else if (period === 'year') {
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            dateFilter = { completedAt: { $gte: yearAgo } };
        }

        // Build main filter
        const filter = {
            owner: ownerId,
            status: 'completed',
            'payment.status': 'paid',
            ...dateFilter,
        };

        if (listingId) {
            filter.listing = listingId;
        }

        const bookings = await Booking.find(filter)
            .populate('listing', 'title images')
            .populate('renter', 'name')
            .sort({ completedAt: -1 });

        const earnings = bookings.map((b) => ({
            bookingId: b._id,
            bookingNumber: b.bookingNumber,
            listing: b.listing ? {
                id: b.listing._id,
                title: b.listing.title,
                image: b.listing.images?.[0]?.url,
            } : null,
            renter: b.renter ? { id: b.renter._id, name: b.renter.name } : null,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            grossAmount: b.pricing?.total || 0,
            serviceFee: b.pricing?.serviceFee || 0,
            netEarnings: (b.pricing?.total || 0) - (b.pricing?.serviceFee || 0),
            completedAt: b.completedAt,
            currency: b.pricing?.currency || 'PKR',
        }));

        const totalGross = earnings.reduce((sum, e) => sum + e.grossAmount, 0);
        const totalFees = earnings.reduce((sum, e) => sum + e.serviceFee, 0);
        const totalNet = earnings.reduce((sum, e) => sum + e.netEarnings, 0);

        res.json({
            status: 'success',
            count: earnings.length,
            summary: {
                totalGross,
                totalFees,
                totalNet,
                currency: 'PKR',
            },
            earnings,
        });
    } catch (err) {
        console.error('Get owner earnings error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load earnings' });
    }
};

// GET /api/owner/dashboard - Get dashboard summary data
exports.getDashboard = async (req, res) => {
    try {
        const ownerId = req.user._id;

        // Recent pending bookings (up to 5)
        const pendingBookings = await Booking.find({
            owner: ownerId,
            status: 'pending',
        })
            .populate('listing', 'title images')
            .populate('renter', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(5);

        // Upcoming confirmed bookings (up to 5)
        const upcomingBookings = await Booking.find({
            owner: ownerId,
            status: 'confirmed',
            checkIn: { $gte: new Date() },
        })
            .populate('listing', 'title images')
            .populate('renter', 'name avatar')
            .sort({ checkIn: 1 })
            .limit(5);

        // Recent reviews (up to 5)
        const recentReviews = await Review.find({ reviewee: ownerId })
            .populate('reviewer', 'name avatar')
            .populate('listing', 'title')
            .sort({ createdAt: -1 })
            .limit(5);

        // Listings needing attention (draft or inactive)
        const listingsNeedingAttention = await Listing.find({
            owner: ownerId,
            status: { $in: ['draft', 'inactive'] },
        })
            .select('title status images createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            status: 'success',
            dashboard: {
                pendingBookings: pendingBookings.map((b) => ({
                    id: b._id,
                    bookingNumber: b.bookingNumber,
                    listing: b.listing ? { title: b.listing.title, image: b.listing.images?.[0]?.url } : null,
                    renter: b.renter ? { name: b.renter.name, avatar: b.renter.avatar } : null,
                    checkIn: b.checkIn,
                    checkOut: b.checkOut,
                    total: b.pricing?.total,
                    createdAt: b.createdAt,
                })),
                upcomingBookings: upcomingBookings.map((b) => ({
                    id: b._id,
                    bookingNumber: b.bookingNumber,
                    listing: b.listing ? { title: b.listing.title, image: b.listing.images?.[0]?.url } : null,
                    renter: b.renter ? { name: b.renter.name, avatar: b.renter.avatar } : null,
                    checkIn: b.checkIn,
                    checkOut: b.checkOut,
                })),
                recentReviews: recentReviews.map((r) => ({
                    id: r._id,
                    rating: r.rating,
                    comment: r.comment,
                    reviewer: r.reviewer ? { name: r.reviewer.name, avatar: r.reviewer.avatar } : null,
                    listing: r.listing ? { title: r.listing.title } : null,
                    createdAt: r.createdAt,
                })),
                listingsNeedingAttention: listingsNeedingAttention.map((l) => ({
                    id: l._id,
                    title: l.title,
                    status: l.status,
                    image: l.images?.[0]?.url,
                    createdAt: l.createdAt,
                })),
            },
        });
    } catch (err) {
        console.error('Get owner dashboard error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load dashboard' });
    }
};



