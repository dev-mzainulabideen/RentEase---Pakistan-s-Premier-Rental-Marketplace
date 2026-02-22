const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Dispute = require('../models/Dispute');
const fs = require('fs');
const path = require('path');

// Export users to CSV
exports.exportUsers = async (req, res) => {
    try {
        const users = await User.find().select('name email phone role accountType verified createdAt').lean();
        
        // Convert to CSV
        const csvHeader = 'Name,Email,Phone,Role,Account Type,Verified,Created At\n';
        const csvRows = users.map(user => {
            return [
                `"${user.name || ''}"`,
                `"${user.email || ''}"`,
                `"${user.phone || ''}"`,
                `"${user.role || ''}"`,
                `"${user.accountType || ''}"`,
                user.verified ? 'Yes' : 'No',
                user.createdAt ? new Date(user.createdAt).toISOString() : ''
            ].join(',');
        }).join('\n');
        
        const csv = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting users:', error);
        res.status(500).json({ status: 'error', message: 'Failed to export users' });
    }
};

// Export listings to CSV
exports.exportListings = async (req, res) => {
    try {
        const listings = await Listing.find()
            .populate('owner', 'name email')
            .select('title category price location status createdAt')
            .lean();
        
        const csvHeader = 'Title,Category,Price,Location,Owner,Status,Created At\n';
        const csvRows = listings.map(listing => {
            return [
                `"${listing.title || ''}"`,
                `"${listing.category || ''}"`,
                listing.price?.daily || 0,
                `"${listing.location?.city || ''}, ${listing.location?.province || ''}"`,
                `"${listing.owner?.name || 'N/A'}"`,
                `"${listing.status || ''}"`,
                listing.createdAt ? new Date(listing.createdAt).toISOString() : ''
            ].join(',');
        }).join('\n');
        
        const csv = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=listings-export.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting listings:', error);
        res.status(500).json({ status: 'error', message: 'Failed to export listings' });
    }
};

// Export bookings to CSV
exports.exportBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('renter', 'name email')
            .populate('owner', 'name email')
            .populate('listing', 'title')
            .select('bookingNumber listing renter owner totalAmount status createdAt')
            .lean();
        
        const csvHeader = 'Booking Number,Listing,Renter,Owner,Total Amount,Status,Created At\n';
        const csvRows = bookings.map(booking => {
            return [
                `"${booking.bookingNumber || ''}"`,
                `"${booking.listing?.title || 'N/A'}"`,
                `"${booking.renter?.name || 'N/A'}"`,
                `"${booking.owner?.name || 'N/A'}"`,
                booking.totalAmount || 0,
                `"${booking.status || ''}"`,
                booking.createdAt ? new Date(booking.createdAt).toISOString() : ''
            ].join(',');
        }).join('\n');
        
        const csv = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=bookings-export.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting bookings:', error);
        res.status(500).json({ status: 'error', message: 'Failed to export bookings' });
    }
};

// Export data to JSON
exports.exportDataJSON = async (req, res) => {
    try {
        const { type } = req.query;
        
        let data = {};
        
        if (!type || type === 'all' || type === 'users') {
            data.users = await User.find().select('-password').lean();
        }
        
        if (!type || type === 'all' || type === 'listings') {
            data.listings = await Listing.find().lean();
        }
        
        if (!type || type === 'all' || type === 'bookings') {
            data.bookings = await Booking.find().lean();
        }
        
        if (!type || type === 'all' || type === 'disputes') {
            data.disputes = await Dispute.find().lean();
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=data-export.json');
        res.json({ status: 'success', exportedAt: new Date().toISOString(), data });
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ status: 'error', message: 'Failed to export data' });
    }
};

// Generate comprehensive report
exports.generateReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const matchStage = {};
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(endDate);
        }
        
        // Aggregate statistics
        const userStats = await User.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    verified: { $sum: { $cond: ['$verified', 1, 0] } }
                }
            }
        ]);
        
        const listingStats = await Listing.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$price.daily' }
                }
            }
        ]);
        
        const bookingStats = await Booking.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            }
        ]);
        
        const report = {
            generatedAt: new Date().toISOString(),
            period: {
                startDate: startDate || 'All Time',
                endDate: endDate || 'All Time'
            },
            summary: {
                totalUsers: await User.countDocuments(matchStage),
                totalListings: await Listing.countDocuments(matchStage),
                totalBookings: await Booking.countDocuments(matchStage),
                totalDisputes: await Dispute.countDocuments(matchStage)
            },
            statistics: {
                usersByRole: userStats,
                listingsByCategory: listingStats,
                bookingsByStatus: bookingStats
            }
        };
        
        res.json({ status: 'success', report });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate report' });
    }
};

