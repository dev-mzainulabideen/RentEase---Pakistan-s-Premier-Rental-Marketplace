/**
 * Payment Gateway Integration Services
 * For Course Project - Simulated Gateway Integration
 * 
 * In production, these would connect to actual payment gateways:
 * - JazzCash: https://sandbox.jazzcash.com.pk/
 * - Easypaisa: https://easypaisa.com.pk/
 * - Cards: Stripe, PayPal, or local card processors
 */

const crypto = require('crypto');

/**
 * JazzCash Payment Gateway Integration
 * Simulated for course project - replace with actual JazzCash SDK in production
 */
class JazzCashGateway {
    constructor() {
        // In production, these would come from environment variables
        this.merchantId = process.env.JAZZCASH_MERCHANT_ID || 'MC12345';
        this.password = process.env.JAZZCASH_PASSWORD || 'test_password';
        this.integritySalt = process.env.JAZZCASH_INTEGRITY_SALT || 'test_salt';
        this.apiUrl = process.env.JAZZCASH_API_URL || 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';
    }

    /**
     * Process payment via JazzCash
     * @param {Object} paymentData - Payment information
     * @returns {Promise<Object>} Payment result
     */
    async processPayment(paymentData) {
        const {
            amount,
            currency = 'PKR',
            accountNumber,
            mpin,
            transactionId,
            description = 'Booking Payment'
        } = paymentData;

        try {
            // Validate input
            if (!accountNumber || accountNumber.replace(/\s/g, '').length !== 11) {
                throw new Error('Invalid JazzCash account number');
            }

            if (!mpin || mpin.length !== 6) {
                throw new Error('Invalid MPIN');
            }

            // Simulate API call to JazzCash
            // In production, this would be an actual HTTP request to JazzCash API
            const simulatedResponse = await this.simulateJazzCashAPI({
                merchantId: this.merchantId,
                amount: amount * 100, // Convert to paisa
                currency,
                accountNumber: accountNumber.replace(/\s/g, ''),
                transactionId,
                description
            });

            return {
                success: simulatedResponse.success,
                transactionId: simulatedResponse.transactionId || transactionId,
                gatewayTransactionId: simulatedResponse.gatewayTransactionId,
                message: simulatedResponse.message,
                rawResponse: simulatedResponse
            };
        } catch (error) {
            console.error('JazzCash payment error:', error);
            return {
                success: false,
                error: error.message,
                transactionId
            };
        }
    }

    /**
     * Simulate JazzCash API call (for course project)
     * Replace with actual JazzCash SDK in production
     */
    async simulateJazzCashAPI(paymentData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test mode: Always succeed for test accounts
        // In production, this would be replaced with actual JazzCash API call
        const testAccounts = ['03001234567', '03000000000', '03123456789'];
        const isTestAccount = testAccounts.includes(paymentData.accountNumber);
        const success = isTestAccount || Math.random() > 0.1; // Test accounts always succeed, others 90% success

        if (success) {
            const gatewayTransactionId = `JC${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            return {
                success: true,
                transactionId: paymentData.transactionId,
                gatewayTransactionId,
                message: 'Payment processed successfully via JazzCash',
                status: 'completed'
            };
        } else {
            return {
                success: false,
                transactionId: paymentData.transactionId,
                message: 'Payment failed: Insufficient balance or invalid credentials',
                status: 'failed'
            };
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(transactionId) {
        // Simulate verification
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            verified: true,
            transactionId,
            status: 'completed'
        };
    }
}

/**
 * Easypaisa Payment Gateway Integration
 * Simulated for course project - replace with actual Easypaisa SDK in production
 */
class EasypaisaGateway {
    constructor() {
        this.storeId = process.env.EASYPAISA_STORE_ID || 'STORE123';
        this.apiKey = process.env.EASYPAISA_API_KEY || 'test_api_key';
        this.apiUrl = process.env.EASYPAISA_API_URL || 'https://easypay.easypaisa.com.pk/easypay/';
    }

    /**
     * Process payment via Easypaisa
     */
    async processPayment(paymentData) {
        const {
            amount,
            currency = 'PKR',
            accountNumber,
            mpin,
            transactionId,
            description = 'Booking Payment'
        } = paymentData;

        try {
            // Validate input
            if (!accountNumber || accountNumber.replace(/\s/g, '').length !== 11) {
                throw new Error('Invalid Easypaisa account number');
            }

            if (!mpin || mpin.length !== 6) {
                throw new Error('Invalid MPIN');
            }

            // Simulate API call to Easypaisa
            const simulatedResponse = await this.simulateEasypaisaAPI({
                storeId: this.storeId,
                amount,
                currency,
                accountNumber: accountNumber.replace(/\s/g, ''),
                transactionId,
                description
            });

            return {
                success: simulatedResponse.success,
                transactionId: simulatedResponse.transactionId || transactionId,
                gatewayTransactionId: simulatedResponse.gatewayTransactionId,
                message: simulatedResponse.message,
                rawResponse: simulatedResponse
            };
        } catch (error) {
            console.error('Easypaisa payment error:', error);
            return {
                success: false,
                error: error.message,
                transactionId
            };
        }
    }

    /**
     * Simulate Easypaisa API call (for course project)
     */
    async simulateEasypaisaAPI(paymentData) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test mode: Always succeed for test accounts
        const testAccounts = ['03001234567', '03000000000', '03123456789'];
        const isTestAccount = testAccounts.includes(paymentData.accountNumber);
        const success = isTestAccount || Math.random() > 0.1; // Test accounts always succeed, others 90% success

        if (success) {
            const gatewayTransactionId = `EP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            return {
                success: true,
                transactionId: paymentData.transactionId,
                gatewayTransactionId,
                message: 'Payment processed successfully via Easypaisa',
                status: 'completed'
            };
        } else {
            return {
                success: false,
                transactionId: paymentData.transactionId,
                message: 'Payment failed: Account verification failed',
                status: 'failed'
            };
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(transactionId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            verified: true,
            transactionId,
            status: 'completed'
        };
    }
}

/**
 * Card Payment Gateway Integration
 * Simulated for course project - replace with Stripe/PayPal in production
 */
class CardGateway {
    constructor() {
        this.apiKey = process.env.CARD_API_KEY || 'test_api_key';
        this.secretKey = process.env.CARD_SECRET_KEY || 'test_secret_key';
        // In production, use Stripe: const stripe = require('stripe')(this.secretKey);
    }

    /**
     * Process card payment
     */
    async processPayment(paymentData) {
        const {
            amount,
            currency = 'PKR',
            cardNumber,
            cardExpiry,
            cardCVV,
            cardName,
            transactionId,
            description = 'Booking Payment'
        } = paymentData;

        try {
            // Validate card
            const validation = this.validateCard(cardNumber, cardExpiry, cardCVV);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Simulate API call to card processor
            const simulatedResponse = await this.simulateCardAPI({
                amount,
                currency,
                cardNumber: cardNumber.replace(/\s/g, ''),
                cardExpiry,
                cardCVV,
                cardName,
                transactionId,
                description
            });

            return {
                success: simulatedResponse.success,
                transactionId: simulatedResponse.transactionId || transactionId,
                gatewayTransactionId: simulatedResponse.gatewayTransactionId,
                message: simulatedResponse.message,
                cardBrand: validation.brand,
                rawResponse: simulatedResponse
            };
        } catch (error) {
            console.error('Card payment error:', error);
            return {
                success: false,
                error: error.message,
                transactionId
            };
        }
    }

    /**
     * Validate card details
     */
    validateCard(cardNumber, cardExpiry, cardCVV) {
        const cleaned = (cardNumber || '').replace(/\s/g, '');

        // Luhn algorithm check
        if (!this.luhnCheck(cleaned)) {
            return { valid: false, error: 'Invalid card number' };
        }

        // Check expiry
        const [month, year] = (cardExpiry || '').split('/');
        if (!month || !year || month.length !== 2 || year.length !== 2) {
            return { valid: false, error: 'Invalid expiry date format' };
        }

        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        if (expiryDate < new Date()) {
            return { valid: false, error: 'Card has expired' };
        }

        // Check CVV
        if (!cardCVV || cardCVV.length < 3 || cardCVV.length > 4) {
            return { valid: false, error: 'Invalid CVV' };
        }

        // Detect card brand
        let brand = 'Unknown';
        if (/^4/.test(cleaned)) brand = 'Visa';
        else if (/^5[1-5]/.test(cleaned)) brand = 'Mastercard';
        else if (/^3[47]/.test(cleaned)) brand = 'American Express';
        else if (/^6(?:011|5)/.test(cleaned)) brand = 'Discover';

        return { valid: true, brand };
    }

    /**
     * Luhn algorithm for card validation
     */
    luhnCheck(cardNumber) {
        let sum = 0;
        let isEven = false;

        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    }

    /**
     * Simulate card API call (for course project)
     * In production, replace with Stripe: await stripe.charges.create({...})
     */
    async simulateCardAPI(paymentData) {
        await new Promise(resolve => setTimeout(resolve, 1500));

        // For test mode: Always succeed with test card numbers
        // In production, this would be actual card validation
        const cleanedCard = paymentData.cardNumber.replace(/\s/g, '');
        const testCards = ['4242424242424242', '4000000000000002', '4000000000009995'];
        
        let success = true;
        let message = 'Payment processed successfully';

        // Test mode: Accept common test cards, reject others
        if (testCards.includes(cleanedCard) || cleanedCard.startsWith('4242')) {
            // Test card - always succeed
            success = true;
            message = 'Payment processed successfully (Test Mode)';
        } else {
            // For non-test cards, simulate random failures
            const random = Math.random();
            if (random < 0.05) {
                success = false;
                message = 'Card declined: Insufficient funds';
            } else if (random < 0.08) {
                success = false;
                message = 'Card declined: Invalid CVV';
            } else if (random < 0.1) {
                success = false;
                message = 'Card declined: Expired card';
            }
        }

        if (success) {
            const gatewayTransactionId = `CARD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            return {
                success: true,
                transactionId: paymentData.transactionId,
                gatewayTransactionId,
                message,
                status: 'completed',
                cardLast4: paymentData.cardNumber.slice(-4)
            };
        } else {
            return {
                success: false,
                transactionId: paymentData.transactionId,
                message,
                status: 'failed'
            };
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(transactionId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            verified: true,
            transactionId,
            status: 'completed'
        };
    }
}

/**
 * Payment Gateway Factory
 * Returns appropriate gateway instance based on method
 */
function getPaymentGateway(method) {
    switch (method) {
        case 'jazzcash':
            return new JazzCashGateway();
        case 'easypaisa':
            return new EasypaisaGateway();
        case 'card':
            return new CardGateway();
        default:
            throw new Error(`Unsupported payment method: ${method}`);
    }
}

module.exports = {
    JazzCashGateway,
    EasypaisaGateway,
    CardGateway,
    getPaymentGateway
};


