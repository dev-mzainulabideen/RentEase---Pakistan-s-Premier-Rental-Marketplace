const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

class SubscriptionService {
    // Create subscription for paid account
    async createSubscription(userId, plan, paymentId) {
        const plans = {
            monthly_pkr: { amount: 500, currency: 'PKR', duration: 30 },
            monthly_usd: { amount: 7.99, currency: 'USD', duration: 30 }
        };
        
        const planDetails = plans[plan];
        if (!planDetails) {
            throw new Error('Invalid subscription plan');
        }
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + planDetails.duration);
        
        const nextBillingDate = new Date(endDate);
        
        // Create or update subscription
        let subscription = await Subscription.findOne({ user: userId });
        
        if (subscription) {
            subscription.plan = plan;
            subscription.status = 'active';
            subscription.amount = planDetails.amount;
            subscription.currency = planDetails.currency;
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.nextBillingDate = nextBillingDate;
            subscription.autoRenew = true;
            subscription.paymentHistory.push({
                paymentId,
                amount: planDetails.amount,
                currency: planDetails.currency,
                paidAt: new Date(),
                status: 'completed'
            });
            await subscription.save();
        } else {
            subscription = await Subscription.create({
                user: userId,
                plan,
                status: 'active',
                amount: planDetails.amount,
                currency: planDetails.currency,
                startDate,
                endDate,
                nextBillingDate,
                paymentHistory: [{
                    paymentId,
                    amount: planDetails.amount,
                    currency: planDetails.currency,
                    paidAt: new Date(),
                    status: 'completed'
                }]
            });
        }
        
        // Update user account type and subscription
        // Direct update to bypass pre-save hook validation (we control this transition)
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Update account type and subscription
        user.accountType = 'paid';
        user.subscription.status = 'active';
        user.subscription.plan = plan;
        user.subscription.startDate = startDate;
        user.subscription.endDate = endDate;
        user.subscription.nextBillingDate = nextBillingDate;
        user.subscription.lastPaymentDate = new Date();
        user.verification = user.verification || {};
        user.verification.status = 'verified';
        user.verification.verifiedAt = new Date();
        user.verified = true;
        user.adDisplaySettings = user.adDisplaySettings || {};
        user.adDisplaySettings.adsEnabled = false;
        
        await user.save({ validateBeforeSave: true });
        
        console.log(`✅ User ${userId} upgraded to paid account`);
        
        return subscription;
    }
    
    // Check if subscription is active
    async isSubscriptionActive(userId) {
        const user = await User.findById(userId);
        if (!user) return false;
        
        if (user.accountType === 'paid' && user.subscription.status === 'active') {
            const now = new Date();
            if (user.subscription.endDate && user.subscription.endDate > now) {
                return true;
            } else {
                // Subscription expired, update status
                await this.handleSubscriptionExpiry(userId);
                return false;
            }
        }
        
        return false;
    }
    
    // Handle subscription expiry
    async handleSubscriptionExpiry(userId) {
        const user = await User.findById(userId);
        
        if (user.subscription.autoRenew) {
            // Attempt auto-renewal
            // This would trigger payment processing in production
            // For now, we'll just mark as expired
            await User.findByIdAndUpdate(userId, {
                'subscription.status': 'expired'
            });
        } else {
            // Downgrade to free account
            const user = await User.findById(userId);
            if (user) {
                user.accountType = 'free';
                user.subscription.status = 'expired';
                user.adDisplaySettings = user.adDisplaySettings || {};
                user.adDisplaySettings.adsEnabled = true;
                user.adDisplaySettings.adsExpiryDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
                user.verification = user.verification || {};
                user.verification.status = 'not_verified';
                user.verified = false;
                
                await user.save({ validateBeforeSave: true });
                console.log(`✅ User ${userId} downgraded to free account`);
            }
        }
    }
    
    // Cancel subscription
    async cancelSubscription(userId, reason) {
        await Subscription.findOneAndUpdate(
            { user: userId },
            {
                status: 'cancelled',
                cancellationRequestedAt: new Date(),
                cancellationReason: reason,
                autoRenew: false
            }
        );
        
        // User remains paid until endDate, then downgrades
        const user = await User.findById(userId);
        if (user.subscription.endDate < new Date()) {
            await this.handleSubscriptionExpiry(userId);
        } else {
            // Disable auto-renewal
            await User.findByIdAndUpdate(userId, {
                'subscription.autoRenew': false
            });
        }
    }
    
    // Get subscription status
    async getSubscriptionStatus(userId) {
        const user = await User.findById(userId).select('accountType subscription verification');
        if (!user) {
            return {
                accountType: 'free',
                subscriptionActive: false,
                verificationStatus: 'not_verified'
            };
        }
        
        const isActive = await this.isSubscriptionActive(userId);
        
        return {
            accountType: user.accountType,
            subscriptionActive: isActive,
            subscription: user.subscription,
            verificationStatus: user.verification?.status || 'not_verified'
        };
    }
}

module.exports = SubscriptionService;

