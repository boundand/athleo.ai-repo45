import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

function ProgramDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [programData, setProgramData] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await api.get(`/programs/${id}`);
        const prog = response.data.program || response.data;
        const exos = response.data.exercises || [];
        
        setProgramData(prog);
        setExercises(exos);
      } catch (error) {
        console.error("Erreur chargement programme", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, [id]);

  const groupExercisesByDay = (exercisesList) => {
    const grouped = {};
    exercisesList.forEach(ex => {
      const dayName = ex.day.charAt(0).toUpperCase() + ex.day.slice(1);
      if (!grouped[dayName]) grouped[dayName] = [];
      grouped[dayName].push(ex);
    });
    
    const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return Object.keys(grouped)
      .sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b))
      .reduce((obj, key) => {
        obj[key] = grouped[key];
        return obj;
      }, {});
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
    </div>
  );

  if (!programData) return <div className="p-10 text-center">{t('program_not_found')}</div>;

  const groupedExercises = groupExercisesByDay(exercises);

  const parseList = (data) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      try { return JSON.parse(data); } catch (e) { return []; }
  };

  const nutritionTips = parseList(programData.nutrition_info);
  const progressionTips = parseList(programData.progression_info);
  const safetyTips = parseList(programData.safety_info);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-gray-100 pb-8 pt-6 px-4">
        <div className="max-w-4xl mx-auto">
            {/* 👇 MODIFICATION ICI : Vers /dashboard */}
            <Link to="/dashboard" className="text-sm text-gray-500 hover:text-blue-600 mb-6 inline-block font-medium">
                {t('back_dashboard')}
            </Link>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                {programData.name}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {programData.description}
            </p>

            <div className="flex flex-wrap gap-3">
                <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    ⏱ 8 {t('weeks')}
                </span>
                <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    📅 {Object.keys(groupedExercises).length} {t('days_per_week')}
                </span>
                <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    ⚡ {t('level_label')} {programData.level || 'Intermédiaire'}
                </span>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        
        {/* --- STATS CLÉS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-lg shadow-blue-200">
                <div className="text-blue-200 text-xs font-bold uppercase mb-1">{t('calories_target')}</div>
                <div className="text-3xl font-extrabold">{programData.est_calories || 2500} kcal</div>
                <p className="text-sm text-blue-100 mt-2 opacity-80">{t('weekly_est')}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase mb-1">{t('proteins')}</div>
                <div className="text-3xl font-extrabold text-gray-900">{programData.est_protein || 150}g</div>
                <p className="text-sm text-gray-500 mt-2">{t('daily_rec')}</p>
            </div>
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase mb-1">{t('session_duration')}</div>
                <div className="text-3xl font-extrabold text-gray-900">{programData.duration_minutes} min</div>
                <p className="text-sm text-gray-500 mt-2">{t('optimal_intensity')}</p>
            </div>
        </div>

        {/* --- CONSEILS --- */}
        <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-gray-900">
                    {t('nutrition_tips')}
                </h3>
                <ul className="space-y-3">
                    {nutritionTips.length > 0 ? nutritionTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                            <span className="text-blue-500 mt-1">✔</span>{tip}
                        </li>
                    )) : <p className="text-gray-400 text-sm">--</p>}
                </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-gray-900">
                    {t('progression_plan')}
                </h3>
                <ul className="space-y-3">
                    {progressionTips.length > 0 ? progressionTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                            <span className="text-blue-500 mt-1">🚀</span>{tip}
                        </li>
                    )) : <p className="text-gray-400 text-sm">--</p>}
                </ul>
            </div>

             <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-red-800">
                    {t('safety_tips')}
                </h3>
                <ul className="space-y-3">
                    {safetyTips.length > 0 ? safetyTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-red-700 text-sm">
                            <span className="mt-1">⚠️</span>{tip}
                        </li>
                    )) : <p className="text-red-400 text-sm">--</p>}
                </ul>
            </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{t('weekly_program')}</h2>

        {/* --- LISTE DES JOURS --- */}
        <div className="space-y-6">
            {Object.keys(groupedExercises).length === 0 ? (
                <div className="text-center py-10">{t('no_exercises')}</div>
            ) : (
                Object.entries(groupedExercises).map(([day, dayExercises], dayIdx) => (
                <div key={day} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                             <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                                {t('day')} {dayIdx + 1}
                             </span>
                             <h2 className="text-lg font-bold text-gray-900">{day}</h2>
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {dayExercises.length} {t('exercises_count')}
                        </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {dayExercises.map((exercise, index) => (
                            <div key={index} className="p-6 hover:bg-gray-50 transition-colors group">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start gap-4">
                                        <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm mt-1">
                                            {index + 1}
                                        </span>
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                                {exercise.name}
                                            </h3>
                                            {exercise.tips && (
                                                <p className="text-sm text-gray-500 mt-2 bg-blue-50 p-3 rounded-lg border border-blue-100 inline-block w-full">
                                                    💡 <strong>{t('tip')} :</strong> {exercise.tips}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-12">
                                        <div className="bg-gray-100 rounded-xl p-3 text-center">
                                            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">{t('sets')}</div>
                                            <div className="text-xl font-extrabold text-gray-900">{exercise.sets}</div>
                                        </div>
                                        <div className="bg-gray-100 rounded-xl p-3 text-center">
                                            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">{t('reps')}</div>
                                            <div className="text-xl font-extrabold text-gray-900">{exercise.reps}</div>
                                        </div>
                                        <div className="bg-gray-100 rounded-xl p-3 text-center border-l-4 border-blue-500">
                                            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">{t('tempo')}</div>
                                            <div className="text-lg font-bold text-gray-900 font-mono">
                                                {exercise.tempo || "2-0-2-0"}
                                            </div>
                                        </div>
                                        <div className="bg-gray-100 rounded-xl p-3 text-center">
                                            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">{t('rest')}</div>
                                            <div className="text-lg font-bold text-gray-900">{exercise.rest_seconds}s</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}

export default ProgramDetails;
