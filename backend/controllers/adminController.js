const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Dispute = require('../models/Dispute');
const Review = require('../models/Review');

// GET /api/admin/stats - Dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Total users
        const totalUsers = await User.countDocuments();
        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        const activeUsers = await User.countDocuments({ 
            status: { $ne: 'banned' } 
        });

        // User growth calculation
        const usersLastMonth = await User.countDocuments({
            createdAt: { $lt: thirtyDaysAgo }
        });
        const userGrowth = usersLastMonth > 0 
            ? ((newUsersThisMonth / usersLastMonth) * 100).toFixed(1)
            : 0;

        // Listings
        const totalListings = await Listing.countDocuments();
        const activeListings = await Listing.countDocuments({ 
            status: 'active' 
        });
        const newListingsThisMonth = await Listing.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        const listingsLastMonth = await Listing.countDocuments({
            createdAt: { $lt: thirtyDaysAgo, $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000) }
        });
        const listingGrowth = listingsLastMonth > 0 
            ? ((newListingsThisMonth / listingsLastMonth) * 100).toFixed(1)
            : 0;

        // Verifications
        const pendingVerifications = await User.countDocuments({
            'verificationStatus.email': false,
            'verificationStatus.phone': false,
            'verificationStatus.id': false
        });

        // Disputes
        const openDisputes = await Dispute.countDocuments({ 
            status: { $in: ['open', 'in_review'] } 
        });
        const urgentDisputes = await Dispute.countDocuments({ 
            status: 'open',
            priority: 'urgent'
        });
        const inReviewDisputes = await Dispute.countDocuments({ 
            status: 'in_review' 
        });
        const resolvedDisputes = await Dispute.countDocuments({ 
            status: 'resolved' 
        });

        // Revenue (from payments)
        const totalRevenueResult = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        const monthlyRevenueResult = await Payment.aggregate([
            { 
                $match: { 
                    status: 'completed',
                    createdAt: { $gte: thirtyDaysAgo }
                } 
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

        // Revenue growth
        const lastMonthRevenueResult = await Payment.aggregate([
            { 
                $match: { 
                    status: 'completed',
                    createdAt: { 
                        $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                        $lt: thirtyDaysAgo
                    }
                } 
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;
        const revenueGrowth = lastMonthRevenue > 0 
            ? (((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
            : 0;

        // Subscriptions (paid users)
        const activeSubscriptions = await User.countDocuments({ 
            accountType: 'paid' 
        });

        // Recent users (last 5)
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email role accountType createdAt')
            .lean();

        // Recent disputes (last 5)
        const recentDisputes = await Dispute.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('reporter', 'name email')
            .select('type title priority status createdAt reporter')
            .lean();

        // User growth data (last 7 months)
        const userGrowthData = [];
        for (let i = 6; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const count = await User.countDocuments({
                createdAt: { $gte: monthStart, $lte: monthEnd }
            });
            const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });
            userGrowthData.push({ month: monthName, users: count });
        }

        // Revenue data (last 7 months)
        const revenueData = [];
        for (let i = 6; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const result = await Payment.aggregate([
                {
                    $match: {
                        status: 'completed',
                        createdAt: { $gte: monthStart, $lte: monthEnd }
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const revenue = result[0]?.total || 0;
            const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });
            revenueData.push({ month: monthName, revenue });
        }

        // Category distribution
        const categoryDistribution = await Listing.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            status: 'success',
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    new: newUsersThisMonth,
                    growth: parseFloat(userGrowth)
                },
                listings: {
                    total: totalListings,
                    active: activeListings,
                    new: newListingsThisMonth,
                    growth: parseFloat(listingGrowth),
                    pending: 0 // Can be calculated based on status
                },
                verifications: {
                    pending: pendingVerifications
                },
                disputes: {
                    open: openDisputes,
                    urgent: urgentDisputes,
                    inReview: inReviewDisputes,
                    resolved: resolvedDisputes
                },
                revenue: {
                    total: totalRevenue,
                    thisMonth: monthlyRevenue,
                    growth: parseFloat(revenueGrowth)
                },
                subscriptions: {
                    active: activeSubscriptions,
                    expired: 0, // Can be calculated if needed
                    new: 0 // Can be calculated
                },
                recentUsers,
                recentDisputes,
                userGrowth: userGrowthData,
                revenueData,
                categoryDistribution: categoryDistribution.map(cat => ({
                    category: cat._id,
                    count: cat.count
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch dashboard statistics'
        });
    }
};

// GET /api/admin/users - Get all users with filters
exports.getUsers = async (req, res) => {
    try {
        const {
            search,
            role,
            accountType,
            verification,
            status,
            page = 1,
            limit = 20
        } = req.query;

        const query = {};

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Role filter
        if (role) {
            query.role = role;
        }

        // Account type filter
        if (accountType) {
            query.accountType = accountType;
        }

        // Verification filter
        if (verification === 'verified') {
            query['verificationStatus.email'] = true;
            query['verificationStatus.phone'] = true;
        } else if (verification === 'unverified') {
            query.$or = [
                { 'verificationStatus.email': false },
                { 'verificationStatus.phone': false }
            ];
        } else if (verification === 'pending') {
            query['verificationStatus.email'] = false;
            query['verificationStatus.phone'] = false;
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await User.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch users'
        });
    }
};

// GET /api/admin/users/:id - Get single user details
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Get user's listings count
        const listingsCount = await Listing.countDocuments({ owner: user._id });
        
        // Get user's bookings count
        const bookingsCount = await Booking.countDocuments({
            $or: [{ renter: user._id }, { owner: user._id }]
        });

        res.json({
            status: 'success',
            data: {
                ...user,
                listingsCount,
                bookingsCount
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user'
        });
    }
};

// PATCH /api/admin/users/:id/role - Change user role
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['renter', 'owner', 'dual_role', 'admin', 'moderator'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid role'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update user role'
        });
    }
};

// PATCH /api/admin/users/:id/status - Update user status (suspend/ban/activate)
exports.updateUserStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;
        const validStatuses = ['active', 'suspended', 'banned'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid status'
            });
        }

        const updateData = { status };
        if (reason) {
            updateData.suspensionReason = reason;
            updateData.suspendedAt = new Date();
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update user status'
        });
    }
};

// PATCH /api/admin/users/:id/verify - Manually verify user
exports.verifyUser = async (req, res) => {
    try {
        const { email, phone, id } = req.body;
        
        const updateData = {
            verified: true,
            verificationStatus: {
                email: email !== undefined ? email : true,
                phone: phone !== undefined ? phone : true,
                id: id !== undefined ? id : true
            }
        };

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        console.error('Error verifying user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify user'
        });
    }
};

// GET /api/admin/listings - Get all listings with filters
exports.getListings = async (req, res) => {
    try {
        const {
            search,
            category,
            status,
            owner,
            page = 1,
            limit = 20
        } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (status) {
            query.status = status;
        }

        if (owner) {
            query.owner = owner;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const listings = await Listing.find(query)
            .populate('owner', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Listing.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                listings,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch listings'
        });
    }
};

// PATCH /api/admin/listings/:id/status - Update listing status
exports.updateListingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['draft', 'active', 'paused', 'rejected', 'reported'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid status'
            });
        }

        const listing = await Listing.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('owner', 'name email');

        if (!listing) {
            return res.status(404).json({
                status: 'error',
                message: 'Listing not found'
            });
        }

        res.json({
            status: 'success',
            data: listing
        });
    } catch (error) {
        console.error('Error updating listing status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update listing status'
        });
    }
};

// PATCH /api/admin/listings/:id/feature - Toggle featured status
exports.toggleFeatured = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({
                status: 'error',
                message: 'Listing not found'
            });
        }

        // Toggle featured status
        const newFeaturedStatus = !listing.featured;
        
        // Use findByIdAndUpdate to ensure the update is saved properly
        const updatedListing = await Listing.findByIdAndUpdate(
            req.params.id,
            { featured: newFeaturedStatus },
            { new: true, runValidators: true }
        ).populate('owner', 'name email');

        if (!updatedListing) {
            return res.status(404).json({
                status: 'error',
                message: 'Listing not found after update'
            });
        }

        console.log(`✅ Featured status toggled for listing ${req.params.id}: ${newFeaturedStatus}`);

        res.json({
            status: 'success',
            data: updatedListing,
            message: `Listing ${newFeaturedStatus ? 'featured' : 'unfeatured'} successfully`
        });
    } catch (error) {
        console.error('Error toggling featured status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to toggle featured status',
            error: error.message
        });
    }
};

// GET /api/admin/categories - Get all categories
exports.getCategories = async (req, res) => {
    try {
        const Category = require('../models/Category');
        const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
        
        res.json({
            status: 'success',
            data: { categories }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch categories'
        });
    }
};

// GET /api/admin/ads - Get all ads
exports.getAds = async (req, res) => {
    try {
        const Ad = require('../models/Ad');
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const ads = await Ad.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean();
        const total = await Ad.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                ads,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching ads:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch ads'
        });
    }
};

// GET /api/admin/subscriptions - Get all subscriptions
exports.getSubscriptions = async (req, res) => {
    try {
        const Subscription = require('../models/Subscription');
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const subscriptions = await Subscription.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        const total = await Subscription.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                subscriptions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch subscriptions'
        });
    }
};

// GET /api/admin/disputes - Get all disputes
exports.getDisputes = async (req, res) => {
    try {
        const { status, type, priority, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) query.status = status;
        if (type) query.type = type;
        if (priority) query.priority = priority;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const disputes = await Dispute.find(query)
            .populate('reporter', 'name email')
            .populate('booking', 'bookingNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        const total = await Dispute.countDocuments(query);

        res.json({
            status: 'success',
            data: {
                disputes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching disputes:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch disputes'
        });
    }
};

// GET /api/admin/statistics - Get detailed statistics
exports.getStatistics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // User statistics
        const totalUsers = await User.countDocuments();
        const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Listing statistics
        const totalListings = await Listing.countDocuments();
        const activeListings = await Listing.countDocuments({ status: 'active' });
        const listingsByCategory = await Listing.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Booking statistics
        const totalBookings = await Booking.countDocuments();
        const bookingsByStatus = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Revenue statistics
        const revenueStats = await Payment.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: startDate } } },
            { $group: {
                _id: null,
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            } }
        ]);

        res.json({
            status: 'success',
            data: {
                users: {
                    total: totalUsers,
                    new: newUsers,
                    byRole: usersByRole
                },
                listings: {
                    total: totalListings,
                    active: activeListings,
                    byCategory: listingsByCategory
                },
                bookings: {
                    total: totalBookings,
                    byStatus: bookingsByStatus
                },
                revenue: {
                    total: revenueStats[0]?.total || 0,
                    transactions: revenueStats[0]?.count || 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch statistics'
        });
    }
};

// GET /api/admin/reviews - Get all reviews with filters
exports.getReviews = async (req, res) => {
    try {
        const startTime = Date.now();
        const { status, limit = 50, page = 1, sort = '-createdAt' } = req.query;
        
        const filter = {};
        if (status) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);
        
        // Use lean() for faster queries and select only needed fields
        const reviews = await Review.find(filter)
            .populate('reviewer', 'name email avatar')
            .populate('reviewee', 'name email')
            .populate('listing', 'title featuredImage') // Only featuredImage, not all images
            .populate('booking', 'bookingNumber')
            .select('-__v') // Exclude version key
            .sort(sort)
            .limit(limitNum)
            .skip(skip)
            .lean(); // Use lean() for read-only queries (much faster)

        // Optimize listing images - only return featured image URL
        const optimizedReviews = reviews.map(review => {
            if (review.listing && review.listing.images) {
                // Only return first image URL if available, otherwise use featuredImage
                review.listing.image = review.listing.featuredImage || 
                    (Array.isArray(review.listing.images) && review.listing.images[0]?.url) || 
                    (typeof review.listing.images === 'string' ? review.listing.images : null);
                delete review.listing.images; // Remove full images array
            }
            return review;
        });

        const total = await Review.countDocuments(filter);

        const responseTime = Date.now() - startTime;
        if (responseTime > 1000) {
            console.warn(`⚠️ Slow admin reviews query: ${responseTime}ms`);
        }

        res.json({
            status: 'success',
            reviews: optimizedReviews,
            pagination: {
                total,
                page: parseInt(page),
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch reviews'
        });
    }
};

// PATCH /api/admin/reviews/:id/status - Update review status (approve/reject)
exports.updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, moderationNotes } = req.body;
        
        const validStatuses = ['pending', 'approved', 'rejected', 'hidden'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid status. Must be one of: pending, approved, rejected, hidden'
            });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                status: 'error',
                message: 'Review not found'
            });
        }

        review.status = status;
        if (moderationNotes) {
            review.moderationNotes = moderationNotes;
        }
        await review.save();

        // If approved, update listing stats
        if (status === 'approved') {
            try {
                // Import the updateListingStats function
                const reviewsController = require('./reviewsController');
                // Check if it's exported (it might be a private function)
                // If not exported, we'll calculate stats manually
                const Review = require('../models/Review');
                const Listing = require('../models/Listing');
                
                // Calculate and update listing stats
                const listingReviews = await Review.find({ 
                    listing: review.listing,
                    status: 'approved'
                });
                
                const totalReviews = listingReviews.length;
                const avgRating = totalReviews > 0
                    ? listingReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
                    : 0;
                
                await Listing.findByIdAndUpdate(review.listing, {
                    'stats.reviews': totalReviews,
                    'stats.averageRating': Math.round(avgRating * 10) / 10
                });
            } catch (error) {
                console.error('Error updating listing stats:', error);
                // Don't fail the request if stats update fails
            }
        }

        const updatedReview = await Review.findById(id)
            .populate('reviewer', 'name email avatar')
            .populate('reviewee', 'name email')
            .populate('listing', 'title images')
            .populate('booking', 'bookingNumber');

        res.json({
            status: 'success',
            message: `Review ${status} successfully`,
            review: updatedReview
        });
    } catch (error) {
        console.error('Error updating review status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update review status'
        });
    }
};

