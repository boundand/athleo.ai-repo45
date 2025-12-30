const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// 1. INSCRIPTION
const register = async (req, res) => {
  try {
    const { email, password, name, level, goals } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Données manquantes' });

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) return res.status(409).json({ error: 'Email déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, level, goals) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, level, goals, created_at`,
      [email, passwordHash, name, level, goals]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ message: 'Compte créé', token, user });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur serveur inscription' });
  }
};

// 2. CONNEXION
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    delete user.password_hash;

    res.json({ message: 'Connexion réussie', token, user });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur connexion' });
  }
};

// 3. RECUPERER MON PROFIL (getMe)
const getMe = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, level, goals, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({ error: 'Erreur récupération profil' });
  }
};

// 4. CHANGER MOT DE PASSE
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
        
        const user = userRes.rows[0];
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) return res.status(400).json({ error: "L'ancien mot de passe est incorrect." });

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

        res.json({ message: "Mot de passe modifié avec succès !" });
    } catch (err) {
        console.error("Erreur changePassword:", err);
        res.status(500).json({ error: "Erreur changement mot de passe" });
    }
};

// TRES IMPORTANT : Tout doit être exporté ici
module.exports = { register, login, getMe, changePassword };