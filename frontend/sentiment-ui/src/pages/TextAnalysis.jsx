import { useState } from "react";
import api from "../api/axios"; // 👈 important

export default function TextAnalysis() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/sentiment/text", { text }); // ✅ HERE
      setResult(res.data);
    } catch (err) {
      setError("Failed to analyze text");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text"
      />

      <button onClick={handleAnalyze}>
        Analyze
      </button>

      {loading && <p>Analyzing...</p>}

      {result && (
        <div>
          <p>Sentiment: {result.sentiment}</p>
          <p>Confidence: {result.confidence}%</p>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
