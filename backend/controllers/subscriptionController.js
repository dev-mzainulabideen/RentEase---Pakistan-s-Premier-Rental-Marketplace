const SubscriptionService = require('../services/subscriptionService');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Create subscription
exports.createSubscription = async (req, res) => {
    try {
        const { plan, paymentMethod, paymentDetails } = req.body;
        const userId = req.user._id;
        
        if (!plan || !['monthly_pkr', 'monthly_usd'].includes(plan)) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid subscription plan is required'
            });
        }
        
        // Create payment record
        const planAmounts = {
            monthly_pkr: 500,
            monthly_usd: 7.99
        };
        
        const payment = await Payment.create({
            user: userId,
            type: 'subscription',
            amount: planAmounts[plan],
            currency: plan === 'monthly_pkr' ? 'PKR' : 'USD',
            method: paymentMethod || 'card',
            status: 'completed',
            paymentDetails: paymentDetails || {}
        });
        
        // Create subscription
        const subscriptionService = new SubscriptionService();
        const subscription = await subscriptionService.createSubscription(
            userId,
            plan,
            payment._id
        );
        
        res.json({
            status: 'success',
            message: 'Subscription created successfully',
            data: { subscription }
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create subscription'
        });
    }
};

// Get subscription status
exports.getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const subscriptionService = new SubscriptionService();
        const status = await subscriptionService.getSubscriptionStatus(userId);
        
        res.json({
            status: 'success',
            data: status
        });
    } catch (error) {
        console.error('Error getting subscription status:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get subscription status'
        });
    }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
    try {
        const { reason } = req.body;
        const userId = req.user._id;
        
        const subscriptionService = new SubscriptionService();
        await subscriptionService.cancelSubscription(userId, reason);
        
        res.json({
            status: 'success',
            message: 'Subscription cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to cancel subscription'
        });
    }
};

