const express = require('express');
const {
    list,
    create,
    getById,
    getOwnerListings,
    update,
    updateStatus,
    deleteListing,
    getAvailability,
    getSimilarListings,
} = require('../controllers/listingsController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', list);

// Owner routes (authenticated) - must be before /:id to avoid matching
router.get('/owner/me', auth, getOwnerListings);

// Availability check (public) - must be before /:id
router.get('/:id/availability', getAvailability);

// Similar listings (public) - must be before /:id
router.get('/:id/similar', getSimilarListings);

// Single listing by ID (public)
router.get('/:id', getById);

// Listing CRUD (authenticated)
router.post('/', auth, create);
router.put('/:id', auth, update);
router.patch('/:id/status', auth, updateStatus);
router.delete('/:id', auth, deleteListing);

module.exports = router;
