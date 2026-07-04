import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getHealth } from '../api';
import type { HealthStatus } from '../types';

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: '/analyze',
    label: 'Analyze',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
        <line x1="8" x2="16" y1="22" y2="22" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'History',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };
  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          </svg>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">CESTS</span>
          <span className="sidebar-logo-sub">Sentiment AI</span>
        </div>
      </div>

      <span className="nav-section-label">Main Menu</span>

      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/dashboard'}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          {icon}
          {label}
        </NavLink>
      ))}

      <button
        onClick={handleLogout}
        className="nav-link"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          marginTop: 'auto',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>

      <div className="sidebar-bottom">
        <div className="sidebar-status">
          <div className={`status-dot ${health?.status === 'healthy' ? '' : 'offline'}`} />
          <div>
            <div className="status-text" style={{ fontWeight: 600, color: health?.status === 'healthy' ? 'var(--color-positive)' : 'var(--color-negative)' }}>
              {health?.status === 'healthy' ? 'API Online' : 'API Offline'}
            </div>
            {health && (
              <div className="status-text" style={{ fontSize: '10.5px', marginTop: '1px' }}>
                Gemini {health.gemini_enabled ? '✓' : '✗'} · Whisper {health.whisper_enabled ? '✓' : '✗'}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
