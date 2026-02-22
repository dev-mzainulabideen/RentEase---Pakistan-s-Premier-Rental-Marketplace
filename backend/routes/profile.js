const express = require('express');
const auth = require('../middleware/auth');
const {
    getProfile,
    updateProfile,
    updatePassword,
    updateNotificationSettings,
    updatePreferences,
} = require('../controllers/profileController');

const router = express.Router();

// GET /api/profile - current user profile
router.get('/', auth, getProfile);

// PUT /api/profile - update profile
router.put('/', auth, updateProfile);

// PUT /api/profile/password - change password
router.put('/password', auth, updatePassword);

// PUT /api/profile/settings/notifications - notification preferences
router.put('/settings/notifications', auth, updateNotificationSettings);

// PUT /api/profile/settings/preferences - language/timezone
router.put('/settings/preferences', auth, updatePreferences);

module.exports = router;


