import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";
import AxiosInstance from "../Utils/AxiosInstance";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // Step 1: Request OTP, Step 2: Verify OTP & Reset
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  async function handleSendOtp(e) {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    try {
      // Call backend to verify if the user exists and send OTP
      const response = await AxiosInstance.post(
        "/api/forgot-password/send-otp",
        { email },
      );
      setMessage(response.data.message || `An OTP has been sent to ${email}.`);
      setStep(2);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || "Server error. Please try again.",
      );
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!otp.trim()) {
      setErrorMessage("Please enter the OTP.");
      return;
    }
    if (!newPassword.trim()) {
      setErrorMessage("Please enter a new password.");
      return;
    }
    if (!confirmPassword.trim()) {
      setErrorMessage("Please confirm your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await AxiosInstance.post(
        "/api/forgot-password/reset-password",
        { email, otp, newPassword },
      );
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || "Server error. Please try again.",
      );
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card" data-aos="zoom-in">
        <h2>Forgot Password</h2>
        <p>
          {step === 1
            ? "Enter your email to receive an OTP"
            : "Enter the OTP and your new password"}
        </p>

        <form
          className="auth-form"
          onSubmit={step === 1 ? handleSendOtp : handleResetPassword}
        >
          {step === 1 ? (
            <input
              type="email"
              className="auth-input"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          ) : (
            <>
              <input
                type="text"
                className="auth-input"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <input
                type="password"
                className="auth-input"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                className="auth-input"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
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

          {message && (
            <div
              style={{
                color: "green",
                marginBottom: "10px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {message}
            </div>
          )}

          <button type="submit" className="login-btn">
            {step === 1 ? "Send OTP" : "Reset Password"}
          </button>
        </form>

        <div className="auth-links">
          Remember your password? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}
