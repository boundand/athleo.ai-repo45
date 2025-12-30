const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// La route principale
router.get('/', analyticsController.getAnalytics);

module.exports = router;