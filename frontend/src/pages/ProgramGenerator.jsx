import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

function ProgramGenerator() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    age: '',
    height: '',
    weight: '',
    goal: 'gain_muscle',
    level: 'intermediaire',
    days: [],
    duration: '60',
    equipment: 'salle',
    equipmentDetails: [],
    supplements: '',
    constraints: ''
  });

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const gymMissingList = ["Cage à squat", "Presse à cuisses", "Poulies vis-à-vis", "Haltères > 30kg", "Machine Smith", "Banc développé couché"];
  const homeAvailableList = ["Haltères", "Banc de muscu", "Barre de traction", "Élastiques", "Kettlebells", "Barre olympique & Poids", "Tapis de sol", "Vélo / Cardio"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const newDays = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days: newDays };
    });
  };

  const toggleEquipment = (item) => {
    setFormData(prev => {
        const currentList = Array.isArray(prev.equipmentDetails) ? prev.equipmentDetails : [];
        const newList = currentList.includes(item)
            ? currentList.filter(i => i !== item)
            : [...currentList, item];
        return { ...prev, equipmentDetails: newList };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.days.length === 0) return alert(t('select_day_alert'));
    if (!formData.age || !formData.weight) return alert(t('fill_info_alert'));

    setLoading(true);

    try {
      const equipmentString = Array.isArray(formData.equipmentDetails) 
        ? formData.equipmentDetails.join(', ') 
        : formData.equipmentDetails;

      const response = await api.post('/programs/generate', {
        trainingDays: formData.days,
        durationMinutes: parseInt(formData.duration),
        equipment: formData.equipment,
        equipmentDetails: equipmentString,
        level: formData.level,
        goals: [formData.goal],
        personalInfo: {
            age: formData.age,
            height: formData.height,
            weight: formData.weight,
            constraints: formData.constraints,
            supplements: formData.supplements
        }
      });
      
      let programId = response.data?.program?.id || response.data?.id || response.data?.programId;

      if (!programId) {
        const allProgramsRes = await api.get('/programs');
        if (allProgramsRes.data.programs && allProgramsRes.data.programs.length > 0) {
           const sorted = allProgramsRes.data.programs.sort((a, b) => b.id - a.id);
           programId = sorted[0].id;
        }
      }

      if (programId) {
          navigate(`/program/${programId}`);
      } else {
          alert("Programme créé, mais impossible de l'ouvrir automatiquement.");
          // 👇 MODIFICATION ICI : Vers /dashboard
          navigate('/dashboard');
      }

    } catch (error) {
      console.error('Erreur frontend:', error);
      alert(t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-black py-6 px-8 text-center">
          <h1 className="text-2xl font-bold text-white">{t('create_pro_program')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('ai_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* 1. INFOS PERSO */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('my_info')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('age')}</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full border rounded-xl p-3" placeholder="25" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('weight')}</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full border rounded-xl p-3" placeholder="70" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('height')}</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full border rounded-xl p-3" placeholder="175" required />
              </div>
            </div>
          </div>

          <hr />

          {/* 2. OBJECTIF & NIVEAU */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('goal_title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('main_goal')}</label>
                <select name="goal" value={formData.goal} onChange={handleChange} className="w-full border rounded-xl p-3">
                  <option value="gain_muscle">{t('gain_muscle')}</option>
                  <option value="weight_loss">{t('weight_loss')}</option>
                  <option value="strength">{t('strength')}</option>
                  <option value="endurance">{t('endurance')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('level_label')}</label>
                <select name="level" value={formData.level} onChange={handleChange} className="w-full border rounded-xl p-3">
                  <option value="debutant">{t('beginner')}</option>
                  <option value="intermediaire">{t('intermediate')}</option>
                  <option value="avance">{t('advanced')}</option>
                </select>
              </div>
            </div>
          </div>

          <hr />

          {/* 3. MATÉRIEL */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('equipment_title')}</h3>
            
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">{t('training_place')}</label>
                <select 
                    name="equipment" 
                    value={formData.equipment} 
                    onChange={(e) => {
                        setFormData({...formData, equipment: e.target.value, equipmentDetails: []});
                    }} 
                    className="w-full border rounded-xl p-3"
                >
                    <option value="salle">{t('gym')}</option>
                    <option value="maison">{t('home')}</option>
                    <option value="corps">{t('bodyweight')}</option>
                </select>
            </div>

            {/* SELECTION POUR SALLE */}
            {formData.equipment === 'salle' && (
                <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-100">
                    <label className="block text-sm font-bold mb-3 text-red-600">
                        {t('gym_missing')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {gymMissingList.map(item => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => toggleEquipment(item)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                    formData.equipmentDetails.includes(item)
                                    ? 'bg-red-500 text-white border-red-500'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'
                                }`}
                            >
                                {formData.equipmentDetails.includes(item) ? '✕' : '+'} {item}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* SELECTION POUR MAISON */}
            {formData.equipment === 'maison' && (
                <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-100">
                    <label className="block text-sm font-bold mb-3 text-green-700">
                        {t('home_available')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {homeAvailableList.map(item => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => toggleEquipment(item)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                    formData.equipmentDetails.includes(item)
                                    ? 'bg-green-600 text-white border-green-600'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                                }`}
                            >
                                {formData.equipmentDetails.includes(item) ? '✓' : '+'} {item}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">{t('supplements_label')}</label>
                <input 
                    type="text" 
                    name="supplements" 
                    value={formData.supplements} 
                    onChange={handleChange} 
                    className="w-full border rounded-xl p-3" 
                    placeholder="Ex: Créatine, Whey..." 
                />
            </div>

             <div className="mb-4">
                <label className="block text-sm font-medium mb-1">{t('constraints_label')}</label>
                <input 
                    type="text" 
                    name="constraints" 
                    value={formData.constraints} 
                    onChange={handleChange} 
                    className="w-full border rounded-xl p-3" 
                    placeholder="Ex: Mal au genou droit..." 
                />
            </div>
          </div>

          <hr />

          {/* 4. PLANNING */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('planning_title')}</h3>
            <label className="block text-sm font-medium mb-2">{t('training_days')}</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    formData.days.includes(day)
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">{t('duration_label')}</label>
                <select name="duration" value={formData.duration} onChange={handleChange} className="w-full border rounded-xl p-3">
                    <option value="30">30 min (Express)</option>
                    <option value="45">45 min (Standard)</option>
                    <option value="60">1h00 (Optimal)</option>
                    <option value="90">1h30 (Intensif)</option>
                    <option value="120">2h00 (Long)</option>
                </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    {t('generating')}
                </>
            ) : (
                t('generate_btn')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProgramGenerator;
