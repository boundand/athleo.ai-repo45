const db = require('../config/database');

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. STATS GLOBALES
    const statsResult = await db.query(
      `SELECT 
         COUNT(*) as total_assigned,
         COUNT(CASE WHEN is_completed = true THEN 1 END) as total_completed,
         SUM(CASE WHEN is_completed = true THEN duration_minutes ELSE 0 END) as total_minutes
       FROM sessions 
       WHERE user_id = $1 
       AND scheduled_date <= CURRENT_DATE`, // On ne compte que jusqu'à aujourd'hui
      [userId]
    );

    const { total_assigned, total_completed, total_minutes } = statsResult.rows[0];
    
    const completionRate = total_assigned > 0 
      ? Math.round((total_completed / total_assigned) * 100) 
      : 0;

    // 2. GRAPHIQUE (7 DERNIERS JOURS SEULEMENT)
    const weeklyResult = await db.query(
      `SELECT 
         to_char(scheduled_date, 'Day') as day_name,
         COUNT(CASE WHEN is_completed = true THEN 1 END) as completed
       FROM sessions
       WHERE user_id = $1 
       AND scheduled_date >= CURRENT_DATE - INTERVAL '6 days' 
       AND scheduled_date <= CURRENT_DATE
       GROUP BY scheduled_date
       ORDER BY scheduled_date ASC`,
      [userId]
    );

    res.json({
      global: {
        completed: parseInt(total_completed) || 0,
        minutes: parseInt(total_minutes) || 0,
        rate: completionRate
      },
      chart: weeklyResult.rows
    });

  } catch (error) {
    console.error("Erreur Analytics:", error);
    res.status(500).json({ error: "Impossible de charger les stats" });
  }
};

module.exports = { getAnalytics };