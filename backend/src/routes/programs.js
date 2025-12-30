const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Routes
router.post('/generate', programController.generateProgram);
router.get('/history', programController.getProgramHistory); // Avant /:id
router.get('/', programController.getPrograms);

// --- LA ROUTE MANQUANTE QUI CAUSAIT LE 404 ---
router.put('/:id/activate', programController.activateProgram);
// ---------------------------------------------

router.get('/:id', programController.getProgramDetails);
router.delete('/:id', programController.deleteProgram);

module.exports = router;