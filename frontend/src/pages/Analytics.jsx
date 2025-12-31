import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

function Analytics() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics');
      setData(res.data);
    } catch (err) {
      console.error("Erreur stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
    </div>
  );

  const stats = data?.global || { completed: 0, minutes: 0, rate: 0 };
  const chartData = data?.chart ? data.chart.slice(-7) : [];

  const daysMap = {
      'Monday': t('lun'), 'Tuesday': t('mar'), 'Wednesday': t('mer'), 'Thursday': t('jeu'), 
      'Friday': t('ven'), 'Saturday': t('sam'), 'Sunday': t('dim')
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans pb-20">
      
      {/* HEADER */}
      <div className="max-w-2xl mx-auto mb-8 flex items-center gap-4">
        {/* 👇 MODIFICATION ICI : Vers /dashboard */}
        <Link to="/dashboard" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition">
            ←
        </Link>
        <h1 className="text-3xl font-bold text-black">{t('my_stats')}</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* CARTES KPI */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-black text-white p-6 rounded-3xl shadow-lg">
                <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('total_sessions')}</p>
                <p className="text-4xl font-bold">{stats.completed}</p>
                <span className="text-xs bg-white/20 px-2 py-1 rounded mt-2 inline-block">{t('finished')}</span>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('total_time')}</p>
                <p className="text-4xl font-bold text-black">{stats.minutes}</p>
                <p className="text-xs text-gray-500 mt-1">{t('effort_minutes')}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 col-span-2 md:col-span-1 flex flex-col justify-center relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('consistency')}</p>
                    <p className="text-4xl font-bold text-green-600">{stats.rate}%</p>
                </div>
                <div className="absolute bottom-0 left-0 h-2 bg-green-100 w-full">
                    <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${stats.rate}%` }}></div>
                </div>
            </div>
        </div>

        {/* GRAPHIQUE */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t('activity_7_days')}</h3>
            
            {chartData.length > 0 ? (
                <div className="grid grid-cols-7 gap-2 h-40 items-end">
                    {chartData.map((item, idx) => {
                        const rawDay = item.day_name ? item.day_name.trim() : '';
                        const displayDay = daysMap[rawDay] || rawDay.slice(0, 3);

                        return (
                            <div key={idx} className="flex flex-col items-center h-full justify-end">
                                {/* Barre */}
                                <div 
                                    className={`w-full max-w-[20px] rounded-t-lg transition-all duration-700 relative group ${item.completed > 0 ? 'bg-black' : 'bg-gray-100'}`}
                                    style={{ height: `${item.completed > 0 ? (item.completed * 40) : 10}%`, minHeight: '10%' }}
                                >
                                    {/* Tooltip */}
                                    {item.completed > 0 && (
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                            {item.completed} {t('session_unit')}
                                        </div>
                                    )}
                                </div>
                                {/* Jour */}
                                <p className="text-xs text-gray-400 mt-3 font-medium">
                                    {displayDay}
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl">
                    <span className="text-2xl block mb-2">📊</span>
                    {t('no_data_week')}
                </div>
            )}
        </div>

        {/* MOTIVATION */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 rounded-3xl shadow-lg text-white text-center">
            <h2 className="text-2xl font-bold mb-2">{t('keep_it_up')}</h2>
            <p className="opacity-90 mb-6 text-sm">{t('consistency_quote')}</p>
            <Link to="/session-tracker" className="bg-white text-blue-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition shadow-md">
                {t('view_calendar')}
            </Link>
        </div>

      </div>
    </div>
  );
}

export default Analytics;
