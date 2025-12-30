const { openai } = require('../config/openai');
const db = require('../config/database');

// Chat simple (Discussion)
const chatWithCoach = async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // On ajoute un contexte "Sport"
    const systemPrompt = "Tu es un coach sportif expert, motivant et direct. Réponds de manière concrète.";
    
    const messages = [
        { role: 'system', content: systemPrompt },
        ...(history || []).map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text })),
        { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 500,
    });

    const botResponse = completion.choices[0].message.content;
    res.json({ reply: botResponse });

  } catch (error) {
    console.error("Erreur Chat:", error);
    res.status(500).json({ error: "Erreur IA" });
  }
};

// --- NOUVEAU : MODIFICATION DU PROGRAMME ---
const modifyProgram = async (req, res) => {
    try {
        const { instruction } = req.body; // Ex: "Remplace le squat par de la presse"
        const userId = req.user.id;

        // 1. Récupérer le programme ACTIF
        const progRes = await db.query('SELECT * FROM programs WHERE user_id = $1 AND is_active = true', [userId]);
        if (progRes.rows.length === 0) return res.status(404).json({ error: "Aucun programme actif trouvé." });
        const program = progRes.rows[0];

        // 2. Récupérer les exercices ACTUELS
        const exoRes = await db.query('SELECT * FROM exercises WHERE program_id = $1 ORDER BY day, order_index', [program.id]);
        const currentExercises = exoRes.rows;

        // 3. Prompt pour l'IA (Mode Chirurgien)
        const prompt = `
            Tu es un gestionnaire de base de données sportive.
            Voici les exercices actuels du programme (Format JSON) :
            ${JSON.stringify(currentExercises)}

            L'utilisateur veut cette modification : "${instruction}"

            TA MISSION :
            1. Identifie le(s) jour(s) concerné(s).
            2. Renvoie UNIQUEMENT la liste complète des exercices pour le(s) jour(s) modifié(s).
            3. Si l'utilisateur demande d'ajouter, ajoute. S'il demande de remplacer, remplace.
            4. Garde le même format JSON.

            Format de réponse attendu (JSON STRICT) :
            {
                "modifiedDays": [
                    {
                        "day": "lundi",
                        "exercises": [
                            { "name": "Presse à cuisses", "sets": 4, "reps": "10", "rest_seconds": 90, "notes": "...", "tempo": "...", "tips": "..." },
                            ... (tous les autres exos du lundi doivent être présents aussi)
                        ]
                    }
                ]
            }
        `;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Tu es une API JSON qui modifie des programmes sportifs.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const raw = completion.choices[0].message.content;
        const result = JSON.parse(raw);

        if (!result.modifiedDays || result.modifiedDays.length === 0) {
            return res.json({ message: "Je n'ai pas compris la modification. Essaie d'être plus précis." });
        }

        // 4. APPLIQUER LES CHANGEMENTS EN BDD
        for (const dayData of result.modifiedDays) {
            const dayName = dayData.day.toLowerCase();
            
            // A. Supprimer les anciens exos de ce jour
            await db.query('DELETE FROM exercises WHERE program_id = $1 AND day = $2', [program.id, dayName]);

            // B. Insérer les nouveaux
            let orderIndex = 0;
            for (const exo of dayData.exercises) {
                await db.query(
                    `INSERT INTO exercises (program_id, day, name, sets, reps, rest_seconds, notes, order_index, tempo, tips) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [program.id, dayName, exo.name, exo.sets, exo.reps, exo.rest_seconds || 60, exo.notes || '', orderIndex++, exo.tempo || '2-0-2-0', exo.tips || '']
                );
            }
        }

        res.json({ success: true, message: `Programme mis à jour pour : ${result.modifiedDays.map(d => d.day).join(', ')}` });

    } catch (error) {
        console.error("Erreur Modify:", error);
        res.status(500).json({ error: "Erreur lors de la modification du programme." });
    }
};

module.exports = { chatWithCoach, modifyProgram };