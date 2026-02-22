const express = require('express');
const { create, getById } = require('../controllers/paymentsController');
const {
    handleJazzCashWebhook,
    handleEasypaisaWebhook,
    handleCardWebhook,
    handleGenericWebhook
} = require('../controllers/paymentWebhooksController');
const auth = require('../middleware/auth');

const router = express.Router();

// Payment routes (require authentication)
router.use(auth);
router.post('/', create);
router.get('/:id', getById);

// Webhook routes (NO authentication - gateways call these directly)
// In production, verify webhook signatures instead
router.post('/webhooks/jazzcash', handleJazzCashWebhook);
router.post('/webhooks/easypaisa', handleEasypaisaWebhook);
router.post('/webhooks/card', handleCardWebhook);
router.post('/webhooks/generic', handleGenericWebhook); // For testing

module.exports = router;

