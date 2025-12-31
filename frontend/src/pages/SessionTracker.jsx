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
  
  const [checkedExercises, setCheckedExercises] = useState({});

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

  const toggleExercise = (sessionId, exerciseId) => {
    const key = `${sessionId}-${exerciseId}`;
    setCheckedExercises(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCompleteSession = async (session) => {
    setSubmittingId(session.id);
    try {
      const newStatus = !session.is_completed;
      await api.put(`/sessions/${session.id}`, { is_completed: newStatus });
      
      setSessions(prevSessions => 
        prevSessions.map(s => s.id === session.id ? { ...s, is_completed: newStatus } : s)
      );

      if(newStatus) alert(t('session_validated_alert'));
      
    } catch (error) {
      console.error('Erreur validation:', error);
      alert(t('save_error'));
    } finally {
      setSubmittingId(null);
    }
  };

  const getProgress = (session) => {
      if (session.is_completed) return 100;
      const totalExos = session.exercises?.length || 1;
      const checkedCount = session.exercises?.filter(ex => checkedExercises[`${session.id}-${ex.id}`]).length || 0;
      return (checkedCount / totalExos) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* HEADER AVEC NAVIGATION DATE */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-20 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
                {/* 👇 MODIFICATION ICI : Vers /dashboard */}
                <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-100 transition">
                    ← {t('back')}
                </Link>
                <h1 className="text-lg font-bold text-black">{t('habit_tracker_title')}</h1>
                <div className="w-8"></div> {/* Spacer */}
            </div>

            {/* Navigation Date */}
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
          <div className="space-y-6">
            {sessions.map(session => (
              <div key={session.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                
                {/* En-tête Séance */}
                <div className={`p-6 text-white transition-colors ${session.is_completed ? 'bg-green-600' : 'bg-black'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-xl font-bold">{session.program_name}</h2>
                      <p className="text-sm opacity-80">{session.duration_minutes} {t('minutes_short')} • {session.exercises?.length || 0} {t('exercises_short')}</p>
                    </div>
                    {session.is_completed ? (
                        <div className="bg-white/20 p-2 rounded-full">✓</div>
                    ) : (
                        <div className="text-2xl opacity-50">🔥</div>
                    )}
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-white/20 h-1.5 rounded-full mt-4 overflow-hidden">
                      <div 
                        className="bg-white h-full transition-all duration-500 ease-out" 
                        style={{ width: `${getProgress(session)}%` }}
                      ></div>
                  </div>
                </div>

                {/* Liste des Exercices */}
                <div className="p-4 space-y-2">
                  {session.exercises && session.exercises.map((exo) => {
                    const isChecked = checkedExercises[`${session.id}-${exo.id}`] || session.is_completed;
                    
                    return (
                      <div 
                        key={exo.id}
                        onClick={() => !session.is_completed && toggleExercise(session.id, exo.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-gray-50 border-transparent' 
                            : 'bg-white border-gray-100 hover:border-black'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                          isChecked ? 'bg-green-500 border-green-500 text-white text-xs' : 'border-gray-300'
                        }`}>
                          {isChecked && '✓'}
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {exo.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {exo.sets} × {exo.reps}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 border-t border-gray-50 mt-2">
                  <button
                    onClick={() => handleCompleteSession(session)}
                    disabled={submittingId === session.id}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                        session.is_completed 
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                        : 'bg-black text-white hover:bg-gray-800 shadow-lg'
                    }`}
                  >
                    {submittingId === session.id ? '...' : session.is_completed ? t('cancel_validation') : t('validate_session')}
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
