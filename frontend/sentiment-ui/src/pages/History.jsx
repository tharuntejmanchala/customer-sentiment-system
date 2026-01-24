import { useEffect, useState } from "react";

export default function History() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/history")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h2>History</h2>

      {data.map((item, i) => (
        <div key={i} className="card">
          <p><b>Type:</b> {item.type}</p>
          <p><b>Input:</b> {item.input}</p>
          <p><b>Sentiment:</b> {item.sentiment}</p>
          <p><b>Confidence:</b> {item.confidence.toFixed(2)}%</p>
        </div>
      ))}
    </div>
  );
}
