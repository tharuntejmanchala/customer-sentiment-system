import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword } from '../firebase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isMockMode = auth.app.options.apiKey === 'mock-api-key';

  const handleGoogleLogin = () => {
    setLoading(true);
    setError(null);

    if (isMockMode) {
      localStorage.setItem('authenticated', 'true');
      localStorage.setItem('currentUser', 'google-demo@example.com');
      localStorage.setItem('mock_token', 'mock-token-google-demo@example.com');
      setTimeout(() => {
        navigate('/dashboard');
        setLoading(false);
      }, 500);
      return;
    }

    signInWithPopup(auth, googleProvider)
      .then(async (result) => {
        const user = result.user;
        localStorage.setItem('authenticated', 'true');
        localStorage.setItem('currentUser', user.email || 'User');
        navigate('/dashboard');
      })
      .catch((err) => {
        setError(err.message || 'Google sign-in failed.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    if (isMockMode) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
        setLoading(false);
      }, 1500);
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      })
      .catch((err) => {
        let msg = 'Registration failed. Please try again.';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'This email address is already in use.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Invalid email address format.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password is too weak. Please use a stronger password.';
        }
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, var(--bg-surface-2), var(--bg-base))',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 400, padding: 36, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-primary)',
            marginBottom: 16,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {isMockMode ? '[Local Simulation Mode Active]' : 'Register securely using Firebase'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-4" style={{ padding: '8px 12px', fontSize: 12.5 }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4" style={{ padding: '8px 12px', fontSize: 12.5 }}>
            Registration successful! Redirecting to login...
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Google Sign In Option */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGoogleLogin}
            disabled={loading || success}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              fontSize: 13.5,
              fontWeight: 600,
              border: '1px solid var(--border)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', color: 'var(--text-muted)', fontSize: 11.5 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ padding: '0 10px' }}>or create secure password account</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={success}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={success}
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={success}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading || success}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
