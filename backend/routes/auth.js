const express = require('express');
const {
    register,
    login,
    me,
    sendVerificationEmail,
    verifyEmail,
    sendOtp,
    verifyOtp,
} = require('../controllers/authController');
const {
    googleAuth,
    googleCallback,
    facebookAuth,
    facebookCallback
} = require('../controllers/oauthController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.post('/send-verification-email', auth, sendVerificationEmail);
router.post('/verify-email', verifyEmail);
router.post('/send-otp', auth, sendOtp);
router.post('/verify-otp', auth, verifyOtp);

// OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/facebook', facebookAuth);
router.get('/facebook/callback', facebookCallback);

module.exports = router;
