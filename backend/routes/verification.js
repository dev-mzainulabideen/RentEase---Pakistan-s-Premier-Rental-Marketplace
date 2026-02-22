const express = require('express');
const {
    submitIDVerification,
    submitBiometricVerification,
    submitFaceVerification,
    getVerificationStatus
} = require('../controllers/verificationController');
const auth = require('../middleware/auth');

const router = express.Router();

// All verification routes require authentication
router.post('/id', auth, submitIDVerification);
router.post('/biometric', auth, submitBiometricVerification);
router.post('/face', auth, submitFaceVerification);
router.get('/status', auth, getVerificationStatus);

module.exports = router;

