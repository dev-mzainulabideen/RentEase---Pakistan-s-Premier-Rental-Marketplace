const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getUserDisputes,
    getDispute,
    createDispute,
    updateDispute,
    addUpdate,
    getDisputeStats
} = require('../controllers/disputesController');

// All routes require authentication
router.use(protect);

// Get user's disputes
router.get('/', getUserDisputes);

// Get dispute statistics (admin only)
router.get('/stats', getDisputeStats);

// Get single dispute
router.get('/:id', getDispute);

// Create new dispute
router.post('/', createDispute);

// Update dispute
router.patch('/:id', updateDispute);

// Add update/note to dispute
router.post('/:id/updates', addUpdate);

module.exports = router;

