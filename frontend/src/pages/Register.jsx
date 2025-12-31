import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

function Register() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    level: 'intermédiaire',
    goals: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const goalOptions = [
    { id: 'masse', label: 'gain_muscle' },
    { id: 'seche', label: 'weight_loss' },
    { id: 'force', label: 'strength' },
    { id: 'endurance', label: 'endurance' },
  ];

  const handleGoalToggle = (goal) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwords_mismatch'));
      return;
    }

    if (formData.goals.length === 0) {
      setError(t('select_goal_error'));
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        level: formData.level,
        goals: formData.goals
      });
      // 👇 C'EST ICI QUE ÇA CHANGE : On va vers le dashboard après inscription
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6">
            <span className="text-3xl">🏋️</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">
            {t('create_account')}
          </h1>
          <p className="text-gray-500 text-sm">{t('start_transformation')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-gray-100 rounded-2xl border border-gray-200">
            <p className="text-gray-800 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t('full_name')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t('email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t('password')}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t('confirm_password')}
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              {t('level_label')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['debutant', 'intermediaire', 'avance'].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, level })}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.level === level
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level === 'debutant' ? t('beginner') : level === 'intermediaire' ? t('intermediate') : t('advanced')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              {t('goal_title')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {goalOptions.map(goal => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => handleGoalToggle(goal.label)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.goals.includes(goal.label)
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t(goal.label)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {loading ? t('registering') : t('register_btn')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            {t('already_account')}{' '}
            <Link to="/login" className="text-black font-semibold hover:underline">
              {t('login_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
