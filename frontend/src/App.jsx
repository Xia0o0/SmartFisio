import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/Auth/AuthPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ExercisePlayerPage from './pages/ExercisePlayer/ExercisePlayerPage';
import ProgressPage from './pages/Progress/ProgressPage';
import TherapistPage from './pages/Therapist/TherapistPage';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('smartfisio_token');
  return token ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('smartfisio_token');
  return token ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/exercise/:id" element={<PrivateRoute><ExercisePlayerPage /></PrivateRoute>} />
        <Route path="/progress" element={<PrivateRoute><ProgressPage /></PrivateRoute>} />
        <Route path="/therapist" element={<PrivateRoute><TherapistPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
