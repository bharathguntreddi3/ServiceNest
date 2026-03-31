import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/authSlice";
import AxiosInstance from "../Utils/AxiosInstance";
import "./Login.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const response = await AxiosInstance.post(
        "http://localhost:3000/api/login",
        {
          email,
          password,
        },
      );

      const { user, token } = response.data;

      if (user && user.role?.toLowerCase() === "admin") {
        // Store token
        localStorage.setItem("token", token);
        // Dispatch login success to update Redux state
        dispatch(loginSuccess({ user, token }));
        // Navigate to admin dashboard
        navigate("/admin");
      } else {
        setError("Access Denied. You do not have admin privileges.");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Login failed. Please try again.";
      setError(errorMessage);
      console.error("Admin login error:", err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" data-aos="zoom-in">
        <h2>Admin Login</h2>
        <p>Please enter your administrator credentials.</p>
        <form onSubmit={handleLogin} className="auth-form">
          {error && (
            <div
              style={{
                color: "red",
                marginBottom: "10px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {error}
            </div>
          )}
          <input
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email Address"
          />
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
          />
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
