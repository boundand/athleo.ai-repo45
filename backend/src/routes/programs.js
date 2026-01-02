const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 1. Générer
router.post('/generate', programController.generateProgram);

// 2. Historique & Liste
// IMPORTANT : /history doit être avant /:id
router.get('/history', programController.getProgramHistory);
router.get('/', programController.getPrograms);

// 3. Activation
router.put('/:id/activate', programController.activateProgram);

// 4. Détails & Suppression (paramètre :id)
router.get('/:id', programController.getProgramDetails);
router.delete('/:id', programController.deleteProgram);

module.exports = router;
