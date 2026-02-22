/**
 * SMS Service - Simulated SMS Gateway
 * For development/testing purposes only
 * In production, integrate with actual SMS gateway (JazzCash, Easypaisa, Twilio, etc.)
 */

class SMSService {
    /**
     * Send OTP via SMS (simulated)
     * @param {String} phoneNumber - Phone number to send SMS to
     * @param {String} otp - OTP code to send
     * @returns {Promise<Object>} Result object
     */
    async sendOTP(phoneNumber, otp) {
        try {
            // Simulate SMS sending delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // In production, this would call an actual SMS gateway:
            // Example with Twilio:
            // const twilio = require('twilio');
            // const client = twilio(accountSid, authToken);
            // await client.messages.create({
            //     body: `Your verification code is: ${otp}`,
            //     from: '+1234567890',
            //     to: phoneNumber
            // });

            // For development: Log to console
            console.log(`📱 [SMS SIMULATION] Sending OTP to ${phoneNumber}: ${otp}`);
            console.log(`   Message: "Your verification code is: ${otp}. Valid for 10 minutes."`);

            // Simulate success
            return {
                success: true,
                messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                message: 'OTP sent successfully (simulated)'
            };
        } catch (error) {
            console.error('SMS sending error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send SMS'
            };
        }
    }

    /**
     * Send notification SMS (simulated)
     * @param {String} phoneNumber - Phone number to send SMS to
     * @param {String} message - Message to send
     * @returns {Promise<Object>} Result object
     */
    async sendNotification(phoneNumber, message) {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log(`📱 [SMS SIMULATION] Sending notification to ${phoneNumber}:`);
            console.log(`   "${message}"`);

            return {
                success: true,
                messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        } catch (error) {
            console.error('SMS notification error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send SMS'
            };
        }
    }
}

module.exports = new SMSService();

