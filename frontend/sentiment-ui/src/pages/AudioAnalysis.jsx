import { useState } from "react";
import api from "../api/axios"; // ✅ use axios instance with token

export default function AudioAnalysis() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select an audio file");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file); // 🔑 MUST be "file"

      const res = await api.post("/sentiment/audio", formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("Audio analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>Audio Sentiment Analysis</h2>

        <input
          type="file"
          accept=".wav,.mp3,.m4a"
          onChange={(e) => setFile(e.target.files[0])}
          style={styles.input}
        />

        <button onClick={handleAnalyze} disabled={loading} style={styles.button}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {result && (
          <div style={{ marginTop: "20px" }}>
            <p><b>Transcription:</b> {result.transcription}</p>
            <p><b>Sentiment:</b> {result.sentiment}</p>
            <p><b>Confidence:</b> {result.confidence}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "white",
  },
  card: {
    background: "#020617",
    padding: "40px",
    borderRadius: "12px",
    width: "400px",
  },
  input: {
    width: "100%",
    marginBottom: "15px",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
  },
};
