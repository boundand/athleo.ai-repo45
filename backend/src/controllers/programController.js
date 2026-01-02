const db = require('../config/database');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fonction pour déterminer le nombre d'exercices selon la durée
const getExerciseCount = (duration) => {
    const d = parseInt(duration);
    if (d <= 30) return "entre 3 et 4";
    if (d <= 45) return "entre 5 et 6";
    if (d <= 60) return "entre 6 et 8"; // 60 min = solide
    if (d <= 90) return "entre 8 et 10";
    return "environ 10";
};

exports.generateProgram = async (req, res) => {
  try {
    const { trainingDays, durationMinutes, equipment, equipmentDetails, level, goals, personalInfo } = req.body;
    const userId = req.user.id;

    // 1. Calculer combien d'exercices on veut VRAIMENT
    const exerciseCountTarget = getExerciseCount(durationMinutes);

    // 2. Construire le prompt pour l'IA (ORDRES STRICTS)
    const prompt = `
      Agis comme un coach sportif expert et nutritionniste. Crée un programme de musculation JSON strict.
      
      PROFIL UTILISATEUR :
      - Objectif : ${goals.join(', ')}
      - Niveau : ${level}
      - Durée séance : ${durationMinutes} minutes
      - Jours d'entraînement : ${trainingDays.join(', ')}
      - Matériel : ${equipment} (${equipmentDetails || 'Standard'})
      - Infos perso : ${personalInfo.age} ans, ${personalInfo.weight}kg, ${personalInfo.height}cm.
      - Contraintes : ${personalInfo.constraints || 'Aucune'}

      RÈGLES STRICTES DE GÉNÉRATION :
      1. Pour une séance de ${durationMinutes} minutes, tu DOIS générer ${exerciseCountTarget} exercices par jour.
      2. Tu DOIS remplir les sections conseils (nutrition, progression, sécurité).
      3. Le format de réponse doit être UNIQUEMENT du JSON valide, sans texte avant ni après.

      STRUCTURE JSON ATTENDUE :
      {
        "programName": "Nom motivant du programme",
        "description": "Description courte et motivante",
        "calories_target": 2500,
        "proteins_target": 160,
        "nutrition_tips": ["Conseil 1 (précis)", "Conseil 2", "Conseil 3"],
        "progression_tips": ["Conseil surcharge progressive", "Conseil repos"],
        "safety_tips": ["Conseil échauffement", "Conseil exécution"],
        "schedule": [
          {
            "day": "Lundi",
            "exercises": [
              {
                "name": "Nom de l'exercice",
                "sets": "4",
                "reps": "10-12",
                "rest": "90",
                "tempo": "2-0-2-0",
                "tips": "Conseil technique court"
              }
            ]
          }
          // Répéter pour chaque jour demandé : ${trainingDays.join(', ')}
        ]
      }
    `;

    // 3. Appel à OpenAI
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo-1106", // Modèle rapide et bon en JSON
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // 4. Sauvegarde en Base de Données
    // On sauvegarde d'abord le programme
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
        JSON.stringify(aiResponse.nutrition_tips),   // On force le JSON stringify
        JSON.stringify(aiResponse.progression_tips), // Idem
        JSON.stringify(aiResponse.safety_tips),      // Idem
      ]
    );

    const programId = programResult.rows[0].id;

    // 5. Sauvegarde des séances et exercices
    // On désactive d'abord les anciens programmes actifs
    await db.query(`UPDATE programs SET is_active = false WHERE user_id = $1 AND id != $2`, [userId, programId]);

    // Boucle sur les jours
    for (const daySchedule of aiResponse.schedule) {
        // Création de la séance (optionnel si tu stockes tout dans exercices, mais propre pour le calendrier)
        // Ici on va directement insérer les exercices liés au programme et au jour
        
        let orderIndex = 1;
        for (const exo of daySchedule.exercises) {
            await db.query(
                `INSERT INTO exercises (
                    program_id, day, name, sets, reps, rest_seconds, tempo, tips, order_index
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    programId,
                    daySchedule.day.toLowerCase(), // Lundi, mardi...
                    exo.name,
                    exo.sets,
                    exo.reps,
                    parseInt(exo.rest),
                    exo.tempo,
                    exo.tips,
                    orderIndex++
                ]
            );
        }

        // Création des sessions dans le calendrier pour les 4 prochaines semaines
        // (Logique simplifiée : on crée des sessions planifiées)
        // Note : Cela dépend de comment tu gères ton calendrier, 
        // mais pour l'instant on se concentre sur la création du programme.
    }
    
    // On génère aussi les sessions initiales dans la table sessions pour que le calendrier ne soit pas vide
    // (Tu as peut-être une fonction séparée pour ça, mais voici un basique)
    const startDate = new Date();
    // ... Logique de peuplement du calendrier si nécessaire ...

    res.json({ 
        success: true, 
        programId: programId,
        message: "Programme généré avec succès" 
    });

  } catch (error) {
    console.error("Erreur génération programme:", error);
    res.status(500).json({ error: "Erreur lors de la génération. Veuillez réessayer." });
  }
};

// Récupérer un programme complet
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

// Récupérer l'historique
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

// Activer un programme
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
