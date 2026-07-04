type Sentiment = 'positive' | 'negative' | 'neutral';

const COLORS: Record<Sentiment, string> = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#f59e0b',
};

interface Props {
  score: number;         // 0–1
  sentiment: Sentiment;
  size?: number;
}

export default function SentimentGauge({ score, sentiment, size = 160 }: Props) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;

  let confidenceVal = score;
  if (sentiment === 'negative') {
    confidenceVal = 1 - score;
  } else if (sentiment === 'neutral') {
    confidenceVal = 1 - Math.abs(score - 0.5) * 2;
  }

  const offset = circumference - (circumference * Math.min(confidenceVal, 1));
  const color = COLORS[sentiment];
  const pct = Math.round(confidenceVal * 100);

  return (
    <div className="gauge-wrap">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          className="gauge-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            className="gauge-track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />
          <circle
            className="gauge-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
        </svg>
        <div className="gauge-center">
          <div className="gauge-value" style={{ color }}>{pct}%</div>
          <div className="gauge-label">confidence</div>
        </div>
      </div>
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        color,
        textTransform: 'capitalize',
        letterSpacing: '-0.2px',
      }}>
        {sentiment}
      </div>
    </div>
  );
}
