const express = require('express');
const auth = require('../middleware/auth');
const { getOrCreateForBooking, listConversations, getMessages, sendMessage } = require('../controllers/conversationsController');

const router = express.Router();

router.use(auth);

// Get all conversations for current user
router.get('/', listConversations);

// Get or create conversation for a booking or listing
router.post('/', getOrCreateForBooking);

// Get messages for a conversation
router.get('/:id/messages', getMessages);

// Send message in a conversation
router.post('/messages', sendMessage);

module.exports = router;


