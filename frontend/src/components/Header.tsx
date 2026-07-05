interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  let currentUser = localStorage.getItem('currentUser') || 'User';
  if (currentUser.includes('@')) {
    currentUser = currentUser.split('@')[0];
  }
  currentUser = currentUser.replace(/[0-9]/g, '');
  currentUser = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);

  return (
    <header className="page-header">
      <div className="page-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          background: 'var(--glass-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 12px',
          fontWeight: 600,
        }}>
          👤 {currentUser}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          background: 'var(--glass-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
