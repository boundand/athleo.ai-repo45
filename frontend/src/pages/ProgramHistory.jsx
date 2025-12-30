import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- IMPORT

function ProgramHistory() {
  const { t, i18n } = useTranslation(); // <--- ACTIVATION
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/programs/history');
      console.log("Historique reçu :", res.data);
      setPrograms(res.data || []);
    } catch (err) {
      console.error("Erreur historique :", err);
      setError(t('history_load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (programId) => {
    if(!window.confirm(t('activate_confirm'))) return;
    try {
      await api.put(`/programs/${programId}/activate`);
      alert(t('program_activated'));
      navigate('/'); 
    } catch (err) {
      alert(t('activation_error'));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
       <div className="animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* BOUTON RETOUR */}
        <div className="mb-6">
            <Link to="/" className="text-gray-500 hover:text-black font-medium transition flex items-center gap-2">
            ← {t('back_dashboard')}
            </Link>
        </div>

        <h1 className="text-3xl font-bold text-black mb-2">{t('my_programs')}</h1>
        <p className="text-gray-500 mb-8">{t('history_subtitle')}</p>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-center">
                {error}
            </div>
        )}

        <div className="space-y-4">
          {programs.length === 0 && !error ? (
             <div className="text-center py-12 bg-white rounded-3xl border border-gray-200">
                <p className="text-gray-400 mb-4">{t('no_history')}</p>
                <Link to="/program-generator" className="bg-black text-white px-6 py-2 rounded-xl font-bold">
                   {t('create_program')}
                </Link>
             </div>
          ) : (
            programs.map(prog => (
                <div key={prog.id} className={`p-6 rounded-3xl border transition-all ${
                    prog.is_active 
                    ? 'bg-black text-white border-black shadow-lg transform scale-[1.02]' 
                    : 'bg-white text-black border-gray-200 hover:shadow-md'
                }`}>
                <div className="flex justify-between items-start gap-4">
                    <div>
                    <h3 className="text-xl font-bold mb-1">{prog.name}</h3>
                    <p className={`text-sm mb-3 ${prog.is_active ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('created_on')} {new Date(prog.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} • {prog.duration_minutes} min
                    </p>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                            prog.is_active ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                            {t(prog.goal) || prog.goal} {/* Essaye de traduire l'objectif (ex: gain_muscle) sinon affiche le texte brut */}
                        </span>
                    </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        {prog.is_active ? (
                            <span className="bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full text-center">
                                {t('active_tag')}
                            </span>
                        ) : (
                            <button 
                                onClick={() => handleActivate(prog.id)}
                                className="border border-gray-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition"
                            >
                                {t('activate_btn')}
                            </button>
                        )}
                        <Link 
                            to={`/program/${prog.id}`}
                            className={`text-xs font-bold underline text-center mt-1 ${
                                prog.is_active ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                            }`}
                        >
                            {t('view_details')}
                        </Link>
                    </div>
                </div>
                </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgramHistory;