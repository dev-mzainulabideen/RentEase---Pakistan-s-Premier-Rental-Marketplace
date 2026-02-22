const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

// Helper to build booking response
function buildBookingResponse(booking) {
    if (!booking) return null;
    return {
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        bookingType: booking.bookingType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        duration: booking.duration,
        durationUnit: booking.durationUnit,
        guests: booking.guests,
        pricing: booking.pricing,
        payment: booking.payment,
        contactInfo: booking.contactInfo,
        renter: booking.renter,
        owner: booking.owner,
        listing: booking.listing,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
    };
}

// GET /api/bookings?role=renter|owner
exports.listForCurrentUser = async (req, res) => {
    try {
        const role = (req.query.role || req.user.role || 'renter').toLowerCase();

        const filter = {};
        if (role === 'owner') {
            filter.owner = req.user._id;
        } else {
            // default: renter bookings
            filter.renter = req.user._id;
        }

        const bookings = await Booking.find(filter)
            .sort({ createdAt: -1 })
            .populate('listing', 'title location pricing images')
            .populate('owner', 'name email')
            .populate('renter', 'name email');

        res.json({
            status: 'success',
            count: bookings.length,
            bookings: bookings.map(buildBookingResponse),
        });
    } catch (err) {
        console.error('List bookings error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load bookings' });
    }
};

// GET /api/bookings/:id
exports.getById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('listing', 'title location pricing images')
            .populate('owner', 'name email')
            .populate('renter', 'name email');

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }

        // Authorization: only renter or owner of this booking
        const userId = String(req.user._id);
        if (String(booking.renter._id) !== userId && String(booking.owner._id) !== userId) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to view this booking' });
        }

        res.json({ status: 'success', booking: buildBookingResponse(booking) });
    } catch (err) {
        console.error('Get booking error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load booking' });
    }
};

// POST /api/bookings
exports.create = async (req, res) => {
    try {
        const { listingId, checkIn, checkOut, guests = 1 } = req.body || {};

        if (!listingId || !checkIn || !checkOut) {
            return res.status(400).json({
                status: 'error',
                message: 'listingId, checkIn, and checkOut are required',
            });
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ status: 'error', message: 'Listing not found' });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const durationDays = Math.ceil(
            (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (!Number.isFinite(durationDays) || durationDays <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid dates: check-out must be after check-in',
            });
        }

        const rate = listing.pricing.amount;
        const subtotal = rate * durationDays;
        const serviceFee = Math.round(subtotal * 0.05); // 5% fee
        const deposit = listing.pricing.deposit || 0;
        const total = subtotal + serviceFee + deposit;

        const isInstant = listing.availability?.instantBooking === true;
        const status = isInstant ? 'confirmed' : 'pending';

        // Generate unique bookingNumber before validation (required field)
        const bookingCount = await Booking.countDocuments();
        const bookingNumber = `MR${Date.now()}${String(bookingCount + 1).padStart(4, '0')}`;

        const booking = await Booking.create({
            bookingNumber,
            renter: req.user._id,
            owner: listing.owner,
            listing: listing._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            duration: durationDays,
            durationUnit: 'days',
            guests,
            pricing: {
                model: 'days',
                rate,
                subtotal,
                serviceFee,
                deposit,
                total,
                currency: listing.pricing.currency || 'PKR',
            },
            status,
            bookingType: isInstant ? 'instant' : 'request',
            payment: {
                status: 'pending',
                method: null,
                paidAmount: 0,
            },
            contactInfo: {
                phone: req.user.phone,
                email: req.user.email,
            },
            confirmedAt: isInstant ? new Date() : null,
        });

        res.status(201).json({
            status: 'success',
            booking: buildBookingResponse(booking),
        });
    } catch (err) {
        console.error('Create booking error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to create booking' });
    }
};

// PATCH /api/bookings/:id/cancel - Renter cancels a booking
exports.cancel = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { reason } = req.body || {};

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }

        const userId = String(req.user._id);

        // Only renter can cancel from renter profile
        if (String(booking.renter) !== userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Only the renter can cancel this booking',
            });
        }

        // Only pending/confirmed bookings can be cancelled
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({
                status: 'error',
                message: `Cannot cancel a booking with status "${booking.status}"`,
            });
        }

        // Optional: basic date rule – cannot cancel after check-in date
        if (booking.checkIn && new Date(booking.checkIn) <= new Date()) {
            return res.status(400).json({
                status: 'error',
                message: 'This booking has already started and cannot be cancelled online.',
            });
        }

        booking.status = 'cancelled';
        booking.cancellation = booking.cancellation || {};
        booking.cancellation.cancelledBy = 'renter';
        booking.cancellation.cancelledAt = new Date();
        booking.cancellation.reason = (reason || '').trim().slice(0, 500) || undefined;

        await booking.save();

        return res.json({
            status: 'success',
            booking: buildBookingResponse(booking),
            message: 'Booking cancelled successfully',
        });
    } catch (err) {
        console.error('Cancel booking error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to cancel booking' });
    }
};

// PATCH /api/bookings/:id/accept - Owner accepts a booking request
exports.accept = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }

        const userId = String(req.user._id);

        // Only owner can accept
        if (String(booking.owner) !== userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Only the property owner can accept this booking',
            });
        }

        // Only pending bookings can be accepted
        if (booking.status !== 'pending') {
            return res.status(400).json({
                status: 'error',
                message: `Cannot accept a booking with status "${booking.status}"`,
            });
        }

        booking.status = 'confirmed';
        booking.confirmedAt = new Date();
        await booking.save();

        // Re-fetch with populated fields
        const updatedBooking = await Booking.findById(bookingId)
            .populate('listing', 'title location pricing images')
            .populate('owner', 'name email')
            .populate('renter', 'name email');

        return res.json({
            status: 'success',
            booking: buildBookingResponse(updatedBooking),
            message: 'Booking accepted successfully',
        });
    } catch (err) {
        console.error('Accept booking error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to accept booking' });
    }
};

// PATCH /api/bookings/:id/decline - Owner declines a booking request
exports.decline = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { reason } = req.body || {};

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }

        const userId = String(req.user._id);

        // Only owner can decline
        if (String(booking.owner) !== userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Only the property owner can decline this booking',
            });
        }

        // Only pending bookings can be declined
        if (booking.status !== 'pending') {
            return res.status(400).json({
                status: 'error',
                message: `Cannot decline a booking with status "${booking.status}"`,
            });
        }

        booking.status = 'cancelled';
        booking.cancellation = {
            cancelledBy: 'owner',
            cancelledAt: new Date(),
            reason: (reason || '').trim().slice(0, 500) || 'Declined by owner',
        };
        await booking.save();

        // Re-fetch with populated fields
        const updatedBooking = await Booking.findById(bookingId)
            .populate('listing', 'title location pricing images')
            .populate('owner', 'name email')
            .populate('renter', 'name email');

        return res.json({
            status: 'success',
            booking: buildBookingResponse(updatedBooking),
            message: 'Booking declined',
        });
    } catch (err) {
        console.error('Decline booking error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to decline booking' });
    }
};

// PATCH /api/bookings/:id/cancel-by-owner - Owner cancels an accepted booking
exports.cancelByOwner = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { reason } = req.body || {};

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }

        const userId = String(req.user._id);

        // Only owner can use this endpoint
        if (String(booking.owner) !== userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Only the property owner can cancel this booking',
            });
        }

        // Can only cancel confirmed bookings
        if (booking.status !== 'confirmed') {
            return res.status(400).json({
                status: 'error',
                message: `Cannot cancel a booking with status "${booking.status}"`,
            });
        }

        booking.status = 'cancelled';
        booking.cancellation = {
            cancelledBy: 'owner',
            cancelledAt: new Date(),
            reason: (reason || '').trim().slice(0, 500) || 'Cancelled by owner',
        };
        await booking.save();

        // Re-fetch with populated fields
        const updatedBooking = await Booking.findById(bookingId)
            .populate('listing', 'title location pricing images')
            .populate('owner', 'name email')
            .populate('renter', 'name email');

        return res.json({
            status: 'success',
            booking: buildBookingResponse(updatedBooking),
            message: 'Booking cancelled by owner',
        });
    } catch (err) {
        console.error('Owner cancel booking error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to cancel booking' });
    }
};

// PATCH /api/bookings/:id/complete - Mark booking as completed (owner or system)
exports.complete = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }

        const userId = String(req.user._id);

        // Only owner can mark as complete
        if (String(booking.owner) !== userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Only the property owner can complete this booking',
            });
        }

        // Only confirmed bookings can be completed
        if (booking.status !== 'confirmed') {
            return res.status(400).json({
                status: 'error',
                message: `Cannot complete a booking with status "${booking.status}"`,
            });
        }

        booking.status = 'completed';
        booking.completedAt = new Date();
        await booking.save();

        // Update listing stats
        await Listing.findByIdAndUpdate(booking.listing, {
            $inc: { 'stats.completedBookings': 1 },
        });

        // Re-fetch with populated fields
        const updatedBooking = await Booking.findById(bookingId)
            .populate('listing', 'title location pricing images')
            .populate('owner', 'name email')
            .populate('renter', 'name email');

        return res.json({
            status: 'success',
            booking: buildBookingResponse(updatedBooking),
            message: 'Booking marked as completed',
        });
    } catch (err) {
        console.error('Complete booking error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to complete booking' });
    }
};

