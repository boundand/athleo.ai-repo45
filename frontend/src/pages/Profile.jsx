import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next'; // <--- IMPORT

function Profile() {
  const { user, logout, loading } = useAuth();
  const { t, i18n } = useTranslation(); // <--- ACTIVATION
  const navigate = useNavigate();
  
  const [completedSessions, setCompletedSessions] = useState(0);
  
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isEditingPass, setIsEditingPass] = useState(false);

  useEffect(() => {
    const fetchUserStats = async () => {
        try {
            const sessRes = await api.get('/sessions');
            const completed = sessRes.data.sessions ? sessRes.data.sessions.filter(s => s.is_completed).length : 0;
            setCompletedSessions(completed);
        } catch (e) {
            console.error("Erreur stats profil", e);
        }
    };
    if (user) fetchUserStats();
  }, [user]);

  const handleLogout = () => {
    if(window.confirm(t('logout_confirm'))) {
        logout();
        navigate('/login');
    }
  };

  const handlePassChange = async (e) => {
      e.preventDefault();
      setMessage({ text: '', type: '' });

      if (passData.new !== passData.confirm) {
          return setMessage({ text: t('passwords_mismatch'), type: "error" });
      }
      if (passData.new.length < 6) {
          return setMessage({ text: t('password_too_short'), type: "error" });
      }

      try {
          await api.put('/auth/password', {
              currentPassword: passData.current,
              newPassword: passData.new
          });
          setMessage({ text: t('password_changed_success'), type: "success" });
          setPassData({ current: '', new: '', confirm: '' });
          setIsEditingPass(false);
      } catch (err) {
          setMessage({ 
              text: err.response?.data?.error || t('change_error'), 
              type: "error" 
          });
      }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  const isAdmin = user.email === 'younessini2@gmail.com';
  // Date dynamique selon la langue
  const joinDate = new Date(user.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      
      {/* BOUTON RETOUR */}
      <div className="max-w-2xl mx-auto mb-6">
        <Link to="/" className="text-gray-500 hover:text-black font-medium transition flex items-center gap-2">
          ← {t('back_dashboard')}
        </Link>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* CARTE D'IDENTITÉ */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-gray-900 to-black"></div>
            
            <div className="relative">
                <div className="w-28 h-28 bg-white rounded-full mx-auto flex items-center justify-center text-5xl mb-4 border-4 border-white shadow-lg -mt-12">
                    {isAdmin ? '👑' : '👤'}
                </div>
                
                <h1 className="text-3xl font-bold text-black mb-1">{user.name}</h1>
                <p className="text-gray-500 text-sm mb-4">{user.email}</p>
                
                <div className="inline-flex items-center gap-4 bg-gray-50 px-6 py-2 rounded-full border border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        {t('member_since')} {joinDate}
                    </span>
                    <span className="h-4 w-[1px] bg-gray-300"></span>
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wide">
                        {completedSessions} {t('sessions_done')}
                    </span>
                </div>
            </div>
        </div>

        {/* SECTION SÉCURITÉ */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {t('security_title')}
                </h3>
                <button 
                    onClick={() => setIsEditingPass(!isEditingPass)}
                    className="text-sm font-bold text-blue-600 hover:underline"
                >
                    {isEditingPass ? t('cancel') : t('edit_password')}
                </button>
            </div>

            {isEditingPass && (
                <form onSubmit={handlePassChange} className="space-y-4 animate-fade-in bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('current_password')}</label>
                        <input 
                            type="password" 
                            required
                            className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:border-black transition"
                            value={passData.current}
                            onChange={e => setPassData({...passData, current: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('new_password')}</label>
                            <input 
                                type="password" 
                                required
                                minLength={6}
                                className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:border-black transition"
                                value={passData.new}
                                onChange={e => setPassData({...passData, new: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('confirm_password')}</label>
                            <input 
                                type="password" 
                                required
                                minLength={6}
                                className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:border-black transition"
                                value={passData.confirm}
                                onChange={e => setPassData({...passData, confirm: e.target.value})}
                            />
                        </div>
                    </div>

                    {message.text && (
                        <div className={`text-sm font-bold p-3 rounded-xl text-center ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {message.text}
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
                    >
                        {t('save_password_btn')}
                    </button>
                </form>
            )}
        </div>

        {/* MENU D'ACTIONS */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-3">
            <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">{t('navigation')}</h3>

            {isAdmin && (
                <button 
                    onClick={() => navigate('/admin')}
                    className="w-full flex items-center justify-between bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800 transition shadow-lg group"
                >
                    <span className="flex items-center gap-3">
                        {t('admin_panel')}
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
            )}
            
            <button 
                onClick={() => navigate('/history')}
                className="w-full flex items-center justify-between bg-white border border-gray-200 text-black p-4 rounded-2xl font-medium hover:bg-gray-50 transition group"
            >
                <span className="flex items-center gap-3">
                    {t('programs_history_btn')}
                </span>
                <span className="text-gray-400 group-hover:text-black transition-colors">→</span>
            </button>
            
            <div className="pt-4 mt-4 border-t border-gray-100">
                <button 
                    onClick={handleLogout}
                    className="w-full text-red-600 bg-red-50 p-4 rounded-2xl font-bold hover:bg-red-100 transition text-center"
                >
                    {t('logout_btn')}
                </button>
            </div>
        </div>

        <p className="text-center text-gray-300 text-xs mt-8">Altheo.ai v1.0 • {t('made_with')}</p>
      </div>
    </div>
  );
}

export default Profile;