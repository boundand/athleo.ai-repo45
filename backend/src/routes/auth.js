const express = require('express');
const router = express.Router();

// Importation du contrôleur
const authController = require('../controllers/authController');

// Importation du middleware (Sécurité)
const { authenticateToken } = require('../middleware/auth');

// Debug pour vérifier que tout est chargé (Regarde ton terminal si ça crash encore)
console.log("Chargement Auth Routes...");
if (!authController.getMe) console.error("❌ ERREUR: getMe est manquant dans authController !");
if (!authenticateToken) console.error("❌ ERREUR: authenticateToken est manquant dans middleware !");

// Définition des routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées
router.get('/me', authenticateToken, authController.getMe);
router.put('/password', authenticateToken, authController.changePassword);

module.exports = router;