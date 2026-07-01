import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage/LandingPage';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Onboarding from './pages/Onboarding/Onboarding';
import Dashboard from './pages/Dashboard/Dashboard';
import SkillGapAnalysis from './pages/SkillGapAnalysis/SkillGapAnalysis';
import AcceptInvite from './pages/Invitation/AcceptInvite';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="fetching-loader">
      <div className="fetching-loader-icon">⚡</div>
      <div className="fetching-loader-text">
        <h3>SkillGuard AI</h3>
        <p>Preparing your workspace…</p>
      </div>
      <div className="fetching-loader-bar-wrap">
        <div className="fetching-loader-bar" />
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

// Public Route (Redirects to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="fetching-loader">
      <div className="fetching-loader-icon">⚡</div>
      <div className="fetching-loader-text">
        <h3>SkillGuard AI</h3>
        <p>Preparing your workspace…</p>
      </div>
      <div className="fetching-loader-bar-wrap">
        <div className="fetching-loader-bar" />
      </div>
    </div>
  );
  if (user && window.location.pathname !== '/signup') return <Navigate to="/dashboard" replace />;
  
  return children;
};

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/invite" element={<AcceptInvite />} />
        
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/skill-gap-analysis" element={
          <ProtectedRoute>
            <SkillGapAnalysis />
          </ProtectedRoute>
        } />

        {/* Catch-all redirect to landing or dashboard depending on auth */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
