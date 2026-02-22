const EmergencyContact = require('../models/EmergencyContact');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

// GET /api/emergency-contacts - Get user's emergency contacts
exports.getUserEmergencyContacts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, limit = 50, page = 1 } = req.query;

        const filter = { user: userId };
        if (status) {
            filter.status = status;
        }

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [contacts, total] = await Promise.all([
            EmergencyContact.find(filter)
                .populate('booking', 'bookingNumber checkIn checkOut')
                .populate('listing', 'title location')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            EmergencyContact.countDocuments(filter)
        ]);

        res.json({
            status: 'success',
            results: contacts.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            contacts
        });
    } catch (err) {
        console.error('Get emergency contacts error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch emergency contacts'
        });
    }
};

// POST /api/emergency-contacts - Create new emergency contact
exports.createEmergencyContact = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            contactName,
            contactPhone,
            contactEmail,
            relationship,
            emergencyType,
            description,
            bookingId,
            listingId,
            location,
            priority
        } = req.body;

        // Validation
        if (!contactName || !contactPhone || !emergencyType || !description) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: contactName, contactPhone, emergencyType, description'
            });
        }

        // Validate booking if provided
        if (bookingId) {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Booking not found'
                });
            }
            // Verify booking belongs to user
            if (String(booking.renter) !== String(userId) && String(booking.owner) !== String(userId)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'You do not have access to this booking'
                });
            }
        }

        // Validate listing if provided
        if (listingId) {
            const listing = await Listing.findById(listingId);
            if (!listing) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Listing not found'
                });
            }
        }

        // Determine priority if not provided
        let contactPriority = priority || 'medium';
        if (emergencyType === 'medical' || emergencyType === 'accident') {
            contactPriority = 'high';
        } else if (emergencyType === 'theft' || emergencyType === 'safety') {
            contactPriority = 'high';
        }

        const emergencyContact = await EmergencyContact.create({
            user: userId,
            booking: bookingId || null,
            listing: listingId || null,
            contactName: contactName.trim(),
            contactPhone: contactPhone.trim(),
            contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : null,
            relationship: relationship || 'other',
            emergencyType,
            description: description.trim(),
            location: location || {},
            priority: contactPriority,
            status: 'pending'
        });

        // Populate related data
        await emergencyContact.populate([
            { path: 'booking', select: 'bookingNumber checkIn checkOut' },
            { path: 'listing', select: 'title location' }
        ]);

        console.log(`✅ Emergency contact created: ${emergencyContact._id} by user ${userId}`);

        res.status(201).json({
            status: 'success',
            message: 'Emergency contact created successfully',
            contact: emergencyContact
        });
    } catch (err) {
        console.error('Create emergency contact error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create emergency contact',
            error: err.message
        });
    }
};

// GET /api/emergency-contacts/:id - Get single emergency contact
exports.getEmergencyContact = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const contact = await EmergencyContact.findById(id)
            .populate('booking', 'bookingNumber checkIn checkOut')
            .populate('listing', 'title location')
            .populate('user', 'name email');

        if (!contact) {
            return res.status(404).json({
                status: 'error',
                message: 'Emergency contact not found'
            });
        }

        // Verify user owns this contact (unless admin)
        if (String(contact.user._id) !== String(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have access to this emergency contact'
            });
        }

        res.json({
            status: 'success',
            contact
        });
    } catch (err) {
        console.error('Get emergency contact error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch emergency contact'
        });
    }
};

// PUT /api/emergency-contacts/:id - Update emergency contact (admin only for status updates)
exports.updateEmergencyContact = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { status, responseNotes, actionTaken } = req.body;

        const contact = await EmergencyContact.findById(id);

        if (!contact) {
            return res.status(404).json({
                status: 'error',
                message: 'Emergency contact not found'
            });
        }

        // Only user can update their own contact details, admin can update status
        if (String(contact.user) !== String(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to update this emergency contact'
            });
        }

        // Admin can update status and response
        if (req.user.role === 'admin') {
            if (status) {
                contact.status = status;
            }
            if (responseNotes || actionTaken) {
                contact.response = {
                    respondedBy: userId,
                    respondedAt: new Date(),
                    responseNotes: responseNotes || contact.response?.responseNotes,
                    actionTaken: actionTaken || contact.response?.actionTaken
                };
            }
        } else {
            // User can only update their own contact details (not status)
            const { contactName, contactPhone, contactEmail, description } = req.body;
            if (contactName) contact.contactName = contactName.trim();
            if (contactPhone) contact.contactPhone = contactPhone.trim();
            if (contactEmail) contact.contactEmail = contactEmail.trim().toLowerCase();
            if (description) contact.description = description.trim();
        }

        await contact.save();

        await contact.populate([
            { path: 'booking', select: 'bookingNumber checkIn checkOut' },
            { path: 'listing', select: 'title location' }
        ]);

        res.json({
            status: 'success',
            message: 'Emergency contact updated successfully',
            contact
        });
    } catch (err) {
        console.error('Update emergency contact error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update emergency contact'
        });
    }
};

// GET /api/emergency-contacts/stats - Get emergency contact statistics (user's own)
exports.getEmergencyStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const stats = await EmergencyContact.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    contacted: {
                        $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] }
                    },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                    },
                    critical: {
                        $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            total: 0,
            pending: 0,
            contacted: 0,
            resolved: 0,
            critical: 0
        };

        res.json({
            status: 'success',
            stats: result
        });
    } catch (err) {
        console.error('Get emergency stats error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch emergency statistics'
        });
    }
};

