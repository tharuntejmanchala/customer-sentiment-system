import { useEffect, useState } from "react";

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/analytics")
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <p>Loading analytics...</p>;

  return (
    <div>
      <h2>Analytics</h2>

      <p>Total Analyses: {data.total}</p>

      <p>Positive: {data.positive}</p>
      <p>Neutral: {data.neutral}</p>
      <p>Negative: {data.negative}</p>

      <p>Text Inputs: {data.text}</p>
      <p>Audio Inputs: {data.audio}</p>
    </div>
  );
}
