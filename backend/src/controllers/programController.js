const db = require('../config/database');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- LOGIQUE STRICTE POUR LE NOMBRE D'EXERCICES ---
const getExerciseCount = (duration) => {
    const d = parseInt(duration) || 60; // Par défaut 60 si erreur
    if (d <= 30) return "exactement 3 exercices";
    if (d <= 45) return "exactement 4 ou 5 exercices";
    if (d <= 60) return "entre 6 et 7 exercices"; 
    if (d <= 90) return "entre 8 et 10 exercices";
    return "environ 10 exercices";
};

// --- 1. GÉNÉRER UN PROGRAMME (L'IA) ---
exports.generateProgram = async (req, res) => {
  try {
    const { trainingDays, durationMinutes, equipment, equipmentDetails, level, goals, personalInfo } = req.body;
    const userId = req.user.id;

    console.log("Génération lancée pour:", durationMinutes, "minutes");

    // Calcul strict du nombre d'exos
    const exerciseCountTarget = getExerciseCount(durationMinutes);

    const prompt = `
      Tu es un coach sportif expert et nutritionniste.
      Crée un programme de musculation au format JSON STRICT.

      PROFIL:
      - Objectif: ${goals.join(', ')}
      - Niveau: ${level}
      - Durée: ${durationMinutes} minutes
      - Jours: ${trainingDays.join(', ')}
      - Matériel: ${equipment} (${equipmentDetails || 'Standard'})
      - Infos: ${personalInfo.age} ans, ${personalInfo.weight}kg.
      - Contraintes: ${personalInfo.constraints || 'Aucune'}

      RÈGLES IMPÉRATIVES:
      1. Pour ${durationMinutes} minutes, tu DOIS mettre ${exerciseCountTarget} par séance. C'est CRITIQUE.
      2. Tu DOIS remplir les tableaux 'nutrition_tips', 'progression_tips' et 'safety_tips' avec au moins 3 conseils chacun. Ne laisse jamais vide.
      3. Réponds UNIQUEMENT le JSON.

      FORMAT JSON ATTENDU:
      {
        "programName": "Nom du programme",
        "description": "Description courte",
        "calories_target": 2500,
        "proteins_target": 160,
        "nutrition_tips": ["Mange 2g de protéines par kg", "Bois 3L d'eau", "Privilégie les glucides complexes"],
        "progression_tips": ["Augmente la charge de 2kg chaque semaine", "Note tes performances"],
        "safety_tips": ["Échauffement articulaire 5min obligatoire", "Garde le dos droit"],
        "schedule": [
          {
            "day": "Lundi",
            "exercises": [
              {
                "name": "Squat",
                "sets": "4",
                "reps": "10",
                "rest": "90",
                "tempo": "2-0-2-0",
                "tips": "Pousse les genoux vers l'extérieur"
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
        console.error("Erreur parsing JSON IA", e);
        return res.status(500).json({ error: "Erreur de format IA" });
    }

    // Sécurités pour éviter les champs vides dans le Dashboard
    const nutritionInfo = aiResponse.nutrition_tips?.length > 0 ? aiResponse.nutrition_tips : ["Hydratation importante", "Protéines à chaque repas", "Légumes à volonté"];
    const progressionInfo = aiResponse.progression_tips?.length > 0 ? aiResponse.progression_tips : ["Surcharge progressive", "Noter ses charges"];
    const safetyInfo = aiResponse.safety_tips?.length > 0 ? aiResponse.safety_tips : ["Échauffement obligatoire", "Stop si douleur"];

    // Insertion BDD
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
        aiResponse.programName || "Programme Personnalisé",
        aiResponse.description || "Votre programme sur mesure",
        durationMinutes,
        level,
        goals[0],
        aiResponse.calories_target || 2000,
        aiResponse.proteins_target || 150,
        JSON.stringify(nutritionInfo),
        JSON.stringify(progressionInfo),
        JSON.stringify(safetyInfo),
      ]
    );

    const programId = programResult.rows[0].id;

    // Désactiver les anciens
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
    console.error("Erreur serveur generation:", error);
    res.status(500).json({ error: "Erreur serveur lors de la génération" });
  }
};

// --- 2. RÉCUPÉRER UN PROGRAMME PAR ID ---
exports.getProgramById = async (req, res) => {
    try {
        const { id } = req.params;
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

// --- 3. RÉCUPÉRER L'HISTORIQUE ---
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT * FROM programs WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// --- 4. RÉCUPÉRER TOUS LES PROGRAMMES (C'est celle-ci qui manquait !) ---
// Souvent utilisée par la route '/'
exports.getAllPrograms = async (req, res) => {
    // On renvoie la même chose que l'historique pour éviter les erreurs
    return exports.getHistory(req, res);
};

// --- 5. ACTIVER UN PROGRAMME ---
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
