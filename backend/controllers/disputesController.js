const Dispute = require('../models/Dispute');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

// Helper function to build dispute response
function buildDisputeResponse(dispute) {
    return {
        id: dispute._id,
        reporter: {
            id: dispute.reporter._id || dispute.reporter,
            name: dispute.reporter.name || 'Unknown',
            email: dispute.reporter.email || ''
        },
        reportedUser: dispute.reportedUser ? {
            id: dispute.reportedUser._id || dispute.reportedUser,
            name: dispute.reportedUser.name || 'Unknown',
            email: dispute.reportedUser.email || ''
        } : null,
        listing: dispute.listing ? {
            id: dispute.listing._id || dispute.listing,
            title: dispute.listing.title || 'Unknown Listing'
        } : null,
        booking: dispute.booking ? {
            id: dispute.booking._id || dispute.booking,
            bookingNumber: dispute.booking.bookingNumber || 'Unknown'
        } : null,
        type: dispute.type,
        title: dispute.title,
        description: dispute.description,
        priority: dispute.priority,
        status: dispute.status,
        evidence: dispute.evidence || [],
        assignedTo: dispute.assignedTo ? {
            id: dispute.assignedTo._id || dispute.assignedTo,
            name: dispute.assignedTo.name || 'Unknown'
        } : null,
        resolution: dispute.resolution || null,
        updates: dispute.updates || [],
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
        resolvedAt: dispute.resolvedAt
    };
}

// GET /api/disputes - Get all disputes for current user
exports.getUserDisputes = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, type, priority } = req.query;
        
        const filter = {
            $or: [
                { reporter: userId },
                { reportedUser: userId }
            ]
        };
        
        if (status) {
            filter.status = status;
        }
        if (type) {
            filter.type = type;
        }
        if (priority) {
            filter.priority = priority;
        }
        
        const disputes = await Dispute.find(filter)
            .populate('reporter', 'name email')
            .populate('reportedUser', 'name email')
            .populate('listing', 'title')
            .populate('booking', 'bookingNumber')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });
        
        res.json({
            status: 'success',
            data: disputes.map(buildDisputeResponse)
        });
    } catch (error) {
        console.error('Error fetching disputes:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch disputes'
        });
    }
};

// GET /api/disputes/:id - Get single dispute
exports.getDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        const dispute = await Dispute.findById(id)
            .populate('reporter', 'name email')
            .populate('reportedUser', 'name email')
            .populate('listing', 'title')
            .populate('booking', 'bookingNumber')
            .populate('assignedTo', 'name email')
            .populate('resolution.resolvedBy', 'name email');
        
        if (!dispute) {
            return res.status(404).json({
                status: 'error',
                message: 'Dispute not found'
            });
        }
        
        // Check if user has access (reporter, reported user, or admin)
        const isReporter = dispute.reporter._id.toString() === userId.toString();
        const isReported = dispute.reportedUser && dispute.reportedUser._id.toString() === userId.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isReporter && !isReported && !isAdmin) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }
        
        res.json({
            status: 'success',
            data: buildDisputeResponse(dispute)
        });
    } catch (error) {
        console.error('Error fetching dispute:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch dispute'
        });
    }
};

// POST /api/disputes - Create new dispute
exports.createDispute = async (req, res) => {
    try {
        const userId = req.user._id;
        let {
            type,
            title,
            description,
            priority,
            reportedUserId,
            listingId,
            bookingId,
            evidence
        } = req.body;
        
        // Validation
        const errors = [];
        if (!type || !['payment', 'safety', 'quality', 'behavior', 'fraud', 'other'].includes(type)) {
            errors.push('Valid dispute type is required');
        }
        if (!title || title.trim().length < 5) {
            errors.push('Title must be at least 5 characters');
        }
        if (!description || description.trim().length < 20) {
            errors.push('Description must be at least 20 characters');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors
            });
        }
        
        // Verify booking exists if provided
        let booking = null;
        let finalBookingId = null; // Use a new variable instead of reassigning const
        if (bookingId && bookingId.trim() !== '') {
            const bookingIdValue = bookingId.trim();
            
            // Check if it's a valid MongoDB ObjectId
            const mongoose = require('mongoose');
            const isValidObjectId = mongoose.Types.ObjectId.isValid(bookingIdValue);
            
            if (isValidObjectId) {
                // Try to find by _id first
                booking = await Booking.findById(bookingIdValue);
            }
            
            // If not found by _id, try to find by bookingNumber
            if (!booking) {
                booking = await Booking.findOne({ bookingNumber: bookingIdValue });
            }
            
            if (!booking) {
                return res.status(404).json({
                    status: 'error',
                    message: `Booking not found. Please check your booking number or ID. Test booking numbers: MR17676224861820039, MR17676224861820040`
                });
            }
            
            // Verify user is part of this booking
            if (booking.renter.toString() !== userId.toString() && 
                booking.owner.toString() !== userId.toString()) {
                return res.status(403).json({
                    status: 'error',
                    message: 'You are not authorized to create a dispute for this booking'
                });
            }
            
            // Set reported user based on booking
            if (!reportedUserId) {
                reportedUserId = booking.renter.toString() === userId.toString() 
                    ? booking.owner 
                    : booking.renter;
            }
            
            // Store the actual _id for storage
            finalBookingId = booking._id.toString();
        }
        
        // Verify listing exists if provided
        if (listingId && listingId.trim() !== '') {
            const listing = await Listing.findById(listingId.trim());
            if (!listing) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Listing not found'
                });
            }
        }
        
        // Create dispute
        const dispute = await Dispute.create({
            reporter: userId,
            reportedUser: reportedUserId || null,
            listing: (listingId && listingId.trim() !== '') ? listingId.trim() : null,
            booking: finalBookingId || null, // Use the finalBookingId variable
            type,
            title: title.trim(),
            description: description.trim(),
            priority: priority || 'medium',
            evidence: evidence || [],
            status: 'open'
        });
        
        const populatedDispute = await Dispute.findById(dispute._id)
            .populate('reporter', 'name email')
            .populate('reportedUser', 'name email')
            .populate('listing', 'title')
            .populate('booking', 'bookingNumber');
        
        res.status(201).json({
            status: 'success',
            message: 'Dispute created successfully',
            data: buildDisputeResponse(populatedDispute)
        });
    } catch (error) {
        console.error('Error creating dispute:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create dispute',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// PATCH /api/disputes/:id - Update dispute
exports.updateDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { status, priority, assignedTo, resolution } = req.body;
        
        const dispute = await Dispute.findById(id);
        if (!dispute) {
            return res.status(404).json({
                status: 'error',
                message: 'Dispute not found'
            });
        }
        
        // Check permissions
        const isReporter = dispute.reporter.toString() === userId.toString();
        const isAdmin = req.user.role === 'admin';
        
        // Only reporter can update their own dispute (limited fields)
        // Admin can update any dispute
        if (!isReporter && !isAdmin) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }
        
        // Update allowed fields
        if (status && isAdmin) {
            dispute.status = status;
            if (status === 'resolved' || status === 'closed') {
                dispute.resolvedAt = new Date();
            }
        }
        if (priority && isAdmin) {
            dispute.priority = priority;
        }
        if (assignedTo && isAdmin) {
            dispute.assignedTo = assignedTo;
        }
        if (resolution && isAdmin) {
            dispute.resolution = {
                ...dispute.resolution,
                ...resolution,
                resolvedBy: userId,
                resolvedAt: new Date()
            };
            dispute.status = 'resolved';
            dispute.resolvedAt = new Date();
        }
        
        await dispute.save();
        
        const updatedDispute = await Dispute.findById(id)
            .populate('reporter', 'name email')
            .populate('reportedUser', 'name email')
            .populate('listing', 'title')
            .populate('booking', 'bookingNumber')
            .populate('assignedTo', 'name email');
        
        res.json({
            status: 'success',
            message: 'Dispute updated successfully',
            data: buildDisputeResponse(updatedDispute)
        });
    } catch (error) {
        console.error('Error updating dispute:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update dispute'
        });
    }
};

// POST /api/disputes/:id/updates - Add update/note to dispute
exports.addUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { note } = req.body;
        
        if (!note || note.trim().length < 5) {
            return res.status(400).json({
                status: 'error',
                message: 'Note must be at least 5 characters'
            });
        }
        
        const dispute = await Dispute.findById(id);
        if (!dispute) {
            return res.status(404).json({
                status: 'error',
                message: 'Dispute not found'
            });
        }
        
        // Check permissions
        const isReporter = dispute.reporter.toString() === userId.toString();
        const isReported = dispute.reportedUser && dispute.reportedUser.toString() === userId.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isReporter && !isReported && !isAdmin) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }
        
        // Add update
        dispute.updates.push({
            note: note.trim(),
            addedBy: userId,
            addedAt: new Date()
        });
        
        await dispute.save();
        
        const updatedDispute = await Dispute.findById(id)
            .populate('reporter', 'name email')
            .populate('reportedUser', 'name email')
            .populate('updates.addedBy', 'name email');
        
        res.json({
            status: 'success',
            message: 'Update added successfully',
            data: buildDisputeResponse(updatedDispute)
        });
    } catch (error) {
        console.error('Error adding update:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add update'
        });
    }
};

// GET /api/disputes/stats - Get dispute statistics (admin only)
exports.getDisputeStats = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Admin access required'
            });
        }
        
        const stats = {
            total: await Dispute.countDocuments(),
            open: await Dispute.countDocuments({ status: 'open' }),
            inReview: await Dispute.countDocuments({ status: 'in_review' }),
            resolved: await Dispute.countDocuments({ status: 'resolved' }),
            closed: await Dispute.countDocuments({ status: 'closed' }),
            rejected: await Dispute.countDocuments({ status: 'rejected' }),
            byType: {},
            byPriority: {
                low: await Dispute.countDocuments({ priority: 'low' }),
                medium: await Dispute.countDocuments({ priority: 'medium' }),
                high: await Dispute.countDocuments({ priority: 'high' }),
                urgent: await Dispute.countDocuments({ priority: 'urgent' })
            }
        };
        
        // Count by type
        const types = ['payment', 'safety', 'quality', 'behavior', 'fraud', 'other'];
        for (const type of types) {
            stats.byType[type] = await Dispute.countDocuments({ type });
        }
        
        res.json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        console.error('Error fetching dispute stats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch statistics'
        });
    }
};

