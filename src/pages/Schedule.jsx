import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import CheckoutStepper from "../components/CheckoutStepper";
import AxiosInstance from "../Utils/AxiosInstance";
import { login } from "../redux/authSlice"; 

export default function Schedule() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [address, setAddress] = useState(user?.address || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const timeSlots = {
    Morning: ["09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM"],
    Afternoon: ["12:00 PM - 01:00 PM", "01:00 PM - 02:00 PM", "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM"],
    Evening: ["04:00 PM - 05:00 PM", "05:00 PM - 06:00 PM"]
  };

  // --- NEW LOGIC: Check if a time slot has passed today ---
  const isSlotDisabled = (slotString) => {
    if (!date) return false;

    const today = new Date();
    const selectedDate = new Date(date);

    // Check if the selected date is today
    if (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    ) {
      // Extract the start time, e.g., "02:00 PM" from "02:00 PM - 03:00 PM"
      const startTimeString = slotString.split(" - ")[0];
      const [timePart, modifier] = startTimeString.split(" ");
      let hours = parseInt(timePart.split(":")[0], 10);

      // Convert 12-hour format to 24-hour format
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      const currentHour = today.getHours();
      
      // Disable the slot if the current hour is past or equal to the slot's start hour
      // (e.g., if it is 2:30 PM, the 2:00 PM slot will be disabled)
      return currentHour >= hours;
    }

    return false;
  };

  // Reset selected time if the user changes the date and their selected time is now disabled
  useEffect(() => {
    if (time && isSlotDisabled(time)) {
      setTime(""); 
    }
  }, [date]);
  // --------------------------------------------------------

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            alert("Could not determine address from your location.");
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          alert("Failed to convert coordinates to an address.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve location. Please check your browser permissions.");
        setIsLocating(false);
      }
    );
  };

  const handleProceed = async () => {
    if (!address || !phone || !date || !time) {
      alert("Please fill in all details and select a valid time slot.");
      return;
    }

    if (user && address !== user.address) {
      try {
        const token = localStorage.getItem("token");
        const response = await AxiosInstance.put(
          `/api/user/${user.id}`,
          { name: user.name, email: user.email, phone: phone, address: address },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        dispatch(login(response.data.user)); 
      } catch (error) {
        console.error("Failed to save address silently:", error);
      }
    }

    navigate("/payment", {
      state: { address, phone, scheduleDate: date, scheduleTime: time },
    });
  };

  return (
    <div className="auth-container" style={{ flexDirection: "column", paddingTop: "60px" }}>
      <CheckoutStepper currentStep={2} />

      <div className="auth-card" data-aos="zoom-in" style={{ marginTop: "20px", maxWidth: "500px" }}>
        <h2>Booking Details</h2>
        <p>Enter your address and schedule your Slot</p>

        <div className="auth-form">
          <div style={{ position: "relative" }}>
            <textarea
              className="auth-input"
              rows="3"
              placeholder="Enter your full address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ fontFamily: "inherit", resize: "vertical", paddingRight: "40px" }}
            />
            <button 
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              title="Use Current Location"
              style={{
                position: "absolute",
                right: "10px",
                top: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isLocating ? "#aaa" : "#1e6bb8",
                fontSize: "20px",
                padding: "5px"
              }}
            >
              {isLocating ? "⏳" : "📌"}
            </button>
            <div style={{ textAlign: "right", marginTop: "5px" }}>
              <button 
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                style={{ background: "none", border: "none", color: "#1e6bb8", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}
              >
                {isLocating ? "Locating..." : "Use Current Location"}
              </button>
            </div>
          </div>

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
            min={new Date().toISOString().split("T")[0]} 
          />

          <div className="time-slot-container">
            <label style={{ display: "block", marginBottom: "15px", fontWeight: "600", color: "#333", textAlign: "left" }}>
              Select Time Slot
            </label>
            
            {Object.entries(timeSlots).map(([period, slots]) => (
              <div key={period} className="time-slot-group">
                <h4 className="time-slot-period">{period}</h4>
                <div className="time-slot-grid">
                  {slots.map((slot) => {
                    const disabled = isSlotDisabled(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        // Apply 'selected' class if it's chosen, apply 'disabled' if it's past
                        className={`time-slot-pill ${time === slot ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                        onClick={() => !disabled && setTime(slot)}
                        disabled={disabled}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button className="login-btn" onClick={handleProceed}>
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}