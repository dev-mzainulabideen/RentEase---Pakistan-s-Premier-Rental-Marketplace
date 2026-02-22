/**
 * Payment Webhook Handler
 * Handles payment confirmations from payment gateways
 * For course project - simulates webhook processing
 */

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const crypto = require('crypto');

/**
 * Verify webhook signature (for security)
 * In production, verify signature from gateway
 */
function verifyWebhookSignature(payload, signature, secret) {
    // In production, use gateway-specific signature verification
    // Example for Stripe: stripe.webhooks.constructEvent(payload, signature, secret)
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * POST /api/payments/webhooks/jazzcash
 * Handle JazzCash webhook
 */
exports.handleJazzCashWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.JAZZCASH_WEBHOOK_SECRET || 'test_secret';
        const signature = req.headers['x-jazzcash-signature'] || '';

        // Verify webhook signature (in production)
        // const isValid = verifyWebhookSignature(req.body, signature, webhookSecret);
        // if (!isValid) {
        //     return res.status(401).json({ status: 'error', message: 'Invalid signature' });
        // }

        const {
            transactionId,
            gatewayTransactionId,
            status,
            amount,
            currency
        } = req.body;

        // Find payment by transaction ID
        const payment = await Payment.findOne({
            'paymentDetails.transactionId': transactionId
        });

        if (!payment) {
            console.error('Payment not found for webhook:', transactionId);
            return res.status(404).json({ status: 'error', message: 'Payment not found' });
        }

        // Update payment status
        if (status === 'completed' || status === 'success') {
            payment.status = 'completed';
            payment.completedAt = new Date();
            payment.gatewayResponse = {
                success: true,
                message: 'Payment confirmed via webhook',
                transactionId: gatewayTransactionId,
                rawResponse: req.body
            };

            // Update booking
            if (payment.booking) {
                const booking = await Booking.findById(payment.booking);
                if (booking) {
                    booking.payment.status = 'paid';
                    booking.payment.paidAt = new Date();
                    booking.payment.transactionId = gatewayTransactionId;
                    
                    if (booking.status === 'pending') {
                        booking.status = 'confirmed';
                        booking.confirmedAt = new Date();
                    }
                    
                    await booking.save();
                }
            }
        } else if (status === 'failed' || status === 'declined') {
            payment.status = 'failed';
            payment.failedAt = new Date();
            payment.gatewayResponse = {
                success: false,
                message: 'Payment failed',
                transactionId: gatewayTransactionId,
                rawResponse: req.body
            };
        }

        await payment.save();

        console.log('✅ Webhook processed:', transactionId, '| Status:', status);

        res.json({ status: 'success', message: 'Webhook processed' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
    }
};

/**
 * POST /api/payments/webhooks/easypaisa
 * Handle Easypaisa webhook
 */
exports.handleEasypaisaWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.EASYPAISA_WEBHOOK_SECRET || 'test_secret';
        const signature = req.headers['x-easypaisa-signature'] || '';

        // Verify signature in production

        const {
            transactionId,
            gatewayTransactionId,
            status,
            amount,
            currency
        } = req.body;

        const payment = await Payment.findOne({
            'paymentDetails.transactionId': transactionId
        });

        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Payment not found' });
        }

        if (status === 'completed' || status === 'success') {
            payment.status = 'completed';
            payment.completedAt = new Date();
            payment.gatewayResponse = {
                success: true,
                message: 'Payment confirmed via Easypaisa webhook',
                transactionId: gatewayTransactionId,
                rawResponse: req.body
            };

            if (payment.booking) {
                const booking = await Booking.findById(payment.booking);
                if (booking) {
                    booking.payment.status = 'paid';
                    booking.payment.paidAt = new Date();
                    booking.payment.transactionId = gatewayTransactionId;
                    
                    if (booking.status === 'pending') {
                        booking.status = 'confirmed';
                        booking.confirmedAt = new Date();
                    }
                    
                    await booking.save();
                }
            }
        } else if (status === 'failed') {
            payment.status = 'failed';
            payment.failedAt = new Date();
            payment.gatewayResponse = {
                success: false,
                message: 'Payment failed',
                transactionId: gatewayTransactionId,
                rawResponse: req.body
            };
        }

        await payment.save();

        console.log('✅ Easypaisa webhook processed:', transactionId);

        res.json({ status: 'success', message: 'Webhook processed' });
    } catch (error) {
        console.error('Easypaisa webhook error:', error);
        res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
    }
};

/**
 * POST /api/payments/webhooks/card
 * Handle card payment webhook (Stripe/PayPal)
 */
exports.handleCardWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.CARD_WEBHOOK_SECRET || 'test_secret';
        const signature = req.headers['stripe-signature'] || req.headers['x-paypal-signature'] || '';

        // Verify signature in production
        // For Stripe: const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

        const {
            transactionId,
            gatewayTransactionId,
            status,
            amount,
            currency,
            eventType // 'charge.succeeded', 'charge.failed', etc.
        } = req.body;

        const payment = await Payment.findOne({
            'paymentDetails.transactionId': transactionId
        });

        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Payment not found' });
        }

        if (eventType === 'charge.succeeded' || status === 'succeeded' || status === 'completed') {
            payment.status = 'completed';
            payment.completedAt = new Date();
            payment.gatewayResponse = {
                success: true,
                message: 'Payment confirmed via card webhook',
                transactionId: gatewayTransactionId,
                rawResponse: req.body
            };

            if (payment.booking) {
                const booking = await Booking.findById(payment.booking);
                if (booking) {
                    booking.payment.status = 'paid';
                    booking.payment.paidAt = new Date();
                    booking.payment.transactionId = gatewayTransactionId;
                    
                    if (booking.status === 'pending') {
                        booking.status = 'confirmed';
                        booking.confirmedAt = new Date();
                    }
                    
                    await booking.save();
                }
            }
        } else if (eventType === 'charge.failed' || status === 'failed') {
            payment.status = 'failed';
            payment.failedAt = new Date();
            payment.gatewayResponse = {
                success: false,
                message: 'Payment failed',
                transactionId: gatewayTransactionId,
                rawResponse: req.body
            };
        }

        await payment.save();

        console.log('✅ Card webhook processed:', transactionId);

        res.json({ status: 'success', message: 'Webhook processed' });
    } catch (error) {
        console.error('Card webhook error:', error);
        res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
    }
};

/**
 * Generic webhook handler (for testing)
 */
exports.handleGenericWebhook = async (req, res) => {
    try {
        const { transactionId, status, gateway } = req.body;

        const payment = await Payment.findOne({
            'paymentDetails.transactionId': transactionId
        });

        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Payment not found' });
        }

        if (status === 'completed' || status === 'success') {
            payment.status = 'completed';
            payment.completedAt = new Date();
        } else if (status === 'failed') {
            payment.status = 'failed';
            payment.failedAt = new Date();
        }

        await payment.save();

        res.json({ status: 'success', message: 'Webhook processed' });
    } catch (error) {
        console.error('Generic webhook error:', error);
        res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
    }
};


