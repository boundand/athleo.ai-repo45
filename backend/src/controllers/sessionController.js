const db = require('../config/database');

// 1. Récupérer les séances d'une date précise (UNIQUEMENT DU PROGRAMME ACTIF)
const getSessionsByDate = async (req, res) => {
  try {
    const { date } = req.params; // Format attendu : 2023-10-27
    const userId = req.user.id;

    // MODIFICATION ICI : On fait un JOIN avec la table programs
    // Et on ajoute la condition "AND p.is_active = true"
    const sessionsResult = await db.query(
      `SELECT s.* FROM sessions s
       JOIN programs p ON s.program_id = p.id
       WHERE s.user_id = $1 
       AND date(s.scheduled_date) = $2
       AND p.is_active = true
       ORDER BY s.scheduled_date ASC`,
      [userId, date]
    );

    const sessions = sessionsResult.rows;

    // Pour chaque session trouvée, on récupère ses exercices
    for (let session of sessions) {
      const exercisesResult = await db.query(
        `SELECT * FROM exercises 
         WHERE program_id = $1 
         AND day = (
             SELECT CASE EXTRACT(ISODOW FROM CAST($2 AS DATE))
                 WHEN 1 THEN 'lundi'
                 WHEN 2 THEN 'mardi'
                 WHEN 3 THEN 'mercredi'
                 WHEN 4 THEN 'jeudi'
                 WHEN 5 THEN 'vendredi'
                 WHEN 6 THEN 'samedi'
                 WHEN 7 THEN 'dimanche'
             END
         )
         ORDER BY order_index`,
        [session.program_id, date]
      );
      session.exercises = exercisesResult.rows;
    }

    res.json({ sessions });
  } catch (error) {
    console.error("Erreur getSessionsByDate:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Valider (ou dévalider) une séance
const toggleSessionComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_completed } = req.body; // true ou false
        const userId = req.user.id;

        await db.query(
            'UPDATE sessions SET is_completed = $1 WHERE id = $2 AND user_id = $3',
            [is_completed, id, userId]
        );

        res.json({ message: 'Statut de la séance mis à jour' });
    } catch (error) {
        console.error("Erreur toggleSessionComplete:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getSessionsByDate, toggleSessionComplete };