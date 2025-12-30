require('dotenv').config();
const { Pool } = require('pg');

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Indispensable pour Supabase/Render/Fly
  }
});

// On exporte directement l'objet qui permet de faire des requêtes
module.exports = {
  query: (text, params) => pool.query(text, params),
  // On ajoute cette fonction pour permettre les transactions si besoin plus tard
  connect: () => pool.connect(), 
};