import { useState } from "react";
import { cardStyle, buttonStyle, inputStyle } from "../styles/ui";

export default function TextAnalysis() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!text) return;
    setLoading(true);
    setResult(null);

    const res = await fetch("http://127.0.0.1:5000/api/sentiment/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div style={{ padding: "32px", maxWidth: "700px", margin: "auto" }}>
      <h2>Text Sentiment Analysis</h2>

      <textarea
        rows={5}
        style={{ ...inputStyle, width: "100%", marginTop: "12px" }}
        placeholder="Enter customer feedback..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button style={{ ...buttonStyle, marginTop: "12px" }} onClick={handleAnalyze}>
        Analyze
      </button>

      {loading && <p>Analyzing...</p>}

      {result && (
        <div style={cardStyle}>
          <h3>Result</h3>
          <p><strong>Sentiment:</strong> {result.sentiment}</p>

          <p>
            <strong>Confidence:</strong>{" "}
            {(result.confidence).toFixed(1)}%
          </p>

          {/* Confidence Bar */}
          <div style={{ background: "#1e293b", height: "8px", borderRadius: "4px" }}>
            <div
              style={{
                width: `${result.confidence}%`,
                height: "8px",
                backgroundColor: "#22c55e",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
