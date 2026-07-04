type Sentiment = 'positive' | 'negative' | 'neutral';

const icons: Record<Sentiment, string> = {
  positive: '↑',
  negative: '↓',
  neutral: '→',
};

export default function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span className={`sentiment-badge ${sentiment}`}>
      <span>{icons[sentiment]}</span>
      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </span>
  );
}
