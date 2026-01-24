import { useState } from "react";

export default function AudioAnalysis() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select an audio file");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      // 🔴 THIS KEY MUST BE "file"
      formData.append("file", file);

      const res = await fetch(
        "http://127.0.0.1:5000/api/sentiment/audio",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Audio analysis failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1>Audio Sentiment Analysis</h1>

      <input
        type="file"
        accept=".wav,.mp3,.m4a"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <p><strong>Transcription:</strong> {result.transcription}</p>
          <p><strong>Sentiment:</strong> {result.sentiment}</p>
          <p><strong>Confidence:</strong> {result.confidence}</p>
        </div>
      )}
    </div>
  );
}
