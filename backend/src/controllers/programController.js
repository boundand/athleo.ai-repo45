const db = require('../config/database');
const { openai } = require('../config/openai');

// --- 1. GÉNÉRATION DE PROGRAMME (IA) ---
const generateProgram = async (req, res) => {
  console.log("🚀 DÉMARRAGE GÉNÉRATION (Multilingue + Temps)...");

  try {
    const { trainingDays, durationMinutes, equipment, equipmentDetails, level, goals, personalInfo, targetLanguage } = req.body;
    const userId = req.user.id;

    // PAR DÉFAUT : ANGLAIS
    const language = targetLanguage || "English"; 
    console.log(`🌍 Langue : ${language} | Durée : ${durationMinutes} min`);

    const prompt = `
      You are an expert sports coach.
      MANDATORY OUTPUT LANGUAGE: ${language}.
      All content MUST be in ${language}.
      Only JSON keys remain in English.

      CONTEXT:
      - Duration: ${durationMinutes} minutes.
      - Level: ${level}, Goal: ${goals[0]}.
      - Equipment: ${equipment} (${equipmentDetails || 'Standard'}).
      - Days: ${trainingDays.join(', ')}.
      - Info: ${JSON.stringify(personalInfo)}.

      RULE: Fill the ${durationMinutes} minutes.
      
      STRICT JSON FORMAT:
      {
        "programName": "Program Name in ${language}",
        "description": "Description in ${language}",
        "weeks": [
          { 
            "weekNumber": 1, 
            "days": [ 
              { 
                "day": "lundi", 
                "exercises": [ 
                  { "name": "Exo", "sets": 4, "reps": "12", "restSeconds": 60, "tempo": "2-0-2-0", "tips": "Tip", "notes": "Note" } 
                ] 
              } 
            ] 
          }
        ]
      }
    `;

    let programData;
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', 
            messages: [
                { role: 'system', content: 'You are a strict JSON generator for fitness programs.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: "json_object" }
        });
        programData = JSON.parse(completion.choices[0].message.content);
    } catch (aiError) {
        console.error("❌ ERREUR OPENAI:", aiError);
        return res.status(502).json({ error: "AI Error" });
    }

    // Sauvegarde Programme
    const programResult = await db.query(
      `INSERT INTO programs (user_id, name, description, training_days, duration_minutes, equipment, is_active, est_calories, est_protein, nutrition_info, progression_info, safety_info) 
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11) RETURNING id`,
      [userId, programData.programName, programData.description, trainingDays, durationMinutes, equipment, 500, 150, '[]', '[]', '[]']
    );
    const programId = programResult.rows[0].id;

    // Désactiver les anciens
    await db.query('UPDATE programs SET is_active = false WHERE user_id = $1 AND id != $2', [userId, programId]);

    // Sauvegarde Exercices & Sessions
    const modelWeek = programData.weeks[0];
    const dayMap = { 'lundi':1, 'mardi':2, 'mercredi':3, 'jeudi':4, 'vendredi':5, 'samedi':6, 'dimanche':0, 'monday':1, 'tuesday':2, 'wednesday':3, 'thursday':4, 'friday':5, 'saturday':6, 'sunday':0 };

    for (const dayDto of modelWeek.days) {
        let orderIndex = 0;
        const rawDay = dayDto.day.toLowerCase().trim();
        
        for (const exo of dayDto.exercises) {
            await db.query(
                `INSERT INTO exercises (program_id, day, name, sets, reps, rest_seconds, notes, order_index, tempo, tips) 
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [programId, rawDay, exo.name, exo.sets, exo.reps, exo.restSeconds || 60, exo.notes || '', orderIndex++, exo.tempo || '2-0-2-0', exo.tips || '']
            );
        }
        
        // Création des sessions calendrier
        let targetDayNum = -1;
        for (const [key, val] of Object.entries(dayMap)) { if (rawDay.includes(key)) targetDayNum = val; }
        
        if (targetDayNum !== -1) {
            for (let w = 0; w < 4; w++) { 
                const d = new Date(); d.setHours(0,0,0,0);
                let dist = targetDayNum - d.getDay(); 
                if(dist < 0) dist += 7; 
                dist += (w*7);
                d.setDate(d.getDate() + dist);
                
                // Vérif date valide
                if (!isNaN(d.getTime())) {
                    await db.query(
                        `INSERT INTO sessions (user_id, program_id, program_name, scheduled_date, duration_minutes, is_completed) VALUES ($1, $2, $3, $4, $5, false)`, 
                        [userId, programId, programData.programName, d, durationMinutes]
                    );
                }
            }
        }
    }

    res.status(201).json({ message: 'OK', programId: programId });

  } catch (error) {
    console.error('🔴 ERREUR:', error);
    res.status(500).json({ error: error.message });
  }
};

const getPrograms = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM programs WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json({ programs: result.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const getProgramDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const p = await db.query('SELECT * FROM programs WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (p.rows.length === 0) return res.status(404).json({ error: 'Introuvable' });
        const e = await db.query('SELECT * FROM exercises WHERE program_id = $1 ORDER BY order_index', [id]);
        res.json({ program: p.rows[0], exercises: e.rows });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const deleteProgram = async (req, res) => {
    try {
        await db.query('DELETE FROM programs WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Supprimé' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const getProgramHistory = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM programs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3', [req.user.id]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- CORRECTION : Utilisation de db.query directement ---
const activateProgram = async (req, res) => {
    try {
        const programId = req.params.id;
        const userId = req.user.id;

        // 1. Désactiver tous les autres (simple requête)
        await db.query('UPDATE programs SET is_active = false WHERE user_id = $1', [userId]);

        // 2. Activer le bon
        const result = await db.query(
            'UPDATE programs SET is_active = true WHERE id = $1 AND user_id = $2 RETURNING *', 
            [programId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Introuvable ou non autorisé" });
        }

        res.json({ message: "Activé", program: result.rows[0] });

    } catch (err) {
        console.error("Erreur activation:", err);
        res.status(500).json({ error: "Erreur serveur lors de l'activation" });
    }
};

module.exports = { 
    generateProgram, 
    getPrograms, 
    getProgramDetails, 
    deleteProgram, 
    getProgramHistory, 
    activateProgram 
};