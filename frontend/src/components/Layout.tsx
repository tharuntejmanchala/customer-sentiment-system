import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLocation } from 'react-router-dom';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your sentiment analytics' },
  '/analyze': { title: 'Analyze', subtitle: 'Audio recording, file upload, or text analysis' },
  '/history': { title: 'History', subtitle: 'All past analyses and recordings' },
  '/analytics': { title: 'Analytics', subtitle: 'Trends, distributions and insights' },
};

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const meta = pageMeta[pathname] ?? { title: 'CESTS', subtitle: '' };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header title={meta.title} subtitle={meta.subtitle} />
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
