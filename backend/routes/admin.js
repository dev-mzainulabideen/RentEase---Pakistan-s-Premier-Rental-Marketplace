const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/admin');
const adminController = require('../controllers/adminController');

// All admin routes require admin authentication
router.use(requireAdmin);

// Dashboard statistics
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/verify', adminController.verifyUser);

// Listing management
router.get('/listings', adminController.getListings);
router.patch('/listings/:id/status', adminController.updateListingStatus);
router.patch('/listings/:id/feature', adminController.toggleFeatured);

// Categories
router.get('/categories', adminController.getCategories);

// Ads management
router.get('/ads', adminController.getAds);

// Subscriptions
router.get('/subscriptions', adminController.getSubscriptions);

// Disputes
router.get('/disputes', adminController.getDisputes);

// Reviews management
router.get('/reviews', adminController.getReviews);
router.patch('/reviews/:id/status', adminController.updateReviewStatus);

// Statistics
router.get('/statistics', adminController.getStatistics);

module.exports = router;

