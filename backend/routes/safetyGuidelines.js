const express = require('express');
const router = express.Router();
const {
    getAllGuidelines,
    getCategoryGuidelines
} = require('../controllers/safetyGuidelinesController');

// Public routes (no authentication required)
router.get('/', getAllGuidelines);
router.get('/:category', getCategoryGuidelines);

module.exports = router;

