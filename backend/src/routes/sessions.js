const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Récupérer les séances par date
router.get('/date/:date', sessionController.getSessionsByDate);

// Valider une séance complète (Le gros bouton "Valider Séance")
router.put('/:id', sessionController.toggleSessionComplete);

// --- NOUVEAU : Sauvegarder une série spécifique (Cocher une case) ---
router.post('/track-set', sessionController.trackSet);

module.exports = router;
