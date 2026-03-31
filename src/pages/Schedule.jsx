import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Schedule() {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card" data-aos="zoom-in">
        <h2>Booking Details</h2>
        <p>Enter your address and schedule your Slot</p>

        <div className="auth-form">
          <textarea
            className="auth-input"
            rows="3"
            placeholder="Enter your full address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ fontFamily: "inherit", resize: "vertical" }}
          />

          <input
            type="tel"
            className="auth-input"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="date"
            className="auth-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select
            className="auth-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          >
            <option>9:00AM - 10:00AM</option>
            <option>10:00AM - 11:00AM</option>
            <option>11:00AM - 12:00PM</option>
            <option>12:00PM - 01:00PM</option>
            <option>01:00PM - 02:00PM</option>
            <option>02:00PM - 03:00PM</option>
            <option>03:00PM - 04:00PM</option>
            <option>04:00PM - 05:00PM</option>
            <option>05:00PM - 06:00PM</option>
          </select>

          <button className="login-btn" onClick={() => navigate("/payment")}>
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
