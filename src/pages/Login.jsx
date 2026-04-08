import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../redux/authSlice";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AxiosInstance from "../Utils/AxiosInstance";
import { setCart } from "../redux/cartSlice";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingAction = location.state;

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

      // Process pending action (e.g. Add to Cart)
      if (pendingAction?.action === "addToCart" && pendingAction?.service) {
        try {
          await AxiosInstance.post(
            "http://localhost:3000/api/cart/add",
            { userId: data.user.id, service: pendingAction.service },
            { headers: { Authorization: `Bearer ${data.token}` } },
          );
          toast.success(
            `${pendingAction.service.name} was automatically added to your cart!`,
          );
        } catch (err) {
          console.error("Failed to process pending cart addition:", err);
        }
      }

      try {
        const cartResponse = await AxiosInstance.get(
          `http://localhost:3000/api/cart/${data.user.id}`,
        );
        const frontendCart = cartResponse.data.map((item) => ({
          id: item.service_id,
          name: item.service_name,
          price: Number(item.price),
          visit: 0,
          quantity: item.quantity || 1,
        }));
        dispatch(setCart(frontendCart));
      } catch (err) {
        console.error("Error fetching cart during login:", err);
      }

      toast.success("Welcome back!");
      if (pendingAction?.returnTo) {
        navigate(pendingAction.returnTo);
      } else if (data.user?.role?.toLowerCase() === "admin") {
        navigate("/admin");
      } else if (data.user?.role?.toLowerCase() === "provider") {
        navigate("/provider");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error connecting to the server:", error);
      toast.error(
        error.response?.data?.error ||
          "Server error. Please make sure the backend is running.",
      );
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const googleToken = credentialResponse.credential;
      const response = await AxiosInstance.post(
        "http://localhost:3000/api/auth/google",
        {
          token: googleToken,
        },
      );
      const data = response.data;

      if (data.user?.is_blocked) {
        toast.error("Your account has been blocked by the admin.");
        return;
      }

      dispatch(login(data.user));
      localStorage.setItem("token", data.token);

      // Process pending action (e.g. Add to Cart)
      if (pendingAction?.action === "addToCart" && pendingAction?.service) {
        try {
          await AxiosInstance.post(
            "http://localhost:3000/api/cart/add",
            { userId: data.user.id, service: pendingAction.service },
            { headers: { Authorization: `Bearer ${data.token}` } },
          );
          toast.success(
            `${pendingAction.service.name} was automatically added to your cart!`,
          );
        } catch (err) {
          console.error("Failed to process pending cart addition:", err);
        }
      }

      try {
        const cartResponse = await AxiosInstance.get(
          `http://localhost:3000/api/cart/${data.user.id}`,
        );
        const frontendCart = cartResponse.data.map((item) => ({
          id: item.service_id,
          name: item.service_name,
          price: Number(item.price),
          visit: 0,
          quantity: item.quantity || 1,
        }));
        dispatch(setCart(frontendCart));
      } catch (err) {
        console.error("Error fetching cart during login:", err);
      }

      toast.success("Google sign-in successful!");
      if (pendingAction?.returnTo) {
        navigate(pendingAction.returnTo);
      } else if (data.user?.role?.toLowerCase() === "admin") {
        navigate("/admin");
      } else if (data.user?.role?.toLowerCase() === "provider") {
        navigate("/provider");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast.error(
        error.response?.data?.error ||
          "Google Sign-In failed. Please try again.",
      );
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login was unsuccessful. Please try again.");
  };

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

          <button className="login-btn" onClick={handleLogin}>
            Login
          </button>

          <div
            className="divider-or"
            style={{
              margin: "15px 0",
              textAlign: "center",
              color: "#666",
              fontSize: "14px",
              position: "relative",
            }}
          >
            <span
              style={{
                backgroundColor: "white",
                padding: "0 10px",
                position: "relative",
                zIndex: 1,
              }}
            >
              OR
            </span>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: "1px",
                background: "#eee",
                zIndex: 0,
              }}
            ></div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>
        </div>
        <div className="auth-links">
          Don't have an account?{" "}
          <Link to="/register" state={pendingAction}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
