import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import "./AdminStyling.css";

export default function AdminPopularServices({
  popularServices,
  handleDeletePopularService,
  setEditingPopularService,
  setIsAddingPopularService,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = popularServices?.filter((svc) =>
    svc.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleExportCSV = () => {
    if (!filteredServices || filteredServices.length === 0) return;
    const csvData = filteredServices.map((svc) => ({
      ID: svc.id,
      Name: svc.name,
      Price: svc.price,
      "Image URL": svc.image_url,
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
    link.download = "popular_services_export.csv";
    link.click();
  };

  return (
    <>
      <div className="admin-table-header">
        <h2 className="admin-header" style={{ marginBottom: 0 }}>
          Popular Services Management
        </h2>
        <div className="admin-table-controls">
          <input
            type="text"
            placeholder="Search popular services..."
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
            <button
              className="admin-btn-primary"
              onClick={() => setIsAddingPopularService(true)}
            >
              + Add Popular Service
            </button>
          </div>
        </div>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices?.length > 0 ? (
              filteredServices.map((service) => (
                <tr key={service.id}>
                  <td>{service.id}</td>
                  <td>{service.name}</td>
                  <td>
                    <img
                      src={service.image_url}
                      alt={service.name}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "5px",
                      }}
                    />
                  </td>
                  <td>
                    <button
                      className="admin-action-btn edit"
                      onClick={() => setEditingPopularService(service)}
                    >
                      Edit
                    </button>
                    <button
                      className="admin-action-btn delete"
                      onClick={() => handleDeletePopularService(service.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No popular services found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
