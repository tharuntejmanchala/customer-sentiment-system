import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

const navigate = useNavigate();


const handleSubmit = (e) => {
  e.preventDefault();

  if (!email || !password) {
    setError("Please fill in all fields");
    return;
  }

  setError(""); // clear error

  localStorage.setItem("isAuth", "true");

// redirect to dashboard
navigate("/dashboard");
};


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020617"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "360px",
          padding: "24px",
          backgroundColor: "#0f172a",
          borderRadius: "8px",
          border: "1px solid #1e293b"
        }}
      >
        <h2 style={{ marginBottom: "16px" }}>Login</h2>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "14px", color: "#cbd5f5" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                borderRadius: "4px",
                border: "1px solid #334155",
                backgroundColor: "#020617",
                color: "#e5e7eb"
              }}

            
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <label style={{ fontSize: "14px", color: "#cbd5f5" }}>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                    width: "100%",
                    padding: "10px 36px 10px 10px",
                    marginTop: "6px",
                    borderRadius: "4px",
                    border: "1px solid #334155",
                    backgroundColor: "#020617",
                    color: "#e5e7eb"
                  }}

                
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "36px",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: "14px"
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
</div>

        </div>
{error && (
  <p style={{ color: "#f87171", marginBottom: "12px", fontSize: "14px" }}>
    {error}
  </p>
)}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
          Login
        </button>
      </form>
    </div>
  );
}
