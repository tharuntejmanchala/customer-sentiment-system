import { useState, useRef, useEffect } from 'react';
import { analyzeText, analyzeAudio, saveRecording } from '../api';
import type { AnalysisResult } from '../types';
import SentimentGauge from '../components/SentimentGauge';
import SentimentBadge from '../components/SentimentBadge';

type Tab = 'record' | 'upload' | 'text';

export default function Analyze() {
  const [tab, setTab] = useState<Tab>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, []);

  const clearResult = () => { setResult(null); setError(null); setSaved(false); };

  // ---- Recording ----
  const startRecording = async () => {
    try {
      clearResult();
      setAudioURL(null);
      setAudioBlob(null);
      chunksRef.current = [];
      setDuration(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
      };
      mr.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (e) {
      setError('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && isRecording) {
      mediaRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  };

  const submitRecording = async () => {
    if (!audioBlob) return;
    setLoading(true);
    setError(null);
    clearResult();
    try {
      const resp = await analyzeAudio(audioBlob, 'recording.webm');
      const r = resp.analysis_result;
      setResult(r);
      // Auto-save
      await saveRecording({
        audioBlob,
        filename: 'recording.webm',
        timestamp: new Date().toISOString(),
        duration,
        transcription: resp.transcription,
        sentiment: r.sentiment,
        confidence: r.score,
        summary: r.summary,
      }).catch(() => {});
      setSaved(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ---- File upload ----
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); clearResult(); }
  };

  const submitFile = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    clearResult();
    try {
      const form = new FormData();
      form.append('audio', file);
      const resp = await fetch('http://127.0.0.1:5000/audio', { method: 'POST', body: form });
      if (!resp.ok) throw new Error((await resp.json()).detail ?? 'Server error');
      const data = await resp.json();
      const r = data.analysis_result as AnalysisResult;
      setResult(r);
      await saveRecording({
        audioBlob: file,
        filename: file.name,
        timestamp: new Date().toISOString(),
        duration: 0,
        transcription: data.transcription,
        sentiment: r.sentiment,
        confidence: r.score,
        summary: r.summary,
      }).catch(() => {});
      setSaved(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Text analysis ----
  const submitText = async () => {
    if (!text.trim()) { setError('Please enter some text.'); return; }
    setLoading(true);
    setError(null);
    clearResult();
    try {
      const r = await analyzeText(text);
      setResult(r);
      await saveRecording({
        timestamp: new Date().toISOString(),
        duration: 0,
        transcription: text,
        sentiment: r.sentiment,
        confidence: r.score,
        summary: r.summary,
      }).catch(() => {});
      setSaved(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>

      {/* Tab selector */}
      <div className="tabs">
        {([['record', '🎙️ Record Audio'], ['upload', '📁 Upload File'], ['text', '✏️ Enter Text']] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            className={`tab-btn${tab === id ? ' active' : ''}`}
            onClick={() => { setTab(id); clearResult(); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Record tab */}
      {tab === 'record' && (
        <div className="card fade-in">
          <div className="card-header">
            <div>
              <div className="card-title">Record Audio</div>
              <div className="card-subtitle">Speak and let Whisper AI transcribe + analyze</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '16px 0' }}>
            {/* Record button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              style={{
                width: 80, height: 80,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: isRecording
                  ? 'rgba(239,68,68,0.2)'
                  : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isRecording
                  ? '0 0 0 4px rgba(239,68,68,0.2), 0 0 0 8px rgba(239,68,68,0.1)'
                  : 'var(--glow-primary)',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
            >
              {isRecording ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#ef4444">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                </svg>
              )}
            </button>

            {isRecording && (
              <div className="recording-indicator">
                <div className="rec-dot" />
                <span style={{ fontWeight: 600, color: 'var(--color-negative)', fontFamily: 'monospace', fontSize: 18 }}>
                  {fmt(duration)}
                </span>
              </div>
            )}

            {!isRecording && !audioBlob && (
              <p className="text-muted text-sm">Click the microphone to start recording</p>
            )}

            {audioURL && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <audio src={audioURL} controls style={{ width: '100%', borderRadius: 8, outline: 'none' }} />
                <div style={{ fontSize: 12, color: 'var(--color-positive)' }}>✓ Recording ready ({fmt(duration)})</div>
                <button className="btn btn-primary" onClick={submitRecording} disabled={loading}>
                  {loading ? <><div className="spinner" /> Analyzing...</> : '🔍 Analyze Recording'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload tab */}
      {tab === 'upload' && (
        <div className="card fade-in">
          <div className="card-header">
            <div>
              <div className="card-title">Upload Audio File</div>
              <div className="card-subtitle">Supports MP3, WAV, M4A, WEBM, OGG</div>
            </div>
          </div>

          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => document.getElementById('file-input')?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ fontSize: 14, fontWeight: 500 }}>
              {file ? file.name : 'Drag & drop an audio file here, or click to browse'}
            </p>
            <p className="text-sm text-muted">Max 50 MB</p>
            <input
              id="file-input"
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); clearResult(); } }}
            />
          </div>

          {file && (
            <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--color-positive)' }}>✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              <button className="btn btn-primary" onClick={submitFile} disabled={loading}>
                {loading ? <><div className="spinner" /> Analyzing...</> : '🔍 Analyze File'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setFile(null); clearResult(); }}>Clear</button>
            </div>
          )}
        </div>
      )}

      {/* Text tab */}
      {tab === 'text' && (
        <div className="card fade-in">
          <div className="card-header">
            <div>
              <div className="card-title">Analyze Text</div>
              <div className="card-subtitle">Paste transcription or any customer feedback text</div>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="text-input">Text Input</label>
            <textarea
              id="text-input"
              rows={6}
              value={text}
              onChange={e => { setText(e.target.value); clearResult(); }}
              placeholder="Paste or type text here... e.g. 'The support team was incredibly helpful and resolved my issue quickly. I'm very satisfied!'"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={submitText} disabled={loading || !text.trim()}>
              {loading ? <><div className="spinner" /> Analyzing...</> : '🔍 Analyze Text'}
            </button>
            {text && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setText(''); clearResult(); }}>Clear</button>
            )}
            <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>{text.length} chars</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Results */}
      {result && !error && (
        <div className="result-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Analysis Results</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {saved && <span style={{ fontSize: 12, color: 'var(--color-positive)' }}>✓ Saved to history</span>}
              <SentimentBadge sentiment={result.sentiment ?? 'neutral'} />
            </div>
          </div>

          <div className="result-row">
            {/* Gauge */}
            <SentimentGauge score={result.score ?? 0} sentiment={result.sentiment ?? 'neutral'} size={160} />

            {/* Scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.score !== undefined && (['pos', 'neg', 'neu'] as const).map(k => {
                const label = k === 'pos' ? 'Positive' : k === 'neg' ? 'Negative' : 'Neutral';
                const color = k === 'pos' ? '#10b981' : k === 'neg' ? '#ef4444' : '#f59e0b';
                
                let val = 0;
                const s = result.score ?? 0.5;
                if (k === 'pos') {
                  val = s > 0.5 ? (s - 0.5) * 2 : 0;
                } else if (k === 'neg') {
                  val = s < 0.5 ? (0.5 - s) * 2 : 0;
                } else {
                  val = 1 - (s > 0.5 ? (s - 0.5) * 2 : (0.5 - s) * 2);
                }

                return (
                  <div key={k} className="progress-bar-wrap">
                    <div className="progress-bar-header">
                      <span className="label">{label}</span>
                      <span className="value">{(val * 100).toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${val * 100}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
              {result.vader_scores?.compound !== undefined && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Compound Score: <strong style={{ color: 'var(--text-secondary)' }}>{result.vader_scores.compound.toFixed(4)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {result.summary && (
            <div className="summary-box" style={{ marginTop: 20 }}>
              <strong>AI Summary</strong>
              {result.summary}
            </div>
          )}

          {/* Transcription */}
          {result.text && result.text !== text && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                Transcription
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, background: 'var(--glass-bg)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                {result.text}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
