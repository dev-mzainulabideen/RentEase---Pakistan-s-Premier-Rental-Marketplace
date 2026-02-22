const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createSubscription,
    getSubscriptionStatus,
    cancelSubscription
} = require('../controllers/subscriptionController');
const {
    processSubscriptionPayment
} = require('../controllers/subscriptionPaymentController');

// All routes require authentication
router.post('/', protect, createSubscription);
router.post('/payment', protect, processSubscriptionPayment); // New payment endpoint
router.get('/status', protect, getSubscriptionStatus);
router.post('/cancel', protect, cancelSubscription);

module.exports = router;

