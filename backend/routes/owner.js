const express = require('express');
const { getStats, getEarnings, getDashboard } = require('../controllers/ownerController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Owner statistics
router.get('/stats', getStats);

// Earnings breakdown
router.get('/earnings', getEarnings);

// Dashboard summary
router.get('/dashboard', getDashboard);

module.exports = router;



