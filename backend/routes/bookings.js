const express = require('express');
const auth = require('../middleware/auth');
const {
    listForCurrentUser,
    getById,
    create,
    cancel,
    accept,
    decline,
    cancelByOwner,
    complete,
} = require('../controllers/bookingsController');

const router = express.Router();

// All booking routes require authentication
router.use(auth);

// General booking routes
router.get('/', listForCurrentUser);          // GET /api/bookings?role=renter|owner
router.get('/:id', getById);                  // GET /api/bookings/:id
router.post('/', create);                     // POST /api/bookings

// Renter actions
router.patch('/:id/cancel', cancel);          // PATCH /api/bookings/:id/cancel (renter cancels)

// Owner actions
router.patch('/:id/accept', accept);          // PATCH /api/bookings/:id/accept (owner accepts)
router.patch('/:id/decline', decline);        // PATCH /api/bookings/:id/decline (owner declines)
router.patch('/:id/cancel-by-owner', cancelByOwner); // PATCH /api/bookings/:id/cancel-by-owner
router.patch('/:id/complete', complete);      // PATCH /api/bookings/:id/complete (owner marks complete)

module.exports = router;

