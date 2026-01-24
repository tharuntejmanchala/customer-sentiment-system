import { Link } from "react-router-dom";

const linkStyle = {
  color: "#e5e7eb",
  textDecoration: "none",
  fontSize: "14px"
};

export default function Navbar() {
  return (
    <div
      style={{
        backgroundColor: "#020617",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        borderBottom: "1px solid #1e293b"
      }}
    >
      <Link style={linkStyle} to="/">Home</Link>
      <Link style={linkStyle} to="/dashboard">Dashboard</Link>
      <Link style={linkStyle} to="/text-analysis">Text</Link>
      <Link style={linkStyle} to="/audio-analysis">Audio</Link>
      <Link style={linkStyle} to="/analytics">Analytics</Link>
      <Link style={linkStyle} to="/history">History</Link>
      <Link style={linkStyle} to="/feedback">Feedback</Link>
      <Link style={linkStyle} to="/login">Login</Link>
      <Link style={linkStyle} to="/signup">Signup</Link>
    </div>
  );
}
