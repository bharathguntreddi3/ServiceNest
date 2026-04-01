import React, { useState } from "react";
import { FaDownload, FaToggleOn, FaToggleOff } from "react-icons/fa";

export default function AdminServices({
  services,
  handleDeleteService,
  setEditingService,
  setIsAddingService,
  handleToggleServiceStatus,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = services.filter(
    (svc) =>
      svc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      svc.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleExportCSV = () => {
    if (filteredServices.length === 0) return;
    const csvData = filteredServices.map((svc) => ({
      ID: svc.id,
      Name: svc.name,
      Category: svc.category || "N/A",
      Price: svc.price,
      "Visit Price": svc.visit_price,
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
    link.download = "services_export.csv";
    link.click();
  };

  return (
    <>
      <div className="admin-table-header">
        <h2 className="admin-header" style={{ marginBottom: 0 }}>
          Services Management
        </h2>
        <div className="admin-table-controls">
          <input
            type="text"
            placeholder="Search services or category..."
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
              onClick={() => setIsAddingService(true)}
            >
              + Add Service
            </button>
          </div>
        </div>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table" style={{ minWidth: "900px" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Visit Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length > 0 ? (
              filteredServices.map((svc) => (
                <tr key={svc.id}>
                  <td>{svc.id}</td>
                  <td>
                    <strong>{svc.name}</strong>
                  </td>
                  <td>{svc.category || "N/A"}</td>
                  <td>₹{svc.price}</td>
                  <td>₹{svc.visit_price}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        svc.is_active ? "status-active" : "status-blocked"
                      }`}
                    >
                      {svc.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-action-btn edit"
                      onClick={() => setEditingService(svc)}
                    >
                      Edit
                    </button>
                    <button
                      className={`admin-action-btn ${
                        svc.is_active ? "block" : "unblock"
                      }`}
                      onClick={() => handleToggleServiceStatus(svc)}
                    >
                      {svc.is_active ? (
                        <>
                          <FaToggleOff /> Deactivate
                        </>
                      ) : (
                        <>
                          <FaToggleOn /> Activate
                        </>
                      )}
                    </button>
                    <button
                      className="admin-action-btn delete"
                      onClick={() => handleDeleteService(svc.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="no-users-row">
                <td colSpan="7">No services found in the database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
