import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users: 0, programs: 0, completedSessions: 0 });
  const [editingId, setEditingId] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats')
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      alert("Accès refusé ou erreur serveur");
      navigate('/');
    }
  };

  const handleUpdatePass = async (id) => {
    if(!newPass) return;
    if(!window.confirm("Êtes-vous sûr de vouloir changer le mot de passe ?")) return;
    try {
      await api.put(`/admin/users/${id}/password`, { newPassword: newPass });
      alert('Mot de passe changé avec succès');
      setEditingId(null);
      setNewPass('');
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("ATTENTION : Cela supprimera définitivement l'utilisateur et TOUTES ses données. Continuer ?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      setStats({...stats, users: stats.users - 1}); // Mise à jour locale du compteur
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <Link to="/profile" className="text-gray-500 hover:text-black mb-2 inline-block">← Retour Profil</Link>
                <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
                <p className="text-gray-500">Gérez les utilisateurs et surveillez l'activité.</p>
            </div>
            <div className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider">
                Mode Super Admin
            </div>
        </div>
        
        {/* Cartes Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-400 text-xs font-bold uppercase mb-2">Utilisateurs Totaux</p>
                <p className="text-4xl font-extrabold text-black">{stats.users}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-400 text-xs font-bold uppercase mb-2">Programmes Générés</p>
                <p className="text-4xl font-extrabold text-blue-600">{stats.programs}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-400 text-xs font-bold uppercase mb-2">Séances Terminées</p>
                <p className="text-4xl font-extrabold text-green-600">{stats.completedSessions}</p>
            </div>
        </div>

        {/* Tableau Utilisateurs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-black">Liste des Utilisateurs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Nom</th>
                    <th className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Email</th>
                    <th className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Date Inscription</th>
                    <th className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{user.name}</td>
                    <td className="p-4 text-gray-500">{user.email}</td>
                    <td className="p-4 text-gray-500 text-sm">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 flex justify-end gap-3 items-center">
                        {editingId === user.id ? (
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                            <input 
                            type="text" 
                            placeholder="Nouveau MDP" 
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-sm w-32 outline-none focus:border-black"
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            />
                            <button onClick={() => handleUpdatePass(user.id)} className="text-green-600 hover:bg-green-100 p-1 rounded">✔</button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-gray-200 p-1 rounded">✖</button>
                        </div>
                        ) : (
                        <button 
                            onClick={() => setEditingId(user.id)} 
                            className="text-gray-600 hover:text-black text-sm font-medium border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                        >
                            🔑 Changer MDP
                        </button>
                        )}
                        <button 
                            onClick={() => handleDelete(user.id)} 
                            className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                        >
                            🗑 Supprimer
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-400">Aucun autre utilisateur trouvé.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;