import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp } from '../api';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username;

  if (!username) {
    navigate('/login');
    return null;
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }

    setLoading(true);
    setError(null);

    verifyOtp(username, otp)
      .then(res => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('authenticated', 'true');
          localStorage.setItem('currentUser', res.username || username);
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      })
      .catch(err => {
        setError(err.message || 'Invalid or expired OTP.');
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
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Verify Email</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            We've sent a 6-digit OTP to <strong>{username}</strong>. Check your console logs if SMTP is not configured.
          </p>
        </div>

        {error && <div className="alert alert-error mb-4" style={{ padding: '8px 12px', fontSize: 12.5 }}>{error}</div>}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label htmlFor="otp">Enter OTP</label>
            <input
              id="otp"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              maxLength={6}
              style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
