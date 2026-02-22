const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { getPaymentGateway } = require('../services/paymentGateways');

// POST /api/payments - Create payment and process via gateway
exports.create = async (req, res) => {
    try {
        const {
            bookingId,
            paymentMethod,
            cardNumber,
            cardExpiry,
            cardCVV,
            cardName,
            jazzcashNumber,
            jazzcashPin,
            easypaisaNumber,
            easypaisaPin,
            bankName,
            accountNumber,
        } = req.body;

        if (!bookingId || !paymentMethod) {
            return res.status(400).json({
                status: 'error',
                message: 'bookingId and paymentMethod are required',
            });
        }

        // Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }

        // Check authorization - must be the renter of this booking
        const userId = String(req.user._id);
        if (String(booking.renter) !== userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to pay for this booking',
            });
        }

        // Check if already paid
        if (booking.payment?.status === 'paid') {
            return res.status(400).json({
                status: 'error',
                message: 'This booking has already been paid',
            });
        }

        // Generate unique paymentId and transaction ID
        const paymentCount = await Payment.countDocuments();
        const paymentId = `PAY${Date.now()}${String(paymentCount + 1).padStart(6, '0')}`;
        const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Normalize payment method
        const normalizedMethod = paymentMethod === 'bank' ? 'bank_transfer' : paymentMethod;

        // Create payment record with 'processing' status
        const payment = await Payment.create({
            paymentId,
            user: booking.renter,
            booking: booking._id,
            type: 'booking',
            amount: booking.pricing.total,
            currency: booking.pricing.currency || 'PKR',
            method: normalizedMethod,
            status: 'processing', // Start as processing
            paymentDetails: {
                transactionId,
                referenceNumber: paymentId,
                cardLast4: cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : null,
                accountNumber: jazzcashNumber || easypaisaNumber || (accountNumber ? `****${accountNumber.slice(-4)}` : null),
            },
        });

        // Process payment via gateway
        let gatewayResult;
        try {
            const gateway = getPaymentGateway(normalizedMethod);
            
            const paymentData = {
                amount: booking.pricing.total,
                currency: booking.pricing.currency || 'PKR',
                transactionId,
                description: `Booking payment for ${booking.bookingNumber}`,
            };

            // Add method-specific data
            if (normalizedMethod === 'jazzcash') {
                paymentData.accountNumber = jazzcashNumber;
                paymentData.mpin = jazzcashPin;
            } else if (normalizedMethod === 'easypaisa') {
                paymentData.accountNumber = easypaisaNumber;
                paymentData.mpin = easypaisaPin;
            } else if (normalizedMethod === 'card') {
                paymentData.cardNumber = cardNumber;
                paymentData.cardExpiry = cardExpiry;
                paymentData.cardCVV = cardCVV;
                paymentData.cardName = cardName;
            }

            // Process payment
            gatewayResult = await gateway.processPayment(paymentData);

            // Update payment based on gateway response
            if (gatewayResult.success) {
                payment.status = 'completed';
                payment.completedAt = new Date();
                payment.gatewayResponse = {
                    success: true,
                    message: gatewayResult.message || 'Payment processed successfully',
                    transactionId: gatewayResult.gatewayTransactionId || transactionId,
                    rawResponse: gatewayResult.rawResponse
                };

                // Update booking
                booking.payment.status = 'paid';
                booking.payment.method = normalizedMethod;
                booking.payment.paidAmount = booking.pricing.total;
                booking.payment.paidAt = new Date();
                booking.payment.transactionId = gatewayResult.gatewayTransactionId || transactionId;

                if (booking.status === 'pending') {
                    booking.status = 'confirmed';
                    booking.confirmedAt = new Date();
                }

                await booking.save();

                console.log('✅ Payment successful:', payment.paymentId, '| Gateway TXN:', gatewayResult.gatewayTransactionId);

                res.status(201).json({
                    status: 'success',
                    payment: {
                        id: payment._id,
                        paymentId: payment.paymentId,
                        amount: payment.amount,
                        currency: payment.currency,
                        method: payment.method,
                        status: payment.status,
                        transactionId: gatewayResult.gatewayTransactionId || transactionId,
                        completedAt: payment.completedAt,
                        booking: {
                            id: booking._id,
                            bookingNumber: booking.bookingNumber,
                            status: booking.status,
                        },
                    },
                    message: 'Payment processed successfully',
                });
            } else {
                // Payment failed
                payment.status = 'failed';
                payment.failedAt = new Date();
                payment.gatewayResponse = {
                    success: false,
                    message: gatewayResult.error || gatewayResult.message || 'Payment processing failed',
                    transactionId,
                    rawResponse: gatewayResult.rawResponse
                };
                await payment.save();

                console.error('❌ Payment failed:', payment.paymentId, '| Error:', gatewayResult.error);

                res.status(400).json({
                    status: 'error',
                    message: gatewayResult.error || gatewayResult.message || 'Payment processing failed',
                    payment: {
                        id: payment._id,
                        paymentId: payment.paymentId,
                        status: payment.status,
                    },
                });
            }
        } catch (gatewayError) {
            // Gateway error
            payment.status = 'failed';
            payment.failedAt = new Date();
            payment.gatewayResponse = {
                success: false,
                message: gatewayError.message || 'Payment gateway error',
                transactionId,
            };
            await payment.save();

            console.error('❌ Gateway error:', gatewayError);

            res.status(500).json({
                status: 'error',
                message: gatewayError.message || 'Payment gateway error',
            });
        }
    } catch (err) {
        console.error('Create payment error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to process payment' });
    }
};

// GET /api/payments/:id - Get payment details
exports.getById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('booking', 'bookingNumber checkIn checkOut pricing renter owner')
            .populate('user', 'name email');

        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Payment not found' });
        }

        // Authorization: only the user who made the payment can view it
        const userId = String(req.user._id);
        if (String(payment.user._id) !== userId) {
            // Also allow booking owner to view
            const booking = payment.booking;
            if (!booking || String(booking.owner) !== userId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Not authorized to view this payment',
                });
            }
        }

        res.json({ status: 'success', payment });
    } catch (err) {
        console.error('Get payment error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load payment' });
    }
};

// Helper: Detect card brand from number
function detectCardBrand(cardNumber) {
    const cleaned = (cardNumber || '').replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'American Express';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    return 'Unknown';
}

module.exports = exports;
