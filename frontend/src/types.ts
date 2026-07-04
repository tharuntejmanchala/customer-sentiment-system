export interface VaderScores {
  neg: number;
  neu: number;
  pos: number;
  compound: number;
}

export interface AnalysisResult {
  text?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  summary: string;
  vader_scores?: VaderScores;
  error?: string;
}

export interface Recording {
  id: string;
  filename: string | null;
  file_path: string | null;
  timestamp: string;
  duration: number;
  transcription: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  compound: number;
  negative: number;
  neutral: number;
  positive: number;
  summary: string;
}

export interface Analytics {
  total: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  average_confidence: number;
  timeline: TimelinePoint[];
  recent: Recording[];
}

export interface TimelinePoint {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface HealthStatus {
  status: string;
  version: string;
  gemini_enabled: boolean;
  whisper_enabled: boolean;
  tensorflow_enabled: boolean;
}
