import { useEffect, useState, useMemo, Fragment } from 'react';
import { listRecordings } from '../api';
import type { Recording } from '../types';
import SentimentBadge from '../components/SentimentBadge';

type SortKey = 'timestamp' | 'sentiment' | 'confidence';
type SortDir = 'asc' | 'desc';
type Filter = 'all' | 'positive' | 'negative' | 'neutral';

export default function History() {
  const [records, setRecords] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    listRecordings()
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let r = [...records];
    if (filter !== 'all') r = r.filter(x => x.sentiment === filter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        (x.transcription || '').toLowerCase().includes(q) ||
        (x.summary || '').toLowerCase().includes(q)
      );
    }
    r.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === 'timestamp') { av = a.timestamp; bv = b.timestamp; }
      else if (sortKey === 'sentiment') { av = a.sentiment; bv = b.sentiment; }
      else { av = a.confidence; bv = b.confidence; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return r;
  }, [records, filter, search, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p className="text-muted">Loading history...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {records.length} total · {filtered.length} shown
        </span>
      </div>

      {/* Filter & Search */}
      <div className="filter-bar">
        <div className="search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search transcriptions or summaries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {(['all', 'positive', 'negative', 'neutral'] as Filter[]).map(f => (
            <button
              key={f}
              className={`filter-chip ${f === 'all' ? '' : f} ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
          </svg>
          <h3>No analyses found</h3>
          <p>
            {records.length === 0
              ? 'Run your first analysis on the Analyze page.'
              : 'Try a different search or filter.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('timestamp')} style={{ minWidth: 140 }}>
                  Date / Time <SortIcon k="timestamp" />
                </th>
                <th style={{ minWidth: 200 }}>Transcription</th>
                <th onClick={() => handleSort('sentiment')} style={{ width: 110 }}>
                  Sentiment <SortIcon k="sentiment" />
                </th>
                <th onClick={() => handleSort('confidence')} style={{ width: 110 }}>
                  Confidence <SortIcon k="confidence" />
                </th>
                <th style={{ width: 80 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rec => {
                let displayConf = rec.confidence ?? 0;
                if (rec.sentiment === 'negative') {
                  displayConf = 1 - displayConf;
                } else if (rec.sentiment === 'neutral') {
                  displayConf = 1 - Math.abs(displayConf - 0.5) * 2;
                }
                const pct = Math.round(displayConf * 100);

                return (
                  <Fragment key={rec.id}>
                    <tr onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(rec.timestamp).toLocaleDateString()}<br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(rec.timestamp).toLocaleTimeString()}
                        </span>
                      </td>
                      <td>
                        <div className="truncate" style={{ maxWidth: 320 }}>
                          {rec.transcription || <em style={{ color: 'var(--text-muted)' }}>No transcription</em>}
                        </div>
                      </td>
                      <td>
                        <SentimentBadge sentiment={rec.sentiment ?? 'neutral'} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar-track" style={{ flex: 1, height: 5 }}>
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: rec.sentiment === 'positive' ? '#10b981' : rec.sentiment === 'negative' ? '#ef4444' : '#f59e0b'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={e => { e.stopPropagation(); setExpanded(expanded === rec.id ? null : rec.id); }}
                        >
                          {expanded === rec.id ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {expanded === rec.id && (
                      <tr key={`${rec.id}-detail`}>
                        <td colSpan={5} style={{ padding: '0 16px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: 'rgba(99,102,241,0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99,102,241,0.12)', marginTop: 8 }}>
                            {rec.transcription && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Full Transcription</div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{rec.transcription}</p>
                              </div>
                            )}
                            {rec.summary && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>AI Summary</div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{rec.summary}</p>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                              <span>ID: <code style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{rec.id.slice(0, 8)}...</code></span>
                              {rec.duration > 0 && <span>Duration: {rec.duration.toFixed(1)}s</span>}
                              {rec.compound !== undefined && <span>Compound: {rec.compound.toFixed(4)}</span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
