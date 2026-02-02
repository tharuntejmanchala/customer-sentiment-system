import { useEffect, useState } from "react";
import api from "../api/axios";

function History() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 🚫 NO trailing slash
        const res = await api.get("/history");
        setData(res.data);
      } catch (err) {
        console.error("History fetch error:", err);
        setError("Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <p>Loading history...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>History</h2>

      {data.length === 0 && <p>No history available.</p>}

      {data.map((item, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #334155",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "10px",
            background: "#020617",
            color: "white",
          }}
        >
          <p><b>Type:</b> {item[0]}</p>
          <p><b>Input:</b> {item[1]}</p>
          <p><b>Sentiment:</b> {item[2]}</p>
          <p>
            <b>Confidence:</b>{" "}
            {item[3] !== undefined ? (item[3] * 100).toFixed(2) : "0.00"}%
          </p>
          <p><b>Time:</b> {item[4]}</p>
        </div>
      ))}
    </div>
  );
}

// ✅ THIS LINE IS THE KEY
export default History;
