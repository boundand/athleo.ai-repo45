const db = require('../config/database');

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. STATS GLOBALES (Strictement celles validées)
    const statsResult = await db.query(
      `SELECT 
         COUNT(*) as total_completed,
         COALESCE(SUM(duration_minutes), 0) as total_minutes
       FROM sessions 
       WHERE user_id = $1 
       AND is_completed = true`, // On ne veut QUE les vraies validées
      [userId]
    );

    const { total_completed, total_minutes } = statsResult.rows[0];

    // 2. GRAPHIQUE (Données brutes de la BDD)
    const chartResult = await db.query(
      `SELECT 
         TO_CHAR(scheduled_date, 'YYYY-MM-DD') as date_str,
         COUNT(*) as count
       FROM sessions
       WHERE user_id = $1 
       AND is_completed = true 
       AND scheduled_date >= CURRENT_DATE - INTERVAL '6 days' 
       GROUP BY scheduled_date
       ORDER BY scheduled_date ASC`,
      [userId]
    );

    // 3. CONSTRUCTION INTELLIGENTE DES 7 JOURS
    // On génère manuellement les 7 derniers jours pour être sûr d'avoir 0 quand c'est vide
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      // On cherche si la BDD a une donnée pour ce jour précis
      const found = chartResult.rows.find(row => row.date_str === dateString);
      
      // On ajoute le jour dans la liste (avec 0 ou le vrai chiffre)
      last7Days.push({
        day_name: d.toLocaleDateString('en-US', { weekday: 'long' }), // Nom du jour (ex: Monday)
        completed: found ? parseInt(found.count) : 0
      });
    }

    // Calcul d'un taux de "Consistance" simple (arbitraire pour l'instant ou basé sur l'activité)
    // Si tu as fait au moins 1 séance, on met 100% pour t'encourager, sinon 0
    const rate = parseInt(total_completed) > 0 ? 100 : 0;

    res.json({
      global: {
        completed: parseInt(total_completed) || 0,
        minutes: parseInt(total_minutes) || 0,
        rate: rate
      },
      chart: last7Days // On envoie notre tableau propre sans trous
    });

  } catch (error) {
    console.error("Erreur Analytics:", error);
    res.status(500).json({ error: "Impossible de charger les stats" });
  }
};

module.exports = { getAnalytics };
