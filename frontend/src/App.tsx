import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';

function ProtectedLayout({ authenticated }: { authenticated: boolean }) {
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    // Mock local simulation mode if Firebase is not configured
    if (auth.app.options.apiKey === 'mock-api-key') {
      const isAuth = localStorage.getItem('authenticated') === 'true';
      const userEmail = localStorage.getItem('currentUser') || 'demo@example.com';
      setUser(isAuth ? { email: userEmail } : null);
      setInitializing(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (usr) {
        localStorage.setItem('authenticated', 'true');
        localStorage.setItem('currentUser', usr.email || 'User');
      } else {
        localStorage.removeItem('authenticated');
        localStorage.removeItem('currentUser');
      }
      setInitializing(false);
    });
    return unsubscribe;
  }, [location.pathname]);

  if (initializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, background: 'var(--bg-base)' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Connecting to authentication server...</p>
      </div>
    );
  }

  const authenticated = !!user;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={authenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={authenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/forgot-password" element={authenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />

      {/* Protected Routes */}
      <Route element={<ProtectedLayout authenticated={authenticated} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/history" element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
