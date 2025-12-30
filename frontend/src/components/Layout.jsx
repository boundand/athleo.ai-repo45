import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 1. IMPORT
import { useTranslation } from 'react-i18next';

function Sidebar() {
  const { logout } = useAuth();
  
  // 2. ACTIVATION
  const { t } = useTranslation();

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-100 flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-8 px-4">FitApp</h1>

      <nav className="flex-1 space-y-2">
        {/* 3. REMPLACEMENT DU TEXTE */}
        <Link to="/" className="block px-4 py-3 rounded-xl hover:bg-gray-50">
           {t('nav_dashboard')}
        </Link>
        
        <Link to="/program" className="block px-4 py-3 rounded-xl hover:bg-gray-50">
           {t('nav_program')}
        </Link>

        <Link to="/profile" className="block px-4 py-3 rounded-xl hover:bg-gray-50">
           {t('nav_profile')}
        </Link>
      </nav>

      <button onClick={logout} className="text-red-500 font-bold px-4 py-3 text-left">
         {t('nav_logout')}
      </button>
    </div>
  );
}

export default Sidebar;