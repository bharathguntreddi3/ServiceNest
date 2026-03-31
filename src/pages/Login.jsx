import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../redux/authSlice";
import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
import AxiosInstance from "../Utils/AxiosInstance";
import { setCart } from "../redux/cartSlice";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleLogin() {
    setErrorMessage("");
    try {
      const response = await AxiosInstance.post(
        "http://localhost:3000/api/login",
        {
          email: email.trim(),
          password: password.trim(),
        },
      );
      const data = response.data;

      if (data.user?.is_blocked) {
        setErrorMessage("Your account has been blocked by the admin. Please contact the support team");
        return;
      }

      // Only store the safe database user data (name, email, id) into Redux
      dispatch(login(data.user));

      // Store JWT token in local storage
      localStorage.setItem("token", data.token);

      // Fetch the user's cart from the database
      try {
        const cartResponse = await AxiosInstance.get(
          `http://localhost:3000/api/cart/${data.user.id}`,
        );
        const frontendCart = cartResponse.data.map((item) => ({
          id: item.service_id,
          name: item.service_name,
          price: Number(item.price),
          visit: 0, // Adding fallback visit price to prevent NaN errors in Cart.jsx
        }));
        dispatch(setCart(frontendCart));
      } catch (err) {
        console.error("Error fetching cart during login:", err);
      }

      if (data.user?.role?.toLowerCase() === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error connecting to the server:", error);
      setErrorMessage(
        error.response?.data?.error ||
          "Server error. Please make sure the backend is running.",
      );
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card" data-aos="zoom-in">
        <h2>Welcome Back</h2>
        <p>Login to your ServiceNest account</p>

        <div className="auth-form">
          <input
            type="email"
            className="auth-input"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div
            style={{
              textAlign: "right",
              marginTop: "-10px",
              marginBottom: "15px",
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                fontSize: "14px",
                textDecoration: "none",
                color: "#007bff",
                fontWeight: "500",
              }}
            >
              Forgot Password?
            </Link>
          </div>

          {errorMessage && (
            <div
              style={{
                color: "red",
                marginBottom: "10px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {errorMessage}
            </div>
          )}

          <button className="login-btn" onClick={handleLogin}>
            Login
          </button>
        </div>

        <div className="auth-links">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}
