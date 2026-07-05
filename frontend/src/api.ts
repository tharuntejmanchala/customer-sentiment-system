import type { AnalysisResult, Recording, Analytics, HealthStatus } from './types';
import { auth } from './firebase';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(options?.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    if (res.status === 401 && path !== '/login') {
      auth.signOut().catch(() => {});
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authenticated');
      window.location.href = '/login';
    }
    const err = await res.text();
    let msg = `Request failed: ${res.status}`;
    try { msg = JSON.parse(err).detail || msg; } catch { /* noop */ }
    throw new Error(msg);
  }
  return res.json();
}

/** Health check */
export const getHealth = (): Promise<HealthStatus> =>
  request('/health');

/** Analyze plain text */
export const analyzeText = (text: string): Promise<AnalysisResult> =>
  request('/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

/** Transcribe audio file or analyze text via /transcribe */
export const transcribeOrAnalyze = async (
  file?: File | null,
  text?: string
): Promise<{ transcription: string; analysis_result: AnalysisResult }> => {
  const form = new FormData();
  if (file) {
    form.append('audio', file);
  } else if (text) {
    form.append('text', text);
  } else {
    throw new Error('No file or text provided');
  }
  return request('/transcribe', { method: 'POST', body: form });
};

/** Send audio blob for full pipeline (transcribe + analyze) */
export const analyzeAudio = async (
  audioBlob: Blob,
  filename = 'recording.webm'
): Promise<{ transcription: string; analysis_result: AnalysisResult }> => {
  const form = new FormData();
  form.append('audio', audioBlob, filename);
  return request('/audio', { method: 'POST', body: form });
};

/** Save a recording + its analysis to the DB */
export const saveRecording = async (params: {
  audioBlob?: Blob;
  filename?: string;
  timestamp?: string;
  duration?: number;
  transcription?: string;
  sentiment?: string;
  confidence?: number;
  summary?: string;
}): Promise<{ recordingId: string; message: string }> => {
  const form = new FormData();
  if (params.audioBlob && params.filename) {
    form.append('audio', params.audioBlob, params.filename);
  }
  if (params.timestamp) form.append('timestamp', params.timestamp);
  form.append('duration', String(params.duration ?? 0));
  form.append('transcription', params.transcription ?? '');
  form.append('sentiment', params.sentiment ?? '');
  form.append('confidence', String(params.confidence ?? 0));
  form.append('summary', params.summary ?? '');
  return request('/save-recording', { method: 'POST', body: form });
};

/** List all recordings */
export const listRecordings = (): Promise<Recording[]> =>
  request('/recordings');

/** Get a single recording */
export const getRecording = (id: string): Promise<Recording> =>
  request(`/recordings/${id}`);

/** Get analytics */
export const getAnalytics = (): Promise<Analytics> =>
  request('/analytics');
