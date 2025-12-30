const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/chat', aiController.chatWithCoach);

// NOUVELLE ROUTE POUR LA MODIFICATION
router.post('/modify', aiController.modifyProgram);

module.exports = router;