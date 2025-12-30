const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAllUsers, updateUserPassword, deleteUser, getDashboardStats } = require('../controllers/adminController');

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.email === 'younessini2@gmail.com') {
    next();
  } else {
    res.status(403).json({ error: 'Accès interdit.' });
  }
};

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getDashboardStats); // <--- Nouvelle route
router.get('/users', getAllUsers);
router.put('/users/:id/password', updateUserPassword);
router.delete('/users/:id', deleteUser);

module.exports = router;