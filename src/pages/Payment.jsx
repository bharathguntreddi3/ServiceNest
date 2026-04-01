import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../redux/cartSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import AxiosInstance from "../Utils/AxiosInstance";
import CheckoutStepper from "../components/CheckoutStepper";

export default function Payment() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const scheduleDetails = location.state;

  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const user = useSelector((state) => state.auth.user);

  async function pay() {
    if (!user) {
      toast.error("You need to be logged in to make a payment.");
      navigate("/login");
      return;
    }

    if (!scheduleDetails) {
      toast.error("Booking details are missing. Please go back to the schedule page.");
      navigate("/schedule");
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      // Call the checkout endpoint to move items to bookings
      await AxiosInstance.post(
        "http://localhost:3000/api/checkout",
        {
          userId: user.id,
          ...scheduleDetails, // address, phone, scheduleDate, scheduleTime
          paymentMethod: paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Payment successful!");
      setShowSuccess(true);
      dispatch(clearCart()); // Clear Redux cart

      setTimeout(() => {
        navigate("/");
      }, 6000);
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="auth-container">
        <div
          className="auth-card"
          style={{ padding: "50px 30px" }}
          data-aos="zoom-in"
        >
          <div
            style={{ fontSize: "64px", color: "#4caf50", marginBottom: "20px" }}
          >
            ✓
          </div>
          <h2 style={{ color: "#2e7d32", marginBottom: "15px" }}>
            Booking Confirmed!
          </h2>
          <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#444" }}>
            Our Best serviceman has been assigned for your service. He will
            contact you on the selected date. Thank you!
          </p>
          <p style={{ fontSize: "20px", fontWeight: "500" }}>
            Team ServiceNest ✌️
          </p>
          <p style={{ fontSize: "14px", color: "#888", marginTop: "30px" }}>
            Redirecting to home...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ flexDirection: "column", paddingTop: "60px" }}>
      <CheckoutStepper currentStep={3} />

      <div className="auth-card" data-aos="zoom-in" style={{ marginTop: "20px" }}>
        <h2>Select Payment Method</h2>
        <p>Choose how you would like to pay for your service</p>

        <div
          className="auth-form"
          style={{
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "20px",
            marginTop: "20px",
          }}
        >
          <label style={radioContainerStyle}>
            <input
              type="radio"
              name="pay"
              value="UPI"
              checked={paymentMethod === "UPI"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={radioStyle}
            />{" "}
            UPI
          </label>
          <label style={radioContainerStyle}>
            <input
              type="radio"
              name="pay"
              value="Card"
              checked={paymentMethod === "Card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={radioStyle}
            />{" "}
            Card
          </label>
          <label style={radioContainerStyle}>
            <input
              type="radio"
              name="pay"
              value="Net Banking"
              checked={paymentMethod === "Net Banking"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={radioStyle}
            />{" "}
            Net Banking
          </label>
          <label style={radioContainerStyle}>
            <input
              type="radio"
              name="pay"
              value="Cash On Delivery"
              checked={paymentMethod === "Cash On Delivery"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={radioStyle}
            />{" "}
            Cash On
            Delivery
          </label>
        </div>

        <button className="login-btn mobile-hide" onClick={pay} disabled={isProcessing} style={{ marginTop: "15px" }}>
          {isProcessing ? "Processing..." : "Confirm Payment"}
        </button>
      </div>
      <div className="mobile-floating-footer desktop-hide" style={{ justifyContent: "center" }}>
        <button 
          className="login-btn" 
          style={{ width: "100%", padding: "14px", backgroundColor: isProcessing ? "#ccc" : "" }} 
          onClick={pay} 
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Confirm Payment"}
        </button>
      </div>
    </div>
  );
}

const radioContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontSize: "16px",
  cursor: "pointer",
  padding: "12px 15px",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

const radioStyle = {
  width: "18px",
  height: "18px",
  cursor: "pointer",
};
