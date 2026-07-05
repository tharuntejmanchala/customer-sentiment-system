import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    // Mock local simulation fallback if Firebase is not configured
    if (auth.app.options.apiKey === 'mock-api-key') {
      setMessage('A password reset link has been sent to your email.');
      setLoading(false);
      return;
    }

    sendPasswordResetEmail(auth, username)
      .then(() => {
        setMessage('A password reset link has been sent to your email.');
      })
      .catch(err => {
        let msg = 'Failed to send password reset link. Please try again.';
        if (err.code === 'auth/user-not-found') {
          msg = 'No user registered with this email address.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Invalid email address format.';
        }
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'radial-gradient(circle at top right, var(--bg-surface-2), var(--bg-base))',
      width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 100,
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 400, padding: 36, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Reset Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {error && <div className="alert alert-error mb-4" style={{ padding: '8px 12px', fontSize: 12.5 }}>{error}</div>}
        {message && <div className="alert alert-success mb-4" style={{ padding: '8px 12px', fontSize: 12.5 }}>{message}</div>}

        {!message ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label htmlFor="username">Email Address</label>
              <input
                id="username"
                type="email"
                placeholder="Enter your email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <button className="btn btn-secondary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
            Back to Login
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontSize: 13, textDecoration: 'none' }}>
            Remember your password? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
