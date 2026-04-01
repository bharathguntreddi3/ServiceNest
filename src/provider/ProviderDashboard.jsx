import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/authSlice";
import { clearCart } from "../redux/cartSlice";
import AxiosInstance from "../Utils/AxiosInstance";
import toast from "react-hot-toast";

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssignedBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await AxiosInstance.get(
          "http://localhost:3000/api/provider/bookings",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setBookings(response.data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load service requests.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignedBookings();
  }, []);

  const handleAcceptBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await AxiosInstance.put(
        `http://localhost:3000/api/provider/bookings/${bookingId}/status`,
        { status: "Accepted" },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update the local state to reflect the change immediately
      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: response.data.status }
            : booking,
        ),
      );
      toast.success("Booking accepted!");
    } catch (err) {
      toast.error("Failed to accept the service request.");
      console.error("Error accepting booking:", err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      className="container"
      style={{ padding: "40px", textAlign: "center", minHeight: "100vh" }}
    >
      <h1 style={{ color: "#1e6bb8", marginBottom: "20px" }}>
        Provider Dashboard
      </h1>
      <p style={{ fontSize: "18px", color: "#555" }}>
        Welcome back, <strong>{user?.name || "Provider"}</strong>!
      </p>

      <div
        style={{
          marginTop: "40px",
          padding: "30px",
          background: "#f8f9fa",
          borderRadius: "10px",
          border: "1px solid #ccc",
          overflowX: "auto",
        }}
      >
        <h3 style={{ marginBottom: "20px", color: "#333" }}>
          Assigned Service Requests
        </h3>

        {isLoading ? (
          <p>Loading service requests...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : bookings.length === 0 ? (
          <p style={{ color: "#777", marginTop: "10px" }}>
            You currently have no new service requests assigned to you.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              textAlign: "left",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#e9ecef",
                  borderBottom: "2px solid #dee2e6",
                }}
              >
                <th style={{ padding: "12px 8px" }}>Booking ID</th>
                <th style={{ padding: "12px 8px" }}>Customer Name</th>
                <th style={{ padding: "12px 8px" }}>Phone</th>
                <th style={{ padding: "12px 8px" }}>Address</th>
                <th style={{ padding: "12px 8px" }}>Service</th>
                <th style={{ padding: "12px 8px" }}>Scheduled Slot</th>
                <th style={{ padding: "12px 8px" }}>Payment Mode</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
                <th style={{ padding: "12px 8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  style={{ borderBottom: "1px solid #dee2e6" }}
                >
                  <td style={{ padding: "12px 8px", fontWeight: "bold" }}>
                    #{booking.id}
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    {booking.user_name || "N/A"}
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    {booking.phone ? (
                      <a
                        href={`tel:${booking.phone}`}
                        style={{ color: "#1e6bb8", textDecoration: "none" }}
                      >
                        {booking.phone}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td style={{ padding: "12px 8px", maxWidth: "200px" }}>
                    {booking.address || "N/A"}
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <strong>{booking.service_name}</strong> <br />
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      (ID: {booking.service_id})
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ fontWeight: "500" }}>
                      {booking.schedule_date
                        ? new Date(booking.schedule_date).toLocaleDateString()
                        : "N/A"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#555" }}>
                      {booking.schedule_time || "N/A"}
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    {booking.payment_method || "N/A"}
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "12px",
                        color: "white",
                        backgroundColor:
                          booking.status === "Accepted"
                            ? "#28a745" // green
                            : "#ffc107", // yellow
                      }}
                    >
                      {booking.status || "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    {booking.status !== "Accepted" && (
                      <button
                        onClick={() => handleAcceptBooking(booking.id)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "13px",
                          fontWeight: "600",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        className="login-btn"
        onClick={handleLogout}
        style={{ marginTop: "40px", width: "auto", padding: "10px 30px" }}
      >
        Logout
      </button>
    </div>
  );
}
