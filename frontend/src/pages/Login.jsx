import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showForgotMessage, setShowForgotMessage] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // 👇 C'EST ICI QUE ÇA CHANGE : On va vers le dashboard après connexion
      navigate('/dashboard');
    } catch (err) {
      setError(t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6">
            <span className="text-3xl">💪</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">
            {t('welcome_back')}
          </h1>
          <p className="text-gray-500 text-sm">{t('subtitle_login')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-red-800 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {showForgotMessage && (
          <div className="mb-6 p-5 bg-blue-50 rounded-2xl border border-blue-100 animate-fade-in text-center">
            <p className="text-blue-900 text-sm leading-relaxed">
              {t('forgot_msg_1')} <span className="font-bold">bookings937@gmail.com</span> {t('forgot_msg_2')}
            </p>
            <p className="text-blue-800 text-xs mt-2 opacity-80">
              {t('forgot_msg_3')}
            </p>
            <button 
                onClick={() => setShowForgotMessage(false)}
                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
            >
                {t('close_msg')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder={t('email_placeholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder={t('password_placeholder')}
              required
            />
            
            <div className="flex justify-end mt-2">
                <button 
                    type="button"
                    onClick={() => setShowForgotMessage(true)}
                    className="text-xs text-gray-500 hover:text-black font-medium transition-colors"
                >
                    {t('forgot_password')}
                </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? t('logging_in') : t('login_btn')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            {t('no_account')}{' '}
            <Link to="/register" className="text-black font-semibold hover:underline">
              {t('sign_up_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
