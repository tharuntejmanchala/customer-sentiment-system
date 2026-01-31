import { useEffect, useState } from "react";

export default function History() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/history")
      .then((res) => res.json())
      .then((res) => setData(res))
      .catch((err) => console.error("History fetch error:", err));
  }, []);

  return (
    <div>
      <h2>History</h2>

      {data.length === 0 && <p>No history available.</p>}

      {data.map((item, i) => (
        <div key={i} className="card">
          <p><b>Type:</b> {item[0]}</p>
          <p><b>Input:</b> {item[1]}</p>
          <p><b>Sentiment:</b> {item[2]}</p>
          <p>
            <b>Confidence:</b>{" "}
            {item[3] !== undefined ? (item[3]).toFixed(2) : "0.00"}%
          </p>
          <p><b>Time:</b> {item[4]}</p>
        </div>
      ))}
    </div>
  );
}
