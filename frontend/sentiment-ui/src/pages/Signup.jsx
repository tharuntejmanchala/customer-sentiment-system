import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "6px",
  borderRadius: "4px",
  border: "1px solid #334155",
  backgroundColor: "#020617",
  color: "#e5e7eb"
};

const passwordStyle = {
  ...inputStyle,
  padding: "10px 36px 10px 10px"
};



        const handleSubmit = (e) => {
          e.preventDefault();

          if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
          }

          if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
          }

          setError("");

          localStorage.setItem("isAuth", "true");
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
          width: "380px",
          padding: "24px",
          backgroundColor: "#0f172a",
          borderRadius: "8px",
          border: "1px solid #1e293b"
        }}
      >
        <h2 style={{ marginBottom: "16px" }}>Create Account</h2>

        <div style={{ marginBottom: "12px" }}>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            
          />
        </div>

<div style={{ position: "relative", marginBottom: "12px" }}>
  <label style={{ fontSize: "14px", color: "#cbd5f5" }}>Password</label>
  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={passwordStyle}
  />
  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "10px",
      top: "38px",
      cursor: "pointer",
      color: "#94a3b8"
    }}
  >
    {showPassword ? "🙈" : "👁️"}
  </span>
</div>


  <div style={{ position: "relative", marginBottom: "16px" }}>
  <label style={{ fontSize: "14px", color: "#cbd5f5" }}>
    Confirm Password
  </label>
  <input
    type={showConfirmPassword ? "text" : "password"}
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    style={passwordStyle}
  />
  <span
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    style={{
      position: "absolute",
      right: "10px",
      top: "38px",
      cursor: "pointer",
      color: "#94a3b8"
    }}
  >
    {showConfirmPassword ? "🙈" : "👁️"}
  </span>
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
    backgroundColor: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500"
  }}
>
  Create Account
</button>
      </form>
    </div>
  );
}
