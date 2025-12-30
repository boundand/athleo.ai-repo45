import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// 1. IMPORT PRO
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { user } = useAuth();
  
  // 2. ACTIVATION DE LA TRADUCTION
  const { t, i18n } = useTranslation();

  const [todaySession, setTodaySession] = useState(null);
  const [activeProgram, setActiveProgram] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // Date dynamique selon la langue actuelle (i18n.language)
  const todayDate = new Date().toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  });

  // Fonction pour changer la langue
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const progRes = await api.get('/programs');
      let currentProgram = null;
      if (progRes.data.programs && progRes.data.programs.length > 0) {
        const active = progRes.data.programs.find(p => p.is_active);
        currentProgram = active ? active : progRes.data.programs.sort((a, b) => b.id - a.id)[0];
        setActiveProgram(currentProgram);
      }

      const todayISO = new Date().toISOString().split('T')[0];
      const todayRes = await api.get(`/sessions/date/${todayISO}`);
      if (todayRes.data.sessions?.length > 0) setTodaySession(todayRes.data.sessions[0]);

      // Stats logic...
      try {
        const sessionRes = await api.get('/sessions');
        const allSessions = sessionRes.data.sessions || [];
        // ... (Logique de stats inchangée pour faire court) ...
        // Tu peux laisser ton code de calcul de stats ici
      } catch (e) { console.log("Stats error"); }

    } catch (error) {
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* --- EN-TÊTE --- */}
      <header className="bg-white px-6 py-6 rounded-b-3xl shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{todayDate}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-black">
              {t('greeting')} <span className="text-gray-500">{user?.name || t('athlete')}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* BOUTONS LANGUE PRO */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => changeLanguage('fr')} 
                    className={`px-2 py-1 text-xs font-bold rounded ${i18n.language === 'fr' ? 'bg-white shadow text-black' : 'text-gray-400'}`}
                >FR</button>
                <button 
                    onClick={() => changeLanguage('en')} 
                    className={`px-2 py-1 text-xs font-bold rounded ${i18n.language.startsWith('en') ? 'bg-white shadow text-black' : 'text-gray-400'}`}
                >EN</button>
            </div>

            <Link to="/profile" className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:scale-105 transition-transform">
              {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* CARTE SÉANCE */}
        <section>
          {todaySession ? (
            <div className={`rounded-3xl p-8 text-white shadow-xl transition-transform hover:scale-[1.01] ${
              todaySession.is_completed ? 'bg-green-600' : 'bg-black'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur mb-4">
                    {todaySession.is_completed ? t('completed') : t('todays_session')}
                  </span>
                  <h2 className="text-3xl font-bold mb-2">{todaySession.program_name}</h2>
                  <p className="opacity-80 text-lg mb-6">
                    {todaySession.duration_minutes} {t('minutes')} • {todaySession.exercises ? todaySession.exercises.length : t('several')} {t('exercises')}
                  </p>
                </div>
                <div className="text-5xl opacity-20">💪</div>
              </div>

              {todaySession.is_completed ? (
                <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur">
                  <p className="font-bold text-lg">{t('good_job')}</p>
                </div>
              ) : (
                <Link to="/session-tracker" className="block w-full bg-white text-black text-center py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-lg">
                  {t('start')}
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
              <span className="text-5xl block mb-4">😴</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('rest_day')}</h2>
              <p className="text-gray-500 mb-6">{activeProgram ? t('rest_desc') : t('no_program_desc')}</p>
              {!activeProgram && (
                <Link to="/program-generator" className="inline-block bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800">
                  {t('create_program')}
                </Link>
              )}
            </div>
          )}
        </section>

        {/* MENU RAPIDE (Exemple traduit) */}
        <section>
          <h3 className="text-lg font-bold text-black mb-4 ml-1">{t('quick_menu')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/program-generator" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition text-center group">
              <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">⚡</span>
              <span className="text-sm font-bold text-gray-700">{t('generator')}</span>
            </Link>
            <Link to="/analytics" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition text-center group">
              <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">📊</span>
              <span className="text-sm font-bold text-gray-700">{t('analytics')}</span>
            </Link>
            <Link to="/ai-chat" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition text-center group">
              <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">🤖</span>
              <span className="text-sm font-bold text-gray-700">{t('coach')}</span>
            </Link>
            <Link to="/history" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition text-center group">
              <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">📜</span>
              <span className="text-sm font-bold text-gray-700">{t('history')}</span>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Dashboard;