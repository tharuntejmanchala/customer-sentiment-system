import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalytics } from '../api';
import type { Analytics, Recording } from '../types';
import StatCard from '../components/StatCard';
import SentimentBadge from '../components/SentimentBadge';

const iconStyle = { width: 20, height: 20 };

export default function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const dist = data?.sentiment_distribution ?? { positive: 0, negative: 0, neutral: 0 };
  const pctPositive = data?.total ? Math.round((dist.positive / data.total) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Welcome to <span className="gradient-text">CESTS</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            AI-powered Customer Engagement Sentiment Tracking — Gemini · Whisper · VADER
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          </svg>
          New Analysis
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid-4">
        <StatCard
          label="Total Analyses"
          value={data?.total ?? 0}
          icon={<svg style={{ ...iconStyle, color: '#6366f1' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
          iconBg="rgba(99,102,241,0.15)"
          trend={data?.total ? `${data.total} total` : 'No data yet'}
        />
        <StatCard
          label="Positive Rate"
          value={`${pctPositive}%`}
          icon={<svg style={{ ...iconStyle, color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          iconBg="rgba(16,185,129,0.15)"
          trend={`${dist.positive} positive`}
          trendUp={pctPositive > 50}
        />
        <StatCard
          label="Negative Count"
          value={dist.negative}
          icon={<svg style={{ ...iconStyle, color: '#ef4444' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
          iconBg="rgba(239,68,68,0.15)"
          trend={dist.negative > 0 ? 'Needs attention' : 'All clear'}
          trendUp={dist.negative === 0}
        />
        <StatCard
          label="Avg Confidence"
          value={data ? `${Math.round(data.average_confidence * 100)}%` : 'N/A'}
          icon={<svg style={{ ...iconStyle, color: '#06b6d4' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
          iconBg="rgba(6,182,212,0.15)"
          trend="model accuracy"
        />
      </div>

      {/* Recent Analyses (Full Width) */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Analyses</div>
            <div className="card-subtitle">Last 5 results</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/history')}>
            View All
          </button>
        </div>

        {data?.recent && data.recent.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.recent.map((rec: Recording) => (
              <div key={rec.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'background var(--transition)',
              }}
                onClick={() => navigate('/history')}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
              >
                <SentimentBadge sentiment={rec.sentiment ?? 'neutral'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {rec.transcription || '(No transcription)'}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(rec.timestamp).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {Math.round(
                    (rec.sentiment === 'negative'
                      ? 1 - rec.confidence
                      : rec.sentiment === 'neutral'
                      ? 1 - Math.abs(rec.confidence - 0.5) * 2
                      : rec.confidence) * 100
                  )}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '30px 0 0' }}>
            <p>No recent analyses. Start by running a new analysis.</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Quick Actions</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/analyze', { state: { tab: 'record' } })}>
            🎙️ Record Audio
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/analyze', { state: { tab: 'upload' } })}>
            📄 Upload File
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/analyze', { state: { tab: 'text' } })}>
            ✏️ Analyze Text
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/analytics')}>
            📊 View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
