const db = require('../config/database');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Logique pour forcer le nombre d'exercices
const getExerciseCount = (duration) => {
    const d = parseInt(duration) || 60;
    if (d <= 30) return "exactement 3 exercices";
    if (d <= 45) return "exactement 4 ou 5 exercices";
    if (d <= 60) return "entre 6 et 7 exercices";
    if (d <= 90) return "entre 8 et 10 exercices";
    return "environ 10 exercices";
};

// 1. GÉNÉRATION STRICTE
exports.generateProgram = async (req, res) => {
  try {
    const { trainingDays, durationMinutes, equipment, equipmentDetails, level, goals, personalInfo } = req.body;
    const userId = req.user.id;

    console.log(">> Génération stricte lancée pour", userId);

    const exerciseCountTarget = getExerciseCount(durationMinutes);

    const prompt = `
      Tu es un coach sportif expert.
      Génère un programme de musculation au format JSON STRICT.

      CONTEXTE:
      - Durée: ${durationMinutes} minutes
      - Objectif: ${goals.join(', ')}
      - Matériel: ${equipment} (${equipmentDetails || 'Standard'})
      - Niveau: ${level}
      
      RÈGLES CRITIQUES (SANS EXCEPTION):
      1. Tu DOIS générer ${exerciseCountTarget} par séance.
      2. Tu DOIS fournir des conseils nutrition/progression/sécurité non vides.
      3. Réponds UNIQUEMENT le JSON valide. Rien d'autre.

      FORMAT ATTENDU:
      {
        "programName": "Nom du programme",
        "description": "Description",
        "calories_target": 2500,
        "proteins_target": 160,
        "nutrition_tips": ["Conseil 1", "Conseil 2", "Conseil 3"],
        "progression_tips": ["Conseil 1", "Conseil 2"],
        "safety_tips": ["Conseil 1", "Conseil 2"],
        "schedule": [
          {
            "day": "Lundi",
            "exercises": [
              {
                "name": "Exercice",
                "sets": "4",
                "reps": "10",
                "rest": "60",
                "tempo": "2-0-2-0",
                "tips": "Conseil technique"
              }
            ]
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    let aiResponse;
    try {
        aiResponse = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
        console.error("ERREUR CRITIQUE: L'IA a renvoyé un format invalide.");
        // ICI : On arrête tout. Pas de programme poubelle.
        return res.status(500).json({ error: "L'IA a échoué à générer un programme valide. Veuillez réessayer." });
    }

    // Validation supplémentaire : Si le planning est vide, on rejette.
    if (!aiResponse.schedule || aiResponse.schedule.length === 0) {
        return res.status(500).json({ error: "L'IA a généré un programme vide. Annulation." });
    }

    // Sécurités pour les conseils (pour éviter l'affichage vide, mais basé sur la réponse IA)
    const nutritionInfo = aiResponse.nutrition_tips || ["Mangez équilibré"];
    const progressionInfo = aiResponse.progression_tips || ["Surcharge progressive"];
    const safetyInfo = aiResponse.safety_tips || ["Échauffement obligatoire"];

    // Insertion BDD (Seulement si tout est OK)
    const programResult = await db.query(
      `INSERT INTO programs (
        user_id, name, description, duration_minutes, level, goal, 
        est_calories, est_protein, 
        nutrition_info, progression_info, safety_info, 
        is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true) 
       RETURNING id`,
      [
        userId,
        aiResponse.programName,
        aiResponse.description,
        durationMinutes,
        level,
        goals[0],
        aiResponse.calories_target,
        aiResponse.proteins_target,
        JSON.stringify(nutritionInfo),
        JSON.stringify(progressionInfo),
        JSON.stringify(safetyInfo),
      ]
    );

    const programId = programResult.rows[0].id;

    // Désactiver les anciens programmes
    await db.query(`UPDATE programs SET is_active = false WHERE user_id = $1 AND id != $2`, [userId, programId]);

    // Insérer les exercices
    for (const daySchedule of aiResponse.schedule) {
        let orderIndex = 1;
        for (const exo of daySchedule.exercises) {
            await db.query(
                `INSERT INTO exercises (
                    program_id, day, name, sets, reps, rest_seconds, tempo, tips, order_index
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    programId,
                    daySchedule.day.toLowerCase(),
                    exo.name,
                    exo.sets,
                    exo.reps,
                    parseInt(exo.rest) || 60,
                    exo.tempo || "2-0-2-0",
                    exo.tips || "",
                    orderIndex++
                ]
            );
        }
    }

    res.json({ success: true, programId: programId });

  } catch (error) {
    console.error("Erreur Serveur:", error);
    res.status(500).json({ error: "Erreur technique lors de la génération." });
  }
};

// 2. LISTE HISTORIQUE
exports.getProgramHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT * FROM programs WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 3. TOUS LES PROGRAMMES (Alias pour éviter l'erreur 404/Undefined)
exports.getPrograms = async (req, res) => {
    return exports.getProgramHistory(req, res);
};

// 4. DÉTAILS D'UN PROGRAMME
exports.getProgramDetails = async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifions d'abord si c'est bien un ID numérique (évite crash si 'history' passe ici par erreur)
        if (isNaN(id)) return res.status(400).json({ error: "ID invalide" });

        const programRes = await db.query('SELECT * FROM programs WHERE id = $1', [id]);
        
        if (programRes.rows.length === 0) {
            return res.status(404).json({ error: "Programme non trouvé" });
        }

        const exercisesRes = await db.query('SELECT * FROM exercises WHERE program_id = $1 ORDER BY day, order_index', [id]);

        res.json({
            program: programRes.rows[0],
            exercises: exercisesRes.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 5. ACTIVER UN PROGRAMME
exports.activateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await db.query('UPDATE programs SET is_active = false WHERE user_id = $1', [userId]);
        await db.query('UPDATE programs SET is_active = true WHERE id = $1 AND user_id = $2', [id, userId]);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// 6. SUPPRIMER UN PROGRAMME
exports.deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // On supprime d'abord les exercices (FK constraint) ou on laisse le CASCADE faire si configuré
        await db.query('DELETE FROM exercises WHERE program_id = $1', [id]);
        await db.query('DELETE FROM programs WHERE id = $1 AND user_id = $2', [id, userId]);

        res.json({ success: true, message: "Programme supprimé" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur lors de la suppression" });
    }
};
