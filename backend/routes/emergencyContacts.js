const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getUserEmergencyContacts,
    createEmergencyContact,
    getEmergencyContact,
    updateEmergencyContact,
    getEmergencyStats
} = require('../controllers/emergencyContactsController');

// All routes require authentication
router.use(auth);

// GET /api/emergency-contacts/stats - Get user's emergency contact statistics
router.get('/stats', getEmergencyStats);

// GET /api/emergency-contacts - Get user's emergency contacts
router.get('/', getUserEmergencyContacts);

// POST /api/emergency-contacts - Create new emergency contact
router.post('/', createEmergencyContact);

// GET /api/emergency-contacts/:id - Get single emergency contact
router.get('/:id', getEmergencyContact);

// PUT /api/emergency-contacts/:id - Update emergency contact
router.put('/:id', updateEmergencyContact);

module.exports = router;

