import { Link, useNavigate } from "react-router-dom";

const linkStyle = {
  color: "#e5e7eb",
  textDecoration: "none",
  fontSize: "14px",
};

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token"); // ✅ single source of truth

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      style={{
        backgroundColor: "#020617",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        borderBottom: "1px solid #1e293b",
      }}
    >
      {/* Always visible */}
      <Link style={linkStyle} to="/">Home</Link>

      {/* Logged-in links */}
      {token && (
        <>
          <Link style={linkStyle} to="/dashboard">Dashboard</Link>
          <Link style={linkStyle} to="/text-analysis">Text</Link>
          <Link style={linkStyle} to="/audio-analysis">Audio</Link>
          <Link style={linkStyle} to="/analytics">Analytics</Link>
          <Link style={linkStyle} to="/history">History</Link>
          <Link style={linkStyle} to="/feedback">Feedback</Link>

          <button
            onClick={handleLogout}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "1px solid #ef4444",
              color: "#ef4444",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </>
      )}

      {/* Logged-out links */}
      {!token && (
        <>
          <Link style={{ ...linkStyle, marginLeft: "auto" }} to="/login">
            Login
          </Link>
          <Link style={linkStyle} to="/signup">
            Signup
          </Link>
        </>
      )}
    </div>
  );
}
