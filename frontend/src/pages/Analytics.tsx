import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { getAnalytics } from '../api';
import type { Analytics } from '../types';

const SENT_COLORS: Record<string, string> = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#f59e0b',
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      {label && <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name.charAt(0).toUpperCase() + p.name.slice(1)}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p className="text-muted">Loading analytics...</p>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="empty-state" style={{ height: '60vh' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
        <h3>No Data Yet</h3>
        <p>Run some analyses first, then come back here to see charts and trends.</p>
      </div>
    );
  }

  const distData = Object.entries(data.sentiment_distribution).map(([name, value]) => ({ name, value }));
  const timelineData = data.timeline;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Summary Stats Row */}
      <div className="grid-3">
        {[
          { label: 'Total Analyses', value: data.total, color: '#6366f1' },
          { label: 'Avg Confidence', value: `${Math.round(data.average_confidence * 100)}%`, color: '#06b6d4' },
          { label: 'Positive Rate', value: `${Math.round((data.sentiment_distribution.positive / data.total) * 100)}%`, color: '#10b981' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: '-1px' }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2">
        {/* Donut chart */}
        <div className="chart-card">
          <h3>Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={distData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {distData.map(entry => (
                  <Cell key={entry.name} fill={SENT_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'capitalize' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="chart-card">
          <h3>Sentiment Counts</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={distData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {distData.map(entry => (
                  <Cell key={entry.name} fill={SENT_COLORS[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Timeline chart */}
      {timelineData.length > 0 && (
        <div className="chart-card">
          <h3>Sentiment Trend Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timelineData}>
              <defs>
                {(['positive', 'negative', 'neutral'] as const).map(s => (
                  <linearGradient key={s} id={`grad-${s}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENT_COLORS[s]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={SENT_COLORS[s]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'capitalize' }}>{value}</span>} />
              {(['positive', 'negative', 'neutral'] as const).map(s => (
                <Area
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={SENT_COLORS[s]}
                  fill={`url(#grad-${s})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {timelineData.length === 0 && (
        <div className="chart-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
          <p>Not enough timeline data yet. Run analyses on multiple days to see trends.</p>
        </div>
      )}
    </div>
  );
}
