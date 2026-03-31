import React from "react";
import { FaDownload } from "react-icons/fa";

export default function AdminReviews({ reviews }) {
  const handleExportCSV = () => {
    if (!reviews || reviews.length === 0) return;
    const csvData = reviews.map((r) => ({
      ID: r.id,
      Customer: r.name,
      Rating: r.rating,
      Review: r.review,
      Date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A",
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
    link.download = "reviews_export.csv";
    link.click();
  };

  return (
    <>
      <div className="admin-table-header">
        <h2 className="admin-header" style={{ marginBottom: 0 }}>
          Customer Reviews
        </h2>
        <div
          className="admin-table-controls"
          style={{ justifyContent: "flex-end" }}
        >
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
              <th>ID</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.id}</td>
                  <td>
                    <strong>{review.name}</strong>
                  </td>
                  <td>{review.rating} / 5 ⭐</td>
                  <td>"{review.review}"</td>
                  <td>
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="no-users-row">
                <td colSpan="5">No reviews found in the database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
