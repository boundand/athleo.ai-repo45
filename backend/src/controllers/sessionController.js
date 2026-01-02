const db = require('../config/database');

// 1. Récupérer les séances d'une date précise + LE TRACKING (Les cases cochées)
const getSessionsByDate = async (req, res) => {
  try {
    const { date } = req.params; // Format attendu : 2023-10-27
    const userId = req.user.id;

    // A. Récupérer les sessions du programme actif
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

    // B. Pour chaque session, récupérer les exercices (Ton code original)
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

    // C. --- NOUVEAU --- Récupérer le tracking (les cases cochées ce jour-là)
    const trackingResult = await db.query(
        `SELECT * FROM exercise_tracking 
         WHERE user_id = $1 AND date = $2`,
        [userId, date]
    );

    // D. Formater les données de tracking pour le frontend
    const checkedSets = {};
    const actualReps = {};

    trackingResult.rows.forEach(row => {
      // On formate la date pour être sûr qu'elle matche la clé du frontend (YYYY-MM-DD)
      // On utilise 'date' qui vient des params pour être sûr du format string
      const key = `${date}-${row.session_id}-${row.exercise_name}-${row.set_index}`;
      
      if (row.is_completed) checkedSets[key] = true;
      if (row.actual_reps) actualReps[key] = row.actual_reps;
    });

    // On renvoie les sessions ET le progrès (tracking)
    res.json({ 
        sessions, 
        progress: { checkedSets, actualReps } 
    });

  } catch (error) {
    console.error("Erreur getSessionsByDate:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Valider (ou dévalider) une séance complète (Le gros bouton final)
const toggleSessionComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_completed } = req.body;
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

// 3. --- NOUVEAU --- Sauvegarder une série spécifique (Le micro-tracking)
const trackSet = async (req, res) => {
    try {
      const { date, sessionId, exerciseName, setIndex, isCompleted, actualReps } = req.body;
      const userId = req.user.id;
  
      // Requête "UPSERT" : Insère si ça n'existe pas, sinon met à jour
      // ON CONFLICT gère le cas où la ligne existe déjà pour ce user/date/exo/index
      const query = `
        INSERT INTO exercise_tracking (user_id, date, session_id, exercise_name, set_index, is_completed, actual_reps)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, date, exercise_name, set_index) 
        DO UPDATE SET 
          is_completed = EXCLUDED.is_completed, 
          actual_reps = EXCLUDED.actual_reps;
      `;
  
      await db.query(query, [userId, date, sessionId, exerciseName, setIndex, isCompleted, actualReps]);
  
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur trackSet:", error);
      res.status(500).json({ error: "Erreur lors de la sauvegarde de la série" });
    }
};

module.exports = { getSessionsByDate, toggleSessionComplete, trackSet };
