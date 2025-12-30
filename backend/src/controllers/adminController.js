const db = require('../config/database');
const bcrypt = require('bcryptjs');

// --- STATISTIQUES GLOBALES (Nouveau) ---
const getDashboardStats = async (req, res) => {
    try {
        // On fait 3 requêtes en parallèle pour aller vite
        const userCount = await db.query("SELECT COUNT(*) FROM users");
        const programCount = await db.query("SELECT COUNT(*) FROM programs");
        const sessionCount = await db.query("SELECT COUNT(*) FROM sessions WHERE is_completed = true");

        res.json({
            users: parseInt(userCount.rows[0].count),
            programs: parseInt(programCount.rows[0].count),
            completedSessions: parseInt(sessionCount.rows[0].count)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- GESTION UTILISATEURS ---
const getAllUsers = async (req, res) => {
  try {
    const result = await db.query("SELECT id, name, email, created_at FROM users WHERE email != 'younessini2@gmail.com' ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    await db.query('DELETE FROM exercises WHERE program_id IN (SELECT id FROM programs WHERE user_id = $1)', [id]);
    await db.query('DELETE FROM programs WHERE user_id = $1', [id]);
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllUsers, updateUserPassword, deleteUser, getDashboardStats };