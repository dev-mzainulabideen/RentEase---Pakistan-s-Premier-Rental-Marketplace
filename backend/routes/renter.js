const express = require('express');
const auth = require('../middleware/auth');
const { getStats } = require('../controllers/renterController');

const router = express.Router();

router.use(auth);

// Renter activity stats
router.get('/stats', getStats);

module.exports = router;


