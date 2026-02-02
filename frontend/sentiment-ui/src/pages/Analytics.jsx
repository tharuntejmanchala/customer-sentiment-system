import { useEffect, useState } from "react";
import api from "../api/axios";

function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // 🚫 DO NOT use trailing slash unless backend explicitly expects it
        const res = await api.get("/analytics");
        setData(res.data);
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Analytics</h2>

      <p><b>Total Analyses:</b> {data.total}</p>
      <p><b>Positive:</b> {data.positive}</p>
      <p><b>Neutral:</b> {data.neutral}</p>
      <p><b>Negative:</b> {data.negative}</p>
      <p><b>Text Inputs:</b> {data.text}</p>
      <p><b>Audio Inputs:</b> {data.audio}</p>
    </div>
  );
}

// ✅ REQUIRED for `import Analytics from ...`
export default Analytics;
