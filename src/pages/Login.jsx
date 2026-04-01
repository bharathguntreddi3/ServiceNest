// 


import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../redux/authSlice";
import { Link, useNavigate } from "react-router-dom";
import AxiosInstance from "../Utils/AxiosInstance";
import { setCart } from "../redux/cartSlice";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleLogin() {

    if (!email || !password) {
      toast.error("Please enter both email and password."); 
      return;
    }

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
        toast.error("Your account has been blocked by the admin."); 
        return;
      }

      dispatch(login(data.user));
      localStorage.setItem("token", data.token);

      try {
        const cartResponse = await AxiosInstance.get(`http://localhost:3000/api/cart/${data.user.id}`);
        const frontendCart = cartResponse.data.map((item) => ({
          id: item.service_id,
          name: item.service_name,
          price: Number(item.price),
          visit: 0,
        }));
        dispatch(setCart(frontendCart));
      } catch (err) {
        console.error("Error fetching cart during login:", err);
      }

      toast.success("Welcome back!"); 
      if (data.user?.role?.toLowerCase() === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error connecting to the server:", error);
      toast.error(error.response?.data?.error || "Server error. Please make sure the backend is running.");
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

          <div style={{ textAlign: "right", marginTop: "-10px", marginBottom: "15px" }}>
            <Link to="/forgot-password" style={{ fontSize: "14px", textDecoration: "none", color: "#007bff", fontWeight: "500" }}>
              Forgot Password?
            </Link>
          </div>


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
