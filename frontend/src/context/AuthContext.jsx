import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. AU CHARGEMENT DE L'APPLI : On vérifie si un token existe
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // On demande au backend qui est l'utilisateur lié à ce token
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Token invalide ou expiré", error);
          // Si le token n'est plus bon, on nettoie tout
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false); // Le chargement est fini
    };

    loadUser();
  }, []);

  // 2. FONCTION DE CONNEXION
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    
    // On sauvegarde le token et l'user
    const { token, user } = response.data;
    localStorage.setItem('token', token); // <-- C'EST ÇA QUI SAUVEGARDE
    setUser(user);
    
    return user;
  };

  // 3. FONCTION D'INSCRIPTION
  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setUser(user);
    
    return user;
  };

  // 4. FONCTION DE DÉCONNEXION
  const logout = () => {
    localStorage.removeItem('token'); // On supprime le token
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);