import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProgramGenerator from './pages/ProgramGenerator';
import ProgramDetails from './pages/ProgramDetails';
import ProgramHistory from './pages/ProgramHistory';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import AIChat from './pages/AIChat';
import SessionTracker from './pages/SessionTracker';

// Composant de protection
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      {/* Routes Publiques */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Routes Protégées */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/program-generator" element={<ProtectedRoute><ProgramGenerator /></ProtectedRoute>} />
      <Route path="/program/:id" element={<ProtectedRoute><ProgramDetails /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><ProgramHistory /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
      <Route path="/session-tracker" element={<ProtectedRoute><SessionTracker /></ProtectedRoute>} />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;