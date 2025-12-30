import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Vérifie que c'est bien le port de ton backend
});

// INTERCEPTEUR : Ajoute le token automatiquement à CHAQUE requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;