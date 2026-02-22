const SubscriptionService = require('../services/subscriptionService');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { getPaymentGateway } = require('../services/paymentGateways');

/**
 * Process subscription payment and create subscription
 */
exports.processSubscriptionPayment = async (req, res) => {
    try {
        const {
            plan,
            paymentMethod,
            // Card details
            cardNumber,
            cardExpiry,
            cardCVV,
            cardName,
            // JazzCash details
            jazzcashNumber,
            jazzcashPin,
            // Easypaisa details
            easypaisaNumber,
            easypaisaPin
        } = req.body;
        
        const userId = req.user._id;
        
        // Validate plan
        if (!plan || !['monthly_pkr', 'monthly_usd'].includes(plan)) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid subscription plan is required'
            });
        }
        
        // Validate payment method
        if (!paymentMethod || !['card', 'jazzcash', 'easypaisa'].includes(paymentMethod)) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid payment method is required'
            });
        }
        
        // Get plan details
        const planAmounts = {
            monthly_pkr: { amount: 500, currency: 'PKR' },
            monthly_usd: { amount: 7.99, currency: 'USD' }
        };
        
        const planDetails = planAmounts[plan];
        
        // Prepare payment data based on method
        let paymentData = {
            amount: planDetails.amount,
            currency: planDetails.currency,
            transactionId: `SUB${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            description: `Subscription payment - ${plan}`
        };
        
        // Add method-specific data
        if (paymentMethod === 'card') {
            if (!cardNumber || !cardExpiry || !cardCVV || !cardName) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Card details are required'
                });
            }
            paymentData.cardNumber = cardNumber;
            paymentData.cardExpiry = cardExpiry;
            paymentData.cardCVV = cardCVV;
            paymentData.cardName = cardName;
        } else if (paymentMethod === 'jazzcash') {
            if (!jazzcashNumber || !jazzcashPin) {
                return res.status(400).json({
                    status: 'error',
                    message: 'JazzCash account number and PIN are required'
                });
            }
            paymentData.accountNumber = jazzcashNumber;
            paymentData.mpin = jazzcashPin;
        } else if (paymentMethod === 'easypaisa') {
            if (!easypaisaNumber || !easypaisaPin) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Easypaisa account number and PIN are required'
                });
            }
            paymentData.accountNumber = easypaisaNumber;
            paymentData.mpin = easypaisaPin;
        }
        
        // Generate payment ID before creating payment record
        const paymentCount = await Payment.countDocuments();
        const paymentId = `PAY${Date.now()}${String(paymentCount + 1).padStart(6, '0')}`;
        
        // Create payment record with 'processing' status
        const payment = await Payment.create({
            paymentId: paymentId, // Explicitly set paymentId
            user: userId,
            type: 'subscription',
            amount: planDetails.amount,
            currency: planDetails.currency,
            method: paymentMethod,
            status: 'processing',
            paymentDetails: {
                transactionId: paymentData.transactionId,
                cardLast4: cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : null,
                accountNumber: (jazzcashNumber || easypaisaNumber) ? 
                    `${(jazzcashNumber || easypaisaNumber).replace(/\s/g, '').slice(0, 3)}****${(jazzcashNumber || easypaisaNumber).replace(/\s/g, '').slice(-4)}` : null
            }
        });
        
        // Process payment via gateway
        let gatewayResult;
        try {
            const gateway = getPaymentGateway(paymentMethod);
            gatewayResult = await gateway.processPayment(paymentData);
        } catch (gatewayError) {
            console.error('Gateway error:', gatewayError);
            await Payment.findByIdAndUpdate(payment._id, {
                status: 'failed',
                failedAt: new Date(),
                gatewayResponse: {
                    success: false,
                    message: gatewayError.message
                }
            });
            
            return res.status(400).json({
                status: 'error',
                message: gatewayError.message || 'Payment processing failed'
            });
        }
        
        // Update payment record
        if (gatewayResult.success) {
            await Payment.findByIdAndUpdate(payment._id, {
                status: 'completed',
                completedAt: new Date(),
                paymentDetails: {
                    ...payment.paymentDetails,
                    gatewayTransactionId: gatewayResult.gatewayTransactionId
                },
                gatewayResponse: {
                    success: true,
                    transactionId: gatewayResult.transactionId,
                    message: gatewayResult.message,
                    rawResponse: gatewayResult.rawResponse
                }
            });
            
            // Create subscription
            const subscriptionService = new SubscriptionService();
            const subscription = await subscriptionService.createSubscription(
                userId,
                plan,
                payment._id
            );
            
            return res.json({
                status: 'success',
                message: 'Subscription activated successfully',
                data: {
                    subscription,
                    payment: {
                        id: payment._id,
                        transactionId: paymentData.transactionId,
                        gatewayTransactionId: gatewayResult.gatewayTransactionId
                    }
                }
            });
        } else {
            // Payment failed
            await Payment.findByIdAndUpdate(payment._id, {
                status: 'failed',
                failedAt: new Date(),
                gatewayResponse: {
                    success: false,
                    message: gatewayResult.message || gatewayResult.error,
                    rawResponse: gatewayResult
                }
            });
            
            return res.status(400).json({
                status: 'error',
                message: gatewayResult.message || gatewayResult.error || 'Payment failed'
            });
        }
    } catch (error) {
        console.error('Error processing subscription payment:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to process subscription payment'
        });
    }
};

