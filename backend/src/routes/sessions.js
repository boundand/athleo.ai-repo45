const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Récupérer les séances par date
router.get('/date/:date', sessionController.getSessionsByDate);

// Valider une séance (C'est cette ligne qui plantait car la fonction manquait)
router.put('/:id', sessionController.toggleSessionComplete);

module.exports = router;