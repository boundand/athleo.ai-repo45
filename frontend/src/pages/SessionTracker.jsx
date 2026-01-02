import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

function SessionTracker() {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  
  // --- 1. MÉMOIRE DES CASES COCHÉES (VALIDATION) ---
  const [checkedSets, setCheckedSets] = useState(() => {
    const saved = localStorage.getItem('checkedSets');
    return saved ? JSON.parse(saved) : {};
  });

  // --- 2. MÉMOIRE DES REPS RÉELLES (SI ÉCHEC) ---
  const [actualReps, setActualReps] = useState(() => {
    const saved = localStorage.getItem('actualReps');
    return saved ? JSON.parse(saved) : {};
  });

  // Sauvegarde automatique à chaque changement
  useEffect(() => {
    localStorage.setItem('checkedSets', JSON.stringify(checkedSets));
    localStorage.setItem('actualReps', JSON.stringify(actualReps));
  }, [checkedSets, actualReps]);

  const formatDateForApi = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  };

  useEffect(() => {
    fetchSessions(currentDate);
  }, [currentDate]);

  const fetchSessions = async (date) => {
    setLoading(true);
    try {
      const dateStr = formatDateForApi(date);
      const response = await api.get(`/sessions/date/${dateStr}`);
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Erreur chargement séances:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  // Action : Cocher/Décocher une série
  const toggleSet = (sessionId, exerciseId, setIndex) => {
    const key = `${sessionId}-${exerciseId}-${setIndex}`;
    setCheckedSets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Action : Noter les reps réelles
  const handleRepsChange = (sessionId, exerciseId, setIndex, value) => {
    const key = `${sessionId}-${exerciseId}-${setIndex}`;
    setActualReps(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCompleteSession = async (session) => {
    setSubmittingId(session.id);
    try {
      const newStatus = !session.is_completed;
      await api.put(`/sessions/${session.id}`, { is_completed: newStatus });
      
      setSessions(prevSessions => 
        prevSessions.map(s => s.id === session.id ? { ...s, is_completed: newStatus } : s)
      );

      if(newStatus) {
          alert(t('session_validated_alert'));
      }
      
    } catch (error) {
      console.error('Erreur validation:', error);
      alert(t('save_error'));
    } finally {
      setSubmittingId(null);
    }
  };

  // Calcul de la progression
  const getProgress = (session) => {
      if (session.is_completed) return 100;
      if (!session.exercises || session.exercises.length === 0) return 0;

      let totalSets = 0;
      let completedSets = 0;

      session.exercises.forEach(exo => {
          const setsCount = parseInt(exo.sets) || 1;
          totalSets += setsCount;
          for(let i = 0; i < setsCount; i++) {
              if (checkedSets[`${session.id}-${exo.id}-${i}`]) {
                  completedSets++;
              }
          }
      });

      return totalSets === 0 ? 0 : (completedSets / totalSets) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-20 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
                <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-100 transition">
                    ← {t('back')}
                </Link>
                <h1 className="text-lg font-bold text-black">{t('habit_tracker_title')}</h1>
                <div className="w-8"></div>
            </div>

            <div className="flex items-center justify-between bg-gray-100 p-1 rounded-xl">
                <button onClick={() => changeDate(-1)} className="p-2 px-4 rounded-lg hover:bg-white hover:shadow-sm transition text-gray-600">
                    ← {t('yesterday')}
                </button>
                <div className="text-center">
                    <span className="block font-bold text-sm capitalize">{formatDateDisplay(currentDate)}</span>
                </div>
                <button onClick={() => changeDate(1)} className="p-2 px-4 rounded-lg hover:bg-white hover:shadow-sm transition text-gray-600">
                    {t('tomorrow')} →
                </button>
            </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {loading ? (
             <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
             </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                😴
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('nothing_planned')}</h2>
            <p className="text-gray-500 text-sm">{t('no_session_scheduled')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sessions.map(session => (
              <div key={session.id} className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                
                {/* En-tête Séance */}
                <div className={`p-6 text-white transition-colors ${session.is_completed ? 'bg-green-600' : 'bg-black'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-xl font-bold">{session.program_name}</h2>
                      <p className="text-sm opacity-80">{session.duration_minutes} {t('minutes_short')} • {session.exercises?.length || 0} {t('exercises_short')}</p>
                    </div>
                    {session.is_completed && <div className="bg-white/20 p-2 rounded-full animate-bounce">✓</div>}
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-white/20 h-3 rounded-full mt-4 overflow-hidden border border-white/10">
                      <div 
                        className="bg-white h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                        style={{ width: `${getProgress(session)}%` }}
                      ></div>
                  </div>
                  <p className="text-right text-xs mt-1 font-bold">{Math.round(getProgress(session))}%</p>
                </div>

                {/* Liste des Exercices DÉTAILLÉE */}
                <div className="p-4 space-y-6">
                  {session.exercises && session.exercises.map((exo) => {
                    const setsCount = parseInt(exo.sets) || 1;
                    
                    return (
                      <div key={exo.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                         {/* Titre Exercice */}
                         <div className="mb-4 pb-2 border-b border-gray-200">
                            <h3 className="font-extrabold text-lg text-gray-900">{exo.name}</h3>
                            <p className="text-xs text-gray-500 font-medium">Objectif : {exo.sets} séries × {exo.reps} reps • Repos : {exo.rest_seconds}s</p>
                         </div>

                         {/* LISTE DES SÉRIES (1 par 1) */}
                         <div className="space-y-3">
                             {Array.from({ length: setsCount }).map((_, index) => {
                                 const key = `${session.id}-${exo.id}-${index}`;
                                 const isChecked = checkedSets[key];
                                 const savedReps = actualReps[key] || '';
                                 
                                 return (
                                     <div key={index} className={`flex flex-col p-3 rounded-xl transition-all ${isChecked ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}`}>
                                         
                                         {/* Ligne du haut : Titre + Checkbox */}
                                         <div className="flex items-center justify-between mb-2">
                                             <div className="flex items-center gap-3">
                                                 <span className="bg-black text-white w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold">
                                                     {index + 1}
                                                 </span>
                                                 <span className="font-bold text-gray-800 text-sm">
                                                     {exo.reps} Reps
                                                 </span>
                                             </div>
                                             
                                             <button
                                                onClick={() => !session.is_completed && toggleSet(session.id, exo.id, index)}
                                                disabled={session.is_completed}
                                                className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center transition-all
                                                    ${isChecked 
                                                        ? 'bg-green-500 text-white shadow-md scale-110' 
                                                        : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                                                    }
                                                `}
                                             >
                                                 {isChecked ? '✓' : ''}
                                             </button>
                                         </div>

                                         {/* Ligne du bas : Champ Input pour l'échec */}
                                         {!session.is_completed && (
                                            <div className="mt-1">
                                                <p className="text-[10px] text-gray-400 mb-1 ml-1">
                                                    T'as pas pu le compléter ? Met ici combien tu en as fait :
                                                </p>
                                                <input 
                                                    type="number" 
                                                    placeholder={isChecked ? "Validé !" : "Ex: 8"}
                                                    value={savedReps}
                                                    onChange={(e) => handleRepsChange(session.id, exo.id, index, e.target.value)}
                                                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 focus:border-black focus:bg-white outline-none transition-colors"
                                                />
                                            </div>
                                         )}
                                     </div>
                                 )
                             })}
                         </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bouton Final */}
                <div className="p-4 pt-0 border-t border-gray-50 mt-2">
                  <button
                    onClick={() => handleCompleteSession(session)}
                    disabled={submittingId === session.id}
                    className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
                        session.is_completed 
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                        : 'bg-black text-white hover:bg-gray-900 shadow-xl shadow-black/20'
                    }`}
                  >
                    {submittingId === session.id ? 'Sauvegarde en cours...' : session.is_completed ? t('cancel_validation') : t('validate_session')}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionTracker;
