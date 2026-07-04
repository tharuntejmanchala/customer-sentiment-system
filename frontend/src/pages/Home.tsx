import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('authenticated') === 'true';

  const handleStart = () => {
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, var(--bg-surface-2), var(--bg-base))',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, sans-serif',
      overflowX: 'hidden',
    }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 64px',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(8, 8, 16, 0.7)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-primary)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>CESTS</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {isAuthenticated ? (
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
                Sign In
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '120px 24px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: 900,
        margin: '0 auto',
        gap: 24,
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--color-primary-light)',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-full)',
          padding: '6px 16px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          animation: 'fadeIn 0.5s ease',
        }}>
          ✨ Next-Gen Customer Engagement Intelligence
        </div>
        
        <h1 style={{
          fontSize: '56px',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-1.5px',
          marginTop: 10,
        }}>
          Understand Customer Sentiment <br />
          with <span className="gradient-text">Gemini 2.5 AI & Whisper</span>
        </h1>

        <p style={{
          fontSize: 17,
          color: 'var(--text-secondary)',
          maxWidth: 640,
          lineHeight: 1.6,
          marginTop: 10,
        }}>
          Analyze audio recordings, verify transcripts, and get instant summaries with actionable customer insights. All powered by industry-leading sentiment engines.
        </p>

        <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
          <button className="btn btn-primary btn-lg" onClick={handleStart} style={{ padding: '14px 36px', borderRadius: 'var(--radius-md)' }}>
            Start Analyzing Now
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')} style={{ padding: '14px 36px', borderRadius: 'var(--radius-md)' }}>
            Sign In
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        maxWidth: 1100,
        margin: '40px auto 120px',
        padding: '0 24px',
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: 48,
          letterSpacing: '-0.8px',
        }}>
          Powerful Core Features
        </h2>

        <div className="grid-3">
          {[
            {
              title: '🎙️ Audio & Speech to Text',
              desc: 'Record customer audio directly in your browser or upload files. Whisper AI accurately transcribes speeches on-the-fly.',
            },
            {
              title: '🧠 Hybrid Sentiment Scoring',
              desc: 'Combines a custom-trained Bidirectional LSTM model with Rule-based NLTK VADER engines for highly accurate, balanced outputs.',
            },
            {
              title: '📝 Intelligent Summaries',
              desc: 'Generates instant, coherent, multi-sentence summaries, key theme extraction, and actionable steps using Gemini 2.5 Flash.',
            },
          ].map((f, i) => (
            <div key={i} className="card" style={{
              padding: 32,
              background: 'var(--glass-bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              transition: 'transform 0.3s ease, border-color 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--text-muted)',
      }}>
        © {new Date().getFullYear()} CESTS Inc. All rights reserved. Powered by Google DeepMind.
      </footer>
    </div>
  );
}
