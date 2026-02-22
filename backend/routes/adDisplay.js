const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
    getAdsForPage,
    checkAdDisplayStatus
} = require('../controllers/adDisplayController');

// Get ads for page (optional auth for guests)
router.get('/ads', optionalAuth, getAdsForPage);

// Check ad display status (requires auth)
router.get('/status', protect, checkAdDisplayStatus);

module.exports = router;

