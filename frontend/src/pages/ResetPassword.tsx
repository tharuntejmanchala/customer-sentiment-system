import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    resetPassword(token, password)
      .then(res => {
        setMessage(res.message || 'Password reset successfully! You can now sign in.');
      })
      .catch(err => {
        setError(err.message || 'Something went wrong.');
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
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Create New Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Please enter your new password below.
          </p>
        </div>

        {error && <div className="alert alert-error mb-4" style={{ padding: '8px 12px', fontSize: 12.5 }}>{error}</div>}
        {message && <div className="alert alert-success mb-4" style={{ padding: '8px 12px', fontSize: 12.5 }}>{message}</div>}

        {!message && token ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : message ? (
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
            Go to Login
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={() => navigate('/forgot-password')} style={{ width: '100%' }}>
            Request New Link
          </button>
        )}

        {!message && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/login" style={{ color: 'var(--color-primary)', fontSize: 13, textDecoration: 'none' }}>
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
