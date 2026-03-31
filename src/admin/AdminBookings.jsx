import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";

export default function AdminBookings({ bookings }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return;
    const csvData = filteredBookings.map((b) => ({
      "Booking ID": b.id,
      "Customer Name": b.user_name || "N/A",
      "User ID": b.user_id,
      Service: b.service_name || "N/A",
      Price: b.price,
      Date: b.booking_date
        ? new Date(b.booking_date).toLocaleDateString()
        : "N/A",
    }));

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData
      .map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([`${headers}\n${rows}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bookings_export.csv";
    link.click();
  };

  return (
    <>
      <div className="admin-table-header">
        <h2 className="admin-header" style={{ marginBottom: 0 }}>
          All Bookings
        </h2>
        <div className="admin-table-controls">
          <input
            type="text"
            placeholder="Search by customer or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
          <div className="admin-table-actions">
            <button
              className="admin-btn-primary"
              style={{
                backgroundColor: "#28a745",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={handleExportCSV}
            >
              <FaDownload /> Download CSV
            </button>
          </div>
        </div>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table" style={{ minWidth: "800px" }}>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer Name</th>
              <th>User ID</th>
              <th>Service</th>
              <th>Price</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>
                    <strong>{booking.user_name || "N/A"}</strong>
                  </td>
                  <td>{booking.user_id}</td>
                  <td>
                    <strong>{booking.service_name || "N/A"}</strong>
                  </td>
                  <td>₹{booking.price}</td>
                  <td>
                    {booking.booking_date
                      ? new Date(booking.booking_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="no-users-row">
                <td colSpan="6">No bookings found in the database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
