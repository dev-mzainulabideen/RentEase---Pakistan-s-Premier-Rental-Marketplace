const Booking = require('../models/Booking');
const Review = require('../models/Review');

// GET /api/renter/stats
// Returns renter-only activity stats for the logged-in user
exports.getStats = async (req, res) => {
    try {
        const renterId = req.user && req.user._id;
        if (!renterId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const baseFilter = { renter: renterId };

        const [totalBookings, activeBookings, completedBookings, cancelledBookings, reviewsGiven] =
            await Promise.all([
                Booking.countDocuments(baseFilter),
                Booking.countDocuments({ ...baseFilter, status: { $in: ['pending', 'confirmed', 'active'] } }),
                Booking.countDocuments({ ...baseFilter, status: 'completed' }),
                Booking.countDocuments({ ...baseFilter, status: 'cancelled' }),
                Review.countDocuments({ reviewer: renterId, reviewType: 'renter_to_owner' }),
            ]);

        return res.json({
            status: 'success',
            stats: {
                totalBookings,
                activeBookings,
                completedBookings,
                cancelledBookings,
                reviewsGiven,
            },
        });
    } catch (err) {
        console.error('Renter stats error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to load renter stats' });
    }
};


