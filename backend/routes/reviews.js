const express = require('express');
const { create, list, getById, respond, deleteResponse } = require('../controllers/reviewsController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public: List reviews
router.get('/', list);
router.get('/:id', getById);

// Protected: Create review (renters only)
router.post('/', auth, create);

// Protected: Owner responds to review
router.patch('/:id/respond', auth, respond);

// Protected: Owner deletes their response
router.delete('/:id/response', auth, deleteResponse);

module.exports = router;

