import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../Utils/AxiosInstance";
import { useSettings } from "../context/SettingsContext";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { login } from "../redux/authSlice";
import { setCart } from "../redux/cartSlice";
import toast from "react-hot-toast";

/**
 * Register component.
 * Handles user registration and redirects the user to the login page upon successful registration.
 * @returns {JSX.Element} Register component.
 */
export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(""); // New state for phone number
  const [countryCode, setCountryCode] = useState("+91"); // State for country code
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const { settings, loading } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingAction = location.state;
  const dispatch = useDispatch();

  async function handleSendOtp() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (name.trim().length < 3) {
      setErrorMessage("Name must be at least 3 characters long.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!/^\d{7,15}$/.test(phone.trim())) {
      setErrorMessage(
        "Please enter a valid phone number containing only digits.",
      );
      return;
    }

    if (password.trim().length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(
        "http://localhost:3000/api/register/send-otp",
        {
          email: email.trim(),
          phone: `${countryCode}${phone.trim()}`,
        },
      );
      setSuccessMessage(response.data.message || `OTP sent to ${email}`);
      setStep(2);
      setResendTimer(60); // Start the timer
    } catch (error) {
      console.error("Error sending OTP:", error);
      setErrorMessage(
        error.response?.data?.error || "Failed to send OTP. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    // No need to re-validate, just resend to the same email
    setIsResending(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await axiosInstance.post(
        "http://localhost:3000/api/register/send-otp",
        {
          email: email.trim(),
          phone: `${countryCode}${phone.trim()}`,
        },
      );
      setSuccessMessage(response.data.message || `OTP resent to ${email}`);
      setResendTimer(60); // Restart timer
    } catch (error) {
      console.error("Error resending OTP:", error);
      setErrorMessage(
        error.response?.data?.error ||
          "Failed to resend OTP. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  }

  async function handleRegister() {
    setErrorMessage("");

    if (!otp.trim()) {
      setErrorMessage("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setErrorMessage("OTP must be a 6-digit number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(
        "http://localhost:3000/api/register",
        {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: `${countryCode}${phone.trim()}`,
          otp: otp.trim(),
        },
      );

      setSuccessMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { state: pendingAction });
      }, 1500);
    } catch (error) {
      console.error("Error connecting to the server:", error);
      setErrorMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          "Server error. Please make sure the backend is running.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const googleToken = credentialResponse.credential;
      const response = await axiosInstance.post(
        "http://localhost:3000/api/auth/google",
        {
          token: googleToken,
        },
      );
      const data = response.data;

      if (data.user?.is_blocked) {
        setErrorMessage("Your account has been blocked by the admin.");
        return;
      }

      dispatch(login(data.user));
      localStorage.setItem("token", data.token);

      // Process pending action (e.g. Add to Cart)
      if (pendingAction?.action === "addToCart" && pendingAction?.service) {
        try {
          await axiosInstance.post(
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
        const cartResponse = await axiosInstance.get(
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
        console.error("Error fetching cart during Google sign-in:", err);
      }

      toast.success("Google sign-in successful!");
      if (pendingAction?.returnTo) {
        navigate(pendingAction.returnTo);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setErrorMessage(
        error.response?.data?.error ||
          "Google Sign-In failed. Please try again.",
      );
    }
  };

  const handleGoogleError = () => {
    setErrorMessage("Google registration was unsuccessful. Please try again.");
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!settings?.enableRegistration) {
    return (
      <div className="auth-container">
        <div className="auth-card" data-aos="zoom-in">
          <h2 style={{ color: "#dc3545" }}>Registrations Closed</h2>
          <p style={{ marginTop: "15px" }}>
            We are not accepting new user registrations at this time. Please
            check back later.
          </p>
          <div className="auth-links" style={{ marginTop: "20px" }}>
            <Link to="/">Go to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card" data-aos="zoom-in">
        <h2>Create an Account</h2>
        <p>
          {step === 1
            ? "Join ServiceNest to book professionals"
            : "Verify your email address"}
        </p>

        <div className="auth-form">
          {step === 1 ? (
            <>
              <input
                type="text"
                className="auth-input"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
              <input
                type="email"
                className="auth-input"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  className="auth-input"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={isSubmitting}
                  style={{ width: "35%", padding: "10px" }}
                >
                  <option value="+91">India (+91)</option>
                  <option value="+1">USA (+1)</option>
                  <option value="+44">UK (+44)</option>
                  <option value="+61">Australia (+61)</option>
                  <option value="+49">Germany (+49)</option>
                  <option value="+33">France (+33)</option>
                  <option value="+81">Japan (+81)</option>
                  <option value="+86">China (+86)</option>
                  <option value="+55">Brazil (+55)</option>
                </select>
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  style={{ width: "65%" }}
                />
              </div>
              <input
                type="password"
                className="auth-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: "14px",
                  color: "#555",
                  marginBottom: "15px",
                  textAlign: "center",
                }}
              >
                We've sent a 6-digit OTP to <strong>{email}</strong>
              </p>
              <input
                type="text"
                className="auth-input"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isSubmitting}
              />
              <div
                style={{
                  textAlign: "center",
                  marginTop: "10px",
                  fontSize: "14px",
                }}
              >
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isResending}
                  className="resend-otp-btn"
                >
                  {isResending
                    ? "Sending..."
                    : resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend OTP"}
                </button>
              </div>
            </>
          )}

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

          {successMessage && (
            <div
              style={{
                color: "green",
                marginBottom: "10px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {successMessage}
            </div>
          )}

          <button
            className="login-btn"
            onClick={step === 1 ? handleSendOtp : handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Processing..."
              : step === 1
                ? "Send OTP"
                : "Verify & Register"}
          </button>

          {step === 2 && (
            <button
              className="login-btn"
              style={{ backgroundColor: "#6c757d", marginTop: "10px" }}
              onClick={() => {
                setStep(1);
                setErrorMessage("");
                setSuccessMessage("");
              }}
              disabled={isSubmitting}
            >
              Back
            </button>
          )}

          {step === 1 && (
            <>
              <div
                className="divider-or"
                style={{
                  margin: "5px 0",
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
            </>
          )}
        </div>

        <div className="auth-links">
          Already have an account?{" "}
          <Link to="/login" state={pendingAction}>
            Login here
          </Link>
        </div>
        <style>{`
          .resend-otp-btn {
            background: none;
            border: none;
            color: #007bff;
            cursor: pointer;
            text-decoration: underline;
            padding: 0;
            font-size: 14px;
          }
          .resend-otp-btn:disabled {
            color: #6c757d;
            cursor: not-allowed;
            text-decoration: none;
          }
        `}</style>
      </div>
    </div>
  );
}
